-- ====================================================================
-- LISTA TUTTI I RUOLI ESISTENTI NEL DATABASE
-- ====================================================================
-- Questo mostra TUTTI i ruoli disponibili per capire quale usare
-- ====================================================================

SELECT 
    rolname as role_name,
    rolsuper as is_superuser,
    rolcanlogin as can_login,
    CASE 
        WHEN rolname LIKE '%auth%' THEN '🔑 AUTH ROLE'
        WHEN rolname LIKE '%supabase%' THEN '🚀 SUPABASE ROLE'
        WHEN rolname = 'postgres' THEN '🐘 POSTGRES'
        WHEN rolname = 'anon' THEN '👤 ANON'
        WHEN rolname = 'authenticated' THEN '✅ AUTHENTICATED'
        WHEN rolname = 'service_role' THEN '🔧 SERVICE'
        ELSE '📋 OTHER'
    END as type
FROM pg_roles
WHERE rolname IN (
    'postgres',
    'anon', 
    'authenticated',
    'service_role',
    'supabase_auth_admin',
    'supabase_admin',
    'authenticator'
)
ORDER BY rolname;

-- ====================================================================
-- RISULTATO:
-- Questo mostrerà quali ruoli esistono veramente
-- Poi useremo uno di questi per i GRANT
-- ====================================================================
