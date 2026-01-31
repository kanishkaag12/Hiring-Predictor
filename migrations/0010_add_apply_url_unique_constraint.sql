-- Add unique constraint to apply_url to prevent duplicate job postings
-- This allows us to use ON CONFLICT DO NOTHING for idempotent ingestion

CREATE UNIQUE INDEX IF NOT EXISTS "jobs_apply_url_unique_idx" ON "jobs"("apply_url");
