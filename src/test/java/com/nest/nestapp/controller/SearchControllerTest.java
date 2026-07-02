package com.nest.nestapp.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nest.nestapp.dto.SearchRequestDto;
import com.nest.nestapp.dto.SearchResponseDto;
import com.nest.nestapp.dto.SearchResultsDto;
import com.nest.nestapp.exception.GlobalExceptionHandler;
import com.nest.nestapp.model.JobStatus;
import com.nest.nestapp.model.Priority;
import com.nest.nestapp.service.SearchService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SearchController.class)
@Import(GlobalExceptionHandler.class)
@AutoConfigureMockMvc(addFilters = false)
@TestPropertySource(properties = "google.oauth.client-id=test-google-client")
class SearchControllerTest {

    private static final String TEST_USER = "google-sub-test-user";

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private SearchService searchService;

    @BeforeEach
    void authenticateTestUser() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(TEST_USER, null, List.of())
        );
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createSearch_withValidRequest_returns202() throws Exception {
        SearchRequestDto requestDto = SearchRequestDto.builder()
                .priority(Priority.BUDGET)
                .maxPrice(2500)
                .minSqft(800)
                .desiredAmenities(List.of("laundry", "parking"))
                .maxLeaseMonths(12)
                .build();

        UUID searchId = UUID.randomUUID();
        SearchResponseDto responseDto = SearchResponseDto.builder()
                .searchId(searchId)
                .status(JobStatus.PENDING)
                .pollingUrl("/api/v1/search/" + searchId + "/results")
                .estimatedWaitSeconds(120)
                .build();

        when(searchService.createSearch(any(SearchRequestDto.class), eq(TEST_USER))).thenReturn(responseDto);

        mockMvc.perform(post("/api/v1/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.searchId").value(searchId.toString()))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.estimatedWaitSeconds").value(120));
    }

    @Test
    void createSearch_withInvalidRequest_returns400() throws Exception {
        SearchRequestDto invalidRequest = SearchRequestDto.builder()
                .priority(Priority.BUDGET)
                .maxPrice(100)
                .minSqft(50)
                .build();

        mockMvc.perform(post("/api/v1/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getResults_whenCompleted_returns200() throws Exception {
        UUID searchId = UUID.randomUUID();
        SearchResultsDto resultsDto = SearchResultsDto.builder()
                .searchId(searchId)
                .status(JobStatus.COMPLETED)
                .totalApartmentsFound(50)
                .totalAttempted(50)
                .totalSuccessful(50)
                .totalFailed(0)
                .apartments(new ArrayList<>())
                .build();

        when(searchService.getResults(searchId, TEST_USER)).thenReturn(resultsDto);

        mockMvc.perform(get("/api/v1/search/" + searchId + "/results"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.totalApartmentsFound").value(50));
    }

    @Test
    void getResults_whenProcessing_returns202() throws Exception {
        UUID searchId = UUID.randomUUID();
        SearchResultsDto resultsDto = SearchResultsDto.builder()
                .searchId(searchId)
                .status(JobStatus.PROCESSING)
                .estimatedWaitSeconds(60)
                .build();

        when(searchService.getResults(searchId, TEST_USER)).thenReturn(resultsDto);

        mockMvc.perform(get("/api/v1/search/" + searchId + "/results"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("PROCESSING"));
    }

    @Test
    void getResults_whenFailed_returns200() throws Exception {
        UUID searchId = UUID.randomUUID();
        SearchResultsDto resultsDto = SearchResultsDto.builder()
                .searchId(searchId)
                .status(JobStatus.FAILED)
                .totalAttempted(50)
                .totalSuccessful(10)
                .totalFailed(40)
                .errorMessage("Search could not be completed. Please try again.")
                .build();

        when(searchService.getResults(searchId, TEST_USER)).thenReturn(resultsDto);

        mockMvc.perform(get("/api/v1/search/" + searchId + "/results"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("FAILED"));
    }

    @Test
    void getResults_otherUsersSearch_returns404() throws Exception {
        UUID searchId = UUID.randomUUID();
        when(searchService.getResults(searchId, TEST_USER))
                .thenThrow(new NoSuchElementException("Search not found"));

        mockMvc.perform(get("/api/v1/search/" + searchId + "/results"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("The requested resource was not found"));
    }
}
