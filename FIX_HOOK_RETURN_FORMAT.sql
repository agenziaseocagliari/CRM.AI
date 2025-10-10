-- ====================================================================
-- FIX DEFINITIVO: FORMATO RETURN CORRETTO PER GOTURE
-- ====================================================================
-- PROBLEMA: La funzione restituisce solo {"claims": {...}}
-- SOLUZIONE: Deve restituire l'evento COMPLETO con claims aggiornati
-- ====================================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $function$
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
    
    -- ⚠️ FIX CRITICO: Ritorna l'evento COMPLETO con claims aggiornati
    -- NON solo {"claims": {...}}
    -- MA l'intero evento originale con claims sostituiti
    RETURN jsonb_set(event, '{claims}', claims);
    
EXCEPTION WHEN OTHERS THEN
    -- In caso di errore, ritorna l'evento originale
    RETURN event;
END;
$function$;

-- ====================================================================
-- GRANT PERMESSI
-- ====================================================================

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO postgres;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO service_role;

-- ====================================================================
-- TEST IMMEDIATO
-- ====================================================================

SELECT 
    'TEST POST-FIX' as test,
    public.custom_access_token_hook(
        jsonb_build_object(
            'user_id', 'fbb13e89-ce6a-4a98-b718-3d965f19f1c7',
            'claims', jsonb_build_object(
                'sub', 'fbb13e89-ce6a-4a98-b718-3d965f19f1c7',
                'email', 'agenziaseocagliari@gmail.com',
                'role', 'authenticated'
            )
        )
    ) as result;

-- ====================================================================
-- RISULTATO ATTESO:
-- {
--   "user_id": "fbb13e89-ce6a-4a98-b718-3d965f19f1c7",
--   "claims": {
--     "sub": "fbb13e89-ce6a-4a98-b718-3d965f19f1c7",
--     "email": "agenziaseocagliari@gmail.com",
--     "role": "authenticated",
--     "user_role": "super_admin",           <-- AGGIUNTO
--     "organization_id": "...",              <-- AGGIUNTO
--     "full_name": "...",                    <-- AGGIUNTO
--     "is_super_admin": true                 <-- AGGIUNTO
--   }
-- }
-- ====================================================================
