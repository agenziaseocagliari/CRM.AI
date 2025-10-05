/**
 * GUARDIAN AI CRM - TESTING ENVIRONMENT SETUP
 * Sistema per ambiente di testing con database clone
 * Data: 2025-10-05
 */

-- ===================================================================
-- TESTING ENVIRONMENT DATABASE SETUP
-- ===================================================================

-- Crea schema separato per testing
CREATE SCHEMA IF NOT EXISTS testing;

-- Set search path per testing
SET search_path TO testing, public;

-- ===================================================================
-- 1. CLONE ESSENTIAL TABLES FOR TESTING
-- ===================================================================

-- Clone organizations table
CREATE TABLE IF NOT EXISTS testing.organizations (LIKE public.organizations INCLUDING ALL);

-- Clone vertical account configs
CREATE TABLE IF NOT EXISTS testing.vertical_account_configs (LIKE public.vertical_account_configs INCLUDING ALL);

-- Clone vertical templates
CREATE TABLE IF NOT EXISTS testing.vertical_templates (LIKE public.vertical_templates INCLUDING ALL);

-- Clone vertical custom fields
CREATE TABLE IF NOT EXISTS testing.vertical_custom_fields (LIKE public.vertical_custom_fields INCLUDING ALL);

-- Clone enterprise customizations
CREATE TABLE IF NOT EXISTS testing.enterprise_customizations (LIKE public.enterprise_customizations INCLUDING ALL);

-- Clone profiles for testing users
CREATE TABLE IF NOT EXISTS testing.profiles (LIKE public.profiles INCLUDING ALL);

-- ===================================================================
-- 2. TESTING DATA FIXTURES
-- ===================================================================

-- Insert test organizations
INSERT INTO testing.organizations (id, name, account_type, vertical_config, created_at) VALUES
('00000000-0000-0000-0000-000000000001', 'Test Insurance Agency', 'insurance_agency', '{"test_mode": true}', NOW()),
('00000000-0000-0000-0000-000000000002', 'Test Marketing Agency', 'marketing_agency', '{"test_mode": true}', NOW()),
('00000000-0000-0000-0000-000000000003', 'Test Generic Company', 'generic', '{"test_mode": true}', NOW());

-- Copy vertical configurations from production
INSERT INTO testing.vertical_account_configs 
SELECT * FROM public.vertical_account_configs WHERE is_active = TRUE;

-- Copy templates from production
INSERT INTO testing.vertical_templates 
SELECT * FROM public.vertical_templates WHERE is_active = TRUE;

-- Copy custom fields from production
INSERT INTO testing.vertical_custom_fields 
SELECT * FROM public.vertical_custom_fields WHERE is_active = TRUE;

-- ===================================================================
-- 3. TESTING FUNCTIONS
-- ===================================================================

-- Function to reset testing environment
CREATE OR REPLACE FUNCTION testing.reset_testing_environment()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Clear test data
    DELETE FROM testing.enterprise_customizations;
    DELETE FROM testing.organizations WHERE name LIKE 'Test %';
    
    -- Re-insert test organizations
    INSERT INTO testing.organizations (id, name, account_type, vertical_config, created_at) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Test Insurance Agency', 'insurance_agency', '{"test_mode": true}', NOW()),
    ('00000000-0000-0000-0000-000000000002', 'Test Marketing Agency', 'marketing_agency', '{"test_mode": true}', NOW()),
    ('00000000-0000-0000-0000-000000000003', 'Test Generic Company', 'generic', '{"test_mode": true}', NOW());
    
    RAISE NOTICE 'Testing environment reset completed';
END;
$$;

