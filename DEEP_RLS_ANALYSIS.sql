-- ============================================
-- ANALISI APPROFONDITA RLS POLICY PROBLEM
-- Data: 2025-10-10
-- Obiettivo: Capire PERCHÉ WITH CHECK non viene salvato
-- ============================================

-- STEP 1: Analisi completa della policy esistente
-- ============================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,  -- USING expression (per SELECT/UPDATE/DELETE)
    with_check,  -- WITH CHECK expression (per INSERT/UPDATE)
    pg_get_expr(qual, 'public.forms'::regclass) as qual_expression,
    pg_get_expr(with_check, 'public.forms'::regclass) as with_check_expression
FROM pg_policies
WHERE tablename = 'forms' 
  AND policyname = 'forms_insert_policy';

-- STEP 2: Verifica definizione completa policy da pg_policy
-- ============================================
SELECT 
    polname as policy_name,
    polcmd as command,
    polpermissive as permissive,
    polroles::regrole[] as roles,
    polqual as qual_raw,
    polwithcheck as with_check_raw,
    CASE polcmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END as command_type
FROM pg_policy
WHERE polrelid = 'public.forms'::regclass
  AND polname = 'forms_insert_policy';

-- STEP 3: Verifica ownership e permessi sulla tabella
-- ============================================
SELECT 
    t.tablename,
    t.tableowner,
    pg_catalog.has_table_privilege(current_user, 'public.forms', 'SELECT') as can_select,
    pg_catalog.has_table_privilege(current_user, current_schema(), 'CREATE') as can_create_in_schema
FROM pg_tables t
WHERE t.tablename = 'forms';

-- STEP 4: Verifica RLS abilitato
-- ============================================
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    relforcerowsecurity as rls_forced
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.tablename = 'forms';

-- STEP 5: Test query con auth.uid() mock
-- ============================================
-- Verifica se la subquery funziona
SELECT 
    COUNT(*) as matching_profiles,
    array_agg(organization_id) as org_ids
FROM public.profiles 
WHERE id = auth.uid();

-- STEP 6: Analisi tutte le policy sulla tabella forms
-- ============================================
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN cmd = 'INSERT' AND with_check IS NULL THEN '❌ INSERT BROKEN - NO WITH_CHECK'
        WHEN cmd = 'INSERT' AND with_check IS NOT NULL THEN '✅ INSERT OK'
        WHEN cmd IN ('SELECT', 'UPDATE', 'DELETE') AND qual IS NULL THEN '❌ BROKEN - NO QUAL'
        WHEN cmd IN ('SELECT', 'UPDATE', 'DELETE') AND qual IS NOT NULL THEN '✅ OK'
        ELSE '⚠️ UNKNOWN'
    END as policy_status,
    permissive,
    roles
FROM pg_policies
WHERE tablename = 'forms'
ORDER BY cmd, policyname;
