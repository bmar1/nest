package com.nest.nestapp.messaging;

public interface ScrapeJobPublisher {

    void publish(ScrapeJobMessage message);
}
