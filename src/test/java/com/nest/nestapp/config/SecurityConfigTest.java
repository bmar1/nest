package com.nest.nestapp.config;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class SecurityConfigTest {

    @Test
    void parseAllowedAudiences_trimsCommaSeparatedClientIds() {
        Set<String> audiences = SecurityConfig.parseAllowedAudiences(" web-client-id , mobile-client-id ,, ");

        assertThat(audiences).containsExactlyInAnyOrder("web-client-id", "mobile-client-id");
    }

    @Test
    void hasAllowedAudience_acceptsAnyConfiguredGoogleClientId() {
        Jwt token = Jwt.withTokenValue("token")
                .header("alg", "none")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(300))
                .audience(List.of("frontend-client-id"))
                .build();

        assertThat(SecurityConfig.hasAllowedAudience(token, Set.of("api-client-id", "frontend-client-id")))
                .isTrue();
    }
}
