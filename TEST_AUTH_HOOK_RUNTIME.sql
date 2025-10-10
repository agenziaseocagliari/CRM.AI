-- ====================================================================
-- TEST RUNTIME AUTH HOOK
-- ====================================================================
-- Questo script testa se l'auth hook viene chiamato durante il login
-- ====================================================================

-- STEP 1: Aggiungi logging alla funzione hook
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  user_profile RECORD;
  claims jsonb;
BEGIN
  -- LOG: Funzione chiamata
  RAISE LOG 'custom_access_token_hook CALLED for user_id: %', event->>'user_id';
  
  -- Recupera il profilo utente
  SELECT user_role, organization_id, email
  INTO user_profile
  FROM public.profiles
  WHERE id = (event->>'user_id')::uuid;

  -- LOG: Dati recuperati
  RAISE LOG 'Profile found: user_role=%, organization_id=%', 
    user_profile.user_role, user_profile.organization_id;

  -- Se l'utente non ha un profilo, usa valori di default
  IF user_profile IS NULL THEN
    RAISE LOG 'WARNING: No profile found for user_id: %', event->>'user_id';
    claims := jsonb_build_object(
      'user_role', 'user',
      'organization_id', NULL
    );
  ELSE
    -- Costruisci i custom claims
    claims := jsonb_build_object(
      'user_role', COALESCE(user_profile.user_role, 'user'),
      'organization_id', user_profile.organization_id,
      'email', user_profile.email
    );
  END IF;

  -- LOG: Claims generati
  RAISE LOG 'Claims generated: %', claims;

  -- Restituisci l'evento con i custom claims aggiunti
  RETURN jsonb_build_object(
    'claims', (event->'claims') || claims
  );
END;
$$;

-- STEP 2: Verifica che la funzione esista
SELECT 
  proname as function_name,
  prokind as function_kind,
  provolatile as volatility,
  pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc
WHERE proname = 'custom_access_token_hook';

-- STEP 3: Test manuale della funzione
DO $$
DECLARE
  test_event jsonb;
  result jsonb;
BEGIN
  -- Test per agenziaseocagliari@gmail.com
  test_event := jsonb_build_object(
    'user_id', 'fbb13e89-ce6a-4a98-b718-3d965f19f1c7',
    'claims', jsonb_build_object()
  );
  
  result := public.custom_access_token_hook(test_event);
  
  RAISE NOTICE '=== TEST HOOK SUPER ADMIN ===';
  RAISE NOTICE 'User: agenziaseocagliari@gmail.com';
  RAISE NOTICE 'Claims: %', result->'claims';
  RAISE NOTICE 'user_role: %', result->'claims'->>'user_role';
  RAISE NOTICE 'organization_id: %', result->'claims'->>'organization_id';
  
  -- Test per webproseoid@gmail.com
  test_event := jsonb_build_object(
    'user_id', 'dfa97fa5-8375-4f15-ad95-53d339ebcda9',
    'claims', jsonb_build_object()
  );
  
  result := public.custom_access_token_hook(test_event);
  
  RAISE NOTICE '=== TEST HOOK ENTERPRISE ===';
  RAISE NOTICE 'User: webproseoid@gmail.com';
  RAISE NOTICE 'Claims: %', result->'claims';
  RAISE NOTICE 'user_role: %', result->'claims'->>'user_role';
  RAISE NOTICE 'organization_id: %', result->'claims'->>'organization_id';
END $$;

-- STEP 4: Verifica configurazione Auth Settings (se accessibile)
-- Nota: Questa query potrebbe non funzionare se non hai accesso alla tabella config
SELECT 
  key,
  value
FROM pg_catalog.pg_settings
WHERE name LIKE '%hook%' OR name LIKE '%auth%'
LIMIT 10;

-- ====================================================================
-- RISULTATO ATTESO:
-- - Funzione esiste e restituisce claims con user_role e organization_id
-- - Se il login continua a fallire DOPO questo test, il problema è:
--   1. Runtime Supabase Auth non sta chiamando la funzione
--   2. Cache JWT non è stata invalidata
--   3. Configurazione Dashboard non sincronizzata con Management API
-- ====================================================================
