-- Add image_url to opportunities for per-opportunity display images on the marketplace.
-- Run this in Supabase SQL Editor if your database was created before this column existed.
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS image_url TEXT;
