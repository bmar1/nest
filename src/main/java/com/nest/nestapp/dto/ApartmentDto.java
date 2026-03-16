package com.nest.nestapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApartmentDto {
    private UUID id;
    private String title;
    private Integer price;
    private Integer sqft;
    private Integer bedrooms;
    private Integer bathrooms;
    private List<String> amenities;
    private Integer leaseTermMonths;
    private String sourceUrl;
    private BigDecimal finalScore;
    private ScoreBreakdownDto scoreBreakdown;
}
