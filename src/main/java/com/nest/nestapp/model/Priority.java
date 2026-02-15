package com.nest.nestapp.model;

import lombok.Getter;

@Getter
public enum Priority {
    BUDGET(1.5, 0.8, 0.8, 0.9),
    SPACE(0.8, 1.5, 0.8, 0.9),
    AMENITIES(0.9, 0.9, 1.5, 0.9),
    BALANCED(1.0, 1.0, 1.0, 1.0);

    private final double priceWeight;
    private final double spaceWeight;
    private final double amenitiesWeight;
    private final double leaseWeight;

    Priority(double priceWeight, double spaceWeight, double amenitiesWeight, double leaseWeight) {
        this.priceWeight = priceWeight;
        this.spaceWeight = spaceWeight;
        this.amenitiesWeight = amenitiesWeight;
        this.leaseWeight = leaseWeight;
    }
}
