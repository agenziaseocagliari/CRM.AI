-- ====================================================================
-- VERIFICA ESISTENZA E TEST FUNZIONE
-- ====================================================================

-- STEP 1: Verifica che la funzione esista
SELECT 
    proname as function_name,
    pg_get_function_result(oid) as return_type,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname = 'custom_access_token_hook'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- STEP 2: Test DIRETTO della funzione (senza DO block)
SELECT public.custom_access_token_hook(
    '{"user_id": "fbb13e89-ce6a-4a98-b718-3d965f19f1c7", "claims": {}}'::jsonb
) as hook_result;

-- STEP 3: Estrai i claims dal risultato
SELECT 
    (public.custom_access_token_hook(
        '{"user_id": "fbb13e89-ce6a-4a98-b718-3d965f19f1c7", "claims": {}}'::jsonb
    )->'claims'->>'user_role') as user_role,
    (public.custom_access_token_hook(
        '{"user_id": "fbb13e89-ce6a-4a98-b718-3d965f19f1c7", "claims": {}}'::jsonb
    )->'claims'->>'is_super_admin') as is_super_admin;
