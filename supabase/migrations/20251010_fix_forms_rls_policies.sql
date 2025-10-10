-- ========================================
-- FIX: Forms RLS Policies
-- Issue: "new row violates row-level security policy for table forms"
-- Solution: Create proper RLS policies for forms table
-- ========================================

-- Enable RLS on forms table
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

-- DROP existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "forms_select_policy" ON public.forms;
DROP POLICY IF EXISTS "forms_insert_policy" ON public.forms;
DROP POLICY IF EXISTS "forms_update_policy" ON public.forms;
DROP POLICY IF EXISTS "forms_delete_policy" ON public.forms;

-- SELECT: Users can view forms from their organization
CREATE POLICY "forms_select_policy" ON public.forms
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- INSERT: Users can create forms for their organization
CREATE POLICY "forms_insert_policy" ON public.forms
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- UPDATE: Users can update forms from their organization
CREATE POLICY "forms_update_policy" ON public.forms
FOR UPDATE
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

-- DELETE: Users can delete forms from their organization
CREATE POLICY "forms_delete_policy" ON public.forms
FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Verify policies
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'USING clause exists'
        ELSE 'No USING clause'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'WITH CHECK clause exists'
        ELSE 'No WITH CHECK clause'
    END as with_check_clause
FROM pg_policies 
WHERE tablename = 'forms'
ORDER BY policyname;
