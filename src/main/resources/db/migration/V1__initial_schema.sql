-- Initial schema for Nest apartment finder application
-- Creates tables for search requests, apartments, scores, and job tracking

-- Search priority enum type
CREATE TYPE priority_type AS ENUM ('BUDGET', 'SPACE', 'AMENITIES', 'BALANCED');

-- Job status enum type
CREATE TYPE job_status_type AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- Search requests table - stores user search criteria
CREATE TABLE search_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    priority priority_type NOT NULL,
    max_price INTEGER NOT NULL CHECK (max_price > 0),
    min_sqft INTEGER NOT NULL CHECK (min_sqft > 0),
    desired_amenities JSONB DEFAULT '[]'::jsonb,
    max_lease_months INTEGER CHECK (max_lease_months > 0),
    status job_status_type NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Apartments table - stores scraped listing data
CREATE TABLE apartments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_id UUID NOT NULL REFERENCES search_requests(id) ON DELETE CASCADE,
    source_url TEXT NOT NULL,
    source_site VARCHAR(50) NOT NULL DEFAULT 'CRAIGSLIST',
    title TEXT,
    price INTEGER NOT NULL CHECK (price >= 0),
    sqft INTEGER CHECK (sqft > 0),
    bedrooms INTEGER CHECK (bedrooms >= 0),
    amenities JSONB DEFAULT '[]'::jsonb,
    lease_term_months INTEGER DEFAULT 12,
    raw_html TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Apartment scores table - stores calculated match scores
CREATE TABLE apartment_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apartment_id UUID NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
    search_id UUID NOT NULL REFERENCES search_requests(id) ON DELETE CASCADE,
    price_score DECIMAL(5,2) NOT NULL CHECK (price_score >= 0),
    space_score DECIMAL(5,2) NOT NULL CHECK (space_score >= 0),
    amenities_score DECIMAL(5,2) NOT NULL CHECK (amenities_score >= 0),
    lease_score DECIMAL(5,2) NOT NULL CHECK (lease_score >= 0),
    final_score DECIMAL(5,2) NOT NULL CHECK (final_score >= 0 AND final_score <= 100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(apartment_id)
);

-- Scraping jobs table - tracks job processing status
CREATE TABLE scraping_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_id UUID NOT NULL REFERENCES search_requests(id) ON DELETE CASCADE,
    status job_status_type NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    total_attempted INTEGER DEFAULT 0,
    total_successful INTEGER DEFAULT 0,
    total_failed INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(search_id)
);

-- Indexes for performance optimization
CREATE INDEX idx_search_requests_status ON search_requests(status);
CREATE INDEX idx_search_requests_created_at ON search_requests(created_at DESC);

CREATE INDEX idx_apartments_search_id ON apartments(search_id);
CREATE INDEX idx_apartments_price ON apartments(price);
CREATE INDEX idx_apartments_created_at ON apartments(created_at DESC);

CREATE INDEX idx_apartment_scores_search_id ON apartment_scores(search_id);
CREATE INDEX idx_apartment_scores_final_score ON apartment_scores(final_score DESC);
CREATE INDEX idx_apartment_scores_search_final ON apartment_scores(search_id, final_score DESC);

CREATE INDEX idx_scraping_jobs_search_id ON scraping_jobs(search_id);
CREATE INDEX idx_scraping_jobs_status ON scraping_jobs(status);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_search_requests_updated_at BEFORE UPDATE ON search_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
