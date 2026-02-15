package com.nest.nestapp.repository;

import com.nest.nestapp.model.ScrapingJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ScrapingJobRepository extends JpaRepository<ScrapingJob, UUID> {
    Optional<ScrapingJob> findBySearchId(UUID searchId);
}
