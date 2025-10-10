-- ====================================================================
-- CERCA CONFIGURAZIONI NASCOSTE CHE DISABILITANO HOOKS
-- ====================================================================

-- 1. Cerca nella tabella auth.config (se esiste)
SELECT 'auth.config table' as source, *
FROM information_schema.tables
WHERE table_schema = 'auth' 
  AND table_name = 'config';

-- 2. Cerca nelle variabili di configurazione PostgreSQL
SELECT 
    'PostgreSQL Settings' as source,
    name,
    setting,
    context,
    source
FROM pg_settings
WHERE name LIKE '%hook%' 
   OR name LIKE '%auth%'
   OR name LIKE '%goture%'
ORDER BY name;

-- 3. Cerca extension settings
SELECT 
    'Extension Settings' as source,
    extname as extension_name,
    extversion as version
FROM pg_extension
WHERE extname LIKE '%auth%' 
   OR extname LIKE '%vault%'
   OR extname LIKE '%supabase%';

-- 4. Verifica se esiste la tabella auth.hooks
SELECT 
    'auth.hooks table check' as source,
    EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'auth' 
        AND table_name = 'hooks'
    ) as hooks_table_exists;

-- 5. Se esiste, guarda il contenuto
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'auth' 
        AND table_name = 'hooks'
    ) THEN
        RAISE NOTICE 'auth.hooks table exists - checking content...';
        EXECUTE 'SELECT * FROM auth.hooks';
    ELSE
        RAISE NOTICE 'auth.hooks table does NOT exist';
    END IF;
END $$;

-- 6. Verifica policy RLS sulla funzione (potrebbe bloccare GoTrue)
SELECT 
    'Function Security' as source,
    p.proname,
    p.prosecdef as has_security_definer,
    p.proconfig as configuration,
    CASE 
        WHEN p.prosecdef THEN '⚠️ HAS SECURITY DEFINER'
        ELSE '✅ NO SECURITY DEFINER'
    END as security_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'custom_access_token_hook';
