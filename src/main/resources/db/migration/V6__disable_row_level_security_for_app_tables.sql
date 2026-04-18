-- Supabase enables RLS on tables; with no policies, some DB roles cannot INSERT/UPDATE.
-- This app talks to Postgres only from the Spring backend (not PostgREST). Disable RLS so
-- the JDBC user used on Render/pooler can persist rows like a normal server database.
ALTER TABLE search_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE apartments DISABLE ROW LEVEL SECURITY;
ALTER TABLE apartment_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_jobs DISABLE ROW LEVEL SECURITY;
