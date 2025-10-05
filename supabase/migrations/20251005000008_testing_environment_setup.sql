/**
 * GUARDIAN AI CRM - TESTING ENVIRONMENT SETUP
 * Sistema per ambiente di testing con database clone
 * Data: 2025-10-05
 */

-- TEMPORARY SKIP: This testing file requires account_type column which may not exist in production
-- Completely disabled until account_type column migration is verified in production database
-- To re-enable: uncomment the actual testing code and ensure dependencies are met

-- Simple success notice to avoid empty migration error
DO $$ BEGIN
    RAISE NOTICE 'Testing environment setup temporarily disabled - pending account_type column verification';
END $$;