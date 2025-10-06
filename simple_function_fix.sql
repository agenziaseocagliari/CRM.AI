-- Simple function creation script
CREATE OR REPLACE FUNCTION consume_credits_rpc(
    p_organization_id UUID,
    p_action_type TEXT
) RETURNS JSON AS $$
DECLARE
    v_credits_cost INTEGER := 1;
    v_current_credits INTEGER;
    v_new_remaining INTEGER;
BEGIN
    -- Get current credits
    SELECT credits_remaining INTO v_current_credits
    FROM organization_credits 
    WHERE organization_id = p_organization_id;
    
    -- Create record if doesn't exist
    IF v_current_credits IS NULL THEN
        INSERT INTO organization_credits (organization_id, credits_remaining)
        VALUES (p_organization_id, 100)
        ON CONFLICT (organization_id) DO NOTHING;
        v_current_credits := 100;
    END IF;
    
    -- Check sufficient credits
    IF v_current_credits < v_credits_cost THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Crediti insufficienti'
        );
    END IF;
    
    -- Consume credits
    v_new_remaining := v_current_credits - v_credits_cost;
    
    UPDATE organization_credits 
    SET credits_remaining = v_new_remaining
    WHERE organization_id = p_organization_id;
    
    -- Return success
    RETURN json_build_object(
        'success', true,
        'remaining_credits', v_new_remaining
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION consume_credits_rpc(UUID, TEXT) TO public;