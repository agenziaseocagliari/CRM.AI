-- ====================================================================
-- DIAGNOSTIC QUERY: Verificare stato utenti e configurazione JWT hook
-- ====================================================================
-- Eseguire questo script nel Supabase SQL Editor per diagnosticare il problema
-- Project: qjtaqrlpronohgpfdxsi
-- VERSIONE CORRETTA - Rimosso riferimento a colonna 'role' obsoleta
-- ====================================================================

-- 1. VERIFICA UTENTI IN AUTH.USERS
SELECT 
    '=== UTENTI IN AUTH.USERS ===' as section,
    id,
    email,
    created_at,
    confirmed_at,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data
FROM auth.users
WHERE email IN ('agenziaseocagliari@gmail.com', 'webproseoid@gmail.com')
ORDER BY email;

-- 2. VERIFICA PROFILI IN PUBLIC.PROFILES
SELECT 
    '=== PROFILI IN PUBLIC.PROFILES ===' as section,
    p.id,
    p.email,
    p.full_name,
    p.user_role,
    p.organization_id,
    p.created_at,
    p.updated_at
FROM public.profiles p
WHERE p.email IN ('agenziaseocagliari@gmail.com', 'webproseoid@gmail.com')
ORDER BY p.email;

-- 3. VERIFICA ESISTENZA FUNZIONE HOOK
SELECT 
    '=== VERIFICA FUNZIONE HOOK ===' as section,
    proname as function_name,
    prosrc as function_source_preview,
    pg_get_functiondef(oid) as full_definition_available
FROM pg_proc
WHERE proname = 'custom_access_token_hook';

-- 4. VERIFICA SCHEMA PROFILES (COLONNE)
SELECT 
    '=== SCHEMA TABELLA PROFILES ===' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
AND column_name IN ('id', 'email', 'user_role', 'organization_id')
ORDER BY ordinal_position;

-- 5. CONTA UTENTI CON/SENZA ROLE
SELECT 
    '=== STATISTICHE USER_ROLE ===' as section,
    COALESCE(user_role, 'NULL') as role_value,
    COUNT(*) as user_count
FROM public.profiles
GROUP BY COALESCE(user_role, 'NULL')
ORDER BY user_count DESC;

-- 6. VERIFICA SE ESISTONO UTENTI AUTH SENZA PROFILE
SELECT 
    '=== UTENTI AUTH SENZA PROFILE ===' as section,
    au.id,
    au.email,
    au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
AND au.email IN ('agenziaseocagliari@gmail.com', 'webproseoid@gmail.com');

-- 7. TEST MANUALE FUNZIONE HOOK (se esiste un utente)
DO $$
DECLARE
    test_user_id uuid;
    test_event jsonb;
    result jsonb;
BEGIN
    -- Prendi il primo utente dalla tabella profiles
    SELECT id INTO test_user_id FROM public.profiles 
    WHERE email = 'agenziaseocagliari@gmail.com' LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Crea evento di test
        test_event := jsonb_build_object(
            'user_id', test_user_id::text,
            'claims', '{}'::jsonb
        );
        
        -- Chiama la funzione hook
        result := public.custom_access_token_hook(test_event);
        
        RAISE NOTICE '=== TEST FUNZIONE HOOK ===';
        RAISE NOTICE 'User ID: %', test_user_id;
        RAISE NOTICE 'Result claims: %', result->'claims';
        RAISE NOTICE 'user_role in claims: %', result->'claims'->'user_role';
        RAISE NOTICE 'organization_id in claims: %', result->'claims'->'organization_id';
    ELSE
        RAISE WARNING 'Nessun utente trovato per il test';
    END IF;
END $$;

-- 8. VERIFICA SESSIONI ATTIVE (dovrebbero essere 0 dopo invalidazione)
SELECT 
    '=== SESSIONI ATTIVE ===' as section,
    COUNT(*) as sessioni_attive,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Nessuna sessione attiva (corretto dopo invalidazione)'
        ELSE '⚠️ Ci sono ancora ' || COUNT(*) || ' sessioni attive'
    END as stato
FROM auth.sessions
WHERE user_id IN (
    'fbb13e89-ce6a-4a98-b718-3d965f19f1c7',
    'dfa97fa5-8375-4f15-ad95-53d339ebcda9'
);

-- ====================================================================
-- RISULTATI ATTESI:
-- 1. Entrambi gli utenti devono esistere in auth.users ✅
-- 2. Entrambi gli utenti devono avere un record in public.profiles ✅
-- 3. Il campo user_role deve essere popolato (non NULL) ✅
-- 4. La funzione custom_access_token_hook deve esistere ✅
-- 5. Il test della funzione deve restituire user_role nei claims ✅
-- 6. Sessioni attive devono essere 0 (dopo invalidazione) ✅
-- ====================================================================
