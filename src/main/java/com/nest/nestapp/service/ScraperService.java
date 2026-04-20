package com.nest.nestapp.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nest.nestapp.model.Apartment;
import com.nest.nestapp.model.SearchRequest;
import com.nest.nestapp.repository.ApartmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Supplier;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScraperService {

    private static final String CRAIGSLIST_TORONTO_URL = "https://toronto.craigslist.org/search/apa";
    private static final String KIJIJI_TORONTO_URL = "https://www.kijiji.ca/b-apartments-condos/city-of-toronto/c37l1700273";
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final int REQUEST_TIMEOUT_MS = 30000;
    private static final int MAX_LISTINGS_PER_SOURCE = 20;
    private static final int MAX_CACHE_LISTINGS = 40;
    private static final int MAX_COMBINED_LISTINGS = 60;
    private static final int MAX_CONCURRENT_DETAIL_REQUESTS = 8;
    private static final int MIN_PRICE = 500;
    private static final Pattern CRAIGSLIST_DETAIL_URL_PATTERN = Pattern.compile("https://toronto\\.craigslist\\.org/[^\"'#\\s]+?/apa/d/[^\"'#\\s]+\\.html");
    private static final Pattern KIJIJI_DETAIL_URL_PATTERN = Pattern.compile("https://www\\.kijiji\\.ca/v-apartments-condos/[^\"'#\\s]+");
    private static final Pattern SQFT_PATTERN = Pattern.compile("(\\d{2,5})\\s*(?:sq\\.?\\s*ft|square\\s*feet|ft(?:²|2))", Pattern.CASE_INSENSITIVE);
    private static final Pattern BEDROOM_PATTERN = Pattern.compile("(\\d+)\\s*(?:bed(?:room)?s?|br)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern BATHROOM_PATTERN = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*(?:bath(?:room)?s?|ba)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern LEASE_PATTERN = Pattern.compile("(\\d{1,2})\\s*(?:month|mo)", Pattern.CASE_INSENSITIVE);
    private static final Pattern PRICE_PATTERN = Pattern.compile("\\$\\s*([\\d,]{3,7})");

    private final ApartmentRepository apartmentRepository;

    public List<Apartment> scrapeApartments(SearchRequest searchRequest) {
        log.info("Starting scrape for search ID: {}", searchRequest.getId());

        List<Apartment> liveListings = new ArrayList<>();
        liveListings.addAll(scrapeCraigslistListings(searchRequest));
        liveListings.addAll(scrapeKijijiListings(searchRequest));

        List<Apartment> cachedListings = loadCachedListings(searchRequest);
        List<Apartment> mergedListings = mergeDedupedListings(searchRequest, liveListings, cachedListings);

        log.info(
                "Collected {} live listings and {} cached listings; {} remain after dedupe for search {}",
                liveListings.size(),
                cachedListings.size(),
                mergedListings.size(),
                searchRequest.getId()
        );
        return mergedListings;
    }

    private List<Apartment> scrapeCraigslistListings(SearchRequest searchRequest) {
        try {
            Document doc = Jsoup.connect(CRAIGSLIST_TORONTO_URL)
                    .timeout(REQUEST_TIMEOUT_MS)
                    .userAgent(defaultUserAgent())
                    .referrer("https://www.google.com")
                    .data("min_price", String.valueOf(MIN_PRICE))
                    .data("max_price", String.valueOf(searchRequest.getMaxPrice()))
                    .data("availabilityMode", "0")
                    .data("sale_date", "all dates")
                    .get();

            List<String> detailUrls = extractUrls(doc.outerHtml(), CRAIGSLIST_DETAIL_URL_PATTERN, MAX_LISTINGS_PER_SOURCE);
            log.info("Craigslist search page yielded {} detail URLs for search {}", detailUrls.size(), searchRequest.getId());

            return fetchApartments(detailUrls, () -> "Craigslist", url -> fetchCraigslistApartmentDetails(url, searchRequest.getId()));
        } catch (Exception e) {
            log.warn("Craigslist scrape failed for search {}", searchRequest.getId(), e);
            return List.of();
        }
    }

    private List<Apartment> scrapeKijijiListings(SearchRequest searchRequest) {
        try {
            String searchUrl = KIJIJI_TORONTO_URL + "?price=" + MIN_PRICE + "__" + searchRequest.getMaxPrice();
            Document doc = Jsoup.connect(searchUrl)
                    .timeout(REQUEST_TIMEOUT_MS)
                    .userAgent(defaultUserAgent())
                    .referrer("https://www.google.com")
                    .get();

            List<String> detailUrls = extractUrls(doc.outerHtml(), KIJIJI_DETAIL_URL_PATTERN, MAX_LISTINGS_PER_SOURCE);
            log.info("Kijiji search page yielded {} detail URLs for search {}", detailUrls.size(), searchRequest.getId());

            return fetchApartments(detailUrls, () -> "Kijiji", url -> fetchKijijiApartmentDetails(url, searchRequest.getId()));
        } catch (Exception e) {
            log.warn("Kijiji scrape failed for search {}", searchRequest.getId(), e);
            return List.of();
        }
    }

    private List<Apartment> fetchApartments(List<String> detailUrls, Supplier<String> sourceName, ListingFetcher fetcher) {
        if (detailUrls.isEmpty()) {
            return List.of();
        }

        ExecutorService pool = Executors.newFixedThreadPool(MAX_CONCURRENT_DETAIL_REQUESTS);
        try {
            List<CompletableFuture<Apartment>> futures = detailUrls.stream()
                    .map(url -> CompletableFuture.supplyAsync(() -> fetcher.fetch(url), pool))
                    .toList();

            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

            List<Apartment> apartments = futures.stream()
                    .map(CompletableFuture::join)
                    .filter(apartment -> apartment != null && apartment.getPrice() != null)
                    .peek(apartment -> {
                        // DB has CHECK (sqft > 0); convert invalid values to NULL
                        if (apartment.getSqft() != null && apartment.getSqft() <= 0) {
                            apartment.setSqft(null);
                        }
                    })
                    .collect(Collectors.toList());

            log.info("{} detail fetches produced {} apartments", sourceName.get(), apartments.size());
        return apartments;
        } finally {
            pool.shutdownNow();
        }
    }

    private Apartment fetchCraigslistApartmentDetails(String url, UUID searchId) {
        try {
            Document detailDoc = Jsoup.connect(url)
                    .timeout(REQUEST_TIMEOUT_MS)
                    .userAgent(defaultUserAgent())
                    .referrer(CRAIGSLIST_TORONTO_URL)
                    .get();

            String title = textOrFallback(detailDoc.selectFirst("span#titletextonly"), detailDoc.title());
            Integer price = parseInteger(textOrFallback(detailDoc.selectFirst("span.price"), null));

            String detailText = detailDoc.text();
            HousingInfo detailHousing = extractHousingInfo(
                    detailDoc.select("p.attrgroup span, div.mapAndAttrs p.attrgroup span")
                            .stream()
                            .map(Element::text)
                            .collect(Collectors.joining(" "))
            );

            if (price == null) {
                price = extractPrice(detailText);
            }
            if (price == null) {
                log.debug("Skipping Craigslist listing without price: {}", url);
                return null;
            }

            List<String> amenities = normalizeAmenities(
                    detailDoc.select("p.attrgroup span, div.mapAndAttrs p.attrgroup span, p.attrgroup span.shared-line-bubble")
                            .stream()
                            .map(Element::text)
                            .toList()
            );
            List<String> imageUrls = extractImageUrls(detailDoc, null);

            return Apartment.builder()
                    .searchId(searchId)
                    .sourceUrl(url)
                    .imageUrl(imageUrls.isEmpty() ? null : imageUrls.get(0))
                    .imageUrls(imageUrls)
                    .sourceSite("CRAIGSLIST")
                    .title(title)
                    .price(price)
                    .sqft(detailHousing.sqft())
                    .bedrooms(detailHousing.bedrooms())
                    .bathrooms(detailHousing.bathrooms())
                    .amenities(amenities)
                    .leaseTermMonths(extractLeaseTerm(detailText))
                    .rawHtml(detailDoc.outerHtml())
                    .build();
        } catch (Exception e) {
            log.warn("Failed to fetch Craigslist listing details for {}", url, e);
            return null;
        }
    }

    private Apartment fetchKijijiApartmentDetails(String url, UUID searchId) {
        try {
            Document detailDoc = Jsoup.connect(url)
                    .timeout(REQUEST_TIMEOUT_MS)
                    .userAgent(defaultUserAgent())
                    .referrer(KIJIJI_TORONTO_URL)
                    .get();

            JsonNode listingJson = extractListingJson(detailDoc);
            String pageText = detailDoc.text();
            String description = firstNonBlank(extractJsonText(listingJson, "description"), pageText);
            String title = firstNonBlank(extractJsonText(listingJson, "name"), detailDoc.title());
            String combinedText = String.join(" ", title, description, pageText);
            List<String> imageUrls = extractImageUrls(detailDoc, listingJson);

            Integer price = firstNonNull(extractPrice(listingJson), extractPrice(pageText), extractPrice(title));
            if (price == null) {
                log.debug("Skipping Kijiji listing without price: {}", url);
                return null;
            }

            HousingInfo detailHousing = extractHousingInfo(combinedText);
            List<String> amenities = normalizeAmenities(List.of(title, description, pageText));

            return Apartment.builder()
                    .searchId(searchId)
                    .sourceUrl(url)
                    .imageUrl(imageUrls.isEmpty() ? null : imageUrls.get(0))
                    .imageUrls(imageUrls)
                    .sourceSite("KIJIJI")
                    .title(title)
                    .price(price)
                    .sqft(detailHousing.sqft())
                    .bedrooms(detailHousing.bedrooms())
                    .bathrooms(detailHousing.bathrooms())
                    .amenities(amenities)
                    .leaseTermMonths(extractLeaseTerm(combinedText))
                    .rawHtml(detailDoc.outerHtml())
                    .build();
        } catch (Exception e) {
            log.warn("Failed to fetch Kijiji listing details for {}", url, e);
            return null;
        }
    }

    private List<Apartment> loadCachedListings(SearchRequest searchRequest) {
        OffsetDateTime now = OffsetDateTime.now();
        List<Apartment> activeListings = apartmentRepository.findTop200ByExpiresAtAfterOrderByCreatedAtDesc(now);

        List<Apartment> cachedListings = activeListings.stream()
                .filter(apartment -> apartment.getPrice() != null && apartment.getPrice() >= MIN_PRICE)
                .filter(apartment -> apartment.getPrice() <= searchRequest.getMaxPrice())
                .map(apartment -> cloneForSearch(apartment, searchRequest.getId()))
                .limit(MAX_CACHE_LISTINGS)
                .collect(Collectors.toList());

        log.info("Loaded {} non-expired cached listings for search {}", cachedListings.size(), searchRequest.getId());
        return cachedListings;
    }

    private Apartment cloneForSearch(Apartment apartment, UUID searchId) {
        return Apartment.builder()
                .searchId(searchId)
                .sourceUrl(apartment.getSourceUrl())
                .imageUrl(apartment.getImageUrl())
                .imageUrls(apartment.getImageUrls())
                .sourceSite(apartment.getSourceSite())
                .title(apartment.getTitle())
                .price(apartment.getPrice())
                .sqft(apartment.getSqft())
                .bedrooms(apartment.getBedrooms())
                .bathrooms(apartment.getBathrooms())
                .amenities(apartment.getAmenities())
                .leaseTermMonths(apartment.getLeaseTermMonths())
                .rawHtml(apartment.getRawHtml())
                .expiresAt(apartment.getExpiresAt())
                .build();
    }

    private List<Apartment> mergeDedupedListings(SearchRequest searchRequest, List<Apartment> liveListings, List<Apartment> cachedListings) {
        List<Apartment> orderedListings = new ArrayList<>(liveListings);
        orderedListings.addAll(cachedListings);

        List<Apartment> mergedListings = new ArrayList<>();
        Set<String> seenUrls = new HashSet<>();
        Set<String> seenSignatures = new HashSet<>();

        for (Apartment apartment : orderedListings) {
            if (apartment == null || apartment.getPrice() == null) {
                continue;
            }
            if (apartment.getPrice() < MIN_PRICE || apartment.getPrice() > searchRequest.getMaxPrice()) {
                continue;
            }

            String normalizedUrl = normalizeUrl(apartment.getSourceUrl());
            String signature = buildSignature(apartment);

            if (!normalizedUrl.isBlank() && !seenUrls.add(normalizedUrl)) {
                continue;
            }
            if (!signature.isBlank() && !seenSignatures.add(signature)) {
                continue;
            }

            mergedListings.add(apartment);
            if (mergedListings.size() >= MAX_COMBINED_LISTINGS) {
                break;
            }
        }

        return mergedListings;
    }

    private List<String> extractUrls(String html, Pattern pattern, int limit) {
        if (html == null || html.isBlank()) {
            return List.of();
        }

        Matcher matcher = pattern.matcher(html);
        Set<String> urls = new LinkedHashSet<>();
        while (matcher.find() && urls.size() < limit) {
            urls.add(trimTrailingUrlPunctuation(matcher.group()));
        }
        return new ArrayList<>(urls);
    }

    private String trimTrailingUrlPunctuation(String url) {
        if (url == null) {
            return "";
        }

        String cleaned = url.strip();
        while (!cleaned.isEmpty() && "\"'>),".indexOf(cleaned.charAt(cleaned.length() - 1)) >= 0) {
            cleaned = cleaned.substring(0, cleaned.length() - 1);
        }
        return cleaned;
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

    private Integer extractPrice(JsonNode jsonNode) {
        if (jsonNode == null || jsonNode.isNull() || jsonNode.isMissingNode()) {
            return null;
        }

        if (jsonNode.isValueNode()) {
            return parseInteger(jsonNode.asText());
        }

        if (jsonNode.isObject()) {
            if (jsonNode.hasNonNull("price")) {
                Integer directPrice = parseInteger(jsonNode.get("price").asText());
                if (directPrice != null) {
                    return directPrice;
                }
            }

            if (jsonNode.has("offers")) {
                Integer offerPrice = extractPrice(jsonNode.get("offers"));
                if (offerPrice != null) {
                    return offerPrice;
                }
            }

            for (JsonNode child : jsonNode) {
                Integer childPrice = extractPrice(child);
                if (childPrice != null) {
                    return childPrice;
                }
            }
        }

        if (jsonNode.isArray()) {
            for (JsonNode child : jsonNode) {
                Integer childPrice = extractPrice(child);
                if (childPrice != null) {
                    return childPrice;
                }
            }
        }

        return null;
    }

    private String extractImageUrl(JsonNode jsonNode) {
        List<String> imageUrls = extractImageUrls(jsonNode);
        return imageUrls.isEmpty() ? null : imageUrls.get(0);
    }

    private List<String> extractImageUrls(Document detailDoc, JsonNode listingJson) {
        Set<String> imageUrls = new LinkedHashSet<>();

        addIfImage(imageUrls, extractPrimaryImageUrl(detailDoc, null));

        for (Element imageElement : detailDoc.select("img[src], img[data-src], img[data-large], img[data-imgsrc]")) {
            addIfImage(imageUrls, imageElement.attr("src"));
            addIfImage(imageUrls, imageElement.attr("data-src"));
            addIfImage(imageUrls, imageElement.attr("data-large"));
            addIfImage(imageUrls, imageElement.attr("data-imgsrc"));
        }

        if (listingJson != null) {
            imageUrls.addAll(extractImageUrls(listingJson));
        }

        return imageUrls.stream()
                .limit(8)
                .collect(Collectors.toList());
    }

    private List<String> extractImageUrls(JsonNode jsonNode) {
        if (jsonNode == null || jsonNode.isNull() || jsonNode.isMissingNode()) {
            return List.of();
        }

        Set<String> imageUrls = new LinkedHashSet<>();

        if (jsonNode.isTextual()) {
            String value = jsonNode.asText();
            addIfImage(imageUrls, value);
            return new ArrayList<>(imageUrls);
        }

        if (jsonNode.isObject()) {
            if (jsonNode.hasNonNull("image")) {
                imageUrls.addAll(extractImageUrls(jsonNode.get("image")));
            }
            if (jsonNode.hasNonNull("contentUrl")) {
                imageUrls.addAll(extractImageUrls(jsonNode.get("contentUrl")));
            }
            if (jsonNode.hasNonNull("url")) {
                JsonNode urlNode = jsonNode.get("url");
                if (jsonNode.path("@type").asText("").toLowerCase(Locale.ROOT).contains("image")) {
                    imageUrls.addAll(extractImageUrls(urlNode));
                }
            }
            for (JsonNode child : jsonNode) {
                imageUrls.addAll(extractImageUrls(child));
            }
        }

        if (jsonNode.isArray()) {
            for (JsonNode child : jsonNode) {
                imageUrls.addAll(extractImageUrls(child));
            }
        }

        return imageUrls.stream()
                .limit(8)
                .collect(Collectors.toList());
    }

    private boolean isLikelyImageUrl(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }

        String normalized = value.toLowerCase(Locale.ROOT);
        return (normalized.startsWith("http://") || normalized.startsWith("https://"))
                && (normalized.contains("image")
                || normalized.contains("/media/")
                || normalized.matches(".*\\.(jpg|jpeg|png|webp)(\\?.*)?$"));
    }

    private String extractJsonText(JsonNode jsonNode, String fieldName) {
        if (jsonNode == null || jsonNode.isNull() || jsonNode.isMissingNode()) {
            return null;
        }

        if (jsonNode.isObject()) {
            if (jsonNode.hasNonNull(fieldName)) {
                return jsonNode.get(fieldName).asText();
            }
            for (JsonNode child : jsonNode) {
                String value = extractJsonText(child, fieldName);
                if (value != null && !value.isBlank()) {
                    return value;
                }
            }
        }

        if (jsonNode.isArray()) {
            for (JsonNode child : jsonNode) {
                String value = extractJsonText(child, fieldName);
                if (value != null && !value.isBlank()) {
                    return value;
                }
            }
        }

        return null;
    }

    private JsonNode extractListingJson(Document detailDoc) {
        for (Element script : detailDoc.select("script[type=application/ld+json]")) {
            String json = script.data();
            if (json == null || json.isBlank()) {
                continue;
            }
            try {
                JsonNode root = OBJECT_MAPPER.readTree(json);
                JsonNode listingNode = findListingJsonNode(root);
                if (listingNode != null) {
                    return listingNode;
                }
            } catch (Exception ignored) {
                log.debug("Skipping malformed JSON-LD block");
            }
        }
        return null;
    }

    private JsonNode findListingJsonNode(JsonNode node) {
        if (node == null || node.isNull() || node.isMissingNode()) {
            return null;
        }

        if (node.isObject()) {
            String type = node.path("@type").asText("");
            if (type.contains("Residence") || type.contains("Apartment") || type.contains("Product")) {
                return node;
            }
            if (node.has("name") && (node.has("description") || node.has("offers"))) {
                return node;
            }
            for (JsonNode child : node) {
                JsonNode match = findListingJsonNode(child);
                if (match != null) {
                    return match;
                }
            }
        }

        if (node.isArray()) {
            for (JsonNode child : node) {
                JsonNode match = findListingJsonNode(child);
                if (match != null) {
                    return match;
                }
            }
        }

        return null;
    }

    private Integer extractPrice(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        Matcher matcher = PRICE_PATTERN.matcher(value);
        if (matcher.find()) {
            return parseInteger(matcher.group(1));
        }
        return null;
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

    private String extractPrimaryImageUrl(Document detailDoc, String fallback) {
        String imageUrl = attributeOrFallback(detailDoc.selectFirst("meta[property=og:image]"), "content", null);
        if (imageUrl == null || imageUrl.isBlank()) {
            imageUrl = attributeOrFallback(detailDoc.selectFirst("meta[name=twitter:image]"), "content", null);
        }
        if (imageUrl == null || imageUrl.isBlank()) {
            imageUrl = attributeOrFallback(detailDoc.selectFirst("img"), "src", null);
        }
        return firstNonBlank(imageUrl, fallback);
    }

    private void addIfImage(Set<String> images, String candidate) {
        if (isLikelyImageUrl(candidate)) {
            images.add(candidate.trim());
        }
    }

    private String attributeOrFallback(Element element, String attribute, String fallback) {
        if (element != null) {
            String value = element.attr(attribute).trim();
            if (!value.isBlank()) {
                return value;
            }
        }
        return fallback;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "";
    }

    @SafeVarargs
    private final <T> T firstNonNull(T... values) {
        for (T value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private String normalizeUrl(String url) {
        if (url == null || url.isBlank()) {
            return "";
        }

        String normalized = url.strip().toLowerCase(Locale.ROOT);
        int fragmentIndex = normalized.indexOf('#');
        if (fragmentIndex >= 0) {
            normalized = normalized.substring(0, fragmentIndex);
        }
        int queryIndex = normalized.indexOf('?');
        if (queryIndex >= 0) {
            normalized = normalized.substring(0, queryIndex);
        }
        if (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    private String buildSignature(Apartment apartment) {
        String normalizedTitle = apartment.getTitle() == null
                ? ""
                : apartment.getTitle().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", " ").trim();
        return String.join("|",
                normalizedTitle,
                String.valueOf(apartment.getPrice()),
                String.valueOf(apartment.getBedrooms()),
                String.valueOf(apartment.getBathrooms()),
                String.valueOf(apartment.getSqft()));
    }

    private String defaultUserAgent() {
        return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                + "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
    }

    @FunctionalInterface
    private interface ListingFetcher {
        Apartment fetch(String url);
    }

    private record HousingInfo(Integer sqft, Integer bedrooms, Integer bathrooms) {
    }
}
