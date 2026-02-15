package com.nest.nestapp.dto;

import com.nest.nestapp.model.Priority;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchRequestDto {

    @NotNull(message = "Priority is required")
    private Priority priority;

    @NotNull(message = "Max price is required")
    @Min(value = 500, message = "Max price must be at least 500")
    private Integer maxPrice;

    @NotNull(message = "Min square footage is required")
    @Min(value = 300, message = "Min square footage must be at least 300")
    private Integer minSqft;

    private List<String> desiredAmenities;

    @Min(value = 1, message = "Max lease months must be at least 1")
    private Integer maxLeaseMonths;
}
