-- ====================================================================
-- FIX FINALE: Auth Hook con firma ESATTA per Supabase
-- ====================================================================
-- Supabase richiede una firma specifica per gli Auth Hooks
-- Riferimento: https://supabase.com/docs/guides/auth/auth-hooks
-- ====================================================================

-- STEP 1: Elimina la funzione esistente
DROP FUNCTION IF EXISTS public.custom_access_token_hook(jsonb) CASCADE;

-- STEP 2: Crea con la firma ESATTA richiesta da Supabase
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    user_id uuid;
    profile_rec record;
    claims jsonb;
BEGIN
    -- Estrai user_id dall'evento
    user_id := (event->>'user_id')::uuid;
    
    -- Inizializza claims dall'evento
    claims := COALESCE(event->'claims', '{}'::jsonb);
    
    -- Se user_id è NULL, ritorna l'evento senza modifiche
    IF user_id IS NULL THEN
        RETURN event;
    END IF;
    
    -- Recupera il profilo utente
    SELECT user_role, organization_id, email, full_name
    INTO profile_rec
    FROM public.profiles 
    WHERE id = user_id;
    
    -- Se il profilo esiste e ha user_role, aggiungi ai claims
    IF FOUND AND profile_rec.user_role IS NOT NULL THEN
        claims := claims || jsonb_build_object(
            'user_role', profile_rec.user_role,
            'organization_id', profile_rec.organization_id,
            'email', profile_rec.email,
            'full_name', profile_rec.full_name
        );
        
        -- Aggiungi flag is_super_admin se necessario
        IF profile_rec.user_role = 'super_admin' THEN
            claims := claims || jsonb_build_object('is_super_admin', true);
        END IF;
    END IF;
    
    -- Ritorna l'evento con i claims aggiornati
    RETURN jsonb_build_object('claims', claims);
    
EXCEPTION WHEN OTHERS THEN
    -- In caso di errore, ritorna l'evento originale
    RETURN event;
END;
$$;

-- STEP 3: CRITICAL - Grant ai ruoli corretti
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO postgres;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO service_role;

-- STEP 4: Verifica che la funzione sia stata creata
SELECT 
    'Funzione creata correttamente' as status,
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments,
    provolatile as volatility
FROM pg_proc
WHERE proname = 'custom_access_token_hook';

-- STEP 5: Test rapido
SELECT 
    'Test funzione' as status,
    public.custom_access_token_hook(
        '{"user_id": "fbb13e89-ce6a-4a98-b718-3d965f19f1c7", "claims": {}}'::jsonb
    )->'claims'->>'user_role' as user_role;

-- ====================================================================
-- IMPORTANTE: La chiave è STABLE senza SECURITY DEFINER
-- Questo permette a Supabase di validare e abilitare l'hook
-- ====================================================================
