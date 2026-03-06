package com.nest.nestapp.repository;

import com.nest.nestapp.model.SearchRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SearchRequestRepository extends JpaRepository<SearchRequest, UUID> {
}
