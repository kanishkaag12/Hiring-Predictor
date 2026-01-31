-- Create jobs table with correct schema matching shared/schema.ts
-- Using varchar for id to match the schema definition

CREATE TABLE IF NOT EXISTS "jobs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"title" text NOT NULL,
	"company" text NOT NULL,
	"location" text NOT NULL,
	"city" text,
	"state" text,
	"country" text,
	"employment_type" text NOT NULL,
	"experience_level" text NOT NULL,
	"salary_range" text,
	"skills" jsonb NOT NULL,
	"source" text NOT NULL,
	"posted_at" timestamp NOT NULL,
	"apply_url" text NOT NULL,
	"company_type" text,
	"company_size_tag" text,
	"company_tags" jsonb,
	"is_internship" integer DEFAULT 0,
	"hiring_platform" text,
	"hiring_platform_url" text,
	"applicants" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS "jobs_title_idx" ON "jobs"("title");
CREATE INDEX IF NOT EXISTS "jobs_company_idx" ON "jobs"("company");
CREATE INDEX IF NOT EXISTS "jobs_city_idx" ON "jobs"("city");
CREATE INDEX IF NOT EXISTS "jobs_country_idx" ON "jobs"("country");

-- Create unique index on apply_url to prevent duplicate job postings
CREATE UNIQUE INDEX IF NOT EXISTS "jobs_apply_url_unique_idx" ON "jobs"("apply_url");
