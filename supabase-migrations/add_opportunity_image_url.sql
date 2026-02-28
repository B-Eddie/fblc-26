-- Add image_url to opportunities for per-opportunity display images on the marketplace.
-- Run this in Supabase SQL Editor if your database was created before this column existed.

ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Force PostgREST to reload its schema cache so the new column is recognized immediately.
-- Without this, you may get: "Could not find the 'image_url' column of 'opportunities' in the schema cache"
NOTIFY pgrst, 'reload schema';
