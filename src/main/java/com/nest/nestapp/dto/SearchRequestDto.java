package com.nest.nestapp.dto;

import com.nest.nestapp.model.Priority;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
    @Min(value = 500, message = "Max price must be at least $500")
    @Max(value = 25000, message = "Max price must be no more than $25,000")
    private Integer maxPrice;

    @NotNull(message = "Min square footage is required")
    @Min(value = 300, message = "Min square footage must be at least 300")
    @Max(value = 10000, message = "Min square footage must be no more than 10,000")
    private Integer minSqft;

    @Min(value = 1, message = "Desired bedrooms must be at least 1")
    @Max(value = 10, message = "Desired bedrooms must be no more than 10")
    private Integer desiredBedrooms;

    @Min(value = 1, message = "Desired bathrooms must be at least 1")
    @Max(value = 10, message = "Desired bathrooms must be no more than 10")
    private Integer desiredBathrooms;

    @Size(max = 20, message = "No more than 20 amenities may be specified")
    private List<@NotNull @Size(max = 100, message = "Amenity name must be 100 characters or fewer") String> desiredAmenities;

    @Min(value = 1, message = "Max lease months must be at least 1")
    @Max(value = 60, message = "Max lease months must be no more than 60")
    private Integer maxLeaseMonths;
}
