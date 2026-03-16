ALTER TABLE apartments
    ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;

UPDATE apartments
SET expires_at = created_at + INTERVAL '3 days'
WHERE expires_at IS NULL;

ALTER TABLE apartments
    ALTER COLUMN expires_at SET NOT NULL;

CREATE INDEX idx_apartments_expires_at ON apartments(expires_at DESC);
