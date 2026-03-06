package com.nest.nestapp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "scraping_jobs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScrapingJob {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "search_id", nullable = false, unique = true)
    private UUID searchId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private JobStatus status = JobStatus.PENDING;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "total_attempted")
    @Builder.Default
    private Integer totalAttempted = 0;

    @Column(name = "total_successful")
    @Builder.Default
    private Integer totalSuccessful = 0;

    @Column(name = "total_failed")
    @Builder.Default
    private Integer totalFailed = 0;

    @Column(name = "started_at")
    private OffsetDateTime startedAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
    }
}
