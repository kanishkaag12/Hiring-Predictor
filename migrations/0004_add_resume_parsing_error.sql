-- Add resume parsing error tracking
-- This column stores the error message if resume parsing fails, allowing us to:
-- 1. Surface parsing errors to the user
-- 2. Distinguish between "not parsed" and "parsing failed"
-- 3. Implement retry mechanisms

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resume_parsing_error" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resume_parsing_attempted_at" timestamp;

-- Clear any existing error state
UPDATE "users" SET "resume_parsing_error" = NULL WHERE "resume_parsing_error" = '';
