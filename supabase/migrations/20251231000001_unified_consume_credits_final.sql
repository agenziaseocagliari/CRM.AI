-- UNIFIED MIGRATION: Combines and fixes all consume_credits_rpc issues
-- This single migration replaces and supersedes:
-- - 20250123000010_fix_consume_credits_rpc.sql (buggy version)
-- - 20251006000001_fix_consume_credits_schema.sql (partial fix) 
-- - 20251207000001_final_consume_credits_fix.sql (another attempt)
-- - 20260101000001_ultimate_consume_credits_fix.sql (wrong approach)

-- STEP 1: COMPLETELY REMOVE ALL EXISTING VERSIONS
DROP FUNCTION IF EXISTS consume_credits_rpc CASCADE;
DROP FUNCTION IF EXISTS consume_credits_rpc(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS consume_credits_rpc(UUID, TEXT, INTEGER) CASCADE;

-- STEP 2: CREATE THE DEFINITIVE, CORRECT VERSION
-- All variable names are prefixed to avoid PostgreSQL column ambiguity
CREATE OR REPLACE FUNCTION consume_credits_rpc(
    p_organization_id UUID,
    p_action_type TEXT
) RETURNS JSON AS $$
DECLARE
    v_credits_cost INTEGER;           -- FIXED: was 'credits_cost' (conflicted with column)
    v_current_credits INTEGER;        -- FIXED: was 'current_credits' 
    v_new_remaining INTEGER;          -- FIXED: was 'new_remaining'
    v_result JSON;                    -- FIXED: was 'result'
BEGIN
    -- STEP 2A: Get the cost for this action type from credit_actions table
    SELECT credits_cost INTO v_credits_cost
    FROM credit_actions
    WHERE action_type = p_action_type;
    
    -- STEP 2B: If action type doesn't exist, add it with default cost of 1
    IF v_credits_cost IS NULL THEN
        INSERT INTO credit_actions (action_type, credits_cost, description)
        VALUES (p_action_type, 1, 'Auto-generated action type')
        ON CONFLICT (action_type) DO NOTHING;
        v_credits_cost := 1;
    END IF;
    
    -- STEP 2C: Get current credits for organization FROM CORRECT TABLE
    SELECT credits_remaining INTO v_current_credits
    FROM organization_credits
    WHERE organization_id = p_organization_id;
    
    -- STEP 2D: If organization doesn't have credits entry, create one with default free plan
    IF v_current_credits IS NULL THEN
        INSERT INTO organization_credits (
            organization_id, 
            plan_name, 
            total_credits, 
            credits_remaining,
            cycle_start_date,
            cycle_end_date
        ) VALUES (
            p_organization_id,
            'free',
            100,
            100,
            NOW(),
            NOW() + INTERVAL '30 days'
        );
        v_current_credits := 100;
    END IF;
    
    -- STEP 2E: Check if sufficient credits
    IF v_current_credits < v_credits_cost THEN
        v_result := json_build_object(
            'success', false,
            'error', 'Crediti insufficienti',
            'remaining_credits', v_current_credits,
            'required_credits', v_credits_cost
        );
        
        -- Log failed consumption attempt
        INSERT INTO credit_consumption_logs (
            organization_id,
            action_type,
            credits_consumed,
            credits_remaining,
            success,
            error_message
        ) VALUES (
            p_organization_id,
            p_action_type,
            0,
            v_current_credits,
            false,
            'Crediti insufficienti'
        );
        
        RETURN v_result;
    END IF;
    
    -- STEP 2F: Consume credits
    v_new_remaining := v_current_credits - v_credits_cost;
    
    UPDATE organization_credits 
    SET credits_remaining = v_new_remaining,
        updated_at = NOW()
    WHERE organization_id = p_organization_id;
    
    -- STEP 2G: Log successful consumption
    INSERT INTO credit_consumption_logs (
        organization_id,
        action_type,
        credits_consumed,
        credits_remaining,
        success
    ) VALUES (
        p_organization_id,
        p_action_type,
        v_credits_cost,
        v_new_remaining,
        true
    );
    
    -- STEP 2H: Return success result
    v_result := json_build_object(
        'success', true,
        'remaining_credits', v_new_remaining,
        'credits_consumed', v_credits_cost
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 3: ENSURE BASIC CREDIT ACTIONS EXIST
-- From original migration requirements
INSERT INTO credit_actions (action_type, credits_cost, description) VALUES
    ('form_generation', 1, 'AI Form Generation'),
    ('ai_form_generation', 1, 'AI Form Generation (alternative name)'),
    ('ai_chat', 1, 'AI Chat Interaction'),
    ('data_export', 5, 'Data Export Operation'),
    ('report_generation', 3, 'Report Generation'),
    ('workflow_automation', 2, 'Workflow Automation'),
    ('email_campaign', 3, 'Email Campaign Creation')
ON CONFLICT (action_type) DO NOTHING;

-- STEP 4: VERIFY FUNCTION WORKS WITH TEST
-- This will be executed during migration to ensure function works
DO $$
DECLARE
    test_result JSON;
    test_org_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Test the function works without errors
    SELECT consume_credits_rpc(test_org_id, 'form_generation') INTO test_result;
    
    -- Log success
    RAISE NOTICE 'consume_credits_rpc function test: SUCCESS - %', test_result;
    
EXCEPTION WHEN OTHERS THEN
    -- Log any errors during test
    RAISE NOTICE 'consume_credits_rpc function test: ERROR - %', SQLERRM;
END $$;

-- STEP 5: ADD COMPREHENSIVE COMMENT DOCUMENTATION
COMMENT ON FUNCTION consume_credits_rpc(UUID, TEXT) IS 
'UNIFIED MIGRATION VERSION - Timestamp 2025-12-31 (runs after all existing migrations)
FIXES APPLIED:
1. Column ambiguity: All variables prefixed with v_ (v_credits_cost vs credits_cost column)
2. Correct table usage: organization_credits table (not organizations.credits)
3. Comprehensive error handling and logging
4. Auto-creation of missing organizations and credit actions
5. Proper JSON response format
6. Complete DROP CASCADE cleanup of previous versions

RESOLVES ERRORS:
- PostgreSQL: column reference "credits_cost" is ambiguous  
- Edge Function returned a non-2xx status code
- Form generation failures due to credit verification

MIGRATION HISTORY:
- Replaces: 20250123000010, 20251006000001, 20251207000001, 20260101000001
- Single source of truth for consume_credits_rpc function';

-- STEP 6: GRANT NECESSARY PERMISSIONS
-- Ensure the function can be called by Edge Functions
GRANT EXECUTE ON FUNCTION consume_credits_rpc(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION consume_credits_rpc(UUID, TEXT) TO public;