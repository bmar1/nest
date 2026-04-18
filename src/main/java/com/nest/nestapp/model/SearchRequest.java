package com.nest.nestapp.model;

import com.nest.nestapp.converter.JobStatusPgEnumConverter;
import com.nest.nestapp.converter.PriorityPgEnumConverter;
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

    @Convert(converter = PriorityPgEnumConverter.class)
    @Column(nullable = false)
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

    @Convert(converter = JobStatusPgEnumConverter.class)
    @Column(nullable = false)
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
