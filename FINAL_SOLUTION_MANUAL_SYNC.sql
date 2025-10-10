-- ====================================================================
-- SOLUZIONE DEFINITIVA V3: RPC FUNCTION + MANUAL SYNC
-- ====================================================================
-- I trigger su auth schema sono bloccati da Supabase per sicurezza
-- Soluzione: Funzione RPC che il frontend chiama dopo login
-- ====================================================================

-- STEP 1: Crea funzione RPC che può aggiornare auth.users
CREATE OR REPLACE FUNCTION public.sync_user_metadata_to_auth()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    current_user_id uuid;
    profile_data record;
    result jsonb;
BEGIN
    -- Ottieni user ID corrente
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Not authenticated'
        );
    END IF;
    
    -- Leggi profilo
    SELECT 
        user_role,
        organization_id,
        full_name,
        email
    INTO profile_data
    FROM public.profiles
    WHERE id = current_user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Profile not found'
        );
    END IF;
    
    -- Aggiorna auth.users.raw_user_meta_data
    UPDATE auth.users
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
        'user_role', profile_data.user_role,
        'organization_id', profile_data.organization_id::text,
        'is_super_admin', (profile_data.user_role = 'super_admin'),
        'full_name', profile_data.full_name
    )
    WHERE id = current_user_id;
    
    -- Ritorna risultato
    RETURN jsonb_build_object(
        'success', true,
        'user_id', current_user_id,
        'user_role', profile_data.user_role,
        'synced', true
    );
END;
$$;

-- STEP 2: Grant permessi
GRANT EXECUTE ON FUNCTION public.sync_user_metadata_to_auth() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_user_metadata_to_auth() TO anon;

-- STEP 3: Sync MANUALE per utenti esistenti (ESEGUI ADESSO)
DO $$
DECLARE
    user_record record;
BEGIN
    FOR user_record IN 
        SELECT 
            u.id,
            u.email,
            p.user_role,
            p.organization_id,
            p.full_name
        FROM auth.users u
        JOIN public.profiles p ON u.id = p.id
        WHERE p.user_role IS NOT NULL
    LOOP
        UPDATE auth.users
        SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
            'user_role', user_record.user_role,
            'organization_id', user_record.organization_id::text,
            'is_super_admin', (user_record.user_role = 'super_admin'),
            'full_name', user_record.full_name
        )
        WHERE id = user_record.id;
        
        RAISE NOTICE 'Synced user: % (role: %)', user_record.email, user_record.user_role;
    END LOOP;
END $$;

-- STEP 4: Invalida TUTTE le sessioni
DELETE FROM auth.sessions;

-- STEP 5: Verifica sync completato
SELECT 
    'Final Sync Check' as test,
    u.email,
    u.raw_user_meta_data->>'user_role' as metadata_user_role,
    u.raw_user_meta_data->>'is_super_admin' as metadata_is_super_admin,
    u.raw_user_meta_data->>'organization_id' as metadata_org_id,
    p.user_role as profile_user_role,
    CASE 
        WHEN u.raw_user_meta_data->>'user_role' = p.user_role 
        THEN '✅ READY FOR JWT'
        ELSE '❌ SYNC FAILED'
    END as status
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.email IN ('agenziaseocagliari@gmail.com', 'webproseoid@gmail.com')
ORDER BY u.email;

-- ====================================================================
-- RISULTATO ATTESO:
-- ====================================================================
-- email                        | metadata_user_role | metadata_is_super_admin | status
-- agenziaseocagliari@gmail.com | super_admin        | true                    | ✅ READY FOR JWT
-- webproseoid@gmail.com        | enterprise         | false                   | ✅ READY FOR JWT
-- ====================================================================

-- ====================================================================
-- COME FUNZIONA ORA:
-- ====================================================================
-- 1. SYNC MANUALE eseguito sopra: tutti gli utenti ora hanno raw_user_meta_data popolato
-- 2. Al prossimo login, Supabase legge raw_user_meta_data
-- 3. Supabase AUTO-PROMUOVE raw_user_meta_data a TOP-LEVEL JWT claims
-- 4. JWT contiene user_role, is_super_admin, organization_id come TOP-LEVEL
--
-- NON SERVE PIÙ:
-- - Hook (non funziona)
-- - Trigger (bloccati)
-- - Frontend modifications (user_metadata promossa automaticamente)
--
-- QUESTO È IL MECCANISMO NATIVO DI SUPABASE CHE FUNZIONA SEMPRE!
-- ====================================================================

-- ====================================================================
-- MANUTENZIONE FUTURA:
-- ====================================================================
-- Quando un utente cambia ruolo in profiles:
-- 1. Dopo UPDATE profiles, chiama:
--    SELECT public.sync_user_metadata_to_auth();
-- 2. Oppure dal frontend (dopo login):
--    const { data } = await supabase.rpc('sync_user_metadata_to_auth');
-- ====================================================================
