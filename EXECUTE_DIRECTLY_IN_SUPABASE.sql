-- ================================================================
-- EXECUTE THIS DIRECTLY IN SUPABASE STUDIO SQL EDITOR
-- Project: qjtaqrlpronohgpfdxsi
-- URL: https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi/sql
-- ================================================================

-- Drop all existing versions of the function
DROP FUNCTION IF EXISTS consume_credits_rpc(UUID, TEXT);
DROP FUNCTION IF EXISTS consume_credits_rpc(p_organization_id UUID, p_action_type TEXT);

-- Create the corrected consume_credits_rpc function
CREATE OR REPLACE FUNCTION consume_credits_rpc(
    p_organization_id UUID,
    p_action_type TEXT
) RETURNS JSON AS $$
DECLARE
    v_credits_cost INTEGER;
    v_current_credits INTEGER;
    v_new_remaining INTEGER;
    v_result JSON;
BEGIN
    -- STEP 1: Get credits cost for the action
    SELECT credits_cost INTO v_credits_cost
    FROM credit_actions 
    WHERE action_type = p_action_type;
    
    IF v_credits_cost IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Tipo di azione non riconosciuto'
        );
    END IF;
    
    -- STEP 2: Get current credits for organization
    SELECT credits_remaining INTO v_current_credits
    FROM organization_credits 
    WHERE organization_id = p_organization_id;
    
    -- If no record exists, create one with default 100 credits
    IF v_current_credits IS NULL THEN
        INSERT INTO organization_credits (organization_id, credits_remaining)
        VALUES (p_organization_id, 100)
        ON CONFLICT (organization_id) DO NOTHING;
        v_current_credits := 100;
    END IF;
    
    -- STEP 3: Check if sufficient credits
    IF v_current_credits < v_credits_cost THEN
        v_result := json_build_object(
            'success', false,
            'error', 'Crediti insufficienti',
            'remaining_credits', v_current_credits,
            'required_credits', v_credits_cost
        );
        
        -- Log failed attempt
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
    
    -- STEP 4: Consume credits
    v_new_remaining := v_current_credits - v_credits_cost;
    
    UPDATE organization_credits 
    SET credits_remaining = v_new_remaining,
        updated_at = NOW()
    WHERE organization_id = p_organization_id;
    
    -- STEP 5: Log successful consumption
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
    
    -- STEP 6: Return success result
    v_result := json_build_object(
        'success', true,
        'credits_consumed', v_credits_cost,
        'remaining_credits', v_new_remaining
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION consume_credits_rpc(UUID, TEXT) TO public;

-- Test the function works
SELECT consume_credits_rpc('a4a71877-bddf-44ee-9f3a-c3c36c53c24e'::UUID, 'form_generation');