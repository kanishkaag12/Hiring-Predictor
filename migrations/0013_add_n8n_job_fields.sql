-- Migration to add all n8n job ingestion columns
-- This ensures the backend schema matches the actual n8n data structure

-- Add description and job_description columns if they don't exist
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "job_description" text;

-- Add company details
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "company_website" text;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "company_logo" text;

-- Add apply link and direct application indicator
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "apply_link" text;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "apply_is_direct" integer;

-- Add remote work indicator
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "job_is_remote" integer;

-- Add job posting timestamps
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "job_posted_at" text;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "job_posted_at_timestamp" text;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "job_posted_at_datetime_utc" text;

-- Add detailed location fields from n8n
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "job_location" text;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "job_city" text;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "job_state" text;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "job_country" text;

-- Add job Google link
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "job_google_link" text;

-- Add salary information
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "job_salary" text;

-- Add publisher information
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "publisher" text;

-- Create index on job_description for faster text searches
CREATE INDEX IF NOT EXISTS "jobs_job_description_idx" ON "jobs" USING gin(to_tsvector('english', "job_description"));

-- Create index on description for faster text searches
CREATE INDEX IF NOT EXISTS "jobs_description_idx" ON "jobs" USING gin(to_tsvector('english', "description"));

-- Create indexes on job location fields
CREATE INDEX IF NOT EXISTS "jobs_job_city_idx" ON "jobs"("job_city");
CREATE INDEX IF NOT EXISTS "jobs_job_state_idx" ON "jobs"("job_state");
CREATE INDEX IF NOT EXISTS "jobs_job_country_idx" ON "jobs"("job_country");
CREATE INDEX IF NOT EXISTS "jobs_job_is_remote_idx" ON "jobs"("job_is_remote");

-- Create index on apply_link for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS "jobs_apply_link_unique_idx" ON "jobs"("apply_link");

COMMENT ON COLUMN "jobs"."description" IS 'Job description - can be populated by either field';
COMMENT ON COLUMN "jobs"."job_description" IS 'Job description from n8n ingestion - primary source';
COMMENT ON COLUMN "jobs"."job_city" IS 'City from n8n job data';
COMMENT ON COLUMN "jobs"."job_state" IS 'State from n8n job data';
COMMENT ON COLUMN "jobs"."job_country" IS 'Country from n8n job data';
COMMENT ON COLUMN "jobs"."job_is_remote" IS 'Remote work indicator: 0=not remote, 1=remote';
