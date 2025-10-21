-- =====================================================
-- INSURANCE DOCUMENT MANAGEMENT SYSTEM
-- Created: October 21, 2025
-- Purpose: Enable document upload/management for Insurance vertical
-- =====================================================

-- Create insurance_documents table
CREATE TABLE IF NOT EXISTS insurance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Document metadata
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL, -- 'pdf', 'image', 'document', etc.
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL, -- bytes
  
  -- Storage info
  storage_bucket VARCHAR(100) NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  
  -- Classification
  document_category VARCHAR(50) NOT NULL, -- 'policy', 'claim', 'contact', 'general'
  document_type VARCHAR(100), -- 'contract', 'photo_damage', 'id_card', etc.
  
  -- Relationships
  related_entity_type VARCHAR(50), -- 'policy', 'claim', 'contact'
  related_entity_id UUID,
  
  -- Content
  description TEXT,
  tags TEXT[], -- searchable tags
  extracted_text TEXT, -- OCR results (future)
  
  -- Metadata
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE,
  
  -- Search optimization
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('italian', COALESCE(filename, '')), 'A') ||
    setweight(to_tsvector('italian', COALESCE(description, '')), 'B') ||
    setweight(to_tsvector('italian', COALESCE(extracted_text, '')), 'C')
  ) STORED,
  
  -- Constraints
  CONSTRAINT valid_category CHECK (document_category IN ('policy', 'claim', 'contact', 'general')),
  CONSTRAINT valid_file_size CHECK (file_size > 0 AND file_size <= 10485760) -- max 10MB
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_documents_organization ON insurance_documents(organization_id);
CREATE INDEX idx_documents_category ON insurance_documents(document_category);
CREATE INDEX idx_documents_entity ON insurance_documents(related_entity_type, related_entity_id);
CREATE INDEX idx_documents_uploaded_at ON insurance_documents(uploaded_at DESC);
CREATE INDEX idx_documents_search ON insurance_documents USING GIN(search_vector);
CREATE INDEX idx_documents_tags ON insurance_documents USING GIN(tags);
CREATE INDEX idx_documents_uploaded_by ON insurance_documents(uploaded_by);

-- Composite index for common queries
CREATE INDEX idx_documents_org_category ON insurance_documents(organization_id, document_category);
CREATE INDEX idx_documents_org_entity ON insurance_documents(organization_id, related_entity_type, related_entity_id);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

ALTER TABLE insurance_documents ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view documents in their organization
CREATE POLICY "Users can view documents in their organization"
ON insurance_documents FOR SELECT
USING (
  organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid
);

-- INSERT: Users can upload documents to their organization
CREATE POLICY "Users can upload documents to their organization"
ON insurance_documents FOR INSERT
WITH CHECK (
  organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid
  AND uploaded_by = auth.uid()
);

-- UPDATE: Users can update documents in their organization
CREATE POLICY "Users can update documents in their organization"
ON insurance_documents FOR UPDATE
USING (
  organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid
);

-- DELETE: Users can delete documents in their organization (admins only could be added)
CREATE POLICY "Users can delete documents in their organization"
ON insurance_documents FOR DELETE
USING (
  organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid
);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON insurance_documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HELPER VIEWS
-- =====================================================

-- Recent documents view
CREATE OR REPLACE VIEW recent_documents AS
SELECT 
  d.*,
  u.email as uploaded_by_email,
  CASE 
    WHEN d.file_type = 'image' THEN '📷'
    WHEN d.file_type = 'pdf' THEN '📄'
    WHEN d.file_type = 'document' THEN '📝'
    WHEN d.file_type = 'spreadsheet' THEN '📊'
    ELSE '📎'
  END as icon
FROM insurance_documents d
LEFT JOIN auth.users u ON d.uploaded_by = u.id
WHERE d.is_archived = FALSE
ORDER BY d.uploaded_at DESC;

-- Documents by category view
CREATE OR REPLACE VIEW documents_by_category AS
SELECT 
  organization_id,
  document_category,
  COUNT(*) as document_count,
  SUM(file_size) as total_size_bytes,
  ROUND(SUM(file_size) / 1024.0 / 1024.0, 2) as total_size_mb
FROM insurance_documents
WHERE is_archived = FALSE
GROUP BY organization_id, document_category;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE insurance_documents IS 'Stores metadata for all uploaded documents in Insurance vertical';
COMMENT ON COLUMN insurance_documents.storage_bucket IS 'Supabase storage bucket name';
COMMENT ON COLUMN insurance_documents.storage_path IS 'Full path in storage bucket: org_id/filename';
COMMENT ON COLUMN insurance_documents.search_vector IS 'Full-text search vector for Italian language';
COMMENT ON COLUMN insurance_documents.extracted_text IS 'OCR extracted text (future feature)';

-- =====================================================
-- STORAGE BUCKET SETUP INSTRUCTIONS
-- =====================================================

/*
MANUAL STEPS REQUIRED IN SUPABASE DASHBOARD:

1. Go to Storage > Create new bucket
2. Create these buckets (all PRIVATE):
   - insurance-policy-documents
   - insurance-claim-documents  
   - insurance-contact-documents
   - insurance-general-attachments

3. For EACH bucket, add these RLS policies:

   SELECT policy: "Users can view files in their org folder"
   (bucket_id = 'insurance-policy-documents' AND 
    (storage.foldername(name))[1] = (auth.jwt() -> 'user_metadata' ->> 'organization_id'))

   INSERT policy: "Users can upload to their org folder"  
   (bucket_id = 'insurance-policy-documents' AND
    (storage.foldername(name))[1] = (auth.jwt() -> 'user_metadata' ->> 'organization_id'))

   UPDATE policy: "Users can update files in their org folder"
   (bucket_id = 'insurance-policy-documents' AND
    (storage.foldername(name))[1] = (auth.jwt() -> 'user_metadata' ->> 'organization_id'))

   DELETE policy: "Users can delete files in their org folder"
   (bucket_id = 'insurance-policy-documents' AND
    (storage.foldername(name))[1] = (auth.jwt() -> 'user_metadata' ->> 'organization_id'))

   (Repeat for all 4 buckets, changing bucket_id)
*/

-- =====================================================
-- SAMPLE DATA (FOR TESTING)
-- =====================================================

-- Uncomment to insert sample data
/*
INSERT INTO insurance_documents (
  organization_id,
  filename,
  original_filename,
  file_type,
  mime_type,
  file_size,
  storage_bucket,
  storage_path,
  public_url,
  document_category,
  document_type,
  related_entity_type,
  description,
  tags
) VALUES (
  '80302804-3210-4acc-ba20-eab5163fce13', -- Replace with your org_id
  '1729516800_policy_contract.pdf',
  'policy_contract.pdf',
  'pdf',
  'application/pdf',
  245678,
  'insurance-policy-documents',
  '80302804-3210-4acc-ba20-eab5163fce13/1729516800_policy_contract.pdf',
  'https://your-project.supabase.co/storage/v1/object/public/insurance-policy-documents/...',
  'policy',
  'contract',
  'policy',
  'Contratto polizza RC Auto 2025',
  ARRAY['contratto', 'rc-auto', '2025']
);
*/
