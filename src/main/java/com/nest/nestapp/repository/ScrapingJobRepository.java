package com.nest.nestapp.repository;

import com.nest.nestapp.model.ScrapingJob;
import com.nest.nestapp.model.JobStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ScrapingJobRepository extends JpaRepository<ScrapingJob, UUID> {

    Optional<ScrapingJob> findBySearchId(UUID searchId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT j FROM ScrapingJob j WHERE j.searchId = :searchId")
    Optional<ScrapingJob> findBySearchIdForUpdate(@Param("searchId") UUID searchId);

    @Modifying
    @Query("""
            UPDATE ScrapingJob j
               SET j.status = :status,
                   j.startedAt = COALESCE(j.startedAt, :startedAt),
                   j.errorMessage = :errorMessage
             WHERE j.searchId = :searchId
            """)
    int updateStatus(
            @Param("searchId") UUID searchId,
            @Param("status") JobStatus status,
            @Param("startedAt") OffsetDateTime startedAt,
            @Param("errorMessage") String errorMessage
    );

    @Modifying
    @Query("""
            UPDATE ScrapingJob j
               SET j.totalAttempted = COALESCE(j.totalAttempted, 0) + :attempted,
                   j.totalSuccessful = COALESCE(j.totalSuccessful, 0) + :successful,
                   j.totalFailed = COALESCE(j.totalFailed, 0) + :failed
             WHERE j.searchId = :searchId
            """)
    int incrementCounts(
            @Param("searchId") UUID searchId,
            @Param("attempted") int attempted,
            @Param("successful") int successful,
            @Param("failed") int failed
    );

    @Modifying
    @Query("DELETE FROM ScrapingJob j WHERE j.createdAt < :cutoff")
    int deleteByCreatedAtBefore(@Param("cutoff") OffsetDateTime cutoff);
}
