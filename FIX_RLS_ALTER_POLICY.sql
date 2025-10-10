-- ============================================
-- FIX ALTERNATIVO: Usa ALTER POLICY
-- ============================================

-- PROBLEMA: Il CREATE POLICY non salva WITH CHECK
-- SOLUZIONE: Provare ALTER POLICY per modificare quella esistente

-- OPZIONE 1: ALTER la policy esistente
ALTER POLICY "forms_insert_policy" 
ON public.forms 
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Se OPZIONE 1 fallisce, prova OPZIONE 2:
-- DROP completo e ricrea da zero con sintassi estesa

DROP POLICY "forms_insert_policy" ON public.forms;

CREATE POLICY "forms_insert_policy" 
ON public.forms 
AS PERMISSIVE
FOR INSERT 
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
      AND organization_id = forms.organization_id
  )
);

-- Verifica finale
SELECT 
    policyname, 
    cmd,
    roles,
    CASE 
        WHEN qual IS NULL THEN '❌ BROKEN - NO CHECK'
        ELSE '✅ OK - HAS CHECK'
    END as status,
    permissive,
    qual IS NOT NULL as has_check_condition
FROM pg_policies
WHERE tablename = 'forms' 
  AND policyname = 'forms_insert_policy';
