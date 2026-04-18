package com.nest.nestapp.controller;

import com.nest.nestapp.dto.SearchRequestDto;
import com.nest.nestapp.dto.SearchResponseDto;
import com.nest.nestapp.dto.SearchResultsDto;
import com.nest.nestapp.service.SearchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @PostMapping
    public ResponseEntity<SearchResponseDto> createSearch(@Valid @RequestBody SearchRequestDto request) {
        SearchResponseDto response = searchService.createSearch(request);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    @GetMapping("/{searchId}/results")
    public ResponseEntity<SearchResultsDto> getResults(@PathVariable UUID searchId) {
        SearchResultsDto results = searchService.getResults(searchId);
        
        if (results.getStatus() == com.nest.nestapp.model.JobStatus.COMPLETED) {
            return ResponseEntity.ok(results);
        } else if (results.getStatus() == com.nest.nestapp.model.JobStatus.FAILED) {
            // FAILED is a valid terminal poll state — not an HTTP server error (avoid axios 5xx).
            return ResponseEntity.ok(results);
        } else {
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(results);
        }
    }
}
