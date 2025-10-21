-- Fix Circular Self-Reference in profiles SELECT Policy
BEGIN;

-- Step 1: Rimuovi la policy problematica con dipendenza circolare
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;

-- Step 2: Crea policy semplificata per accesso diretto al proprio profilo
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT
  TO public
  USING (id = auth.uid());

-- Step 3: Crea policy per visibilità organizzazione usando JWT claims
CREATE POLICY "profiles_select_organization" ON profiles
  FOR SELECT
  TO public
  USING (
    organization_id = (
      (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid
    )
  );

COMMIT;

-- Verifica risultato
SELECT COUNT(*) as total_policies FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles';
