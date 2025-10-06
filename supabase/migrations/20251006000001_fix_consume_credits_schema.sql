-- Fix: Re-deploy correct consume_credits_rpc function that uses organization_credits table
-- This ensures the function uses the correct schema (organization_credits, not organizations.credits)

-- Drop the existing function first to avoid parameter conflicts
DROP FUNCTION IF EXISTS consume_credits_rpc(UUID, TEXT);
DROP FUNCTION IF EXISTS consume_credits_rpc(UUID, TEXT, INTEGER);

CREATE OR REPLACE FUNCTION consume_credits_rpc(
    p_organization_id UUID,
    p_action_type TEXT
) RETURNS JSON AS $$
DECLARE
    credits_cost INTEGER;
    current_credits INTEGER;
    new_remaining INTEGER;
    result JSON;
BEGIN
    -- Get the cost for this action type
    SELECT credits_cost INTO credits_cost
    FROM credit_actions
    WHERE action_type = p_action_type;
    
    -- If action type doesn't exist, add it with default cost of 1
    IF credits_cost IS NULL THEN
        INSERT INTO credit_actions (action_type, credits_cost, description)
        VALUES (p_action_type, 1, 'Auto-generated action type')
        ON CONFLICT (action_type) DO NOTHING;
        credits_cost := 1;
    END IF;
    
    -- Get current credits for organization FROM CORRECT TABLE
    SELECT credits_remaining INTO current_credits
    FROM organization_credits
    WHERE organization_id = p_organization_id;
    
    -- If organization doesn't have credits entry, create one with default free plan
    IF current_credits IS NULL THEN
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
        current_credits := 100;
    END IF;
    
    -- Check if sufficient credits
    IF current_credits < credits_cost THEN
        result := json_build_object(
            'success', false,
            'error', 'Crediti insufficienti',
            'remaining_credits', current_credits,
            'required_credits', credits_cost
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
            current_credits,
            false,
            'Crediti insufficienti'
        );
        
        RETURN result;
    END IF;
    
    -- Consume credits
    new_remaining := current_credits - credits_cost;
    
    UPDATE organization_credits 
    SET credits_remaining = new_remaining,
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
        credits_cost,
        new_remaining,
        true
    );
    
    result := json_build_object(
        'success', true,
        'remaining_credits', new_remaining,
        'credits_consumed', credits_cost
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Test organization creation removed due to trigger conflicts  
-- Organizations will be created through normal application flow
-- The important fix is the consume_credits_rpc function above
-- This should resolve the Edge Function 500 errors