package com.nest.nestapp.service;

import com.nest.nestapp.dto.*;
import com.nest.nestapp.messaging.ScrapeJobMessage;
import com.nest.nestapp.messaging.ScrapeJobPublisher;
import com.nest.nestapp.model.*;
import com.nest.nestapp.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Search lifecycle:
 * <ul>
 *   <li><b>POST /search</b> — persists {@code SearchRequest}, aggregate {@code ScrapingJob}, and one {@code ScrapeSourceTask}
 *       per enabled source; then either publishes Rabbit messages ({@code scrape.mode=queue}) or runs {@link #processSearchAsync}
 *       ({@code inline}).</li>
 *   <li><b>GET /results</b> — reads DB only; in queue mode waits until every source task is terminal, then {@link #finalizeQueuedSearch}
 *       runs scoring once before returning completed results.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SearchService {

    private final SearchRequestRepository searchRequestRepository;
    private final ScrapingJobRepository scrapingJobRepository;
    private final ApartmentRepository apartmentRepository;
    private final ApartmentScoreRepository apartmentScoreRepository;
    private final ScraperService scraperService;
    private final ScoringService scoringService;
    private final ListingFilterService listingFilterService;
    private final ScrapeSourceTaskService scrapeSourceTaskService;
    private final ScrapeJobPublisher scrapeJobPublisher;
    private final ApplicationContext applicationContext;

    @Value("${scrape.mode:inline}")
    private String scrapeMode;

    @Transactional
    public SearchResponseDto createSearch(SearchRequestDto dto) {
        // Create and save search request
        SearchRequest searchRequest = SearchRequest.builder()
                .priority(dto.getPriority())
                .maxPrice(dto.getMaxPrice())
                .minSqft(dto.getMinSqft())
                .desiredBedrooms(dto.getDesiredBedrooms())
                .desiredBathrooms(dto.getDesiredBathrooms())
                .desiredAmenities(dto.getDesiredAmenities() != null ? dto.getDesiredAmenities() : new ArrayList<>())
                .maxLeaseMonths(dto.getMaxLeaseMonths())
                .status(JobStatus.PENDING)
                .build();
        
        searchRequest = searchRequestRepository.save(searchRequest);
        
        // Create scraping job
        ScrapingJob job = ScrapingJob.builder()
                .searchId(searchRequest.getId())
                .status(JobStatus.PENDING)
                .build();
        scrapingJobRepository.save(job);
        // One DB row per source (e.g. Craigslist, Kijiji); workers or inline scrape flip rows to DONE/FAILED.
        scrapeSourceTaskService.createTasks(searchRequest.getId());

        log.info("Created search request with ID: {}", searchRequest.getId());
        // Must run after commit so publish/async scrape never sees half-written tasks.
        scheduleSearchProcessing(searchRequest);
        
        return SearchResponseDto.builder()
                .searchId(searchRequest.getId())
                .status(JobStatus.PENDING)
                .pollingUrl("/api/v1/search/" + searchRequest.getId() + "/results")
                .estimatedWaitSeconds(120)
                .build();
    }

    /**
     * Inline ({@code scrape.mode=inline}) path: all sources scraped inside the API process, then scored here.
     * Not used when {@code scrape.mode=queue} (workers scrape per message; API scores on demand in {@link #finalizeQueuedSearch}).
     */
    @Async
    @Transactional
    public void processSearchAsync(UUID searchId) {
        ScrapingJob job = scrapingJobRepository.findBySearchId(searchId)
                .orElseThrow(() -> new RuntimeException("Scraping job not found for search: " + searchId));
        SearchRequest request = searchRequestRepository.findById(searchId)
                .orElseThrow(() -> new RuntimeException("Search request not found: " + searchId));

        try {
            job.setStatus(JobStatus.PROCESSING);
            job.setStartedAt(OffsetDateTime.now());
            job.setErrorMessage(null);
            scrapingJobRepository.save(job);

            request.setStatus(JobStatus.PROCESSING);
            searchRequestRepository.save(request);
            scrapeSourceTaskService.enabledSources()
                    .forEach(source -> scrapeSourceTaskService.markProcessing(searchId, source));

            List<Apartment> apartments = scraperService.scrapeApartments(request);
            apartments = listingFilterService.applySpecificNeeds(apartments, request);

            job.setTotalAttempted(apartments.size());

            if (!apartments.isEmpty()) {
                List<Apartment> savedApartments = apartmentRepository.saveAll(apartments);
                List<ApartmentScore> scores = buildScores(savedApartments, request);
                apartmentScoreRepository.saveAll(scores);
                job.setTotalSuccessful(savedApartments.size());
                job.setTotalFailed(Math.max(0, job.getTotalAttempted() - savedApartments.size()));
            } else {
                job.setTotalSuccessful(0);
                job.setTotalFailed(0);
            }

            job.setStatus(JobStatus.COMPLETED);
            job.setCompletedAt(OffsetDateTime.now());
            scrapingJobRepository.save(job);

            request.setStatus(JobStatus.COMPLETED);
            searchRequestRepository.save(request);
            scrapeSourceTaskService.enabledSources()
                    .forEach(source -> scrapeSourceTaskService.markDone(searchId, source));

            log.info("Completed search {}", searchId);
        } catch (Exception e) {
            log.error("Search processing failed for {}", searchId, e);

            job.setStatus(JobStatus.FAILED);
            job.setCompletedAt(OffsetDateTime.now());
            job.setErrorMessage(e.getMessage());
            scrapingJobRepository.save(job);

            request.setStatus(JobStatus.FAILED);
            searchRequestRepository.save(request);
            scrapeSourceTaskService.enabledSources()
                    .forEach(source -> scrapeSourceTaskService.markFailed(searchId, source, e.getMessage()));
        }
    }

    /**
     * Polling endpoint: never touches RabbitMQ. In queue mode, completion is inferred when every {@code scrape_source_tasks}
     * row is DONE or FAILED; then we transition the aggregate job and write scores (once) if needed.
     */
    @Transactional
    public SearchResultsDto getResults(UUID searchId) {
        ScrapingJob job = scrapingJobRepository.findBySearchId(searchId)
                .orElseThrow(() -> new NoSuchElementException("Search not found"));

        if (scrapeSourceTaskService.hasTasks(searchId)
                && job.getStatus() != JobStatus.COMPLETED
                && job.getStatus() != JobStatus.FAILED) {
            if (!scrapeSourceTaskService.allTasksTerminal(searchId)) {
                // Workers still processing one or more sources — tell client to poll again.
                return SearchResultsDto.builder()
                        .searchId(searchId)
                        .status(JobStatus.PROCESSING)
                        .estimatedWaitSeconds(45)
                        .build();
            }
            // All per-source tasks finished: promote aggregate job + score listings (guarded inside).
            job = finalizeQueuedSearch(searchId);
        }
        
        if (job.getStatus() == JobStatus.COMPLETED) {
            // Get top 20 scored apartments
            List<ApartmentScore> scores = apartmentScoreRepository.findTop20BySearchIdOrderByFinalScoreDesc(searchId);
            List<UUID> apartmentIds = scores.stream().map(ApartmentScore::getApartmentId).collect(Collectors.toList());
            List<Apartment> apartments = apartmentRepository.findAllById(apartmentIds);
            Map<UUID, Apartment> apartmentsById = new HashMap<>();
            for (Apartment apartment : apartments) {
                apartmentsById.put(apartment.getId(), apartment);
            }
            
            // Map to DTOs
            List<ApartmentDto> apartmentDtos = scores.stream()
                    .map(score -> {
                        Apartment apt = apartmentsById.get(score.getApartmentId());
                        if (apt == null) {
                            return null;
                        }

                        return ApartmentDto.builder()
                                .id(apt.getId())
                                .title(apt.getTitle())
                                .price(apt.getPrice())
                                .sqft(apt.getSqft())
                                .bedrooms(apt.getBedrooms())
                                .bathrooms(apt.getBathrooms())
                                .amenities(apt.getAmenities())
                                .leaseTermMonths(apt.getLeaseTermMonths())
                                .sourceUrl(apt.getSourceUrl())
                                .imageUrl(apt.getImageUrl())
                                .imageUrls(apt.getImageUrls())
                                .finalScore(score.getFinalScore())
                                .scoreBreakdown(ScoreBreakdownDto.builder()
                                        .priceScore(score.getPriceScore())
                                        .spaceScore(score.getSpaceScore())
                                        .amenitiesScore(score.getAmenitiesScore())
                                        .leaseScore(score.getLeaseScore())
                                        .build())
                                .build();
                    })
                    .filter(java.util.Objects::nonNull)
                    .collect(Collectors.toList());
            
            return SearchResultsDto.builder()
                    .searchId(searchId)
                    .status(JobStatus.COMPLETED)
                    .totalApartmentsFound(apartmentDtos.size())
                    .totalAttempted(job.getTotalAttempted())
                    .totalSuccessful(job.getTotalSuccessful())
                    .totalFailed(job.getTotalFailed())
                    .apartments(apartmentDtos)
                    .build();
        } else if (job.getStatus() == JobStatus.PROCESSING) {
            return SearchResultsDto.builder()
                    .searchId(searchId)
                    .status(JobStatus.PROCESSING)
                    .estimatedWaitSeconds(60)
                    .build();
        } else if (job.getStatus() == JobStatus.FAILED) {
            return SearchResultsDto.builder()
                    .searchId(searchId)
                    .status(JobStatus.FAILED)
                    .totalAttempted(job.getTotalAttempted())
                    .totalSuccessful(job.getTotalSuccessful())
                    .totalFailed(job.getTotalFailed())
                    .errorMessage(job.getErrorMessage())
                    .build();
        } else {
            return SearchResultsDto.builder()
                    .searchId(searchId)
                    .status(JobStatus.PENDING)
                    .estimatedWaitSeconds(120)
                    .build();
        }
    }

    /**
     * Queue-mode only scoring gate: called from {@link #getResults} after workers finished all sources.
     * Uses a row lock on {@code ScrapingJob} so concurrent GETs from multiple API replicas only score once.
     */
    private ScrapingJob finalizeQueuedSearch(UUID searchId) {
        ScrapingJob job = scrapingJobRepository.findBySearchIdForUpdate(searchId)
                .orElseThrow(() -> new NoSuchElementException("Search not found"));

        if (job.getStatus() == JobStatus.COMPLETED || job.getStatus() == JobStatus.FAILED) {
            return job;
        }
        if (!scrapeSourceTaskService.allTasksTerminal(searchId)) {
            return job;
        }

        SearchRequest request = searchRequestRepository.findById(searchId)
                .orElseThrow(() -> new NoSuchElementException("Search request not found"));
        List<Apartment> apartments = apartmentRepository.findBySearchId(searchId);

        if (!apartments.isEmpty()) {
            // Idempotent: another replica may have scored under the same lock ordering.
            if (!apartmentScoreRepository.existsBySearchId(searchId)) {
                List<ApartmentScore> scores = buildScores(apartments, request);
                apartmentScoreRepository.saveAll(scores);
            }
            job.setStatus(JobStatus.COMPLETED);
            job.setTotalSuccessful(Math.max(job.getTotalSuccessful(), apartments.size()));
            request.setStatus(JobStatus.COMPLETED);
        } else {
            job.setStatus(JobStatus.FAILED);
            job.setTotalSuccessful(0);
            job.setErrorMessage("No usable listings found after all scrape source tasks completed");
            request.setStatus(JobStatus.FAILED);
        }

        job.setCompletedAt(OffsetDateTime.now());
        scrapingJobRepository.save(job);
        searchRequestRepository.save(request);
        return job;
    }

    private List<ApartmentScore> buildScores(List<Apartment> apartments, SearchRequest request) {
        int minPrice = apartments.stream()
                .map(Apartment::getPrice)
                .filter(java.util.Objects::nonNull)
                .min(Comparator.naturalOrder())
                .orElse(request.getMaxPrice());
        int maxPrice = apartments.stream()
                .map(Apartment::getPrice)
                .filter(java.util.Objects::nonNull)
                .max(Comparator.naturalOrder())
                .orElse(request.getMaxPrice());
        int minSqft = apartments.stream()
                .map(Apartment::getSqft)
                .filter(java.util.Objects::nonNull)
                .min(Comparator.naturalOrder())
                .orElse(request.getMinSqft());
        int maxSqft = apartments.stream()
                .map(Apartment::getSqft)
                .filter(java.util.Objects::nonNull)
                .max(Comparator.naturalOrder())
                .orElse(request.getMinSqft());

        return apartments.stream()
                .map(apartment -> scoringService.calculateScore(apartment, request, minPrice, maxPrice, minSqft, maxSqft))
                .collect(Collectors.toList());
    }

    /**
     * Defer {@link #dispatchSearch} until the surrounding transaction commits (createSearch).
     * Avoids publishing to Rabbit or starting {@link #processSearchAsync} before tasks + job rows are visible to workers.
     */
    private void scheduleSearchProcessing(SearchRequest searchRequest) {
        SearchService proxy = applicationContext.getBean(SearchService.class);
        if (!TransactionSynchronizationManager.isActualTransactionActive()) {
            dispatchSearch(searchRequest, proxy);
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                dispatchSearch(searchRequest, proxy);
            }
        });
    }

    /**
     * Feature flag: queue mode enqueues one message per source; inline mode scrapes in-process via {@code @Async}.
     */
    private void dispatchSearch(SearchRequest searchRequest, SearchService proxy) {
        if ("queue".equalsIgnoreCase(scrapeMode)) {
            publishSourceJobs(searchRequest);
            return;
        }

        // Spring proxy required so @Async and transaction boundaries apply to processSearchAsync.
        proxy.processSearchAsync(searchRequest.getId());
    }

    /**
     * One AMQP message per enabled source; workers compete on the shared queue and each handles a single source.
     */
    private void publishSourceJobs(SearchRequest searchRequest) {
        scrapeSourceTaskService.enabledSources()
                .forEach(source -> scrapeJobPublisher.publish(toMessage(searchRequest, source)));
    }

    /** Snapshot of search criteria + correlation id carried with the job (worker has no HTTP session). */
    private ScrapeJobMessage toMessage(SearchRequest searchRequest, ScrapeSource source) {
        return new ScrapeJobMessage(
                searchRequest.getId(),
                source,
                searchRequest.getPriority(),
                searchRequest.getMaxPrice(),
                searchRequest.getMinSqft(),
                searchRequest.getDesiredBedrooms(),
                searchRequest.getDesiredBathrooms(),
                searchRequest.getDesiredAmenities(),
                searchRequest.getMaxLeaseMonths(),
                UUID.randomUUID()
        );
    }
}
