package com.nest.nestapp.service;

import com.nest.nestapp.model.Apartment;
import com.nest.nestapp.model.SearchRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ListingFilterService {

    public List<Apartment> applySpecificNeeds(List<Apartment> apartments, SearchRequest request) {
        if (apartments.isEmpty()) {
            return apartments;
        }

        boolean hasBedroomNeed = request.getDesiredBedrooms() != null;
        boolean hasBathroomNeed = request.getDesiredBathrooms() != null;
        if (!hasBedroomNeed && !hasBathroomNeed) {
            return apartments;
        }

        List<Apartment> filtered = apartments.stream()
                .filter(apartment -> request.getDesiredBedrooms() == null
                        || (apartment.getBedrooms() != null && apartment.getBedrooms() >= request.getDesiredBedrooms()))
                .filter(apartment -> request.getDesiredBathrooms() == null
                        || (apartment.getBathrooms() != null && apartment.getBathrooms() >= request.getDesiredBathrooms()))
                .collect(Collectors.toList());

        if (filtered.isEmpty()) {
            log.info("No listings matched bedroom/bathroom requirements for search {}, falling back to all listings", request.getId());
            return apartments;
        }

        return filtered;
    }
}
