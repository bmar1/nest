ALTER TABLE search_requests
    ADD COLUMN desired_bedrooms INTEGER,
    ADD COLUMN desired_bathrooms INTEGER;

ALTER TABLE apartments
    ADD COLUMN bathrooms INTEGER;
