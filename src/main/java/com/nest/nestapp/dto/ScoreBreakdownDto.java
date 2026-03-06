package com.nest.nestapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScoreBreakdownDto {
    private BigDecimal priceScore;
    private BigDecimal spaceScore;
    private BigDecimal amenitiesScore;
    private BigDecimal leaseScore;
}
