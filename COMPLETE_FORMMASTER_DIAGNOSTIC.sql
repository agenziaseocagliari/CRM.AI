-- DIAGNOSTIC COMPLETO E FIX FORMMASTER
-- Eseguire in Supabase Studio SQL Editor

-- 1. Lista tutte le organizations per trovare un ID reale
SELECT 'Organizations disponibili:' as info;
SELECT id, name, created_at FROM organizations LIMIT 5;

-- 2. Verifica che la RPC function esista
SELECT 'Verifica RPC function:' as info;
SELECT routine_name, routine_type, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'consume_credits_rpc';

-- 3. Verifica credit_actions per AI agents
SELECT 'Credit actions per AI agents:' as info;
SELECT * FROM credit_actions WHERE action_type LIKE 'ai_%';

-- 4. Test con prima organization trovata
DO $$
DECLARE
    test_org_id UUID;
    result JSON;
BEGIN
    -- Prendi il primo organization_id disponibile
    SELECT id INTO test_org_id FROM organizations LIMIT 1;
    
    IF test_org_id IS NOT NULL THEN
        RAISE NOTICE 'Testing con organization_id: %', test_org_id;
        
        -- Assicura che l'organization abbia crediti
        INSERT INTO organization_credits (
            organization_id, 
            plan_name, 
            total_credits, 
            credits_remaining,
            cycle_start_date,
            cycle_end_date
        ) VALUES (
            test_org_id,
            'test',
            100,
            100,
            NOW(),
            NOW() + INTERVAL '30 days'
        ) ON CONFLICT (organization_id) DO UPDATE SET
            credits_remaining = 100,
            updated_at = NOW();
        
        -- Test la RPC function
        SELECT consume_credits_rpc(test_org_id, 'ai_form_generation') INTO result;
        RAISE NOTICE 'RPC Test Result: %', result;
        
        -- Verifica crediti after test
        SELECT credits_remaining FROM organization_credits WHERE organization_id = test_org_id;
    ELSE
        RAISE NOTICE 'ERRORE: Nessuna organization trovata nel database!';
    END IF;
END $$;

-- 5. Verifica finale stato tabelle
SELECT 'Final state check:' as info;
SELECT 
    oc.organization_id,
    o.name as org_name,
    oc.credits_remaining,
    oc.plan_name
FROM organization_credits oc
JOIN organizations o ON o.id = oc.organization_id
LIMIT 3;

SELECT 'FormMaster diagnostic completed!' as status;