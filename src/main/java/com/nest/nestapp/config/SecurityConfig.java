package com.nest.nestapp.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Configuration
public class SecurityConfig {

    private static final String GOOGLE_ISSUER = "https://accounts.google.com";
    private static final String GOOGLE_LEGACY_ISSUER = "accounts.google.com";

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/", "/api/v1/health").permitAll()
                        .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                        .requestMatchers("/api/v1/search/**").authenticated()
                        .anyRequest().permitAll()
                )
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
                .build();
                //only allow actuator/health and health endpoints to be accessed without authentication
    }

    @Bean
    JwtDecoder jwtDecoder(
            @Value("${google.oauth.client-ids:${google.oauth.client-id:}}") String googleClientIds
    ) {
        Set<String> allowedAudiences = parseAllowedAudiences(googleClientIds);
        if (allowedAudiences.isEmpty()) {
            throw new IllegalStateException("google.oauth.client-id or google.oauth.client-ids must be configured for Google ID token validation");
        }

        NimbusJwtDecoder decoder = NimbusJwtDecoder.withIssuerLocation(GOOGLE_ISSUER).build();
        OAuth2TokenValidator<Jwt> timestampValidator = new JwtTimestampValidator();
        OAuth2TokenValidator<Jwt> issuerValidator = token -> {
            String issuer = token.getIssuer() == null ? "" : token.getIssuer().toString();
            if (GOOGLE_ISSUER.equals(issuer) || GOOGLE_LEGACY_ISSUER.equals(issuer)) {
                return OAuth2TokenValidatorResult.success();
            }
            OAuth2Error error = new OAuth2Error("invalid_token", "Google ID token issuer is invalid", null);
            return OAuth2TokenValidatorResult.failure(error);
        };
        OAuth2TokenValidator<Jwt> audienceValidator = token -> {
            if (hasAllowedAudience(token, allowedAudiences)) {
                return OAuth2TokenValidatorResult.success();
            }
            OAuth2Error error = new OAuth2Error(
                    "invalid_token",
                    "Google ID token audience does not match this application",
                    null
            );
            return OAuth2TokenValidatorResult.failure(error);
        };
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(timestampValidator, issuerValidator, audienceValidator));
        return decoder;
    }

    static Set<String> parseAllowedAudiences(String googleClientIds) {
        if (googleClientIds == null || googleClientIds.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(googleClientIds.split(","))
                .map(String::trim)
                .filter(id -> !id.isBlank())
                .collect(Collectors.toUnmodifiableSet());
    }

    static boolean hasAllowedAudience(Jwt token, Set<String> allowedAudiences) {
        return token.getAudience().stream().anyMatch(allowedAudiences::contains);
    }
}
