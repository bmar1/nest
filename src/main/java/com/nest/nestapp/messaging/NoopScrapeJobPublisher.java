package com.nest.nestapp.messaging;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "scrape.mode", havingValue = "inline", matchIfMissing = true)
@Slf4j
public class NoopScrapeJobPublisher implements ScrapeJobPublisher {

    @Override
    public void publish(ScrapeJobMessage message) {
        log.debug("Inline scrape mode active; not publishing scrape job {}", message);
    }
}
