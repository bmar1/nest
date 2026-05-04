package com.nest.nestapp.repository;

import com.nest.nestapp.model.ScrapeSource;
import com.nest.nestapp.model.ScrapeSourceTask;
import com.nest.nestapp.model.ScrapeSourceTaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ScrapeSourceTaskRepository extends JpaRepository<ScrapeSourceTask, UUID> {

    List<ScrapeSourceTask> findBySearchId(UUID searchId);

    Optional<ScrapeSourceTask> findBySearchIdAndSource(UUID searchId, ScrapeSource source);

    long countBySearchId(UUID searchId);

    long countBySearchIdAndStatusIn(UUID searchId, Collection<ScrapeSourceTaskStatus> statuses);

    boolean existsBySearchIdAndStatusIn(UUID searchId, Collection<ScrapeSourceTaskStatus> statuses);

    @Modifying
    @Query("""
            UPDATE ScrapeSourceTask t
               SET t.status = :status,
                   t.attempts = t.attempts + :attemptIncrement,
                   t.errorMessage = :errorMessage
             WHERE t.searchId = :searchId
               AND t.source = :source
            """)
    int updateStatus(
            @Param("searchId") UUID searchId,
            @Param("source") ScrapeSource source,
            @Param("status") ScrapeSourceTaskStatus status,
            @Param("attemptIncrement") int attemptIncrement,
            @Param("errorMessage") String errorMessage
    );
}
