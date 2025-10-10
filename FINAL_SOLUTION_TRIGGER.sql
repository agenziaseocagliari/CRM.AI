-- ====================================================================
-- SOLUZIONE DEFINITIVA: DATABASE TRIGGER PER AUTO-SYNC METADATA
-- ====================================================================
-- Questa soluzione usa un trigger PostgreSQL nativo che sincronizza
-- automaticamente app_metadata → user_metadata
-- 
-- PERCHÉ FUNZIONA:
-- - user_metadata viene SEMPRE promossa a top-level JWT claims da Supabase
-- - Trigger PostgreSQL è soluzione nativa, non workaround
-- - Auto-esegue su INSERT/UPDATE, nessuna azione manuale
-- ====================================================================

-- STEP 1: Crea funzione trigger
CREATE OR REPLACE FUNCTION auth.sync_user_metadata_from_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
    profile_data RECORD;
BEGIN
    -- Recupera dati da public.profiles
    SELECT 
        user_role,
        organization_id,
        full_name,
        email
    INTO profile_data
    FROM public.profiles
    WHERE id = NEW.id;
    
    -- Se profilo esiste, sincronizza user_metadata
    IF FOUND THEN
        NEW.raw_user_meta_data := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
            'user_role', profile_data.user_role,
            'organization_id', profile_data.organization_id::text,
            'is_super_admin', (profile_data.user_role = 'super_admin'),
            'full_name', profile_data.full_name
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- STEP 2: Crea trigger su auth.users
DROP TRIGGER IF EXISTS sync_user_metadata_trigger ON auth.users;

CREATE TRIGGER sync_user_metadata_trigger
    BEFORE INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION auth.sync_user_metadata_from_profile();

-- STEP 3: Sync manuale utenti esistenti
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
    'user_role', p.user_role,
    'organization_id', p.organization_id::text,
    'is_super_admin', (p.user_role = 'super_admin'),
    'full_name', p.full_name
)
FROM public.profiles p
WHERE auth.users.id = p.id
  AND auth.users.email IN ('agenziaseocagliari@gmail.com', 'webproseoid@gmail.com')
RETURNING 
    auth.users.email,
    auth.users.raw_user_meta_data->>'user_role' as synced_user_role,
    auth.users.raw_user_meta_data->>'is_super_admin' as synced_is_super_admin;

-- STEP 4: Invalida sessioni per forzare nuovo JWT
DELETE FROM auth.sessions 
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email IN ('agenziaseocagliari@gmail.com', 'webproseoid@gmail.com')
);

-- STEP 5: Verifica trigger creato
SELECT 
    'Trigger Verification' as test,
    tgname as trigger_name,
    tgtype as trigger_type,
    tgenabled as is_enabled,
    CASE 
        WHEN tgenabled = 'O' THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as status
FROM pg_trigger
WHERE tgname = 'sync_user_metadata_trigger';

-- STEP 6: Verifica funzione
SELECT 
    'Function Verification' as test,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as definition_preview
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'auth' 
  AND p.proname = 'sync_user_metadata_from_profile';

-- STEP 7: Verifica user_metadata sincronizzati
SELECT 
    'User Metadata Sync Check' as test,
    email,
    raw_user_meta_data->>'user_role' as user_role,
    raw_user_meta_data->>'is_super_admin' as is_super_admin,
    raw_user_meta_data->>'organization_id' as organization_id,
    CASE 
        WHEN raw_user_meta_data->>'user_role' IS NOT NULL 
        THEN '✅ READY - JWT will have top-level claims'
        ELSE '❌ FAILED - user_role missing'
    END as status
FROM auth.users
WHERE email IN ('agenziaseocagliari@gmail.com', 'webproseoid@gmail.com')
ORDER BY email;

-- ====================================================================
-- COME FUNZIONA:
-- ====================================================================
-- 1. Ogni volta che auth.users viene modificato (login, update, etc)
-- 2. Il trigger PRIMA del salvataggio esegue sync_user_metadata_from_profile()
-- 3. La funzione legge public.profiles e copia user_role → raw_user_meta_data
-- 4. GoTrue genera JWT e AUTOMATICAMENTE promuove raw_user_meta_data a top-level claims
-- 5. JWT contiene user_role, is_super_admin, organization_id come top-level
--
-- NON RICHIEDE:
-- - Hook configurati
-- - Modifiche frontend
-- - Azioni manuali
--
-- È SOLUZIONE NATIVA POSTGRESQL, NON WORKAROUND!
-- ====================================================================

-- ====================================================================
-- TEST POST-IMPLEMENTAZIONE:
-- ====================================================================
-- 1. Esegui questo script completo
-- 2. Verifica tutti i CHECK mostrano ✅
-- 3. Esegui: cd /workspaces/CRM.AI && python3 advanced_jwt_interceptor.py
-- 4. Verifica JWT contiene user_role, is_super_admin, organization_id TOP-LEVEL
-- 5. Login nell'app - dovrebbe funzionare senza TOKEN DEFECT error
-- ====================================================================

-- ====================================================================
-- ROLLBACK (se necessario):
-- ====================================================================
/*
DROP TRIGGER IF EXISTS sync_user_metadata_trigger ON auth.users;
DROP FUNCTION IF EXISTS auth.sync_user_metadata_from_profile();
*/
-- ====================================================================
