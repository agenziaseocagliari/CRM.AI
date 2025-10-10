-- ====================================================================
-- TEST MANUALE DELLA FUNZIONE AUTH HOOK
-- ====================================================================
-- Se questo test fallisce, l'hook non può essere abilitato
-- ====================================================================

-- Test con il formato ESATTO che Supabase Auth invia
DO $$
DECLARE
    test_event jsonb;
    result jsonb;
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'TEST HOOK CON FORMATO SUPABASE AUTH';
    RAISE NOTICE '==========================================';
    
    -- Questo è il formato ESATTO che Supabase invia all'hook
    test_event := jsonb_build_object(
        'user_id', 'fbb13e89-ce6a-4a98-b718-3d965f19f1c7',
        'claims', jsonb_build_object()
    );
    
    RAISE NOTICE 'Input event: %', test_event;
    
    BEGIN
        result := public.custom_access_token_hook(test_event);
        RAISE NOTICE 'Result: %', result;
        RAISE NOTICE 'Claims: %', result->'claims';
        RAISE NOTICE 'user_role: %', result->'claims'->>'user_role';
        
        IF result->'claims'->>'user_role' IS NOT NULL THEN
            RAISE NOTICE '✅ TEST PASSATO - Hook funziona correttamente!';
        ELSE
            RAISE EXCEPTION '❌ TEST FALLITO - user_role è NULL!';
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION '❌ ERRORE NELLA FUNZIONE: % - %', SQLSTATE, SQLERRM;
    END;
    
    RAISE NOTICE '==========================================';
END $$;

-- ====================================================================
-- Se questo test PASSA, il problema è nella configurazione Supabase
-- Se questo test FALLISCE, c'è un errore nella funzione SQL
-- ====================================================================
