-- ====================================================================
-- DIAGNOSI COMPLETA AUTH HOOK - ANALISI SISTEMATICA
-- ====================================================================
-- Questo script analizza OGNI aspetto del sistema per trovare il problema
-- ====================================================================

-- TEST 1: Verifica che la funzione esista e sia corretta
SELECT 
    '=== TEST 1: Funzione Esistenza ===' as test,
    proname as function_name,
    pronamespace::regnamespace as schema_name,
    prokind as kind,
    provolatile as volatility,
    prosecdef as security_definer,
    pg_get_function_arguments(oid) as arguments,
    pg_get_function_result(oid) as return_type
FROM pg_proc
WHERE proname = 'custom_access_token_hook';

-- TEST 2: Verifica i permessi ESATTI sulla funzione
SELECT 
    '=== TEST 2: Permessi Funzione ===' as test,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.routine_privileges
WHERE routine_name = 'custom_access_token_hook'
  AND routine_schema = 'public'
ORDER BY grantee;

-- TEST 3: Verifica che supabase_auth_admin esista come ruolo
SELECT 
    '=== TEST 3: Ruolo supabase_auth_admin ===' as test,
    rolname,
    rolsuper,
    rolcanlogin
FROM pg_roles
WHERE rolname = 'supabase_auth_admin';

-- TEST 4: Test della funzione con formato ESATTO Supabase
SELECT 
    '=== TEST 4: Test Funzione (formato Supabase) ===' as test,
    public.custom_access_token_hook(
        jsonb_build_object(
            'user_id', 'fbb13e89-ce6a-4a98-b718-3d965f19f1c7',
            'claims', jsonb_build_object()
        )
    ) as full_result;

-- TEST 5: Verifica il contenuto dei claims
WITH test AS (
    SELECT public.custom_access_token_hook(
        jsonb_build_object(
            'user_id', 'fbb13e89-ce6a-4a98-b718-3d965f19f1c7',
            'claims', jsonb_build_object()
        )
    ) as result
)
SELECT 
    '=== TEST 5: Claims Dettagliati ===' as test,
    result->>'claims' as claims_json,
    result->'claims'->>'user_role' as user_role,
    result->'claims'->>'is_super_admin' as is_super_admin,
    result->'claims'->>'organization_id' as organization_id,
    result->'claims'->>'email' as email
FROM test;

-- TEST 6: Verifica il profilo nel database
SELECT 
    '=== TEST 6: Profilo Database ===' as test,
    id,
    email,
    user_role,
    organization_id,
    full_name,
    created_at
FROM public.profiles
WHERE id = 'fbb13e89-ce6a-4a98-b718-3d965f19f1c7';

-- TEST 7: Verifica sessioni attive
SELECT 
    '=== TEST 7: Sessioni Attive ===' as test,
    id,
    user_id,
    created_at,
    updated_at,
    (EXTRACT(EPOCH FROM (NOW() - updated_at)) / 60)::int as minutes_ago
FROM auth.sessions
WHERE user_id = 'fbb13e89-ce6a-4a98-b718-3d965f19f1c7'
ORDER BY updated_at DESC
LIMIT 5;

-- TEST 8: Verifica che la funzione sia in public schema
SELECT 
    '=== TEST 8: Schema Verification ===' as test,
    n.nspname as schema_name,
    p.proname as function_name,
    format('%s.%s(%s)', n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)) as full_signature
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'custom_access_token_hook';

-- TEST 9: Verifica ACL (Access Control List) della funzione
SELECT 
    '=== TEST 9: Function ACL ===' as test,
    proname,
    proacl::text as access_control_list
FROM pg_proc
WHERE proname = 'custom_access_token_hook';

-- TEST 10: Test con user_id diverso per escludere problemi specifici
SELECT 
    '=== TEST 10: Test con altro user ===' as test,
    public.custom_access_token_hook(
        jsonb_build_object(
            'user_id', 'dfa97fa5-8375-4f15-ad95-53d339ebcda9',
            'claims', jsonb_build_object()
        )
    )->'claims'->>'user_role' as user_role_enterprise;

-- ====================================================================
-- ANALISI DEI RISULTATI:
-- - Se TEST 1 non mostra la funzione → Funzione non esiste
-- - Se TEST 2 non mostra supabase_auth_admin → Permesso mancante CRITICO
-- - Se TEST 3 non trova il ruolo → Ruolo non esiste (GRAVE)
-- - Se TEST 4 ritorna NULL → Funzione ha errori
-- - Se TEST 5 non mostra user_role → Problema nella logica
-- - Se TEST 6 non trova il profilo → Database inconsistente
-- - Se TEST 7 mostra sessioni → Devono essere eliminate
-- - Se TEST 8 non mostra public.custom_access_token_hook → Schema sbagliato
-- - Se TEST 9 non mostra supabase_auth_admin in ACL → Permesso non applicato
-- ====================================================================
