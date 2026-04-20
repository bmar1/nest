package com.nest.nestapp.model;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "search_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "priority_type")
    private Priority priority;

    @Column(name = "max_price", nullable = false)
    private Integer maxPrice;

    @Column(name = "min_sqft", nullable = false)
    private Integer minSqft;

    @Column(name = "desired_bedrooms")
    private Integer desiredBedrooms;

    @Column(name = "desired_bathrooms")
    private Integer desiredBathrooms;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "desired_amenities", columnDefinition = "jsonb")
    private List<String> desiredAmenities;

    @Column(name = "max_lease_months")
    private Integer maxLeaseMonths;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "job_status_type")
    @Builder.Default
    private JobStatus status = JobStatus.PENDING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
