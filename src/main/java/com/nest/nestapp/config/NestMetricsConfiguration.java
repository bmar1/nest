package com.nest.nestapp.config;

import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.Tags;
import io.micrometer.core.instrument.binder.MeterBinder;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Properties;

/**
 * Exposes scrape-queue depth for Prometheus / GKE Managed Prometheus alerting
 * when {@code scrape.mode=queue} and Rabbit is configured.
 */
@Configuration
public class NestMetricsConfiguration {

    @Bean
    @ConditionalOnProperty(name = "scrape.mode", havingValue = "queue")
    @ConditionalOnBean(RabbitAdmin.class)
    public MeterBinder scrapeQueueDepth(
            RabbitAdmin rabbitAdmin,
            @Value("${rabbitmq.scrape.queue:scrape.jobs}") String queueName
    ) {
        return registry -> Gauge.builder("nest.rabbit.scrape.queue.messages_ready", rabbitAdmin, admin -> {
                    Properties props = admin.getQueueProperties(queueName);
                    if (props == null) {
                        return 0.0;
                    }
                    Object raw = props.get(RabbitAdmin.QUEUE_MESSAGE_COUNT);
                    if (raw instanceof Number n) {
                        return Math.max(0.0, n.doubleValue());
                    }
                    return 0.0;
                })
                .description("Messages ready on the scrape job queue (broker view)")
                .tags(Tags.of("queue", queueName))
                .register(registry);
    }
}
