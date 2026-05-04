package com.nest.nestapp.messaging;

import com.nest.nestapp.model.Priority;
import com.nest.nestapp.model.ScrapeSource;

import java.util.List;
import java.util.UUID;

public record ScrapeJobMessage(
        UUID searchId,
        ScrapeSource source,
        Priority priority,
        Integer maxPrice,
        Integer minSqft,
        Integer desiredBedrooms,
        Integer desiredBathrooms,
        List<String> desiredAmenities,
        Integer maxLeaseMonths,
        UUID correlationId
) {
}
