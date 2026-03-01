-- Add custom_questions JSON column to opportunities table
-- This stores an array of custom questions the business wants applicants to answer
-- Format: [{ "id": "uuid", "question": "text", "type": "text|file", "required": true/false }]
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS custom_questions jsonb DEFAULT '[]'::jsonb;

-- Add new fields to applications table for the enhanced application process
ALTER TABLE applications ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS availability text;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS resume_url text;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS reference_letter_url text;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS custom_answers jsonb DEFAULT '{}'::jsonb;

-- Create storage bucket for application files (resume, reference letters, custom file uploads)
-- Run this in Supabase Dashboard > Storage:
-- 1. Create a new bucket named 'application-files'
-- 2. Make it public (or use signed URLs)
-- 3. Add a policy allowing authenticated users to upload to their own folder
