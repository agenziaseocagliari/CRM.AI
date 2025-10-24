-- =====================================================
-- FASE 0: COMPANY KNOWLEDGE BASE
-- Migration: Create storage bucket and database tables
-- Date: 23 October 2025
-- =====================================================

-- 1. CREATE STORAGE BUCKET
-- =====================================================
INSERT INTO
    storage.buckets (id, name, public)
VALUES (
        'company-knowledge',
        'company-knowledge',
        false
    ) ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Organization can only access their own files
CREATE POLICY "Organization access own knowledge files"
ON storage.objects 
FOR ALL
TO public
USING (
  bucket_id = 'company-knowledge'
  AND (storage.foldername(name))::text = (
    SELECT organization_id::text 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- 2. CREATE DATABASE TABLES
-- =====================================================

-- Table: company_knowledge_sources
CREATE TABLE IF NOT EXISTS company_knowledge_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

-- Source info
source_type TEXT NOT NULL CHECK (
    source_type IN ('file', 'url', 'text')
),
source_name TEXT NOT NULL,
source_url TEXT, -- URL if type=url, storage path if type=file

-- Content
original_content TEXT, -- For text type or scraped content
extracted_text TEXT, -- Processed/cleaned text

-- Metadata
file_size INTEGER, -- bytes, for files
file_type TEXT, -- PDF, DOC, PPT, etc.

-- Processing status
processing_status TEXT DEFAULT 'pending' CHECK (
    processing_status IN (
        'pending',
        'processing',
        'completed',
        'failed'
    )
),
error_message TEXT,

-- Timestamps
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),
last_processed_at TIMESTAMPTZ,

-- Indexes
UNIQUE(organization_id, source_type, source_name) );

CREATE INDEX idx_knowledge_sources_org ON company_knowledge_sources (organization_id);

CREATE INDEX idx_knowledge_sources_status ON company_knowledge_sources (processing_status);

-- Table: company_profiles (generated summary)
CREATE TABLE IF NOT EXISTS company_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,

-- Auto-generated fields
company_name TEXT,
  specializations TEXT[], -- ["RC Auto", "Vita", "Casa"]
  tone_of_voice TEXT, -- "formale", "amichevole", "tecnico"
  values TEXT[], -- Core values extracted
  target_clients TEXT, -- Description of ideal client
  unique_selling_points TEXT[], -- USPs

-- Summary
ai_generated_summary TEXT, -- One-paragraph company description

-- Metadata
generated_at TIMESTAMPTZ,
  sources_used INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ENABLE RLS
-- =====================================================
ALTER TABLE company_knowledge_sources ENABLE ROW LEVEL SECURITY;

ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES
-- =====================================================

-- Policy: Users access own org knowledge sources
DROP POLICY IF EXISTS "Users access own org knowledge" ON company_knowledge_sources;

CREATE POLICY "Users access own org knowledge"
ON company_knowledge_sources
FOR ALL
TO public
USING (
  organization_id IN (
    SELECT organization_id
    FROM profiles
    WHERE id = auth.uid()
  )
);

-- Policy: Users access own company profile
DROP POLICY IF EXISTS "Users access own company profile" ON company_profiles;

CREATE POLICY "Users access own company profile"
ON company_profiles
FOR ALL
TO public
USING (
  organization_id IN (
    SELECT organization_id
    FROM profiles
    WHERE id = auth.uid()
  )
);

-- 5. TRIGGER: Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_knowledge_sources_updated_at ON company_knowledge_sources;

CREATE TRIGGER update_knowledge_sources_updated_at
  BEFORE UPDATE ON company_knowledge_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_profiles_updated_at ON company_profiles;

CREATE TRIGGER update_company_profiles_updated_at
  BEFORE UPDATE ON company_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- END MIGRATION
-- =====================================================