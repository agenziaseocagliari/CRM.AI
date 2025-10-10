-- ====================================================================
-- VERIFICA COMPLETA SCHEMA E PERMESSI
-- ====================================================================

-- 1. Verifica lo schema della funzione
SELECT 
    'Schema Check' as test,
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    CASE 
        WHEN n.nspname = 'public' THEN '✅ SCHEMA CORRETTO'
        ELSE '❌ SCHEMA SBAGLIATO - Dovrebbe essere public'
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'custom_access_token_hook';

-- 2. Verifica se supabase_auth_admin può eseguire la funzione
SELECT 
    'supabase_auth_admin Permissions' as test,
    has_function_privilege('supabase_auth_admin', 
        'public.custom_access_token_hook(jsonb)', 
        'EXECUTE'
    ) as can_execute;

-- 3. Verifica se authenticator può eseguire la funzione
SELECT 
    'authenticator Permissions' as test,
    has_function_privilege('authenticator', 
        'public.custom_access_token_hook(jsonb)', 
        'EXECUTE'
    ) as can_execute;

-- 4. Verifica search_path del ruolo supabase_auth_admin
SELECT 
    'supabase_auth_admin search_path' as test,
    r.rolname,
    r.rolconfig as role_config
FROM pg_roles r
WHERE r.rolname = 'supabase_auth_admin';

-- 5. Verifica che la funzione sia STABLE (non VOLATILE)
SELECT 
    'Function Volatility' as test,
    p.proname,
    p.provolatile as volatility_code,
    CASE p.provolatile
        WHEN 'i' THEN '✅ IMMUTABLE'
        WHEN 's' THEN '✅ STABLE (corretto per hook)'
        WHEN 'v' THEN '❌ VOLATILE (problematico)'
    END as volatility_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'custom_access_token_hook';

-- 6. Mostra la definizione completa della funzione
SELECT 
    'Function Definition' as test,
    pg_get_functiondef(p.oid) as complete_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'custom_access_token_hook';
