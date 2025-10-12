-- PHASE 4.1 TASK 1: Database Schema Analysis for Contact Import System
-- Generated: October 12, 2025

-- ===== PHASE 1: CURRENT STATE ANALYSIS =====

-- Check if contacts table exists and get structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE
    table_name = 'contacts'
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if profiles table exists and structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE
    table_name = 'profiles'
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if organizations table exists and structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE
    table_name = 'organizations'
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check for any existing import-related tables
SELECT table_name, table_type
FROM information_schema.tables
WHERE
    table_schema = 'public'
    AND (
        table_name LIKE '%import%'
        OR table_name LIKE '%contact%'
    )
ORDER BY table_name;

-- Check RLS status on contacts table
SELECT
    schemaname,
    tablename,
    rowsecurity,
    enablerls
FROM pg_tables
WHERE
    tablename IN (
        'contacts',
        'profiles',
        'organizations'
    )
    AND schemaname = 'public';

-- Get row counts for existing tables
SELECT 'contacts' as table_name, count(*) as row_count
FROM contacts
UNION ALL
SELECT 'profiles' as table_name, count(*) as row_count
FROM profiles
UNION ALL
SELECT 'organizations' as table_name, count(*) as row_count
FROM organizations;