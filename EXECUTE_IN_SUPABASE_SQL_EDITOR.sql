-- =================================================================
-- ISTRUZIONI: Esegui questo script nella Supabase SQL Editor
-- Dashboard: https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi
-- Percorso: Database → SQL Editor → New Query
-- =================================================================

-- Fix Circular Self-Reference in profiles SELECT Policy
-- Risolve l'errore "Profile lookup failed" durante il login

BEGIN;

-- Step 1: Rimuovi la policy problematica con dipendenza circolare
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;

-- Step 2: Crea policy semplificata per accesso diretto al proprio profilo
-- Permette agli utenti di vedere il proprio profilo senza subquery
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT
  TO public
  USING (id = auth.uid());

-- Step 3: Crea policy per visibilità organizzazione usando JWT claims
-- Evita la dipendenza circolare leggendo dal JWT invece di interrogare profiles
CREATE POLICY "profiles_select_organization" ON profiles
  FOR SELECT
  TO public
  USING (
    organization_id = (
      (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid
    )
  );

COMMIT;

-- =================================================================
-- VERIFICA IL RISULTATO
-- =================================================================

-- Controlla tutte le policy su profiles
SELECT 
  polname, 
  polcmd::text as command,
  polroles::regrole[]::text[] as roles,
  pg_get_expr(polqual, polrelid) as using_clause
FROM pg_policy 
WHERE polrelid = 'profiles'::regclass 
ORDER BY polname;

-- Conta le policy totali (dovrebbero essere 9: 8 originali -1 +2)
SELECT COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles';

-- =================================================================
-- OUTPUT ATTESO
-- =================================================================
-- ✅ profiles_select_own: accesso diretto (id = auth.uid())
-- ✅ profiles_select_organization: membri organizzazione via JWT
-- ✅ Super admin policies: 3 policy invariate
-- ✅ Total policies: 9
-- =================================================================
