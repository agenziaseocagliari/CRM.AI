-- ====================================================================
-- FIX DEFINITIVO: custom_access_token_hook
-- ====================================================================
-- PROBLEMA TROVATO: La funzione cercava event->'user'->>'id' invece di event->>'user_id'
-- Questo è il formato CORRETTO per Supabase Auth Hooks
-- ====================================================================

-- STEP 1: Elimina la funzione vecchia
DROP FUNCTION IF EXISTS public.custom_access_token_hook(jsonb) CASCADE;

-- STEP 2: Crea la funzione CORRETTA
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    user_id uuid;
    profile_rec record;
    claims jsonb;
BEGIN
    -- ⚠️ FIX: Formato corretto per Supabase Auth Hooks
    -- event->>'user_id' invece di event->'user'->>'id'
    user_id := (event->>'user_id')::uuid;
    
    -- Log per debug (opzionale, rimuovere in produzione)
    RAISE LOG 'custom_access_token_hook called for user_id: %', user_id;
    
    IF user_id IS NULL THEN
        RAISE LOG 'WARNING: user_id is NULL in event';
        RETURN event;
    END IF;
    
    -- Get current claims from event
    claims := COALESCE(event->'claims', '{}'::jsonb);
    
    -- Look up user profile
    BEGIN
        SELECT user_role, organization_id, email, full_name
        INTO profile_rec
        FROM public.profiles 
        WHERE id = user_id;
        
        IF FOUND THEN
            RAISE LOG 'Profile found: user_role=%, org=%', profile_rec.user_role, profile_rec.organization_id;
            
            IF profile_rec.user_role IS NOT NULL THEN
                -- Add custom claims
                claims := claims || jsonb_build_object(
                    'user_role', profile_rec.user_role,
                    'organization_id', profile_rec.organization_id,
                    'email', profile_rec.email,
                    'full_name', profile_rec.full_name
                );
                
                IF profile_rec.user_role = 'super_admin' THEN
                    claims := claims || jsonb_build_object('is_super_admin', true);
                END IF;
                
                RAISE LOG 'Claims updated with user_role: %', profile_rec.user_role;
            ELSE
                RAISE LOG 'WARNING: user_role is NULL for user_id: %', user_id;
            END IF;
        ELSE
            RAISE LOG 'WARNING: No profile found for user_id: %', user_id;
        END IF;
        
        EXCEPTION WHEN OTHERS THEN
            -- Log error but don't fail the authentication
            RAISE LOG 'ERROR in custom_access_token_hook: %', SQLERRM;
    END;
    
    -- Return event with updated claims
    RETURN jsonb_build_object('claims', claims);
END;
$$;

-- STEP 3: Grant permissions
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO anon;

-- STEP 4: Verifica che la funzione sia stata creata correttamente
SELECT 
    proname as function_name,
    prokind as kind,
    provolatile as volatility,
    prosecdef as security_definer,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc
WHERE proname = 'custom_access_token_hook';

-- STEP 5: Test manuale immediato
DO $$
DECLARE
    test_event jsonb;
    result jsonb;
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'TEST HOOK - Super Admin';
    RAISE NOTICE '==========================================';
    
    -- Test per agenziaseocagliari@gmail.com
    test_event := jsonb_build_object(
        'user_id', 'fbb13e89-ce6a-4a98-b718-3d965f19f1c7',
        'claims', jsonb_build_object()
    );
    
    result := public.custom_access_token_hook(test_event);
    
    RAISE NOTICE 'User: agenziaseocagliari@gmail.com';
    RAISE NOTICE 'Result: %', result;
    RAISE NOTICE 'user_role: %', result->'claims'->>'user_role';
    RAISE NOTICE 'organization_id: %', result->'claims'->>'organization_id';
    RAISE NOTICE 'is_super_admin: %', result->'claims'->>'is_super_admin';
    
    -- Verifica che user_role sia presente
    IF result->'claims'->>'user_role' IS NULL THEN
        RAISE EXCEPTION '❌ ERRORE: user_role è ancora NULL!';
    ELSE
        RAISE NOTICE '✅ SUCCESS: user_role presente nei claims!';
    END IF;
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'TEST HOOK - Enterprise';
    RAISE NOTICE '==========================================';
    
    -- Test per webproseoid@gmail.com
    test_event := jsonb_build_object(
        'user_id', 'dfa97fa5-8375-4f15-ad95-53d339ebcda9',
        'claims', jsonb_build_object()
    );
    
    result := public.custom_access_token_hook(test_event);
    
    RAISE NOTICE 'User: webproseoid@gmail.com';
    RAISE NOTICE 'Result: %', result;
    RAISE NOTICE 'user_role: %', result->'claims'->>'user_role';
    RAISE NOTICE 'organization_id: %', result->'claims'->>'organization_id';
    
    IF result->'claims'->>'user_role' IS NULL THEN
        RAISE EXCEPTION '❌ ERRORE: user_role è ancora NULL!';
    ELSE
        RAISE NOTICE '✅ SUCCESS: user_role presente nei claims!';
    END IF;
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅✅✅ TUTTI I TEST PASSATI ✅✅✅';
    RAISE NOTICE '==========================================';
END $$;

-- ====================================================================
-- RISULTATO ATTESO:
-- ✅ Funzione creata correttamente
-- ✅ Test manuali mostrano user_role nei claims
-- ✅ Logs mostrano "SUCCESS: user_role presente nei claims!"
--
-- DOPO QUESTO FIX:
-- 1. L'Auth Hook è già configurato (fatto precedentemente)
-- 2. Le sessioni sono già invalidate (fatto precedentemente)
-- 3. DEVI SOLO fare logout + login per testare
-- ====================================================================
