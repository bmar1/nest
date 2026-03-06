package com.nest.nestapp.controller;

import com.nest.nestapp.dto.SearchRequestDto;
import com.nest.nestapp.dto.SearchResponseDto;
import com.nest.nestapp.dto.SearchResultsDto;
import com.nest.nestapp.service.SearchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
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
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(results);
        } else {
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(results);
        }
    }
}
