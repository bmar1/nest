-- Bind searches to the Google account that created them (JWT "sub" claim).
-- Orphan rows from before ownership cannot be attributed and are removed.

ALTER TABLE search_requests ADD COLUMN user_id VARCHAR(255);

DELETE FROM search_requests WHERE user_id IS NULL;

ALTER TABLE search_requests ALTER COLUMN user_id SET NOT NULL;

CREATE INDEX idx_search_requests_user_id ON search_requests(user_id);
