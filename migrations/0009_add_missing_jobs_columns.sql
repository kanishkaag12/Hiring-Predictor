-- Add missing columns to jobs table
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "company_type" text;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "company_size_tag" text;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "company_tags" jsonb;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "is_internship" integer DEFAULT 0;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "hiring_platform" text;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "hiring_platform_url" text;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "applicants" integer;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "jobs_company_idx" ON "jobs"("company");
