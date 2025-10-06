-- FIXED consume_credits_rpc function for FormMaster (resolves column ambiguity)
CREATE OR REPLACE FUNCTION consume_credits_rpc(
    p_organization_id UUID,
    p_action_type TEXT DEFAULT 'general'
) RETURNS JSON AS $$
DECLARE
    v_org_credits INTEGER;
    v_credits_consumed INTEGER := 1;
    v_remaining_credits INTEGER;
BEGIN
    -- Get organization credits (fully qualified)
    SELECT organizations.credits INTO v_org_credits
    FROM organizations 
    WHERE organizations.id = p_organization_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Organization not found',
            'remaining_credits', 0
        );
    END IF;
    
    -- Set default credits if null
    v_org_credits := COALESCE(v_org_credits, 0);
    
    -- Check if organization has enough credits
    IF v_org_credits < v_credits_consumed THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient credits',
            'remaining_credits', v_org_credits
        );
    END IF;
    
    -- Consume credits
    UPDATE organizations 
    SET credits = v_org_credits - v_credits_consumed,
        updated_at = NOW()
    WHERE organizations.id = p_organization_id;
    
    -- Calculate remaining credits
    v_remaining_credits := v_org_credits - v_credits_consumed;
    
    RETURN json_build_object(
        'success', true,
        'error', null,
        'remaining_credits', v_remaining_credits,
        'credits_consumed', v_credits_consumed,
        'action_type', p_action_type
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;