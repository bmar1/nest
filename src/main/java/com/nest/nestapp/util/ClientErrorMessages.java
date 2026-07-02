package com.nest.nestapp.util;

/**
 * User-facing error strings returned in API responses.
 * Internal exception details belong in logs and DB columns only.
 */
public final class ClientErrorMessages {

    private ClientErrorMessages() {
    }

    public static final String SEARCH_PROCESSING_FAILED =
            "Search could not be completed. Please try again.";

    public static final String NO_LISTINGS_FOUND =
            "No usable listings were found for your search criteria.";
}
