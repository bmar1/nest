package com.nest.nestapp;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Full Spring context integration test.
 * Requires a live PostgreSQL instance - run manually or in CI with a real DB.
 * Use ./mvnw test -Dspring.datasource.url=jdbc:postgresql://... to enable.
 */
@SpringBootTest
@Disabled("Integration test requires a running PostgreSQL instance")
class NestappApplicationTests {

    @Test
    void contextLoads() {
    }

}
