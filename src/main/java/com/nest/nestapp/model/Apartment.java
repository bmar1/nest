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
@Table(name = "apartments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Apartment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "search_id", nullable = false)
    private UUID searchId;

    @Column(name = "source_url", nullable = false, columnDefinition = "TEXT")
    private String sourceUrl;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "image_urls", columnDefinition = "jsonb")
    private List<String> imageUrls;

    @Column(name = "source_site", nullable = false)
    @Builder.Default
    private String sourceSite = "CRAIGSLIST";

    @Column(columnDefinition = "TEXT")
    private String title;

    @Column(nullable = false)
    private Integer price;

    private Integer sqft;

    private Integer bedrooms;

    private Integer bathrooms;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> amenities;

    @Column(name = "lease_term_months")
    @Builder.Default
    private Integer leaseTermMonths = 12;

    @Column(name = "raw_html", columnDefinition = "TEXT")
    private String rawHtml;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        if (expiresAt == null) {
            expiresAt = createdAt.plusDays(3);
        }
    }
}
