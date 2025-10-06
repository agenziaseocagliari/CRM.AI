-- EXECUTE THIS IN SUPABASE STUDIO SQL EDITOR
-- This fixes the FormMaster "Errore di rete nella verifica dei crediti" error
-- by adding the missing consume_credits_rpc function

-- 1. Add missing consume_credits_rpc function
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
    
    -- Get current credits for organization
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

-- 2. Add missing action types that are used by the AI agents
INSERT INTO credit_actions (action_type, credits_cost, description) VALUES
    ('ai_form_generation', 3, 'AI form generation via FormMaster'),
    ('ai_email_generation', 3, 'AI email content generation via EmailGenius'),
    ('ai_whatsapp_generation', 2, 'AI WhatsApp message generation via WhatsAppButler'),
    ('ai_calendar_optimization', 4, 'AI calendar optimization via CalendarWizard'),
    ('ai_analytics_insights', 5, 'AI analytics insights via AnalyticsOracle'),
    ('ai_lead_scoring', 3, 'AI lead scoring via LeadScorer')
ON CONFLICT (action_type) DO NOTHING;

-- 3. Grant execute permission to the service role
GRANT EXECUTE ON FUNCTION consume_credits_rpc TO service_role;

-- 4. Test the function (optional - run this to verify it works)
-- SELECT consume_credits_rpc('550e8400-e29b-41d4-a716-446655440000'::UUID, 'ai_form_generation');

SELECT 'FormMaster RPC function fix applied successfully!' as status;