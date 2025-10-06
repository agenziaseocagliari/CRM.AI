-- ESECUZIONE DIRETTA PER FIX FORMMASTER
-- Questo bypassa temporaneamente il problema dell'Edge Function
-- Da eseguire in Supabase Studio

-- 1. Verifica che tutte le organizzzazioni abbiano crediti di default
INSERT INTO organization_credits (
    organization_id, 
    plan_name, 
    total_credits, 
    credits_remaining,
    cycle_start_date,
    cycle_end_date
)
SELECT 
    o.id,
    'free',
    100,
    100,
    NOW(),
    NOW() + INTERVAL '30 days'
FROM organizations o
WHERE o.id NOT IN (SELECT organization_id FROM organization_credits)
ON CONFLICT (organization_id) DO NOTHING;

-- 2. Verifica environment variables nel supabase per le Edge Functions
-- Controlla in Supabase Dashboard > Project Settings > Edge Functions > Environment Variables:
-- - SUPABASE_URL dovrebbe essere presente
-- - SUPABASE_SERVICE_ROLE_KEY dovrebbe essere presente
-- - GEMINI_API_KEY dovrebbe essere presente

-- 3. Test manuale della RPC function
DO $$
DECLARE
    test_org_id UUID;
    result JSON;
BEGIN
    -- Prendi il primo organization_id disponibile
    SELECT id INTO test_org_id FROM organizations LIMIT 1;
    
    IF test_org_id IS NOT NULL THEN
        -- Test la funzione
        SELECT consume_credits_rpc(test_org_id, 'ai_form_generation') INTO result;
        RAISE NOTICE 'Test RPC Result: %', result;
    ELSE
        RAISE NOTICE 'No organizations found in database';
    END IF;
END $$;

-- 4. Controlla i logs delle Edge Functions
-- Vai in Supabase Dashboard > Edge Functions > Logs per vedere gli errori dettagliati

SELECT 'Fix FormMaster diagnostics completed' as status;