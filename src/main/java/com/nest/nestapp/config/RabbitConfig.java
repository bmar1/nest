package com.nest.nestapp.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
@ConditionalOnProperty(name = "scrape.mode", havingValue = "queue")
public class RabbitConfig {

    @Value("${rabbitmq.scrape.exchange:scrape.exchange}")
    private String exchangeName;

    @Value("${rabbitmq.scrape.queue:scrape.jobs}")
    private String queueName;

    @Value("${rabbitmq.scrape.routing-key:scrape.job}")
    private String routingKey;

    @Value("${rabbitmq.scrape.dlx:scrape.dlx}")
    private String deadLetterExchangeName;

    @Value("${rabbitmq.scrape.dlq:scrape.jobs.dlq}")
    private String deadLetterQueueName;

    @Bean
    public DirectExchange scrapeExchange() {
        return new DirectExchange(exchangeName, true, false);
    }

    @Bean
    public DirectExchange scrapeDeadLetterExchange() {
        return new DirectExchange(deadLetterExchangeName, true, false);
    }

    @Bean
    public Queue scrapeQueue() {
        Map<String, Object> arguments = new HashMap<>();
        arguments.put("x-dead-letter-exchange", deadLetterExchangeName);
        return new Queue(queueName, true, false, false, arguments);
    }

    @Bean
    public Queue scrapeDeadLetterQueue() {
        return new Queue(deadLetterQueueName, true);
    }

    @Bean
    public Binding scrapeBinding(Queue scrapeQueue, DirectExchange scrapeExchange) {
        return BindingBuilder.bind(scrapeQueue).to(scrapeExchange).with(routingKey);
    }

    @Bean
    public Binding scrapeDeadLetterBinding(Queue scrapeDeadLetterQueue, DirectExchange scrapeDeadLetterExchange) {
        return BindingBuilder.bind(scrapeDeadLetterQueue).to(scrapeDeadLetterExchange).with(routingKey);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
