package com.nest.nestapp.repository;

import com.nest.nestapp.model.ScrapingJob;
import org.springframework.data.jpa.repository.JpaRepository;
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

    @Modifying
    @Query("DELETE FROM ScrapingJob j WHERE j.createdAt < :cutoff")
    int deleteByCreatedAtBefore(@Param("cutoff") OffsetDateTime cutoff);
}
