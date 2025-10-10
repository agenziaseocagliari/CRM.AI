-- ====================================================================
-- TEST HOOK COME SE FOSSE CHIAMATO DA GOTURE
-- ====================================================================
-- Questo simula ESATTAMENTE la chiamata che GoTrue fa all'hook
-- ====================================================================

-- Test 1: Simula evento auth con user_id del super admin
SELECT 
    'TEST 1: Super Admin Hook Call' as test_name,
    public.custom_access_token_hook(
        jsonb_build_object(
            'user_id', 'fbb13e89-ce6a-4a98-b718-3d965f19f1c7',
            'claims', jsonb_build_object(
                'sub', 'fbb13e89-ce6a-4a98-b718-3d965f19f1c7',
                'email', 'agenziaseocagliari@gmail.com',
                'role', 'authenticated'
            )
        )
    ) as hook_result;

-- Test 2: Verifica se la funzione ha i permessi giusti
SELECT 
    'TEST 2: Function Permissions' as test_name,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as full_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'custom_access_token_hook';

-- Test 3: Verifica l'ownership della funzione
SELECT 
    'TEST 3: Function Owner' as test_name,
    p.proname as function_name,
    r.rolname as owner_role,
    CASE 
        WHEN r.rolname = 'supabase_auth_admin' THEN '✅ OWNER CORRETTO'
        WHEN r.rolname = 'postgres' THEN '⚠️ OWNER POSTGRES (potrebbe andare bene)'
        ELSE '❌ OWNER SBAGLIATO'
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_roles r ON p.proowner = r.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'custom_access_token_hook';

-- Test 4: Verifica ACL (Access Control List)
SELECT 
    'TEST 4: Function ACL' as test_name,
    p.proname as function_name,
    p.proacl as access_control_list
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'custom_access_token_hook';
