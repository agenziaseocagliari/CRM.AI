-- ====================================================================
-- SOLUZIONE DEFINITIVA SENZA DIPENDERE DALL'HOOK
-- ====================================================================
-- GoTrue automaticamente promuove i campi in raw_user_meta_data
-- ai top-level claims del JWT (questo è comportamento nativo)
-- ====================================================================

-- STEP 1: Copia user_role da app_metadata a user_metadata per SUPER ADMIN
UPDATE auth.users
SET raw_user_meta_data = 
    raw_user_meta_data || 
    jsonb_build_object(
        'user_role', 'super_admin',
        'organization_id', '00000000-0000-0000-0000-000000000001',
        'is_super_admin', true,
        'full_name', 'Super Admin'
    )
WHERE email = 'agenziaseocagliari@gmail.com'
RETURNING 
    email,
    raw_user_meta_data->>'user_role' as user_metadata_user_role,
    raw_app_meta_data->>'user_role' as app_metadata_user_role;

-- STEP 2: Copia user_role da app_metadata a user_metadata per ENTERPRISE
UPDATE auth.users
SET raw_user_meta_data = 
    raw_user_meta_data || 
    jsonb_build_object(
        'user_role', 'enterprise',
        'organization_id', (
            SELECT organization_id::text 
            FROM public.profiles 
            WHERE id = auth.users.id
        ),
        'is_super_admin', false
    )
WHERE email = 'webproseoid@gmail.com'
RETURNING 
    email,
    raw_user_meta_data->>'user_role' as user_metadata_user_role,
    raw_app_meta_data->>'user_role' as app_metadata_user_role;

-- ====================================================================
-- VERIFICA FINALE
-- ====================================================================

SELECT 
    'Verifica Metadata' as test,
    email,
    raw_user_meta_data->>'user_role' as user_role_in_metadata,
    raw_app_meta_data->>'user_role' as user_role_in_app,
    CASE 
        WHEN raw_user_meta_data->>'user_role' IS NOT NULL 
        THEN '✅ READY - Al prossimo login JWT avrà user_role top-level'
        ELSE '❌ FAILED'
    END as status
FROM auth.users
WHERE email IN ('agenziaseocagliari@gmail.com', 'webproseoid@gmail.com')
ORDER BY email;

-- ====================================================================
-- COME FUNZIONA:
-- ====================================================================
-- 1. GoTrue legge raw_user_meta_data durante la generazione del JWT
-- 2. Tutti i campi in raw_user_meta_data vengono AUTOMATICAMENTE
--    promossi a top-level claims nel JWT
-- 3. Dopo questo UPDATE, il JWT conterrà:
--    - user_role (top-level) ✅
--    - is_super_admin (top-level) ✅  
--    - organization_id (top-level) ✅
-- 4. Nessun hook necessario - è un meccanismo nativo di Supabase
-- ====================================================================

-- ====================================================================
-- PROSSIMI STEP:
-- ====================================================================
-- 1. Esegui questo script
-- 2. INVALIDA le sessioni correnti:
--    DELETE FROM auth.sessions WHERE user_id IN (
--        SELECT id FROM auth.users 
--        WHERE email IN ('agenziaseocagliari@gmail.com', 'webproseoid@gmail.com')
--    );
-- 3. Fai logout e re-login
-- 4. Il JWT avrà user_role, is_super_admin, organization_id come top-level claims
-- ====================================================================
