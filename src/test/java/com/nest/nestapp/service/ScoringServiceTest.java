package com.nest.nestapp.service;

import com.nest.nestapp.model.Apartment;
import com.nest.nestapp.model.ApartmentScore;
import com.nest.nestapp.model.Priority;
import com.nest.nestapp.model.SearchRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ScoringServiceTest {

    private ScoringService scoringService;

    @BeforeEach
    void setUp() {
        scoringService = new ScoringService();
    }

    @Test
    void calculateScore_withBudgetPriority_favorsLowerPrice() {
        SearchRequest searchRequest = SearchRequest.builder()
                .id(UUID.randomUUID())
                .priority(Priority.BUDGET)
                .maxPrice(2500)
                .minSqft(800)
                .build();

        Apartment cheapApartment = Apartment.builder()
                .id(UUID.randomUUID())
                .price(1500)
                .sqft(900)
                .amenities(List.of("parking"))
                .leaseTermMonths(12)
                .build();

        Apartment expensiveApartment = Apartment.builder()
                .id(UUID.randomUUID())
                .price(2400)
                .sqft(900)
                .amenities(List.of("parking"))
                .leaseTermMonths(12)
                .build();

        ApartmentScore cheapScore = scoringService.calculateScore(cheapApartment, searchRequest, 1000, 2500, 800, 1500);
        ApartmentScore expensiveScore = scoringService.calculateScore(expensiveApartment, searchRequest, 1000, 2500, 800, 1500);

        assertTrue(cheapScore.getFinalScore().compareTo(expensiveScore.getFinalScore()) > 0,
                "Cheaper apartment should score higher with BUDGET priority");
    }

    @Test
    void calculateScore_withSpacePriority_favorsBiggerSpace() {
        SearchRequest searchRequest = SearchRequest.builder()
                .id(UUID.randomUUID())
                .priority(Priority.SPACE)
                .maxPrice(2500)
                .minSqft(800)
                .build();

        Apartment smallApartment = Apartment.builder()
                .id(UUID.randomUUID())
                .price(2000)
                .sqft(850)
                .amenities(List.of("parking"))
                .leaseTermMonths(12)
                .build();

        Apartment largeApartment = Apartment.builder()
                .id(UUID.randomUUID())
                .price(2000)
                .sqft(1400)
                .amenities(List.of("parking"))
                .leaseTermMonths(12)
                .build();

        ApartmentScore smallScore = scoringService.calculateScore(smallApartment, searchRequest, 1000, 2500, 800, 1500);
        ApartmentScore largeScore = scoringService.calculateScore(largeApartment, searchRequest, 1000, 2500, 800, 1500);

        assertTrue(largeScore.getFinalScore().compareTo(smallScore.getFinalScore()) > 0,
                "Larger apartment should score higher with SPACE priority");
    }

    @Test
    void calculateScore_withAmenitiesPriority_favorsMoreAmenities() {
        SearchRequest searchRequest = SearchRequest.builder()
                .id(UUID.randomUUID())
                .priority(Priority.AMENITIES)
                .maxPrice(2500)
                .minSqft(800)
                .build();

        Apartment fewAmenities = Apartment.builder()
                .id(UUID.randomUUID())
                .price(2000)
                .sqft(1000)
                .amenities(List.of("parking"))
                .leaseTermMonths(12)
                .build();

        Apartment manyAmenities = Apartment.builder()
                .id(UUID.randomUUID())
                .price(2000)
                .sqft(1000)
                .amenities(Arrays.asList("laundry", "parking", "gym", "pool"))
                .leaseTermMonths(12)
                .build();

        ApartmentScore fewScore = scoringService.calculateScore(fewAmenities, searchRequest, 1000, 2500, 800, 1500);
        ApartmentScore manyScore = scoringService.calculateScore(manyAmenities, searchRequest, 1000, 2500, 800, 1500);

        assertTrue(manyScore.getFinalScore().compareTo(fewScore.getFinalScore()) > 0,
                "Apartment with more amenities should score higher with AMENITIES priority");
        assertTrue(manyScore.getAmenitiesScore().compareTo(fewScore.getAmenitiesScore()) > 0);
    }

    @Test
    void calculateScore_priceScore_calculatesProperly() {
        SearchRequest searchRequest = SearchRequest.builder()
                .id(UUID.randomUUID())
                .priority(Priority.BALANCED)
                .maxPrice(2500)
                .minSqft(800)
                .build();

        Apartment apartment = Apartment.builder()
                .id(UUID.randomUUID())
                .price(1500)
                .sqft(1000)
                .amenities(List.of())
                .leaseTermMonths(12)
                .build();

        ApartmentScore score = scoringService.calculateScore(apartment, searchRequest, 1000, 2500, 800, 1500);

        assertNotNull(score.getPriceScore());
        assertTrue(score.getPriceScore().compareTo(BigDecimal.ZERO) > 0);
        assertTrue(score.getPriceScore().compareTo(BigDecimal.valueOf(30)) <= 0);
    }

    @Test
    void calculateScore_amenitiesScore_laundryWorth10Points() {
        SearchRequest searchRequest = SearchRequest.builder()
                .id(UUID.randomUUID())
                .priority(Priority.BALANCED)
                .maxPrice(2500)
                .minSqft(800)
                .build();

        Apartment withLaundry = Apartment.builder()
                .id(UUID.randomUUID())
                .price(2000)
                .sqft(1000)
                .amenities(List.of("laundry"))
                .leaseTermMonths(12)
                .build();

        Apartment withoutLaundry = Apartment.builder()
                .id(UUID.randomUUID())
                .price(2000)
                .sqft(1000)
                .amenities(List.of())
                .leaseTermMonths(12)
                .build();

        ApartmentScore withScore = scoringService.calculateScore(withLaundry, searchRequest, 1000, 2500, 800, 1500);
        ApartmentScore withoutScore = scoringService.calculateScore(withoutLaundry, searchRequest, 1000, 2500, 800, 1500);

        BigDecimal difference = withScore.getAmenitiesScore().subtract(withoutScore.getAmenitiesScore());
        assertEquals(0, BigDecimal.valueOf(10).compareTo(difference),
                "Laundry should add 10 points to amenities score");
    }

    @Test
    void calculateScore_leaseScore_monthToMonthWorth20Points() {
        SearchRequest searchRequest = SearchRequest.builder()
                .id(UUID.randomUUID())
                .priority(Priority.BALANCED)
                .maxPrice(2500)
                .minSqft(800)
                .build();

        Apartment monthToMonth = Apartment.builder()
                .id(UUID.randomUUID())
                .price(2000)
                .sqft(1000)
                .amenities(List.of())
                .leaseTermMonths(1)
                .build();

        ApartmentScore score = scoringService.calculateScore(monthToMonth, searchRequest, 1000, 2500, 800, 1500);

        assertEquals(0, BigDecimal.valueOf(20).compareTo(score.getLeaseScore()),
                "Month-to-month lease should give 20 points");
    }

    @Test
    void calculateScore_finalScore_isBetween0And100() {
        SearchRequest searchRequest = SearchRequest.builder()
                .id(UUID.randomUUID())
                .priority(Priority.BALANCED)
                .maxPrice(2500)
                .minSqft(800)
                .build();

        Apartment apartment = Apartment.builder()
                .id(UUID.randomUUID())
                .price(2000)
                .sqft(1000)
                .amenities(Arrays.asList("laundry", "parking", "gym"))
                .leaseTermMonths(12)
                .build();

        ApartmentScore score = scoringService.calculateScore(apartment, searchRequest, 1000, 2500, 800, 1500);

        assertTrue(score.getFinalScore().compareTo(BigDecimal.ZERO) >= 0);
        assertTrue(score.getFinalScore().compareTo(BigDecimal.valueOf(100)) <= 0);
    }

    @Test
    void calculateScore_withNullSqft_handlesGracefully() {
        SearchRequest searchRequest = SearchRequest.builder()
                .id(UUID.randomUUID())
                .priority(Priority.BALANCED)
                .maxPrice(2500)
                .minSqft(800)
                .build();

        Apartment apartment = Apartment.builder()
                .id(UUID.randomUUID())
                .price(2000)
                .sqft(null)
                .amenities(List.of("parking"))
                .leaseTermMonths(12)
                .build();

        ApartmentScore score = scoringService.calculateScore(apartment, searchRequest, 1000, 2500, 800, 1500);

        assertNotNull(score);
        assertEquals(0, BigDecimal.ZERO.compareTo(score.getSpaceScore()));
    }

    @Test
    void calculateScore_edgeCase_priceAtMaximum() {
        SearchRequest searchRequest = SearchRequest.builder()
                .id(UUID.randomUUID())
                .priority(Priority.BUDGET)
                .maxPrice(2500)
                .minSqft(800)
                .build();

        Apartment apartment = Apartment.builder()
                .id(UUID.randomUUID())
                .price(2500)
                .sqft(1000)
                .amenities(List.of())
                .leaseTermMonths(12)
                .build();

        ApartmentScore score = scoringService.calculateScore(apartment, searchRequest, 1000, 2500, 800, 1500);

        assertTrue(score.getPriceScore().compareTo(BigDecimal.ZERO) >= 0);
    }
}
