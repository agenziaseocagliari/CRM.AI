-- Test: Check if organization exists and create if needed for testing
-- This migration creates a test organization for development testing

-- First check if the test organization exists
DO $$ 
BEGIN
    -- Create test organization if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = '00000000-0000-4000-8000-000000000001') THEN
        INSERT INTO organizations (
            id,
            name,
            plan,
            created_at,
            updated_at
        ) VALUES (
            '00000000-0000-4000-8000-000000000001',
            'Test Organization',
            'free',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created test organization with ID: 00000000-0000-4000-8000-000000000001';
    ELSE
        RAISE NOTICE 'Test organization already exists';
    END IF;
END $$;