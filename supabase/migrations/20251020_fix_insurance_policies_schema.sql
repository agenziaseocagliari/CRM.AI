-- =================================
-- MIGRATION: Fix insurance_policies schema relationships
-- Purpose: Ensure proper foreign key constraints and schema cache refresh
-- Date: 2025-10-20
-- Author: Claude Sonnet 4.5
-- Issue: "Could not find a relationship between 'insurance_policies' and 'profiles' in the schema cache"
-- =================================

-- 1. Verify and create missing foreign key constraints (idempotent)
-- ===================================================================

-- Check if contact_id FK exists, create if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_insurance_policies_contact' 
        AND table_name = 'insurance_policies'
    ) THEN
        ALTER TABLE insurance_policies
        ADD CONSTRAINT fk_insurance_policies_contact
        FOREIGN KEY (contact_id) 
        REFERENCES contacts(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Created FK: insurance_policies.contact_id → contacts.id';
    ELSE
        RAISE NOTICE 'FK already exists: insurance_policies.contact_id → contacts.id';
    END IF;
END $$;

-- Check if organization_id FK exists, create if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_insurance_policies_organization' 
        AND table_name = 'insurance_policies'
    ) THEN
        ALTER TABLE insurance_policies
        ADD CONSTRAINT fk_insurance_policies_organization
        FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Created FK: insurance_policies.organization_id → organizations.id';
    ELSE
        RAISE NOTICE 'FK already exists: insurance_policies.organization_id → organizations.id';
    END IF;
END $$;

-- Check if created_by FK to profiles exists (optional, may be null)
DO $$
BEGIN
    -- First verify the column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'insurance_policies' 
        AND column_name = 'created_by'
    ) THEN
        -- Then check if FK exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_insurance_policies_created_by' 
            AND table_name = 'insurance_policies'
        ) THEN
            ALTER TABLE insurance_policies
            ADD CONSTRAINT fk_insurance_policies_created_by
            FOREIGN KEY (created_by) 
            REFERENCES profiles(id) 
            ON DELETE SET NULL;
            
            RAISE NOTICE 'Created FK: insurance_policies.created_by → profiles.id';
        ELSE
            RAISE NOTICE 'FK already exists: insurance_policies.created_by → profiles.id';
        END IF;
    ELSE
        RAISE NOTICE 'Column created_by does not exist in insurance_policies, skipping FK creation';
    END IF;
END $$;

-- 2. Create helpful indexes for performance (idempotent)
-- ========================================================

CREATE INDEX IF NOT EXISTS idx_insurance_policies_contact_id 
ON insurance_policies(contact_id);

CREATE INDEX IF NOT EXISTS idx_insurance_policies_organization_id 
ON insurance_policies(organization_id);

CREATE INDEX IF NOT EXISTS idx_insurance_policies_created_by 
ON insurance_policies(created_by) 
WHERE created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_insurance_policies_status_end_date 
ON insurance_policies(status, end_date);

-- 3. Verify relationships are properly defined
-- ==============================================

-- This query should return all FK relationships for insurance_policies
DO $$
DECLARE
    fk_record RECORD;
BEGIN
    RAISE NOTICE '=== Foreign Key Relationships for insurance_policies ===';
    
    FOR fk_record IN
        SELECT
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = 'insurance_policies'
        ORDER BY tc.constraint_name
    LOOP
        RAISE NOTICE 'FK: %.% → %.%', 
            'insurance_policies', 
            fk_record.column_name,
            fk_record.foreign_table_name,
            fk_record.foreign_column_name;
    END LOOP;
END $$;

-- 4. Force PostgREST schema cache reload
-- =======================================
-- Note: The actual cache reload happens via NOTIFY in the deploy script
-- This is a marker for the deploy script to trigger cache reload

COMMENT ON TABLE insurance_policies IS 'Insurance policies table with FK constraints to contacts, organizations, and profiles. Schema updated: 2025-10-20';

-- Add helpful documentation
COMMENT ON CONSTRAINT fk_insurance_policies_contact ON insurance_policies IS 'Links policy to contact (policyholder)';
COMMENT ON CONSTRAINT fk_insurance_policies_organization ON insurance_policies IS 'Links policy to organization (multi-tenancy)';

-- Verify view dependencies
COMMENT ON VIEW renewal_reminders IS 'View depends on insurance_policies → contacts FK. Updated: 2025-10-20';

-- Success marker
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 20251020_fix_insurance_policies_schema completed successfully';
    RAISE NOTICE '⚠️  Remember to reload PostgREST schema cache after deployment';
END $$;
