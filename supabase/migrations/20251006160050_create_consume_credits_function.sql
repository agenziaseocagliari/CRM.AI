-- Create the missing consume_credits_rpc function
-- This function handles credit consumption for various CRM actions

DROP FUNCTION IF EXISTS consume_credits_rpc(UUID, TEXT);

CREATE OR REPLACE FUNCTION consume_credits_rpc(
    p_organization_id UUID,
    p_action_type TEXT
) RETURNS JSON AS $$
DECLARE
    v_credits_cost INTEGER := 1; -- Default cost
    v_current_credits INTEGER;
    v_new_remaining INTEGER;
BEGIN
    -- Get credits cost for the action (fallback to 1 if not found)
    SELECT COALESCE(credits_cost, 1) INTO v_credits_cost
    FROM credit_actions 
    WHERE action_type = p_action_type;
    
    -- Get current credits for organization
    SELECT credits_remaining INTO v_current_credits
    FROM organization_credits 
    WHERE organization_id = p_organization_id;
    
    -- If no record exists, create one with default 100 credits
    IF v_current_credits IS NULL THEN
        INSERT INTO organization_credits (organization_id, credits_remaining, created_at, updated_at)
        VALUES (p_organization_id, 100, NOW(), NOW())
        ON CONFLICT (organization_id) DO NOTHING;
        v_current_credits := 100;
    END IF;
    
    -- Check if sufficient credits
    IF v_current_credits < v_credits_cost THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Crediti insufficienti',
            'remaining_credits', v_current_credits,
            'required_credits', v_credits_cost
        );
    END IF;
    
    -- Consume credits
    v_new_remaining := v_current_credits - v_credits_cost;
    
    UPDATE organization_credits 
    SET credits_remaining = v_new_remaining,
        updated_at = NOW()
    WHERE organization_id = p_organization_id;
    
    -- Log the consumption (if table exists)
    BEGIN
        INSERT INTO credit_consumption_logs (
            organization_id,
            action_type,
            credits_consumed,
            credits_remaining,
            success,
            created_at
        ) VALUES (
            p_organization_id,
            p_action_type,
            v_credits_cost,
            v_new_remaining,
            true,
            NOW()
        );
    EXCEPTION
        WHEN OTHERS THEN
            -- Ignore logging errors, continue with credit consumption
            NULL;
    END;
    
    -- Return success result
    RETURN json_build_object(
        'success', true,
        'credits_consumed', v_credits_cost,
        'remaining_credits', v_new_remaining
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION consume_credits_rpc(UUID, TEXT) TO public;