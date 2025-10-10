-- ====================================================================
-- SOLUZIONE DEFINITIVA V2: TRIGGER SU public.profiles
-- ====================================================================
-- Supabase blocca trigger su auth.users per sicurezza
-- Usiamo trigger su public.profiles + funzione Edge Function
-- ====================================================================

-- STEP 1: Crea funzione che aggiorna auth.users.raw_user_meta_data
CREATE OR REPLACE FUNCTION public.sync_auth_user_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Aggiorna raw_user_meta_data in auth.users quando profile cambia
    UPDATE auth.users
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
        'user_role', NEW.user_role,
        'organization_id', NEW.organization_id::text,
        'is_super_admin', (NEW.user_role = 'super_admin'),
        'full_name', NEW.full_name
    )
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$;

-- STEP 2: Crea trigger su public.profiles
DROP TRIGGER IF EXISTS sync_auth_metadata_trigger ON public.profiles;

CREATE TRIGGER sync_auth_metadata_trigger
    AFTER INSERT OR UPDATE OF user_role, organization_id, full_name
    ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_auth_user_metadata();

-- STEP 3: Sync manuale IMMEDIATO per utenti esistenti
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
    'user_role', p.user_role,
    'organization_id', p.organization_id::text,
    'is_super_admin', (p.user_role = 'super_admin'),
    'full_name', p.full_name
)
FROM public.profiles p
WHERE auth.users.id = p.id
  AND p.user_role IS NOT NULL
RETURNING 
    auth.users.email,
    auth.users.raw_user_meta_data->>'user_role' as user_role,
    auth.users.raw_user_meta_data->>'is_super_admin' as is_super_admin;

-- STEP 4: Invalida tutte le sessioni
DELETE FROM auth.sessions;

-- STEP 5: Verifica trigger creato
SELECT 
    'Trigger on profiles' as test,
    tgname as trigger_name,
    tgenabled as enabled,
    CASE 
        WHEN tgenabled = 'O' THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as status
FROM pg_trigger
WHERE tgname = 'sync_auth_metadata_trigger';

-- STEP 6: Verifica funzione
SELECT 
    'Function Check' as test,
    proname as function_name,
    CASE 
        WHEN prosecdef THEN '✅ SECURITY DEFINER (can update auth.users)'
        ELSE '❌ Not secure definer'
    END as security
FROM pg_proc
WHERE proname = 'sync_auth_user_metadata';

-- STEP 7: Verifica sync completato
SELECT 
    'Sync Status' as test,
    u.email,
    u.raw_user_meta_data->>'user_role' as user_role_in_metadata,
    p.user_role as user_role_in_profile,
    CASE 
        WHEN u.raw_user_meta_data->>'user_role' = p.user_role 
        THEN '✅ SYNCED'
        ELSE '❌ NOT SYNCED'
    END as status
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.email IN ('agenziaseocagliari@gmail.com', 'webproseoid@gmail.com')
ORDER BY u.email;

-- ====================================================================
-- COME FUNZIONA:
-- ====================================================================
-- 1. Quando public.profiles.user_role viene aggiornato
-- 2. Trigger chiama sync_auth_user_metadata()
-- 3. Funzione (con SECURITY DEFINER) aggiorna auth.users.raw_user_meta_data
-- 4. Al prossimo login, GoTrue legge raw_user_meta_data
-- 5. Supabase AUTO-PROMUOVE raw_user_meta_data a top-level JWT claims
--
-- DIFFERENZA DA SOLUZIONE PRECEDENTE:
-- - Trigger su public.profiles (permesso) invece di auth.users (bloccato)
-- - SECURITY DEFINER permette alla funzione di aggiornare auth.users
-- - Stesso risultato finale: JWT contiene user_role top-level
-- ====================================================================

-- ====================================================================
-- TEST:
-- ====================================================================
-- Dopo esecuzione, testa modificando un profilo:
UPDATE public.profiles 
SET full_name = 'Super Admin Updated'
WHERE email = 'agenziaseocagliari@gmail.com'
RETURNING 
    email,
    (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = profiles.id) as metadata_updated;

-- Se vedi "Super Admin Updated" in metadata_updated = TRIGGER FUNZIONA ✅
-- ====================================================================
