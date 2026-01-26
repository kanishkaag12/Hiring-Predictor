-- Add missing profile fields to users table
-- These fields were referenced in code but missing from the schema

-- Add userType column if it doesn't exist
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "user_type" text;

-- Add interestRoles column if it doesn't exist  
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "interest_roles" jsonb DEFAULT '[]'::jsonb;
