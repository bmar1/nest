package com.nest.nestapp.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "scrape.mode", havingValue = "queue")
@RequiredArgsConstructor
@Slf4j
public class RabbitScrapeJobPublisher implements ScrapeJobPublisher {

    private final RabbitTemplate rabbitTemplate;

    @Value("${rabbitmq.scrape.exchange:scrape.exchange}")
    private String exchange;

    @Value("${rabbitmq.scrape.routing-key:scrape.job}")
    private String routingKey;

    @Override
    public void publish(ScrapeJobMessage message) {
        rabbitTemplate.convertAndSend(exchange, routingKey, message);
        log.info("Published scrape job for search {} source {}", message.searchId(), message.source());
    }
}
