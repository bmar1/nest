package com.nest.nestapp.service;

import com.nest.nestapp.dto.SearchRequestDto;
import com.nest.nestapp.model.JobStatus;
import com.nest.nestapp.model.Priority;
import com.nest.nestapp.model.ScrapingJob;
import com.nest.nestapp.model.SearchRequest;
import com.nest.nestapp.repository.ApartmentRepository;
import com.nest.nestapp.repository.ApartmentScoreRepository;
import com.nest.nestapp.repository.ScrapingJobRepository;
import com.nest.nestapp.repository.SearchRequestRepository;
import com.nest.nestapp.messaging.ScrapeJobPublisher;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationContext;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SearchServiceOwnershipTest {

    private static final String OWNER = "google-sub-owner";
    private static final String OTHER = "google-sub-other";

    @Mock
    private SearchRequestRepository searchRequestRepository;
    @Mock
    private ScrapingJobRepository scrapingJobRepository;
    @Mock
    private ApartmentRepository apartmentRepository;
    @Mock
    private ApartmentScoreRepository apartmentScoreRepository;
    @Mock
    private ScraperService scraperService;
    @Mock
    private ScoringService scoringService;
    @Mock
    private ListingFilterService listingFilterService;
    @Mock
    private ScrapeSourceTaskService scrapeSourceTaskService;
    @Mock
    private ScrapeJobPublisher scrapeJobPublisher;
    @Mock
    private ApplicationContext applicationContext;

    @InjectMocks
    private SearchService searchService;

    @Test
    void createSearch_persistsUserIdFromJwtSubject() {
        ReflectionTestUtils.setField(searchService, "scrapeMode", "queue");

        SearchRequestDto dto = SearchRequestDto.builder()
                .priority(Priority.BALANCED)
                .maxPrice(2000)
                .minSqft(700)
                .build();

        when(searchRequestRepository.save(any(SearchRequest.class)))
                .thenAnswer(invocation -> {
                    SearchRequest saved = invocation.getArgument(0);
                    saved.setId(UUID.randomUUID());
                    return saved;
                });
        when(scrapingJobRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(scrapeSourceTaskService.enabledSources()).thenReturn(List.of());
        when(applicationContext.getBean(SearchService.class)).thenReturn(searchService);

        searchService.createSearch(dto, OWNER);

        ArgumentCaptor<SearchRequest> captor = ArgumentCaptor.forClass(SearchRequest.class);
        verify(searchRequestRepository).save(captor.capture());
        assertThat(captor.getValue().getUserId()).isEqualTo(OWNER);
    }

    @Test
    void getResults_wrongUser_throwsNotFound() {
        UUID searchId = UUID.randomUUID();
        when(searchRequestRepository.findByIdAndUserId(searchId, OTHER)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> searchService.getResults(searchId, OTHER))
                .isInstanceOf(NoSuchElementException.class);
    }

    @Test
    void getResults_owner_canPollProcessingSearch() {
        UUID searchId = UUID.randomUUID();
        when(searchRequestRepository.findByIdAndUserId(searchId, OWNER))
                .thenReturn(Optional.of(SearchRequest.builder().id(searchId).userId(OWNER).build()));
        when(scrapingJobRepository.findBySearchId(searchId))
                .thenReturn(Optional.of(ScrapingJob.builder()
                        .searchId(searchId)
                        .status(JobStatus.PROCESSING)
                        .build()));
        when(scrapeSourceTaskService.hasTasks(searchId)).thenReturn(false);

        var results = searchService.getResults(searchId, OWNER);

        assertThat(results.getStatus()).isEqualTo(JobStatus.PROCESSING);
    }
}
