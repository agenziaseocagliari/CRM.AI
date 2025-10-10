-- ====================================================================
-- VERIFICA COMPLETA CONFIGURAZIONE AUTH HOOK
-- ====================================================================
-- Esegui questo SQL nel Supabase SQL Editor per diagnosticare il problema
-- ====================================================================

-- 1. Verifica che la funzione esista
SELECT 
    'STEP 1: Funzione custom_access_token_hook' as step,
    proname as function_name,
    prokind as kind,
    provolatile as volatility,
    prosecdef as security_definer,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc
WHERE proname = 'custom_access_token_hook';

-- 2. Verifica i permessi della funzione
SELECT 
    'STEP 2: Permessi funzione' as step,
    grantee,
    privilege_type
FROM information_schema.routine_privileges
WHERE routine_name = 'custom_access_token_hook';

-- 3. Test manuale della funzione per Super Admin
SELECT 
    'STEP 3: Test funzione per Super Admin' as step,
    public.custom_access_token_hook(
        jsonb_build_object(
            'user_id', 'fbb13e89-ce6a-4a98-b718-3d965f19f1c7',
            'claims', jsonb_build_object()
        )
    ) as result;

-- 4. Verifica che user_role sia presente nel risultato
WITH test_result AS (
    SELECT public.custom_access_token_hook(
        jsonb_build_object(
            'user_id', 'fbb13e89-ce6a-4a98-b718-3d965f19f1c7',
            'claims', jsonb_build_object()
        )
    ) as hook_result
)
SELECT 
    'STEP 4: Verifica claims' as step,
    hook_result->'claims'->>'user_role' as user_role,
    hook_result->'claims'->>'is_super_admin' as is_super_admin,
    hook_result->'claims'->>'organization_id' as organization_id,
    CASE 
        WHEN hook_result->'claims'->>'user_role' IS NOT NULL 
        THEN '✅ FUNZIONE OK - user_role presente'
        ELSE '❌ ERRORE - user_role NULL'
    END as status
FROM test_result;

-- 5. Verifica il profile nel database
SELECT 
    'STEP 5: Verifica profile database' as step,
    id,
    email,
    user_role,
    organization_id,
    CASE 
        WHEN user_role IS NOT NULL 
        THEN '✅ Profile OK'
        ELSE '❌ user_role NULL nel database'
    END as status
FROM public.profiles
WHERE id = 'fbb13e89-ce6a-4a98-b718-3d965f19f1c7';

-- 6. Conta le sessioni attive
SELECT 
    'STEP 6: Sessioni attive' as step,
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN user_id = 'fbb13e89-ce6a-4a98-b718-3d965f19f1c7' THEN 1 END) as super_admin_sessions
FROM auth.sessions;

-- ====================================================================
-- DIAGNOSI:
-- - Se STEP 1 non trova la funzione → Rieseguire FIX_CUSTOM_ACCESS_TOKEN_HOOK_DEFINITIVO.sql
-- - Se STEP 2 non mostra permessi → Rieseguire GRANT statements
-- - Se STEP 3 restituisce NULL → Problema nella funzione
-- - Se STEP 4 mostra user_role NULL → Problema nel profile o nella funzione
-- - Se STEP 5 mostra user_role NULL → Problema nel database
-- - Se STEP 6 mostra sessioni > 0 → Devi invalidarle
-- ====================================================================
