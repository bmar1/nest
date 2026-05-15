package com.nest.nestapp.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.amqp.autoconfigure.SimpleRabbitListenerContainerFactoryConfigurer;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

/**
 * Declares scrape exchange, main queue, DLQ, and JSON converter when {@code scrape.mode=queue}.
 * Connection factory comes from Spring Boot ({@code spring.rabbitmq.*} / env).
 */
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

    /**
     * Listener factory matches Spring Boot defaults ({@code spring.rabbitmq.listener.simple.*}) via the configurer,
     * with {@code defaultRequeueRejected=false} so the broker does not redeliver (tasks are marked FAILED and acked).
     */
    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            SimpleRabbitListenerContainerFactoryConfigurer configurer,
            ConnectionFactory connectionFactory,
            MessageConverter jsonMessageConverter
    ) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        configurer.configure(factory, connectionFactory);
        factory.setMessageConverter(jsonMessageConverter);
        factory.setDefaultRequeueRejected(false);
        return factory;
    }
}
