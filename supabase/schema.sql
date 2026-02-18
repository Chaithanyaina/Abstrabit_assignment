-- Database Setup for Smart Bookmark App
-- Run this in your Supabase SQL Editor

-- 1. Tables
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Optimization for Realtime
ALTER TABLE bookmarks REPLICA IDENTITY FULL;

-- 2. Security (RLS)
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Select policy
DROP POLICY IF EXISTS "Users can view own bookmarks" ON bookmarks;
CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

-- Insert policy
DROP POLICY IF EXISTS "Users can insert own bookmarks" ON bookmarks;
CREATE POLICY "Users can insert own bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Delete policy
DROP POLICY IF EXISTS "Users can delete own bookmarks" ON bookmarks;
CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Enable Realtime
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'bookmarks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;
  END IF;
END $$;
