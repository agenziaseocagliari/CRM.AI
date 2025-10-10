-- ============================================
-- FIX CRITICO: forms_insert_policy ha qual=null
-- Data: 2025-10-10
-- ============================================

-- PROBLEMA IDENTIFICATO:
-- La policy forms_insert_policy ha qual=null
-- Questo blocca TUTTI gli inserimenti!

-- STEP 1: DROP la policy INSERT rotta
DROP POLICY IF EXISTS "forms_insert_policy" ON public.forms;

-- STEP 2: RICREA con la condizione corretta
CREATE POLICY "forms_insert_policy" ON public.forms
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- STEP 3: VERIFICA (query semplificata)
SELECT 
    tablename,
    policyname, 
    cmd,
    CASE 
        WHEN qual IS NULL THEN '❌ BROKEN - NO CONDITION'
        ELSE '✅ OK - HAS CONDITION'
    END as status
FROM pg_policies
WHERE tablename = 'forms' 
  AND policyname = 'forms_insert_policy';

-- ============================================
-- OUTPUT ATTESO:
-- ============================================
-- tablename | policyname           | cmd    | status
-- ----------+----------------------+--------+----------------------
-- forms     | forms_insert_policy  | INSERT | ✅ OK - HAS CONDITION
-- ============================================
