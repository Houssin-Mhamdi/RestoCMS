-- ============================================
-- Run this SQL in your Supabase SQL editor
-- ============================================

-- 1. CLIENTS TABLE
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL,
  restaurant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  name TEXT NOT NULL,
  lastname TEXT NOT NULL,
  phone TEXT NOT NULL,
  location TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL,
  restaurant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  items JSONB DEFAULT '[]'::jsonb NOT NULL,
  total NUMERIC DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.5 PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL,
  restaurant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  name TEXT NOT NULL,
  price NUMERIC DEFAULT 0 NOT NULL,
  image_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ENABLE RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating
DROP POLICY IF EXISTS "Users can view own clients" ON clients;
DROP POLICY IF EXISTS "Users can insert own clients" ON clients;
DROP POLICY IF EXISTS "Users can update own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON clients;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Users can delete own orders" ON orders;
DROP POLICY IF EXISTS "Users can view own products" ON products;
DROP POLICY IF EXISTS "Users can insert own products" ON products;
DROP POLICY IF EXISTS "Users can update own products" ON products;
DROP POLICY IF EXISTS "Users can delete own products" ON products;

-- 4. RLS POLICIES WITH RESTAURANT SCOPING
CREATE POLICY "Users can view own clients"
  ON clients FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients"
  ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON clients FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders"
  ON orders FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own orders"
  ON orders FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own products"
  ON products FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products"
  ON products FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
  ON products FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
  ON products FOR DELETE USING (auth.uid() = user_id);

-- 6. CALENDAR EVENTS TABLE
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL,
  restaurant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  date DATE NOT NULL,
  title TEXT NOT NULL,
  note TEXT DEFAULT '',
  remind_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own events" ON calendar_events;
DROP POLICY IF EXISTS "Users can insert own events" ON calendar_events;
DROP POLICY IF EXISTS "Users can update own events" ON calendar_events;
DROP POLICY IF EXISTS "Users can delete own events" ON calendar_events;

CREATE POLICY "Users can view own events"
  ON calendar_events FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events"
  ON calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
  ON calendar_events FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events"
  ON calendar_events FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- MIGRATION: Add restaurant_id to existing tables
-- ============================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS restaurant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS restaurant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE products ADD COLUMN IF NOT EXISTS restaurant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS restaurant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS remind_days INTEGER DEFAULT 0;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS dark_mode BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- ============================================
-- RESTAURANTS TABLE (persist settings)
-- ============================================
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL,
  name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT '€',
  color TEXT NOT NULL DEFAULT '#f97316',
  logo TEXT DEFAULT '',
  table_count INTEGER DEFAULT 0,
  dark_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own restaurants"
  ON restaurants FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own restaurants"
  ON restaurants FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own restaurants"
  ON restaurants FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own restaurants"
  ON restaurants FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 5. STORAGE BUCKET FOR AVATARS
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Anyone can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Users can delete own product images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
  );

INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload logos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'logos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Anyone can view logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'logos');

CREATE POLICY "Users can delete own logos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'logos'
    AND auth.role() = 'authenticated'
  );
