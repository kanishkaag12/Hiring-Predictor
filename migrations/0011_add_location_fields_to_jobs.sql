-- Add city, state, country fields to jobs table for better location tracking
-- These fields are used by the n8n job ingest endpoint

ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "city" text;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "state" text;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "country" text;

-- Create indexes for location-based queries
CREATE INDEX IF NOT EXISTS "jobs_city_idx" ON "jobs"("city");
CREATE INDEX IF NOT EXISTS "jobs_country_idx" ON "jobs"("country");
