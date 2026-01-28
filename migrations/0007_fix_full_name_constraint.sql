-- Fix: Make full_name nullable since backend uses 'name' column instead
ALTER TABLE users ALTER COLUMN full_name DROP NOT NULL;
