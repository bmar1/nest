package com.nest.nestapp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "apartment_scores")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApartmentScore {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "apartment_id", nullable = false, unique = true)
    private UUID apartmentId;

    @Column(name = "search_id", nullable = false)
    private UUID searchId;

    @Column(name = "price_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal priceScore;

    @Column(name = "space_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal spaceScore;

    @Column(name = "amenities_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal amenitiesScore;

    @Column(name = "lease_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal leaseScore;

    @Column(name = "final_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal finalScore;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
    }
}
