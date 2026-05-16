package com.nest.nestapp.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

/**
 * Centralised CORS configuration.
 *
 * Replaces the per-controller @CrossOrigin(origins = "*") wildcards.
 * Allowed origins are controlled via the ALLOWED_ORIGINS environment variable,
 * defaulting to localhost for local development.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${cors.allowed-origins:http://localhost,http://localhost:5173,http://localhost:5174,https://nest-one-eta.vercel.app}")
    private String[] allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(normalizeOrigins(allowedOrigins))
                .allowedMethods("GET", "POST")
                .allowedHeaders("Authorization", "Content-Type", "Accept")
                .exposedHeaders("Retry-After")
                .maxAge(3600);
    }

    static String[] normalizeOrigins(String[] origins) {
        if (origins == null) {
            return new String[0];
        }
        return Arrays.stream(origins)
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .map(WebConfig::stripTrailingSlash)
                .distinct()
                .toArray(String[]::new);
    }

    private static String stripTrailingSlash(String origin) {
        if (origin.endsWith("/") && origin.length() > 1) {
            return origin.substring(0, origin.length() - 1);
        }
        return origin;
    }
}
