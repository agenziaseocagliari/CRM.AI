-- ============================================================================
-- 🔍 VERIFICA COMPLETA POLICIES FORMS TABLE
-- ============================================================================
-- Esegui questo in Supabase SQL Editor per confermare policy creation
-- ============================================================================

-- 1️⃣ CHECK: Lista tutte le policies sulla tabella forms
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual::text AS condition,
  with_check::text AS with_check_condition
FROM pg_policies 
WHERE tablename = 'forms'
ORDER BY policyname;

-- Expected output: 5 policies
-- 1. "Public forms can be viewed by anyone" (SELECT, qual: true)
-- 2. "Users can delete their own forms"
-- 3. "Users can insert their own forms"
-- 4. "Users can update their own forms"
-- 5. "Users can view their own forms"

-- ============================================================================

-- 2️⃣ CHECK: Verifica policy pubblica specifica
SELECT 
  policyname,
  cmd AS command_type,
  qual::text AS using_condition,
  permissive
FROM pg_policies 
WHERE tablename = 'forms' 
  AND policyname = 'Public forms can be viewed by anyone';

-- Expected:
-- | policyname                        | command_type | using_condition | permissive |
-- |-----------------------------------|--------------|-----------------|------------|
-- | Public forms can be viewed by anyone | SELECT       | true            | PERMISSIVE |

-- ============================================================================

-- 3️⃣ TEST: Simula accesso anonimo (anon role)
SET ROLE anon;

-- Questo dovrebbe funzionare SENZA errore RLS
SELECT id, name, title 
FROM forms 
LIMIT 5;

-- Se ritorna rows: ✅ Policy funziona
-- Se RLS error: ❌ Policy non applicata

RESET ROLE;

-- ============================================================================

-- 4️⃣ CHECK: Verifica RLS abilitato su forms
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables 
WHERE tablename = 'forms';

-- Expected: rls_enabled = true

-- ============================================================================

-- 5️⃣ DEBUG: Se policy mancante, controlla pg_class
SELECT 
  relname AS table_name,
  relrowsecurity AS rls_enabled,
  relforcerowsecurity AS rls_forced
FROM pg_class 
WHERE relname = 'forms';

-- ============================================================================

-- 6️⃣ ALTERNATIVE CHECK: Via information_schema
SELECT 
  table_schema,
  table_name,
  privilege_type,
  grantee
FROM information_schema.table_privileges
WHERE table_name = 'forms'
  AND grantee = 'anon'
ORDER BY privilege_type;

-- ============================================================================
