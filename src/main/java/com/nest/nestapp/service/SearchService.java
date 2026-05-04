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
        scrapeSourceTaskService.createTasks(searchRequest.getId());
        
        log.info("Created search request with ID: {}", searchRequest.getId());
        scheduleSearchProcessing(searchRequest);
        
        return SearchResponseDto.builder()
                .searchId(searchRequest.getId())
                .status(JobStatus.PENDING)
                .pollingUrl("/api/v1/search/" + searchRequest.getId() + "/results")
                .estimatedWaitSeconds(120)
                .build();
    }

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

    @Transactional
    public SearchResultsDto getResults(UUID searchId) {
        // Get scraping job status
        ScrapingJob job = scrapingJobRepository.findBySearchId(searchId)
                .orElseThrow(() -> new NoSuchElementException("Search not found"));

        if (scrapeSourceTaskService.hasTasks(searchId)
                && job.getStatus() != JobStatus.COMPLETED
                && job.getStatus() != JobStatus.FAILED) {
            if (!scrapeSourceTaskService.allTasksTerminal(searchId)) {
                return SearchResultsDto.builder()
                        .searchId(searchId)
                        .status(JobStatus.PROCESSING)
                        .estimatedWaitSeconds(45)
                        .build();
            }
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

    private void dispatchSearch(SearchRequest searchRequest, SearchService proxy) {
        if ("queue".equalsIgnoreCase(scrapeMode)) {
            publishSourceJobs(searchRequest);
            return;
        }

        proxy.processSearchAsync(searchRequest.getId());
    }

    private void publishSourceJobs(SearchRequest searchRequest) {
        scrapeSourceTaskService.enabledSources()
                .forEach(source -> scrapeJobPublisher.publish(toMessage(searchRequest, source)));
    }

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
