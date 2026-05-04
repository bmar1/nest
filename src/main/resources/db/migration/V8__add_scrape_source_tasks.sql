CREATE TABLE scrape_source_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_id UUID NOT NULL REFERENCES search_requests(id) ON DELETE CASCADE,
    source VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'PROCESSING', 'DONE', 'FAILED')),
    attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (search_id, source)
);

CREATE INDEX idx_scrape_source_tasks_search_id ON scrape_source_tasks(search_id);
CREATE INDEX idx_scrape_source_tasks_search_status ON scrape_source_tasks(search_id, status);
CREATE INDEX idx_scrape_source_tasks_source_status ON scrape_source_tasks(source, status);

CREATE TRIGGER update_scrape_source_tasks_updated_at BEFORE UPDATE ON scrape_source_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE scrape_source_tasks DISABLE ROW LEVEL SECURITY;
