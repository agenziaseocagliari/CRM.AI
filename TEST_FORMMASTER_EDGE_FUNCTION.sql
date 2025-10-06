-- TEST SCRIPT per verificare che la RPC function consume_credits_rpc funzioni
-- Esegui questo in Supabase Studio per testare la funzione

-- 1. Verifica che la funzione esista
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'consume_credits_rpc';

-- 2. Test della funzione con dati mock
-- Nota: sostituisci questo UUID con un organization_id reale dal tuo database
SELECT consume_credits_rpc(
    '550e8400-e29b-41d4-a716-446655440000'::UUID, 
    'ai_form_generation'::TEXT
);

-- 3. Verifica che le tabelle necessarie esistano
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('organization_credits', 'credit_actions', 'credit_consumption_logs');

-- 4. Verifica i credit_actions esistenti
SELECT * FROM credit_actions WHERE action_type LIKE 'ai_%';

-- 5. Se non ci sono organization_credits, creane uno di test
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
) ON CONFLICT (organization_id) DO NOTHING;

-- 6. Test finale della funzione
SELECT 'Test completed - check results above' as status;