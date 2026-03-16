ALTER TABLE apartments
    ADD COLUMN image_urls JSONB DEFAULT '[]'::jsonb;
