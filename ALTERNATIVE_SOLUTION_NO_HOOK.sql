-- ====================================================================
-- SOLUZIONE ALTERNATIVA DEFINITIVA
-- ====================================================================
-- Siccome l'hook non viene chiamato da GoTrue, usiamo app_metadata
-- che GIÀ CONTIENE user_role e funziona perfettamente
-- ====================================================================

-- PROBLEMA: 
-- Il JWT attuale contiene:
--   app_metadata.user_role = 'super_admin'  ✅ FUNZIONA
-- Ma il frontend cerca:
--   user_role (top-level claim)  ❌ MANCANTE (dovrebbe essere aggiunto dall'hook)

-- SOLUZIONE 1: Modifica il frontend per leggere app_metadata.user_role
-- SOLUZIONE 2: Usa un trigger PostgreSQL per sincronizzare raw_app_meta_data → raw_user_meta_data
-- SOLUZIONE 3: Modifica Supabase per auto-promote app_metadata claims

-- ====================================================================
-- VERIFICA CHE app_metadata.user_role ESISTA PER ENTRAMBI GLI UTENTI
-- ====================================================================

SELECT 
    'User Metadata Check' as test,
    id,
    email,
    raw_app_meta_data->>'user_role' as app_metadata_user_role,
    raw_user_meta_data->>'account_type' as user_metadata_account_type,
    CASE 
        WHEN raw_app_meta_data->>'user_role' IS NOT NULL 
        THEN '✅ user_role EXISTS in app_metadata'
        ELSE '❌ user_role MISSING in app_metadata'
    END as status
FROM auth.users
WHERE email IN ('agenziaseocagliari@gmail.com', 'webproseoid@gmail.com')
ORDER BY email;

-- ====================================================================
-- TEST: Proviamo a PROMUOVERE app_metadata a user_metadata
-- ====================================================================
-- Questa potrebbe essere la soluzione più semplice

-- ATTENZIONE: Questo è un TEST - NON eseguirlo ancora
-- Aspetta i risultati degli altri test prima

/*
UPDATE auth.users
SET raw_user_meta_data = 
    raw_user_meta_data || 
    jsonb_build_object(
        'user_role', raw_app_meta_data->>'user_role',
        'organization_id', raw_app_meta_data->>'organization_id',
        'is_super_admin', (raw_app_meta_data->>'user_role' = 'super_admin')
    )
WHERE email IN ('agenziaseocagliari@gmail.com', 'webproseoid@gmail.com')
RETURNING 
    email,
    raw_user_meta_data->>'user_role' as user_role,
    raw_app_meta_data->>'user_role' as app_user_role;
*/

-- ====================================================================
-- SPIEGAZIONE:
-- ====================================================================
-- GoTrue automaticamente promuove i campi in raw_user_meta_data 
-- ai top-level claims del JWT.
-- Se copiamo user_role da app_metadata a user_metadata,
-- il JWT lo avrà automaticamente senza bisogno di hook!
-- ====================================================================
