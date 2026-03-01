-- Create business_favorites table
CREATE TABLE IF NOT EXISTS business_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique constraint (one favorite per business per user)
  UNIQUE(profile_id, business_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_business_favorites_profile_id ON business_favorites(profile_id);
CREATE INDEX IF NOT EXISTS idx_business_favorites_business_id ON business_favorites(business_id);

-- Enable Row Level Security
ALTER TABLE business_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own bookmarked businesses
CREATE POLICY "Users can view their own business favorites"
  ON business_favorites
  FOR SELECT
  USING (auth.uid() = profile_id);

-- RLS Policy: Users can only insert their own business favorites
CREATE POLICY "Users can insert their own business favorites"
  ON business_favorites
  FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- RLS Policy: Users can only delete their own business favorites
CREATE POLICY "Users can delete their own business favorites"
  ON business_favorites
  FOR DELETE
  USING (auth.uid() = profile_id);
