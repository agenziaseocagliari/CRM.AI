-- ========================================
-- MIGRATION: Add metadata column to forms
-- Date: 2025-01-10
-- Purpose: Store AI-generated metadata (industry, confidence, platform, GDPR)
-- ========================================

-- Add metadata column if not exists
ALTER TABLE public.forms 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_forms_metadata 
ON public.forms USING gin (metadata);

-- Add comment for documentation
COMMENT ON COLUMN public.forms.metadata IS 
'AI-generated metadata: industry detection, confidence score, platform type, GDPR compliance, etc.';

-- Verify schema
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'forms' 
    AND column_name = 'metadata'
  ) THEN
    RAISE NOTICE '✅ metadata column exists';
  ELSE
    RAISE EXCEPTION '❌ metadata column not created';
  END IF;

  IF EXISTS (
    SELECT 1 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'forms' 
    AND indexname = 'idx_forms_metadata'
  ) THEN
    RAISE NOTICE '✅ idx_forms_metadata index exists';
  ELSE
    RAISE EXCEPTION '❌ idx_forms_metadata index not created';
  END IF;
END $$;
