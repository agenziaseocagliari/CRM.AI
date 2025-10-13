-- Add missing columns to profiles table for booking functionality
-- This migration ensures all required fields exist for the booking settings
-- Updated timestamp to run after existing migrations

-- Check if profiles table exists, if not create it
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (id)
);

-- Add missing columns with IF NOT EXISTS to avoid conflicts
ALTER TABLE profiles 
    ADD COLUMN IF NOT EXISTS full_name TEXT,
    ADD COLUMN IF NOT EXISTS job_title TEXT,
    ADD COLUMN IF NOT EXISTS company TEXT,
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS username TEXT,
    ADD COLUMN IF NOT EXISTS default_duration INTEGER DEFAULT 30,
    ADD COLUMN IF NOT EXISTS buffer_before INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS buffer_after INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS days_ahead INTEGER DEFAULT 30,
    ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'Consulenza Strategica',
    ADD COLUMN IF NOT EXISTS meeting_type TEXT DEFAULT 'Video chiamata';

-- Ensure updated_at column exists
ALTER TABLE profiles 
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create or replace the function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
-- Policy for users to select their own profile
CREATE POLICY IF NOT EXISTS "Users can view their own profile"
ON profiles FOR SELECT
TO public
USING (auth.uid() = id);

-- Policy for users to insert their own profile
CREATE POLICY IF NOT EXISTS "Users can insert their own profile"
ON profiles FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

-- Policy for users to update their own profile
CREATE POLICY IF NOT EXISTS "Users can update their own profile"
ON profiles FOR UPDATE
TO public
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy for users to delete their own profile
CREATE POLICY IF NOT EXISTS "Users can delete their own profile"
ON profiles FOR DELETE
TO public
USING (auth.uid() = id);

-- Create unique constraint on username if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_username_unique' 
        AND conrelid = 'profiles'::regclass
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);
    END IF;
END $$;

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles (username);

-- Create index on full_name for search
CREATE INDEX IF NOT EXISTS profiles_full_name_idx ON profiles (full_name);

COMMENT ON TABLE profiles IS 'User profiles with booking settings and personal information';
COMMENT ON COLUMN profiles.username IS 'Unique username for booking URL (e.g., /book/username)';
COMMENT ON COLUMN profiles.default_duration IS 'Default meeting duration in minutes';
COMMENT ON COLUMN profiles.buffer_before IS 'Buffer time before meeting in minutes';
COMMENT ON COLUMN profiles.buffer_after IS 'Buffer time after meeting in minutes';
COMMENT ON COLUMN profiles.days_ahead IS 'How many days ahead users can book';