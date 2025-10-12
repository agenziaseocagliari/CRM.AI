-- =========================================================
-- TRIAL SYSTEM OPTIMIZATION: 30 → 14 DAYS
-- Business Justification: Industry standard, cost optimization, conversion improvement
-- Date: October 12, 2025
-- =========================================================

-- =========================================================
-- 1. Create initialize_trial_user Function (14-day trial)
-- =========================================================
CREATE OR REPLACE FUNCTION initialize_trial_user(
    p_organization_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_trial_end TIMESTAMPTZ;
    v_existing_credits INTEGER;
BEGIN
    -- Calculate 14-day trial end (industry standard)
    v_trial_end := NOW() + INTERVAL '14 days';
    
    -- Check if organization already has credits
    SELECT credits_remaining INTO v_existing_credits
    FROM organization_credits
    WHERE organization_id = p_organization_id;
    
    IF v_existing_credits IS NULL THEN
        -- Create new trial entry
        INSERT INTO organization_credits (
            organization_id,
            plan_name,
            is_trial,
            cycle_start_date,
            cycle_end_date,
            -- Multi-credit trial allocation (14-day optimized amounts)
            ai_credits_available,
            ai_credits_total,
            whatsapp_credits_available,
            whatsapp_credits_total,
            email_credits_available,
            email_credits_total,
            sms_credits_available,
            sms_credits_total,
            -- Backward compatibility
            credits_remaining,
            total_credits,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            p_organization_id,
            'trial_14',                  -- Updated plan name
            true,
            NOW(),
            v_trial_end,
            50,                          -- AI: 50 (adequate for testing, was 100 generic)
            50,
            25,                          -- WhatsApp: 25 (sufficient for messaging tests)
            25,
            200,                         -- Email: 200 (generous, email is low cost)
            200,
            5,                           -- SMS: 5 (limited, SMS is expensive)
            5,
            50,                          -- Backward compatibility
            50,
            true,
            NOW(),
            NOW()
        );
    ELSE
        -- Update existing organization to trial
        UPDATE organization_credits
        SET
            is_trial = true,
            plan_name = 'trial_14',
            cycle_end_date = v_trial_end,
            -- Multi-credit trial allocation
            ai_credits_available = 50,
            ai_credits_total = 50,
            whatsapp_credits_available = 25,
            whatsapp_credits_total = 25,
            email_credits_available = 200,
            email_credits_total = 200,
            sms_credits_available = 5,
            sms_credits_total = 5,
            -- Backward compatibility
            credits_remaining = GREATEST(credits_remaining, 50),
            total_credits = GREATEST(total_credits, 50),
            is_active = true,
            updated_at = NOW()
        WHERE organization_id = p_organization_id;
    END IF;
    
    -- Log trial activation
    INSERT INTO credit_consumption_logs (
        organization_id,
        action_type,
        ai_credits_consumed,
        whatsapp_credits_consumed,
        email_credits_consumed,
        sms_credits_consumed,
        credits_consumed,
        success,
        metadata,
        created_at
    ) VALUES (
        p_organization_id,
        'trial_activation_14day',
        0,
        0,
        0,
        0,
        0,
        true,
        json_build_object(
            'trial_duration', '14 days',
            'trial_type', 'multi_credit',
            'credits_allocated', json_build_object(
                'ai', 50,
                'whatsapp', 25,
                'email', 200,
                'sms', 5
            )
        ),
        NOW()
    );
    
    RETURN json_build_object(
        'success', true,
        'trial_duration_days', 14,
        'trial_ends_at', v_trial_end,
        'plan_name', 'trial_14',
        'credits_allocated', json_build_object(
            'ai', 50,
            'whatsapp', 25,
            'email', 200,
            'sms', 5
        ),
        'business_rationale', json_build_object(
            'duration_reason', 'Industry standard (Slack, Notion, etc.)',
            'cost_optimization', 'Reduces trial costs by 53%',
            'conversion_expectation', '+10-15% based on industry data'
        )
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION initialize_trial_user TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_trial_user TO service_role;

-- =========================================================
-- 2. Update consume_credits_rpc with 14-day trial check
-- =========================================================
CREATE OR REPLACE FUNCTION consume_credits_rpc(
    p_organization_id UUID,
    p_action_type TEXT,
    p_quantity INTEGER DEFAULT 1
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_action RECORD;
    v_org_credits RECORD;
    v_ai_required INTEGER;
    v_wa_required INTEGER;
    v_email_required INTEGER;
    v_sms_required INTEGER;
    v_generic_required INTEGER;
    v_ai_remaining INTEGER;
    v_wa_remaining INTEGER;
    v_email_remaining INTEGER;
    v_sms_remaining INTEGER;
    v_generic_remaining INTEGER;
    v_result JSON;
BEGIN
    -- Get action requirements
    SELECT * INTO v_action
    FROM credit_actions
    WHERE action_type = p_action_type;
    
    -- If action not found, create with default values
    IF NOT FOUND THEN
        INSERT INTO credit_actions (
            action_type, 
            credits_cost,
            ai_credits_required,
            whatsapp_credits_required,
            email_credits_required,
            sms_credits_required,
            description
        ) VALUES (
            p_action_type,
            1,                          -- Generic fallback
            CASE 
                WHEN p_action_type LIKE '%ai%' THEN 1
                ELSE 0
            END,
            CASE 
                WHEN p_action_type LIKE '%whatsapp%' OR p_action_type LIKE '%wa%' THEN 1
                ELSE 0
            END,
            CASE 
                WHEN p_action_type LIKE '%email%' THEN 1
                ELSE 0
            END,
            CASE 
                WHEN p_action_type LIKE '%sms%' THEN 1
                ELSE 0
            END,
            'Auto-generated action type'
        ) RETURNING * INTO v_action;
    END IF;
    
    -- Get and lock org credits
    SELECT * INTO v_org_credits
    FROM organization_credits
    WHERE organization_id = p_organization_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        -- Auto-initialize trial for new organization
        SELECT initialize_trial_user(p_organization_id) INTO v_result;
        
        -- Re-fetch after initialization
        SELECT * INTO v_org_credits
        FROM organization_credits
        WHERE organization_id = p_organization_id;
    END IF;
    
    -- ✅ CRITICAL: 14-day trial expiry check
    IF v_org_credits.is_trial = true AND v_org_credits.cycle_end_date < NOW() THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Trial period expired',
            'error_code', 'TRIAL_EXPIRED',
            'trial_ended_at', v_org_credits.cycle_end_date,
            'trial_duration', '14 days',
            'trial_type', 'multi_credit',
            'message', 'Your 14-day trial has ended. Upgrade to continue using the service.',
            'action_required', 'Please upgrade to a paid plan to continue',
            'upgrade_url', '/pricing',
            'benefits', json_build_object(
                'unlimited_ai', 'Unlimited AI credits',
                'unlimited_messaging', 'Unlimited WhatsApp & SMS',
                'premium_features', 'Advanced automation & analytics'
            )
        );
    END IF;
    
    -- Calculate requirements based on quantity
    v_ai_required := COALESCE(v_action.ai_credits_required, 0) * p_quantity;
    v_wa_required := COALESCE(v_action.whatsapp_credits_required, 0) * p_quantity;
    v_email_required := COALESCE(v_action.email_credits_required, 0) * p_quantity;
    v_sms_required := COALESCE(v_action.sms_credits_required, 0) * p_quantity;
    v_generic_required := COALESCE(v_action.credits_cost, 0) * p_quantity;
    
    -- Check sufficient credits for each type
    IF v_ai_required > 0 AND COALESCE(v_org_credits.ai_credits_available, 0) < v_ai_required THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient AI credits',
            'error_code', 'INSUFFICIENT_AI_CREDITS',
            'required', v_ai_required,
            'available', COALESCE(v_org_credits.ai_credits_available, 0),
            'credit_type', 'ai',
            'upgrade_url', '/pricing',
            'trial_info', CASE 
                WHEN v_org_credits.is_trial THEN json_build_object(
                    'is_trial', true,
                    'days_remaining', EXTRACT(days FROM (v_org_credits.cycle_end_date - NOW()))
                )
                ELSE json_build_object('is_trial', false)
            END
        );
    END IF;
    
    IF v_wa_required > 0 AND COALESCE(v_org_credits.whatsapp_credits_available, 0) < v_wa_required THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient WhatsApp credits',
            'error_code', 'INSUFFICIENT_WHATSAPP_CREDITS',
            'required', v_wa_required,
            'available', COALESCE(v_org_credits.whatsapp_credits_available, 0),
            'credit_type', 'whatsapp',
            'upgrade_url', '/pricing'
        );
    END IF;
    
    IF v_email_required > 0 AND COALESCE(v_org_credits.email_credits_available, 0) < v_email_required THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient Email credits',
            'error_code', 'INSUFFICIENT_EMAIL_CREDITS',
            'required', v_email_required,
            'available', COALESCE(v_org_credits.email_credits_available, 0),
            'credit_type', 'email',
            'upgrade_url', '/pricing'
        );
    END IF;
    
    IF v_sms_required > 0 AND COALESCE(v_org_credits.sms_credits_available, 0) < v_sms_required THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient SMS credits',
            'error_code', 'INSUFFICIENT_SMS_CREDITS',
            'required', v_sms_required,
            'available', COALESCE(v_org_credits.sms_credits_available, 0),
            'credit_type', 'sms',
            'upgrade_url', '/pricing'
        );
    END IF;
    
    -- Check generic credits (backward compatibility)
    IF v_generic_required > 0 AND COALESCE(v_org_credits.credits_remaining, 0) < v_generic_required THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient credits',
            'error_code', 'INSUFFICIENT_CREDITS',
            'required', v_generic_required,
            'available', COALESCE(v_org_credits.credits_remaining, 0),
            'credit_type', 'generic',
            'upgrade_url', '/pricing'
        );
    END IF;
    
    -- Deduct credits
    UPDATE organization_credits
    SET
        ai_credits_available = COALESCE(ai_credits_available, 0) - v_ai_required,
        whatsapp_credits_available = COALESCE(whatsapp_credits_available, 0) - v_wa_required,
        email_credits_available = COALESCE(email_credits_available, 0) - v_email_required,
        sms_credits_available = COALESCE(sms_credits_available, 0) - v_sms_required,
        credits_remaining = COALESCE(credits_remaining, 0) - v_generic_required,
        last_updated = NOW()
    WHERE organization_id = p_organization_id
    RETURNING
        ai_credits_available,
        whatsapp_credits_available,
        email_credits_available,
        sms_credits_available,
        credits_remaining
    INTO v_ai_remaining, v_wa_remaining, v_email_remaining, v_sms_remaining, v_generic_remaining;
    
    -- Log transaction
    INSERT INTO credit_consumption_logs (
        organization_id,
        action_type,
        ai_credits_consumed,
        whatsapp_credits_consumed,
        email_credits_consumed,
        sms_credits_consumed,
        credits_consumed,
        success,
        metadata,
        created_at
    ) VALUES (
        p_organization_id,
        p_action_type,
        v_ai_required,
        v_wa_required,
        v_email_required,
        v_sms_required,
        v_generic_required,
        true,
        json_build_object(
            'quantity', p_quantity,
            'trial_optimized', true,
            'trial_duration', '14_days'
        ),
        NOW()
    );
    
    -- Return success with optimized response
    RETURN json_build_object(
        'success', true,
        'action_type', p_action_type,
        'quantity', p_quantity,
        'consumed', json_build_object(
            'ai', v_ai_required,
            'whatsapp', v_wa_required,
            'email', v_email_required,
            'sms', v_sms_required,
            'generic', v_generic_required
        ),
        'remaining', json_build_object(
            'ai', v_ai_remaining,
            'whatsapp', v_wa_remaining,
            'email', v_email_remaining,
            'sms', v_sms_remaining,
            'generic', v_generic_remaining
        ),
        'trial_info', CASE 
            WHEN v_org_credits.is_trial THEN json_build_object(
                'is_trial', true,
                'plan_name', 'trial_14',
                'days_remaining', EXTRACT(days FROM (v_org_credits.cycle_end_date - NOW())),
                'expires_at', v_org_credits.cycle_end_date
            )
            ELSE json_build_object('is_trial', false)
        END
    );
END;
$$;

-- =========================================================
-- 3. Verification Queries
-- =========================================================

-- Test function creation
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_name IN ('initialize_trial_user', 'consume_credits_rpc')
    AND routine_schema = 'public';

-- Verify current organization trial status
SELECT 
    o.name,
    oc.is_trial,
    oc.plan_name,
    oc.cycle_end_date,
    CASE 
        WHEN oc.cycle_end_date > NOW() THEN 'ACTIVE'
        ELSE 'EXPIRED'
    END as trial_status,
    EXTRACT(days FROM (oc.cycle_end_date - NOW())) as days_remaining,
    oc.ai_credits_available,
    oc.whatsapp_credits_available,
    oc.email_credits_available,
    oc.sms_credits_available
FROM organizations o
LEFT JOIN organization_credits oc ON o.id = oc.organization_id
ORDER BY o.created_at;