package com.nest.nestapp.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nest.nestapp.dto.SearchRequestDto;
import com.nest.nestapp.model.Priority;
import com.nest.nestapp.messaging.ScrapeJobPublisher;
import com.nest.nestapp.service.ScraperService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Full-stack security tests with real {@link SecurityConfig} OAuth2 filter chains.
 * Persistence-heavy ownership scenarios are covered in {@link com.nest.nestapp.service.SearchServiceOwnershipTest}.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:nest-security-test;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.flyway.enabled=false",
        "google.oauth.client-id=test-google-client",
        "scrape.mode=queue"
})
class ApiSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ScraperService scraperService;

    @MockitoBean
    private ScrapeJobPublisher scrapeJobPublisher;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void searchPost_withoutJwt_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validSearchRequest())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void searchResults_withoutJwt_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/search/" + UUID.randomUUID() + "/results"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void prometheus_onMainPort_withoutAuth_isForbidden() throws Exception {
        mockMvc.perform(get("/actuator/prometheus"))
                .andExpect(status().isForbidden());
    }

    @Test
    void unknownRoute_withoutAuth_isForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/admin"))
                .andExpect(status().isForbidden());
    }

    @Test
    void health_withoutAuth_isPublic() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk());
    }

    private static SearchRequestDto validSearchRequest() {
        return SearchRequestDto.builder()
                .priority(Priority.BUDGET)
                .maxPrice(2500)
                .minSqft(800)
                .build();
    }
}
