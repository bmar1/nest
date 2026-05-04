package com.nest.nestapp.filter;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-IP rate limiting filter.
 * POST /api/v1/search            : 5 searches per IP per minute
 * GET  /api/v1/search/{id}/results : 60 polls per IP per minute
 *
 * Buckets are held in memory and evicted every 5 minutes to prevent
 * unbounded map growth from stale IPs.
 */
@Component
@Order(1)
@Slf4j
public class RateLimitingFilter implements Filter {

    @Value("${rate-limit.search.per-minute:5}")
    private int searchLimitPerMinute;

    @Value("${rate-limit.results.per-minute:60}")
    private int resultsLimitPerMinute;

    @Value("${rate-limit.retry-after-seconds:60}")
    private int retryAfterSeconds;

    private final ConcurrentHashMap<String, Bucket> searchBuckets = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Bucket> resultsBuckets = new ConcurrentHashMap<>();

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpReq = (HttpServletRequest) request;
        HttpServletResponse httpRes = (HttpServletResponse) response;

        String path = httpReq.getRequestURI();
        String method = httpReq.getMethod();
        String ip = extractClientIp(httpReq);

        boolean isSearchPost = "POST".equalsIgnoreCase(method)
                && path.matches("/api/v1/search/?");
        boolean isResultsGet = "GET".equalsIgnoreCase(method)
                && path.matches("/api/v1/search/[^/]+/results");

        if (isSearchPost) {
            Bucket bucket = searchBuckets.computeIfAbsent(ip, k -> buildSearchBucket());
            if (!bucket.tryConsume(1)) {
                log.warn("Rate limit exceeded on POST /api/v1/search for IP {}", ip);
                sendRateLimitResponse(httpRes,
                        "Too many search requests. Please wait a moment before searching again.");
                return;
            }
        } else if (isResultsGet) {
            Bucket bucket = resultsBuckets.computeIfAbsent(ip, k -> buildResultsBucket());
            if (!bucket.tryConsume(1)) {
                log.warn("Rate limit exceeded on results poll for IP {}", ip);
                sendRateLimitResponse(httpRes, "Too many requests. Please slow down polling.");
                return;
            }
        }

        chain.doFilter(request, response);
    }

    @Scheduled(fixedDelay = 300_000)
    public void evictBuckets() {
        searchBuckets.clear();
        resultsBuckets.clear();
        log.debug("Rate limit buckets cleared");
    }

    private Bucket buildSearchBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(searchLimitPerMinute)
                        .refillGreedy(searchLimitPerMinute, Duration.ofMinutes(1))
                        .build())
                .build();
    }

    private Bucket buildResultsBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(resultsLimitPerMinute)
                        .refillGreedy(resultsLimitPerMinute, Duration.ofMinutes(1))
                        .build())
                .build();
    }

    private void sendRateLimitResponse(HttpServletResponse response, String message)
            throws IOException {
        response.setStatus(429);
        response.setContentType("application/json");
        response.setHeader("Retry-After", Integer.toString(retryAfterSeconds));
        response.getWriter().write(
                "{\"error\":\"" + message + "\",\"status\":429}");
    }

    /**
     * Respects X-Forwarded-For when behind a reverse proxy.
     * Only the leftmost address is used to prevent header-injection spoofing.
     */
    private static String extractClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
