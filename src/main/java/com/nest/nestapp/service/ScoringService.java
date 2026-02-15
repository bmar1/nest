package com.nest.nestapp.service;

import com.nest.nestapp.model.Apartment;
import com.nest.nestapp.model.ApartmentScore;
import com.nest.nestapp.model.Priority;
import com.nest.nestapp.model.SearchRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScoringService {

    public ApartmentScore calculateScore(Apartment apartment, SearchRequest searchRequest, 
                                        int minPrice, int maxPrice, int minSqft, int maxSqft) {
        
        Priority priority = searchRequest.getPriority();
        
        // Calculate individual scores (0-30 for price/space, 0-20 for amenities/lease)
        BigDecimal priceScore = calculatePriceScore(apartment.getPrice(), minPrice, maxPrice);
        BigDecimal spaceScore = calculateSpaceScore(apartment.getSqft(), minSqft, maxSqft);
        BigDecimal amenitiesScore = calculateAmenitiesScore(apartment.getAmenities());
        BigDecimal leaseScore = calculateLeaseScore(apartment.getLeaseTermMonths());
        
        // Apply priority weights
        BigDecimal weightedPriceScore = priceScore.multiply(BigDecimal.valueOf(priority.getPriceWeight()));
        BigDecimal weightedSpaceScore = spaceScore.multiply(BigDecimal.valueOf(priority.getSpaceWeight()));
        BigDecimal weightedAmenitiesScore = amenitiesScore.multiply(BigDecimal.valueOf(priority.getAmenitiesWeight()));
        BigDecimal weightedLeaseScore = leaseScore.multiply(BigDecimal.valueOf(priority.getLeaseWeight()));
        
        // Calculate final score and normalize to 0-100
        BigDecimal rawTotal = weightedPriceScore.add(weightedSpaceScore)
                .add(weightedAmenitiesScore)
                .add(weightedLeaseScore);
        
        // Normalize to 100 scale
        BigDecimal finalScore = normalizeScore(rawTotal);
        
        return ApartmentScore.builder()
                .apartmentId(apartment.getId())
                .searchId(searchRequest.getId())
                .priceScore(priceScore.setScale(2, RoundingMode.HALF_UP))
                .spaceScore(spaceScore.setScale(2, RoundingMode.HALF_UP))
                .amenitiesScore(amenitiesScore.setScale(2, RoundingMode.HALF_UP))
                .leaseScore(leaseScore.setScale(2, RoundingMode.HALF_UP))
                .finalScore(finalScore.setScale(2, RoundingMode.HALF_UP))
                .build();
    }

    private BigDecimal calculatePriceScore(Integer price, int minPrice, int maxPrice) {
        if (price == null || maxPrice <= minPrice) {
            return BigDecimal.ZERO;
        }
        
        // Lower price is better: (maxPrice - apartmentPrice) / (maxPrice - minPrice) * 30
        double score = ((double)(maxPrice - price) / (maxPrice - minPrice)) * 30.0;
        return BigDecimal.valueOf(Math.max(0, Math.min(30, score)));
    }

    private BigDecimal calculateSpaceScore(Integer sqft, int minSqft, int maxSqft) {
        if (sqft == null || maxSqft <= minSqft) {
            return BigDecimal.ZERO;
        }
        
        // Bigger is better: (apartmentSqft - minSqft) / (maxSqft - minSqft) * 30
        double score = ((double)(sqft - minSqft) / (maxSqft - minSqft)) * 30.0;
        return BigDecimal.valueOf(Math.max(0, Math.min(30, score)));
    }

    private BigDecimal calculateAmenitiesScore(List<String> amenities) {
        if (amenities == null || amenities.isEmpty()) {
            return BigDecimal.ZERO;
        }
        
        double score = 0;
        
        // In-unit laundry = 10 pts
        if (amenities.stream().anyMatch(a -> a.toLowerCase().contains("laundry"))) {
            score += 10;
        }
        
        // Parking = 5 pts
        if (amenities.stream().anyMatch(a -> a.toLowerCase().contains("parking"))) {
            score += 5;
        }
        
        // Gym = 3 pts
        if (amenities.stream().anyMatch(a -> a.toLowerCase().contains("gym") || a.toLowerCase().contains("fitness"))) {
            score += 3;
        }
        
        // Others = 2 pts each (capped at 20 total)
        long otherAmenities = amenities.stream()
                .filter(a -> !a.toLowerCase().contains("laundry") 
                        && !a.toLowerCase().contains("parking")
                        && !a.toLowerCase().contains("gym")
                        && !a.toLowerCase().contains("fitness"))
                .count();
        score += Math.min(otherAmenities * 2, 20 - score);
        
        return BigDecimal.valueOf(Math.min(20, score));
    }

    private BigDecimal calculateLeaseScore(Integer leaseTermMonths) {
        if (leaseTermMonths == null) {
            leaseTermMonths = 12; // Default
        }
        
        // Month-to-month (1 month) = 20 pts
        // 6-month = 15 pts
        // 12-month = 10 pts
        // 12+ months = 5 pts
        
        if (leaseTermMonths == 1) {
            return BigDecimal.valueOf(20);
        } else if (leaseTermMonths <= 6) {
            return BigDecimal.valueOf(15);
        } else if (leaseTermMonths == 12) {
            return BigDecimal.valueOf(10);
        } else {
            return BigDecimal.valueOf(5);
        }
    }

    private BigDecimal normalizeScore(BigDecimal rawScore) {
        // Max possible raw score with max weights (1.5) is:
        // (30 * 1.5) + (30 * 1.5) + (20 * 1.5) + (20 * 1.5) = 150
        // Normalize to 0-100 scale
        BigDecimal maxPossible = BigDecimal.valueOf(150);
        return rawScore.divide(maxPossible, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
    }
}
