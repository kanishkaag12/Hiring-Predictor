-- Create missing core tables (skills, projects, experience, favourites)
-- These should have been created by base migrations but are missing

-- Skills table
CREATE TABLE IF NOT EXISTS "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"level" text NOT NULL
);

-- Projects table
CREATE TABLE IF NOT EXISTS "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"tech_stack" jsonb NOT NULL,
	"description" text NOT NULL,
	"github_link" text,
	"complexity" text NOT NULL
);

-- Experience table
CREATE TABLE IF NOT EXISTS "experience" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company" text NOT NULL,
	"role" text NOT NULL,
	"duration" text NOT NULL,
	"type" text NOT NULL
);

-- Favourites table
CREATE TABLE IF NOT EXISTS "favourites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"job_id" varchar NOT NULL,
	"job_type" text NOT NULL,
	"saved_at" timestamp DEFAULT now() NOT NULL
);

-- Jobs table
CREATE TABLE IF NOT EXISTS "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"company" text NOT NULL,
	"location" text NOT NULL,
	"employment_type" text NOT NULL,
	"experience_level" text NOT NULL,
	"salary_range" text,
	"skills" jsonb NOT NULL,
	"source" text NOT NULL,
	"posted_at" timestamp NOT NULL,
	"apply_url" text NOT NULL
);

-- Create foreign key constraints
ALTER TABLE "skills" ADD CONSTRAINT "skills_user_id_users_id_fk" 
	FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk" 
	FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "experience" ADD CONSTRAINT "experience_user_id_users_id_fk" 
	FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "favourites" ADD CONSTRAINT "favourites_user_id_users_id_fk" 
	FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS "skills_user_id_idx" ON "skills"("user_id");
CREATE INDEX IF NOT EXISTS "projects_user_id_idx" ON "projects"("user_id");
CREATE INDEX IF NOT EXISTS "experience_user_id_idx" ON "experience"("user_id");
CREATE INDEX IF NOT EXISTS "favourites_user_id_idx" ON "favourites"("user_id");
CREATE INDEX IF NOT EXISTS "jobs_title_idx" ON "jobs"("title");
