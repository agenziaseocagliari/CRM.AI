-- EMERGENCY FIX TEST: Verifica RPC function e crediti
-- Eseguire SUBITO in Supabase Studio SQL Editor

-- Test 1: Verifica che la RPC function esista e funzioni
SELECT 'Testing RPC function...' as status;

-- Test 2: Verifica con UUID di test
SELECT consume_credits_rpc(
    '550e8400-e29b-41d4-a716-446655440000'::UUID, 
    'ai_form_generation'::TEXT
) as rpc_test_result;

-- Test 3: Se fallisce, prova a creare organization di test
INSERT INTO organizations (id, name, email, created_at) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440000'::UUID,
    'Test Organization',
    'test@example.com',
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Test 4: Crea crediti per organization di test
INSERT INTO organization_credits (
    organization_id, 
    plan_name, 
    total_credits, 
    credits_remaining,
    cycle_start_date,
    cycle_end_date
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000'::UUID,
    'test',
    100,
    100,
    NOW(),
    NOW() + INTERVAL '30 days'
) ON CONFLICT (organization_id) DO UPDATE SET
    credits_remaining = 100,
    updated_at = NOW();

-- Test 5: Retry RPC function
SELECT consume_credits_rpc(
    '550e8400-e29b-41d4-a716-446655440000'::UUID, 
    'ai_form_generation'::TEXT
) as rpc_final_test;

-- Test 6: Verifica crediti rimanenti
SELECT credits_remaining 
FROM organization_credits 
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000'::UUID;

SELECT 'RPC Function Test Completed!' as final_status;