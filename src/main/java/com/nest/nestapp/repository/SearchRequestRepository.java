package com.nest.nestapp.repository;

import com.nest.nestapp.model.SearchRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.UUID;

@Repository
public interface SearchRequestRepository extends JpaRepository<SearchRequest, UUID> {

    @Modifying
    @Query("DELETE FROM SearchRequest r WHERE r.createdAt < :cutoff")
    int deleteByCreatedAtBefore(@Param("cutoff") OffsetDateTime cutoff);
}
