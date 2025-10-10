-- ====================================================================
-- TEST SINGOLO: Verifica Ruolo supabase_auth_admin
-- ====================================================================
-- Questo è il test CRITICO per capire se i permessi funzionano
-- ====================================================================

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') 
        THEN '✅ RUOLO ESISTE'
        ELSE '❌ RUOLO NON ESISTE - QUESTO È IL PROBLEMA!'
    END as status,
    (SELECT rolname FROM pg_roles WHERE rolname = 'supabase_auth_admin') as role_name,
    (SELECT rolsuper FROM pg_roles WHERE rolname = 'supabase_auth_admin') as is_superuser,
    (SELECT rolcanlogin FROM pg_roles WHERE rolname = 'supabase_auth_admin') as can_login;

-- ====================================================================
-- RISULTATO ATTESO:
-- Se status = '❌ RUOLO NON ESISTE' → Questo è il problema!
-- Soluzione: Devo creare il ruolo o usare un altro ruolo esistente
-- ====================================================================