-- Function to sync production changes to testing
CREATE OR REPLACE FUNCTION testing.sync_from_production()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Sync vertical configs
    DELETE FROM testing.vertical_account_configs;
    INSERT INTO testing.vertical_account_configs 
    SELECT * FROM public.vertical_account_configs WHERE is_active = TRUE;
    
    -- Sync templates
    DELETE FROM testing.vertical_templates;
    INSERT INTO testing.vertical_templates 
    SELECT * FROM public.vertical_templates WHERE is_active = TRUE;
    
    -- Sync custom fields
    DELETE FROM testing.vertical_custom_fields;
    INSERT INTO testing.vertical_custom_fields 
    SELECT * FROM public.vertical_custom_fields WHERE is_active = TRUE;
    
    RAISE NOTICE 'Testing environment synced from production';
END;
$$;

-- Function to create test enterprise customization
CREATE OR REPLACE FUNCTION testing.create_test_enterprise_customization(
    p_organization_id UUID,
    p_customization_name TEXT,
    p_customization_config JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_customization_id UUID;
BEGIN
    INSERT INTO testing.enterprise_customizations (
        organization_id,
        customization_type,
        customization_name,
        customization_config,
        is_active,
        created_by,
        description
    ) VALUES (
        p_organization_id,
        'template',
        p_customization_name,
        p_customization_config,
        TRUE,
        'test-system',
        'Test enterprise customization'
    ) RETURNING id INTO v_customization_id;
    
    RETURN v_customization_id;
END;
$$;

-- ===================================================================
-- 4. TESTING PROCEDURES
-- ===================================================================

-- Test vertical account type assignment
CREATE OR REPLACE FUNCTION testing.test_account_type_assignment()
RETURNS TABLE (
    test_name TEXT,
    organization_id UUID,
    account_type TEXT,
    success BOOLEAN,
    error_message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_test_org_id UUID := '00000000-0000-0000-0000-000000000001';
    v_error_msg TEXT;
BEGIN
    -- Test 1: Set insurance agency account type
    BEGIN
        UPDATE testing.organizations 
        SET account_type = 'insurance_agency'::account_type_enum
        WHERE id = v_test_org_id;
        
        RETURN QUERY SELECT 
            'Set Insurance Account Type'::TEXT,
            v_test_org_id,
            'insurance_agency'::TEXT,
            TRUE,
            NULL::TEXT;
    EXCEPTION WHEN OTHERS THEN
        v_error_msg := SQLERRM;
        RETURN QUERY SELECT 
            'Set Insurance Account Type'::TEXT,
            v_test_org_id,
            'insurance_agency'::TEXT,
            FALSE,
            v_error_msg;
    END;
    
    -- Test 2: Set marketing agency account type
    v_test_org_id := '00000000-0000-0000-0000-000000000002';
    BEGIN
        UPDATE testing.organizations 
        SET account_type = 'marketing_agency'::account_type_enum
        WHERE id = v_test_org_id;
        
        RETURN QUERY SELECT 
            'Set Marketing Account Type'::TEXT,
            v_test_org_id,
            'marketing_agency'::TEXT,
            TRUE,
            NULL::TEXT;
    EXCEPTION WHEN OTHERS THEN
        v_error_msg := SQLERRM;
        RETURN QUERY SELECT 
            'Set Marketing Account Type'::TEXT,
            v_test_org_id,
            'marketing_agency'::TEXT,
            FALSE,
            v_error_msg;
    END;
END;
$$;

-- Test template retrieval
CREATE OR REPLACE FUNCTION testing.test_template_retrieval()
RETURNS TABLE (
    test_name TEXT,
    account_type TEXT,
    template_count BIGINT,
    success BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_count BIGINT;
BEGIN
    -- Test insurance agency templates
    SELECT COUNT(*) INTO v_count
    FROM testing.vertical_templates
    WHERE account_type = 'insurance_agency' AND is_active = TRUE;
    
    RETURN QUERY SELECT 
        'Insurance Agency Templates'::TEXT,
        'insurance_agency'::TEXT,
        v_count,
        (v_count > 0);
    
    -- Test marketing agency templates
    SELECT COUNT(*) INTO v_count
    FROM testing.vertical_templates
    WHERE account_type = 'marketing_agency' AND is_active = TRUE;
    
    RETURN QUERY SELECT 
        'Marketing Agency Templates'::TEXT,
        'marketing_agency'::TEXT,
        v_count,
        (v_count > 0);
END;
$$;

-- Test custom fields retrieval
CREATE OR REPLACE FUNCTION testing.test_custom_fields_retrieval()
RETURNS TABLE (
    test_name TEXT,
    account_type TEXT,
    entity_type TEXT,
    field_count BIGINT,
    success BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_count BIGINT;
BEGIN
    -- Test insurance agency contact fields
    SELECT COUNT(*) INTO v_count
    FROM testing.vertical_custom_fields
    WHERE account_type = 'insurance_agency' 
      AND entity_type = 'contact' 
      AND is_active = TRUE;
    
    RETURN QUERY SELECT 
        'Insurance Contact Fields'::TEXT,
        'insurance_agency'::TEXT,
        'contact'::TEXT,
        v_count,
        (v_count > 0);
    
    -- Test marketing agency opportunity fields
    SELECT COUNT(*) INTO v_count
    FROM testing.vertical_custom_fields
    WHERE account_type = 'marketing_agency' 
      AND entity_type = 'opportunity' 
      AND is_active = TRUE;
    
    RETURN QUERY SELECT 
        'Marketing Opportunity Fields'::TEXT,
        'marketing_agency'::TEXT,
        'opportunity'::TEXT,
        v_count,
        (v_count > 0);
END;
$$;

-- ===================================================================
-- 5. COMPREHENSIVE TEST SUITE
-- ===================================================================

-- Run all tests
CREATE OR REPLACE FUNCTION testing.run_all_tests()
RETURNS TABLE (
    test_category TEXT,
    test_name TEXT,
    status TEXT,
    details JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_start_time TIMESTAMP;
    v_end_time TIMESTAMP;
BEGIN
    v_start_time := NOW();
    
    -- Reset testing environment
    PERFORM testing.reset_testing_environment();
    
    -- Test account type assignments
    RETURN QUERY 
    SELECT 
        'Account Type Assignment'::TEXT,
        aat.test_name,
        CASE WHEN aat.success THEN 'PASSED' ELSE 'FAILED' END,
        jsonb_build_object(
            'organization_id', aat.organization_id,
            'account_type', aat.account_type,
            'error_message', aat.error_message
        )
    FROM testing.test_account_type_assignment() aat;
    
    -- Test template retrieval
    RETURN QUERY
    SELECT 
        'Template Retrieval'::TEXT,
        tr.test_name,
        CASE WHEN tr.success THEN 'PASSED' ELSE 'FAILED' END,
        jsonb_build_object(
            'account_type', tr.account_type,
            'template_count', tr.template_count
        )
    FROM testing.test_template_retrieval() tr;
    
    -- Test custom fields retrieval
    RETURN QUERY
    SELECT 
        'Custom Fields Retrieval'::TEXT,
        cfr.test_name,
        CASE WHEN cfr.success THEN 'PASSED' ELSE 'FAILED' END,
        jsonb_build_object(
            'account_type', cfr.account_type,
            'entity_type', cfr.entity_type,
            'field_count', cfr.field_count
        )
    FROM testing.test_custom_fields_retrieval() cfr;
    
    v_end_time := NOW();
    
    -- Summary
    RETURN QUERY
    SELECT 
        'Test Summary'::TEXT,
        'Execution Time'::TEXT,
        'INFO'::TEXT,
        jsonb_build_object(
            'start_time', v_start_time,
            'end_time', v_end_time,
            'duration_seconds', EXTRACT(EPOCH FROM (v_end_time - v_start_time))
        );
END;
$$;

-- ===================================================================
-- 6. TESTING POLICIES (RLS)
-- ===================================================================

-- Enable RLS on testing tables
ALTER TABLE testing.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE testing.vertical_account_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE testing.vertical_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE testing.vertical_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE testing.enterprise_customizations ENABLE ROW LEVEL SECURITY;

-- Allow all access in testing schema (testing environment)
CREATE POLICY testing_organizations_all ON testing.organizations FOR ALL USING (TRUE);
CREATE POLICY testing_vertical_configs_all ON testing.vertical_account_configs FOR ALL USING (TRUE);
CREATE POLICY testing_templates_all ON testing.vertical_templates FOR ALL USING (TRUE);
CREATE POLICY testing_custom_fields_all ON testing.vertical_custom_fields FOR ALL USING (TRUE);
CREATE POLICY testing_customizations_all ON testing.enterprise_customizations FOR ALL USING (TRUE);

-- ===================================================================
-- 7. TESTING TRIGGERS
-- ===================================================================

-- Trigger to log testing activities
CREATE OR REPLACE FUNCTION testing.log_testing_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO testing.testing_logs (
        table_name,
        operation,
        old_values,
        new_values,
        created_at
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
        NOW()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create testing logs table
CREATE TABLE IF NOT EXISTS testing.testing_logs (
    id BIGSERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add triggers to testing tables
DROP TRIGGER IF EXISTS testing_organizations_log ON testing_organizations;

CREATE TRIGGER testing_organizations_log 
    AFTER INSERT OR UPDATE OR DELETE ON testing.organizations
    FOR EACH ROW EXECUTE FUNCTION testing.log_testing_activity();

DROP TRIGGER IF EXISTS testing_customizations_log ON testing_customizations;

CREATE TRIGGER testing_customizations_log 
    AFTER INSERT OR UPDATE OR DELETE ON testing.enterprise_customizations
    FOR EACH ROW EXECUTE FUNCTION testing.log_testing_activity();

-- ===================================================================
-- 8. DEPLOYMENT SYNC FUNCTIONS
-- ===================================================================

-- Function to promote tested changes to production
CREATE OR REPLACE FUNCTION testing.promote_to_production(
    p_change_type TEXT,
    p_change_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_success BOOLEAN := FALSE;
BEGIN
    -- This would contain logic to safely promote changes
    -- For now, just log the promotion request
    
    INSERT INTO testing.promotion_log (
        change_type,
        change_id,
        promoted_at,
        promoted_by
    ) VALUES (
        p_change_type,
        p_change_id,
        NOW(),
        current_user
    );
    
    v_success := TRUE;
    
    RETURN v_success;
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Promotion log table
CREATE TABLE IF NOT EXISTS testing.promotion_log (
    id BIGSERIAL PRIMARY KEY,
    change_type TEXT NOT NULL,
    change_id UUID NOT NULL,
    promoted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    promoted_by TEXT DEFAULT current_user,
    status TEXT DEFAULT 'pending'
);

-- ===================================================================
-- COMPLETION COMMENTS
-- ===================================================================

COMMENT ON SCHEMA testing IS 'Isolated testing environment for vertical account types system';
COMMENT ON FUNCTION testing.reset_testing_environment IS 'Resets testing environment to clean state';
COMMENT ON FUNCTION testing.sync_from_production IS 'Syncs latest production configurations to testing';
COMMENT ON FUNCTION testing.run_all_tests IS 'Comprehensive test suite for vertical account system';

-- Success notification
DO $$
BEGIN
    RAISE NOTICE 'TESTING ENVIRONMENT SETUP COMPLETED!';
    RAISE NOTICE 'Available functions:';
    RAISE NOTICE '- testing.reset_testing_environment()';
    RAISE NOTICE '- testing.sync_from_production()';
    RAISE NOTICE '- testing.run_all_tests()';
    RAISE NOTICE 'Test organizations created with IDs: 001, 002, 003';
END $$;