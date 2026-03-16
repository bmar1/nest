package com.nest.nestapp.service;

import com.nest.nestapp.model.Apartment;
import com.nest.nestapp.model.SearchRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScraperService {

    private static final String CRAIGSLIST_TORONTO_URL = "https://toronto.craigslist.org/search/apa";
    private static final int REQUEST_TIMEOUT_MS = 30000;
    private static final int MAX_LISTINGS = 20;
    private static final int MAX_CONCURRENT_DETAIL_REQUESTS = 8;
    private static final Pattern SQFT_PATTERN = Pattern.compile("(\\d+)\\s*ft(?:²|2)");
    private static final Pattern BEDROOM_PATTERN = Pattern.compile("(\\d+)\\s*br", Pattern.CASE_INSENSITIVE);
    private static final Pattern BATHROOM_PATTERN = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*ba", Pattern.CASE_INSENSITIVE);
    private static final Pattern LEASE_PATTERN = Pattern.compile("(\\d{1,2})\\s*(?:month|mo)", Pattern.CASE_INSENSITIVE);

    public List<Apartment> scrapeApartments(SearchRequest searchRequest) {
        ExecutorService pool = Executors.newFixedThreadPool(MAX_CONCURRENT_DETAIL_REQUESTS);

        try {
            log.info("Starting scrape for search ID: {}", searchRequest.getId());

            Document doc = Jsoup.connect(CRAIGSLIST_TORONTO_URL)
                    .timeout(REQUEST_TIMEOUT_MS)
                    .userAgent(defaultUserAgent())
                    .referrer("https://www.google.com")
                    .data("min_price", "500")
                    .data("max_price", String.valueOf(searchRequest.getMaxPrice()))
                    .data("availabilityMode", "0")
                    .data("sale_date", "all dates")
                    .get();

            List<ListingSummary> listings = doc.select("li.result-row").stream()
                    .map(this::parseListingSummary)
                    .filter(summary -> summary != null && !summary.url().isBlank())
                    .limit(MAX_LISTINGS)
                    .toList();

            List<CompletableFuture<Apartment>> futures = listings.stream()
                    .map(summary -> CompletableFuture.supplyAsync(
                            () -> fetchApartmentDetails(summary, searchRequest.getId()),
                            pool
                    ))
                    .toList();

            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

            List<Apartment> apartments = futures.stream()
                    .map(CompletableFuture::join)
                    .filter(apartment -> apartment != null && apartment.getPrice() != null)
                    .collect(Collectors.toList());

            log.info("Scraped {} apartments", apartments.size());
            return apartments;
        } catch (Exception e) {
            log.error("Error scraping apartments", e);
            throw new RuntimeException("Scraping failed: " + e.getMessage());
        } finally {
            pool.shutdownNow();
        }
    }

    private ListingSummary parseListingSummary(Element listing) {
        Element link = listing.selectFirst("a.result-title.hdrlnk, a.posting-title");
        if (link == null) {
            return null;
        }

        String url = link.absUrl("href");
        if (url.isBlank()) {
            url = link.attr("href");
        }

        String title = link.text().trim();
        Integer price = parseInteger(listing.selectFirst("span.result-price") != null
                ? listing.selectFirst("span.result-price").text()
                : null);
        HousingInfo housing = extractHousingInfo(listing.selectFirst("span.housing") != null
                ? listing.selectFirst("span.housing").text()
                : null);

        return new ListingSummary(url, title, price, housing.sqft(), housing.bedrooms(), housing.bathrooms());
    }

    private Apartment fetchApartmentDetails(ListingSummary summary, UUID searchId) {
        try {
            Document detailDoc = Jsoup.connect(summary.url())
                    .timeout(REQUEST_TIMEOUT_MS)
                    .userAgent(defaultUserAgent())
                    .referrer(CRAIGSLIST_TORONTO_URL)
                    .get();

            String title = textOrFallback(detailDoc.selectFirst("span#titletextonly"), summary.title());
            Integer price = parseInteger(textOrFallback(detailDoc.selectFirst("span.price"), summary.price() != null ? summary.price().toString() : null));

            String detailText = detailDoc.text();
            HousingInfo detailHousing = extractHousingInfo(
                    detailDoc.select("p.attrgroup span, div.mapAndAttrs p.attrgroup span")
                            .stream()
                            .map(Element::text)
                            .collect(Collectors.joining(" "))
            );

            Integer sqft = detailHousing.sqft() != null ? detailHousing.sqft() : summary.sqft();
            Integer bedrooms = detailHousing.bedrooms() != null ? detailHousing.bedrooms() : summary.bedrooms();
            Integer bathrooms = detailHousing.bathrooms() != null ? detailHousing.bathrooms() : summary.bathrooms();

            List<String> amenities = normalizeAmenities(
                    detailDoc.select("p.attrgroup span, div.mapAndAttrs p.attrgroup span, p.attrgroup span.shared-line-bubble")
                            .stream()
                            .map(Element::text)
                            .toList()
            );

            Integer leaseTermMonths = extractLeaseTerm(detailText);

            if (price == null) {
                log.debug("Skipping listing without price: {}", summary.url());
                return null;
            }

            return Apartment.builder()
                    .searchId(searchId)
                    .sourceUrl(summary.url())
                    .sourceSite("CRAIGSLIST")
                    .title(title)
                    .price(price)
                    .sqft(sqft)
                    .bedrooms(bedrooms)
                    .bathrooms(bathrooms)
                    .amenities(amenities)
                    .leaseTermMonths(leaseTermMonths)
                    .rawHtml(detailDoc.outerHtml())
                    .build();
        } catch (Exception e) {
            log.warn("Failed to fetch listing details for {}", summary.url(), e);
            return null;
        }
    }

    private HousingInfo extractHousingInfo(String rawText) {
        if (rawText == null || rawText.isBlank()) {
            return new HousingInfo(null, null, null);
        }

        String normalized = rawText.toLowerCase(Locale.ROOT);
        Integer sqft = extractFirstMatch(SQFT_PATTERN, normalized);
        Integer bedrooms = extractFirstMatch(BEDROOM_PATTERN, normalized);
        Integer bathrooms = extractBathroomCount(normalized);
        return new HousingInfo(sqft, bedrooms, bathrooms);
    }

    private List<String> normalizeAmenities(List<String> rawAttributes) {
        if (rawAttributes == null || rawAttributes.isEmpty()) {
            return List.of();
        }

        Set<String> amenities = new LinkedHashSet<>();

        for (String attribute : rawAttributes) {
            if (attribute == null || attribute.isBlank()) {
                continue;
            }

            String normalized = attribute.toLowerCase(Locale.ROOT);

            if (normalized.contains("washer") || normalized.contains("laundry") || normalized.contains("w/d")) {
                amenities.add("laundry");
            }
            if (normalized.contains("parking") || normalized.contains("carport") || normalized.contains("garage")) {
                amenities.add("parking");
            }
            if (normalized.contains("gym") || normalized.contains("fitness")) {
                amenities.add("gym");
            }
            if (normalized.contains("internet") || normalized.contains("wifi") || normalized.contains("wi-fi")) {
                amenities.add("wifi");
            }
            if (normalized.contains("pet") || normalized.contains("cats") || normalized.contains("dogs")) {
                amenities.add("pets");
            }
        }

        return new ArrayList<>(amenities);
    }

    private Integer extractLeaseTerm(String text) {
        if (text == null || text.isBlank()) {
            return 12;
        }

        String normalized = text.toLowerCase(Locale.ROOT);
        if (normalized.contains("month-to-month")) {
            return 1;
        }

        Matcher matcher = LEASE_PATTERN.matcher(normalized);
        if (matcher.find()) {
            return Integer.parseInt(matcher.group(1));
        }

        return 12;
    }

    private Integer parseInteger(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String digits = value.replaceAll("[^0-9]", "");
        if (digits.isBlank()) {
            return null;
        }

        try {
            return Integer.parseInt(digits);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Integer extractFirstMatch(Pattern pattern, String value) {
        Matcher matcher = pattern.matcher(value);
        if (matcher.find()) {
            try {
                return Integer.parseInt(matcher.group(1));
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private Integer extractBathroomCount(String value) {
        Matcher matcher = BATHROOM_PATTERN.matcher(value);
        if (matcher.find()) {
            try {
                double bathrooms = Double.parseDouble(matcher.group(1));
                return (int) Math.ceil(bathrooms);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private String textOrFallback(Element element, String fallback) {
        if (element != null) {
            String text = element.text().trim();
            if (!text.isBlank()) {
                return text;
            }
        }
        return fallback != null ? fallback : "";
    }

    private String defaultUserAgent() {
        return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                + "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
    }

    private record ListingSummary(String url, String title, Integer price, Integer sqft, Integer bedrooms, Integer bathrooms) {
    }

    private record HousingInfo(Integer sqft, Integer bedrooms, Integer bathrooms) {
    }
}
