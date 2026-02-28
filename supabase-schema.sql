-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('student', 'business')),
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create businesses table
CREATE TABLE businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('food', 'retail', 'services', 'healthcare', 'education', 'other')),
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  phone TEXT,
  email TEXT,
  website TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create opportunities table
CREATE TABLE opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  hours_available INTEGER NOT NULL,
  start_date DATE,
  end_date DATE,
  is_flexible BOOLEAN DEFAULT false,
  perks TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create applications table
CREATE TABLE applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  message TEXT,
  hours_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(profile_id, opportunity_id)
);

-- Create bookmarks table
CREATE TABLE bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(profile_id, opportunity_id)
);

-- Create ratings table
CREATE TABLE ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(profile_id, business_id)
);

-- Create business favorites table
CREATE TABLE business_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(profile_id, business_id)
);

-- Create coupons table
CREATE TABLE coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  discount_percent INTEGER,
  discount_amount DECIMAL(10, 2),
  coupon_code TEXT,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Businesses policies
CREATE POLICY "Businesses are viewable by everyone"
  ON businesses FOR SELECT
  USING (true);

CREATE POLICY "Business users can create businesses"
  ON businesses FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Business owners can update their businesses"
  ON businesses FOR UPDATE
  USING (auth.uid() = profile_id);

CREATE POLICY "Business owners can delete their businesses"
  ON businesses FOR DELETE
  USING (auth.uid() = profile_id);

-- Opportunities policies
CREATE POLICY "Opportunities are viewable by everyone"
  ON opportunities FOR SELECT
  USING (true);

CREATE POLICY "Business owners can create opportunities"
  ON opportunities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = business_id
      AND businesses.profile_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can update their opportunities"
  ON opportunities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = opportunities.business_id
      AND businesses.profile_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can delete their opportunities"
  ON opportunities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = opportunities.business_id
      AND businesses.profile_id = auth.uid()
    )
  );

-- Applications policies
CREATE POLICY "Users can view their own applications"
  ON applications FOR SELECT
  USING (auth.uid() = profile_id OR 
    EXISTS (
      SELECT 1 FROM opportunities o
      JOIN businesses b ON b.id = o.business_id
      WHERE o.id = applications.opportunity_id
      AND b.profile_id = auth.uid()
    )
  );

CREATE POLICY "Students can create applications"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own applications"
  ON applications FOR UPDATE
  USING (auth.uid() = profile_id OR 
    EXISTS (
      SELECT 1 FROM opportunities o
      JOIN businesses b ON b.id = o.business_id
      WHERE o.id = applications.opportunity_id
      AND b.profile_id = auth.uid()
    )
  );

-- Bookmarks policies
CREATE POLICY "Users can view their own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can create their own bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = profile_id);

-- Ratings policies
CREATE POLICY "Ratings are viewable by everyone"
  ON ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can create ratings"
  ON ratings FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own ratings"
  ON ratings FOR UPDATE
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own ratings"
  ON ratings FOR DELETE
  USING (auth.uid() = profile_id);

-- Business favorites policies
CREATE POLICY "Users can view their own business favorites"
  ON business_favorites FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can create their own business favorites"
  ON business_favorites FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own business favorites"
  ON business_favorites FOR DELETE
  USING (auth.uid() = profile_id);

-- Coupons policies
CREATE POLICY "Coupons are viewable by everyone"
  ON coupons FOR SELECT
  USING (true);

CREATE POLICY "Business owners can create coupons"
  ON coupons FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = business_id
      AND businesses.profile_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can update their coupons"
  ON coupons FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = coupons.business_id
      AND businesses.profile_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can delete their coupons"
  ON coupons FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = coupons.business_id
      AND businesses.profile_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_businesses_category ON businesses(category);
CREATE INDEX idx_businesses_location ON businesses(latitude, longitude);
CREATE INDEX idx_opportunities_business_id ON opportunities(business_id);
CREATE INDEX idx_applications_profile_id ON applications(profile_id);
CREATE INDEX idx_applications_opportunity_id ON applications(opportunity_id);
CREATE INDEX idx_bookmarks_profile_id ON bookmarks(profile_id);
CREATE INDEX idx_ratings_business_id ON ratings(business_id);
CREATE INDEX idx_business_favorites_profile_id ON business_favorites(profile_id);
CREATE INDEX idx_business_favorites_business_id ON business_favorites(business_id);
CREATE INDEX idx_coupons_business_id ON coupons(business_id);
