package com.nest.nestapp.messaging;

import com.nest.nestapp.model.Apartment;
import com.nest.nestapp.model.JobStatus;
import com.nest.nestapp.model.SearchRequest;
import com.nest.nestapp.repository.ApartmentRepository;
import com.nest.nestapp.repository.ScrapingJobRepository;
import com.nest.nestapp.repository.SearchRequestRepository;
import com.nest.nestapp.service.ListingFilterService;
import com.nest.nestapp.service.ScrapeSourceTaskService;
import com.nest.nestapp.service.ScraperService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Component
@Profile("worker")
@ConditionalOnProperty(name = "scrape.mode", havingValue = "queue")
@RequiredArgsConstructor
@Slf4j
public class ScrapeJobConsumer {

    private final SearchRequestRepository searchRequestRepository;
    private final ScrapingJobRepository scrapingJobRepository;
    private final ApartmentRepository apartmentRepository;
    private final ScraperService scraperService;
    private final ListingFilterService listingFilterService;
    private final ScrapeSourceTaskService scrapeSourceTaskService;

    @RabbitListener(queues = "${rabbitmq.scrape.queue:scrape.jobs}")
    @Transactional
    public void consume(ScrapeJobMessage message) {
        log.info("Worker received scrape job search={} source={}", message.searchId(), message.source());

        try {
            SearchRequest request = searchRequestRepository.findById(message.searchId())
                    .orElseThrow(() -> new IllegalArgumentException("Search request not found: " + message.searchId()));

            searchRequestRepository.updateStatus(message.searchId(), JobStatus.PROCESSING);
            scrapingJobRepository.updateStatus(message.searchId(), JobStatus.PROCESSING, OffsetDateTime.now(), null);
            scrapeSourceTaskService.markProcessing(message.searchId(), message.source());

            List<Apartment> apartments = scraperService.scrapeSource(request, message.source());
            apartments = listingFilterService.applySpecificNeeds(apartments, request);
            int attempted = apartments.size();
            List<Apartment> savedApartments = apartmentRepository.saveAll(apartments);
            int successful = savedApartments.size();

            scrapingJobRepository.incrementCounts(
                    message.searchId(),
                    attempted,
                    successful,
                    Math.max(0, attempted - successful)
            );
            scrapeSourceTaskService.markDone(message.searchId(), message.source());

            log.info(
                    "Worker completed scrape job search={} source={} saved={}",
                    message.searchId(),
                    message.source(),
                    successful
            );
        } catch (Exception e) {
            log.error("Worker failed scrape job search={} source={}", message.searchId(), message.source(), e);
            scrapeSourceTaskService.markFailed(message.searchId(), message.source(), e.getMessage());
            scrapingJobRepository.incrementCounts(message.searchId(), 0, 0, 1);
        }
    }
}
