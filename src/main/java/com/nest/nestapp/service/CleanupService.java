package com.nest.nestapp.service;

import com.nest.nestapp.repository.ApartmentRepository;
import com.nest.nestapp.repository.ApartmentScoreRepository;
import com.nest.nestapp.repository.ScrapingJobRepository;
import com.nest.nestapp.repository.SearchRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Nightly cleanup job that removes expired apartment data and old search records.
 *
 * Deletion order respects FK constraints:
 *   apartment_scores -> apartments -> scraping_jobs -> search_requests
 *
 * Apartment expiry is set to created_at + 3 days (see Apartment.@PrePersist).
 * SearchRequest / ScrapingJob records are kept for 7 days so users can
 * reopen their results tab after a search completes.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CleanupService {

    private static final int SEARCH_RETENTION_DAYS = 7;

    private final ApartmentScoreRepository apartmentScoreRepository;
    private final ApartmentRepository apartmentRepository;
    private final ScrapingJobRepository scrapingJobRepository;
    private final SearchRequestRepository searchRequestRepository;

    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupExpiredData() {
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime searchCutoff = now.minusDays(SEARCH_RETENTION_DAYS);

        log.info("Starting nightly cleanup (search cutoff: {})", searchCutoff);

        // 1. Collect IDs of apartments that have expired
        List<UUID> expiredApartmentIds = apartmentRepository.findIdsByExpiresAtBefore(now);

        // 2. Delete scores for those apartments first (FK child)
        int scoresDeleted = 0;
        if (!expiredApartmentIds.isEmpty()) {
            scoresDeleted = apartmentScoreRepository.deleteByApartmentIdIn(expiredApartmentIds);
        }

        // 3. Delete the expired apartments themselves
        int apartmentsDeleted = apartmentRepository.deleteByExpiresAtBefore(now);

        // 4. Delete scraping jobs older than the retention window
        int jobsDeleted = scrapingJobRepository.deleteByCreatedAtBefore(searchCutoff);

        // 5. Delete search requests older than the retention window
        int requestsDeleted = searchRequestRepository.deleteByCreatedAtBefore(searchCutoff);

        log.info(
                "Cleanup complete: {} scores, {} apartments, {} jobs, {} search requests deleted",
                scoresDeleted, apartmentsDeleted, jobsDeleted, requestsDeleted
        );
    }
}
