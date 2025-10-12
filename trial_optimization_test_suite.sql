-- =========================================================
-- TRIAL OPTIMIZATION TESTING SUITE - 14 DAYS
-- Test all aspects of the new 14-day trial system
-- Date: October 12, 2025
-- =========================================================

-- Test 1: Verify Functions Exist
SELECT 
    'Functions Check' as test_name,
    COUNT(*) as functions_found,
    ARRAY_AGG(routine_name) as function_names
FROM information_schema.routines
WHERE routine_name IN ('initialize_trial_user', 'consume_credits_rpc')
    AND routine_schema = 'public';

-- Test 2: Check Current Organizations Trial Status
SELECT 
    'Current Orgs Status' as test_name,
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

-- Test 3: Test Trial User Initialization (using existing org)
SELECT 
    'Trial Initialization Test' as test_name,
    initialize_trial_user(
        (SELECT id FROM organizations WHERE name LIKE '%SEO%' LIMIT 1)
    ) as result;

-- Test 4: Verify Trial Allocation After Initialization
SELECT 
    'Post-Init Verification' as test_name,
    o.name,
    oc.plan_name,
    oc.is_trial,
    EXTRACT(days FROM (oc.cycle_end_date - NOW())) as days_until_expiry,
    json_build_object(
        'ai', oc.ai_credits_available,
        'whatsapp', oc.whatsapp_credits_available,
        'email', oc.email_credits_available,
        'sms', oc.sms_credits_available
    ) as credit_allocation
FROM organizations o
JOIN organization_credits oc ON o.id = oc.organization_id
WHERE o.name LIKE '%SEO%';

-- Test 5: Test Credit Consumption with Active Trial
SELECT 
    'Active Trial Consumption' as test_name,
    consume_credits_rpc(
        (SELECT id FROM organizations WHERE name LIKE '%SEO%' LIMIT 1),
        'ai_chat',
        1
    ) as consumption_result;

-- Test 6: Simulate Expired Trial Test (Temporary)
-- First backup current state
CREATE TEMP TABLE trial_backup AS
SELECT organization_id, cycle_end_date
FROM organization_credits
WHERE organization_id = (SELECT id FROM organizations WHERE name LIKE '%SEO%' LIMIT 1);

-- Set trial as expired
UPDATE organization_credits
SET cycle_end_date = NOW() - INTERVAL '1 day'
WHERE organization_id = (
    SELECT id FROM organizations WHERE name LIKE '%SEO%' LIMIT 1
);

-- Test consumption with expired trial (should fail)
SELECT 
    'Expired Trial Test' as test_name,
    consume_credits_rpc(
        (SELECT id FROM organizations WHERE name LIKE '%SEO%' LIMIT 1),
        'ai_chat',
        1
    ) as expired_trial_result;

-- Restore original trial state
UPDATE organization_credits
SET cycle_end_date = (SELECT cycle_end_date FROM trial_backup LIMIT 1)
WHERE organization_id = (
    SELECT organization_id FROM trial_backup LIMIT 1
);

-- Test 7: Verify Restored State
SELECT 
    'Restored State Check' as test_name,
    o.name,
    CASE 
        WHEN oc.cycle_end_date > NOW() THEN 'ACTIVE'
        ELSE 'EXPIRED'
    END as trial_status,
    EXTRACT(days FROM (oc.cycle_end_date - NOW())) as days_remaining
FROM organizations o
JOIN organization_credits oc ON o.id = oc.organization_id
WHERE o.name LIKE '%SEO%';

-- Test 8: Test Multi-Credit Consumption
SELECT 
    'Multi-Credit Test' as test_name,
    consume_credits_rpc(
        (SELECT id FROM organizations WHERE name LIKE '%SEO%' LIMIT 1),
        'whatsapp_message',
        1
    ) as whatsapp_result;

-- Test 9: Check Transaction Logging
SELECT 
    'Transaction Logging Check' as test_name,
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN action_type LIKE '%trial%' THEN 1 END) as trial_related,
    COUNT(CASE WHEN success = true THEN 1 END) as successful,
    COUNT(CASE WHEN success = false THEN 1 END) as failed
FROM credit_consumption_logs
WHERE organization_id = (SELECT id FROM organizations WHERE name LIKE '%SEO%' LIMIT 1)
    AND created_at >= NOW() - INTERVAL '1 hour';

-- Test 10: Final System Status Check
SELECT 
    'System Status Summary' as test_name,
    json_build_object(
        'total_organizations', (SELECT COUNT(*) FROM organizations),
        'trial_organizations', (SELECT COUNT(*) FROM organization_credits WHERE is_trial = true),
        'active_trials', (SELECT COUNT(*) FROM organization_credits WHERE is_trial = true AND cycle_end_date > NOW()),
        'expired_trials', (SELECT COUNT(*) FROM organization_credits WHERE is_trial = true AND cycle_end_date <= NOW()),
        'trial_14_plans', (SELECT COUNT(*) FROM organization_credits WHERE plan_name = 'trial_14'),
        'avg_trial_days_remaining', (
            SELECT ROUND(AVG(EXTRACT(days FROM (cycle_end_date - NOW()))), 1)
            FROM organization_credits 
            WHERE is_trial = true AND cycle_end_date > NOW()
        )
    ) as system_summary;

-- Cleanup
DROP TABLE IF EXISTS trial_backup;