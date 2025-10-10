-- ============================================
-- FIX FORZATO: Ricrea forms_insert_policy
-- ============================================

-- STEP 1: Verifica policy esistenti
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'forms' AND cmd = 'INSERT';

-- STEP 2: DROP tutte le policy INSERT (con varianti nome)
DROP POLICY IF EXISTS "forms_insert_policy" ON public.forms CASCADE;
DROP POLICY IF EXISTS forms_insert_policy ON public.forms CASCADE;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.forms CASCADE;
DROP POLICY IF EXISTS "Enable insert for organization members" ON public.forms CASCADE;

-- STEP 3: Ricrea la policy con WITH CHECK corretto
CREATE POLICY "forms_insert_policy" 
ON public.forms 
FOR INSERT 
TO public
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- STEP 4: Verifica finale
SELECT 
    policyname, 
    cmd,
    roles,
    CASE 
        WHEN qual IS NULL THEN '❌ BROKEN - NO CHECK CONDITION'
        ELSE '✅ OK - HAS CHECK CONDITION'
    END as status
FROM pg_policies
WHERE tablename = 'forms' 
  AND cmd = 'INSERT'
ORDER BY policyname;
