-- Add parsed resume data fields to users table
-- These fields store the extracted resume information

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resume_parsed_skills" jsonb DEFAULT '[]'::jsonb;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resume_education" jsonb DEFAULT '[]'::jsonb;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resume_experience_months" integer DEFAULT 0;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resume_projects_count" integer DEFAULT 0;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resume_completeness_score" text DEFAULT '0';
