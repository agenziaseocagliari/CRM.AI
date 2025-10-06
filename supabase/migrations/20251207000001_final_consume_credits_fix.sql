-- FINAL FIX: Resolve all consume_credits_rpc issues definitively
-- This migration has timestamp 2025-12-07 to ensure it runs AFTER all other migrations
-- ROOT CAUSE: Migration 20250123000010 was overriding our fix due to later timestamp

-- 1. COMPLETELY DROP ALL EXISTING VERSIONS
DROP FUNCTION IF EXISTS consume_credits_rpc(UUID, TEXT);
DROP FUNCTION IF EXISTS consume_credits_rpc(UUID, TEXT, INTEGER);
DROP FUNCTION IF EXISTS consume_credits_rpc CASCADE;

-- 2. CREATE THE DEFINITIVE, CORRECT VERSION
-- Fixed all column ambiguity issues by using unique variable names
CREATE OR REPLACE FUNCTION consume_credits_rpc(
    p_organization_id UUID,
    p_action_type TEXT
) RETURNS JSON AS $$
DECLARE
    v_credits_cost INTEGER;           -- Prefixed with v_ to avoid column conflicts
    v_current_credits INTEGER;        -- Prefixed with v_ to avoid column conflicts  
    v_new_remaining INTEGER;          -- Prefixed with v_ to avoid column conflicts
    v_result JSON;                    -- Prefixed with v_ to avoid column conflicts
BEGIN
    -- Get the cost for this action type from credit_actions table
    SELECT credits_cost INTO v_credits_cost
    FROM credit_actions
    WHERE action_type = p_action_type;
    
    -- If action type doesn't exist, add it with default cost of 1
    IF v_credits_cost IS NULL THEN
        INSERT INTO credit_actions (action_type, credits_cost, description)
        VALUES (p_action_type, 1, 'Auto-generated action type')
        ON CONFLICT (action_type) DO NOTHING;
        v_credits_cost := 1;
    END IF;
    
    -- Get current credits for organization FROM CORRECT TABLE (organization_credits)
    SELECT credits_remaining INTO v_current_credits
    FROM organization_credits
    WHERE organization_id = p_organization_id;
    
    -- If organization doesn't have credits entry, create one with default free plan
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
    
    -- Check if sufficient credits
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
    
    -- Consume credits
    v_new_remaining := v_current_credits - v_credits_cost;
    
    UPDATE organization_credits 
    SET credits_remaining = v_new_remaining,
        updated_at = NOW()
    WHERE organization_id = p_organization_id;
    
    -- Log successful consumption
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
    
    v_result := json_build_object(
        'success', true,
        'remaining_credits', v_new_remaining,
        'credits_consumed', v_credits_cost
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ADDITIONAL SAFETY CHECKS
-- Ensure the credit_actions table has the required basic action types
INSERT INTO credit_actions (action_type, credits_cost, description) VALUES
    ('form_generation', 1, 'AI Form Generation'),
    ('ai_chat', 1, 'AI Chat Interaction'),
    ('data_export', 5, 'Data Export Operation'),
    ('report_generation', 3, 'Report Generation')
ON CONFLICT (action_type) DO NOTHING;

-- 4. COMMENT EXPLAINING THE FIX
COMMENT ON FUNCTION consume_credits_rpc(UUID, TEXT) IS 
'FINAL VERSION - Fixed column ambiguity by prefixing all variables with v_. 
Migration timestamp 2025-12-07 ensures this runs after all other migrations.
All variables now have unique names that cannot conflict with table columns.';