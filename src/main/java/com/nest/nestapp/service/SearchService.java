package com.nest.nestapp.service;

import com.nest.nestapp.dto.*;
import com.nest.nestapp.model.*;
import com.nest.nestapp.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
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

    @Transactional
    public SearchResponseDto createSearch(SearchRequestDto dto) {
        // Create and save search request
        SearchRequest searchRequest = SearchRequest.builder()
                .priority(dto.getPriority())
                .maxPrice(dto.getMaxPrice())
                .minSqft(dto.getMinSqft())
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
        
        log.info("Created search request with ID: {}", searchRequest.getId());
        
        // TODO: Publish message to queue for async processing
        
        return SearchResponseDto.builder()
                .searchId(searchRequest.getId())
                .status(JobStatus.PENDING)
                .pollingUrl("/api/v1/search/" + searchRequest.getId() + "/results")
                .estimatedWaitSeconds(120)
                .build();
    }

    @Transactional(readOnly = true)
    public SearchResultsDto getResults(UUID searchId) {
        // Get scraping job status
        ScrapingJob job = scrapingJobRepository.findBySearchId(searchId)
                .orElseThrow(() -> new RuntimeException("Search not found"));
        
        if (job.getStatus() == JobStatus.COMPLETED) {
            // Get top 20 scored apartments
            List<ApartmentScore> scores = apartmentScoreRepository.findTop20BySearchIdOrderByFinalScoreDesc(searchId);
            List<UUID> apartmentIds = scores.stream().map(ApartmentScore::getApartmentId).collect(Collectors.toList());
            List<Apartment> apartments = apartmentRepository.findAllById(apartmentIds);
            
            // Map to DTOs
            List<ApartmentDto> apartmentDtos = apartments.stream()
                    .map(apt -> {
                        ApartmentScore score = scores.stream()
                                .filter(s -> s.getApartmentId().equals(apt.getId()))
                                .findFirst()
                                .orElse(null);
                        
                        return ApartmentDto.builder()
                                .id(apt.getId())
                                .title(apt.getTitle())
                                .price(apt.getPrice())
                                .sqft(apt.getSqft())
                                .bedrooms(apt.getBedrooms())
                                .amenities(apt.getAmenities())
                                .leaseTermMonths(apt.getLeaseTermMonths())
                                .sourceUrl(apt.getSourceUrl())
                                .finalScore(score != null ? score.getFinalScore() : null)
                                .scoreBreakdown(score != null ? ScoreBreakdownDto.builder()
                                        .priceScore(score.getPriceScore())
                                        .spaceScore(score.getSpaceScore())
                                        .amenitiesScore(score.getAmenitiesScore())
                                        .leaseScore(score.getLeaseScore())
                                        .build() : null)
                                .build();
                    })
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
                    .build();
        } else {
            return SearchResultsDto.builder()
                    .searchId(searchId)
                    .status(JobStatus.PENDING)
                    .estimatedWaitSeconds(120)
                    .build();
        }
    }
}
