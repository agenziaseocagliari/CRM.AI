-- Debug script to check profiles table schema and data
-- Run this in Supabase SQL Editor to verify the table structure

-- Check if profiles table exists and show its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check RLS policies on profiles table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- Check if profiles table has any data
SELECT 
    id,
    full_name,
    job_title,
    company,
    username,
    created_at,
    updated_at
FROM profiles
LIMIT 10;

-- Check auth.users table to see if users exist
SELECT 
    id,
    email,
    created_at
FROM auth.users
LIMIT 5;

-- Check for any constraints on profiles table
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'profiles';