-- =====================================================
-- FIX COMPLETE: COMPANY KNOWLEDGE BASE RLS POLICIES
-- Migration: Fix all RLS issues (406, 400, insert errors)
-- Date: 23 October 2025 - 19:06
-- =====================================================

-- ============================================
-- FIX 1: STORAGE BUCKET RLS POLICIES
-- ============================================

-- Drop existing storage policy (if any)
DROP POLICY IF EXISTS "Organization access own knowledge files" ON storage.objects;

-- Create correct storage policies
-- Policy: Users can upload files to their organization folder
CREATE POLICY "Users can upload to own org folder"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'company-knowledge'
  AND (storage.foldername(name)) IN (
    SELECT organization_id::text
    FROM profiles
    WHERE id = auth.uid()
  )
);

-- Policy: Users can read files from their organization folder
CREATE POLICY "Users can read own org files"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'company-knowledge'
  AND (storage.foldername(name)) IN (
    SELECT organization_id::text
    FROM profiles
    WHERE id = auth.uid()
  )
);

-- Policy: Users can delete files from their organization folder
CREATE POLICY "Users can delete own org files"
ON storage.objects
FOR DELETE
TO public
USING (
  bucket_id = 'company-knowledge'
  AND (storage.foldername(name)) IN (
    SELECT organization_id::text
    FROM profiles
    WHERE id = auth.uid()
  )
);

-- ============================================
-- FIX 2: COMPANY_KNOWLEDGE_SOURCES TABLE
-- ============================================

-- Drop old policy
DROP POLICY IF EXISTS "Users access own org knowledge" ON company_knowledge_sources;

-- Create comprehensive policies (one per operation)
CREATE POLICY "Users can select own org sources"
ON company_knowledge_sources
FOR SELECT
TO public
USING (
  organization_id IN (
    SELECT organization_id
    FROM profiles
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert own org sources"
ON company_knowledge_sources
FOR INSERT
TO public
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM profiles
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update own org sources"
ON company_knowledge_sources
FOR UPDATE
TO public
USING (
  organization_id IN (
    SELECT organization_id
    FROM profiles
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM profiles
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete own org sources"
ON company_knowledge_sources
FOR DELETE
TO public
USING (
    organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE
            id = auth.uid ()
    )
);

-- ============================================
-- FIX 3: COMPANY_PROFILES TABLE
-- ============================================

-- Drop old policy
DROP POLICY IF EXISTS "Users access own company profile" ON company_profiles;

-- Create comprehensive policies (one per operation)
CREATE POLICY "Users can select own company profile"
ON company_profiles
FOR SELECT
TO public
USING (
  organization_id IN (
    SELECT organization_id
    FROM profiles
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert own company profile"
ON company_profiles
FOR INSERT
TO public
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM profiles
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update own company profile"
ON company_profiles
FOR UPDATE
TO public
USING (
  organization_id IN (
    SELECT organization_id
    FROM profiles
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM profiles
    WHERE id = auth.uid()
  )
);

-- ============================================
-- VERIFICATION QUERY (run after migration)
-- ============================================
-- To verify all policies are created, run:
-- SELECT schemaname, tablename, policyname
-- FROM pg_policies
-- WHERE tablename IN ('company_knowledge_sources', 'company_profiles')
-- ORDER BY tablename, policyname;

-- =====================================================
-- END MIGRATION
-- =====================================================