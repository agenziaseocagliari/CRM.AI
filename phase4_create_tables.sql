-- ===== PHASE 4.1 TASK 1: CONTACT IMPORT SCHEMA =====
-- Creating database schema for advanced contact import/export system
-- Generated: October 12, 2025

-- ===== TABLE 1: contact_imports (Import History Tracking) =====
CREATE TABLE IF NOT EXISTS public.contact_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- File metadata
    filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('csv', 'xlsx', 'vcf')),
    
    -- Import statistics
    total_rows INTEGER NOT NULL DEFAULT 0,
    successful_imports INTEGER NOT NULL DEFAULT 0,
    failed_imports INTEGER NOT NULL DEFAULT 0,
    duplicate_skipped INTEGER NOT NULL DEFAULT 0,
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed', 'cancelled')),
    
    -- Timestamps
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ NULL,
    
    -- Error tracking
    error_message TEXT NULL,
    error_details JSONB NULL,
    
    -- Configuration
    field_mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
    duplicate_strategy VARCHAR(50) NOT NULL DEFAULT 'skip' CHECK (duplicate_strategy IN ('skip', 'update', 'merge')),
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_imports_organization_id ON contact_imports(organization_id);
CREATE INDEX IF NOT EXISTS idx_contact_imports_status ON contact_imports(status);
CREATE INDEX IF NOT EXISTS idx_contact_imports_created_at ON contact_imports(created_at DESC);

-- Enable RLS
ALTER TABLE contact_imports ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see imports from their organization
CREATE POLICY "Users can view their organization's imports" ON contact_imports
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert imports for their organization" ON contact_imports
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid()
        ) AND uploaded_by = auth.uid()
    );

CREATE POLICY "Users can update their organization's imports" ON contact_imports
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- ===== TABLE 2: contact_import_logs (Row-Level Import Results) =====
CREATE TABLE IF NOT EXISTS public.contact_import_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_id UUID NOT NULL REFERENCES contact_imports(id) ON DELETE CASCADE,
    
    -- Row tracking
    row_number INTEGER NOT NULL,
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Result tracking
    status VARCHAR(50) NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'duplicate_skipped')),
    
    -- Success case
    contact_id UUID NULL REFERENCES contacts(id) ON DELETE SET NULL,
    
    -- Error cases
    error_type VARCHAR(100) NULL,
    error_message TEXT NULL,
    error_field VARCHAR(100) NULL,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contact_import_logs_import_id ON contact_import_logs(import_id);
CREATE INDEX IF NOT EXISTS idx_contact_import_logs_status ON contact_import_logs(status);
CREATE INDEX IF NOT EXISTS idx_contact_import_logs_contact_id ON contact_import_logs(contact_id) WHERE contact_id IS NOT NULL;

-- Enable RLS
ALTER TABLE contact_import_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can see logs only for imports they can access
CREATE POLICY "Users can view logs for accessible imports" ON contact_import_logs
    FOR SELECT USING (
        import_id IN (
            SELECT id FROM contact_imports
            WHERE organization_id IN (
                SELECT organization_id FROM profiles 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert logs for accessible imports" ON contact_import_logs
    FOR INSERT WITH CHECK (
        import_id IN (
            SELECT id FROM contact_imports
            WHERE organization_id IN (
                SELECT organization_id FROM profiles 
                WHERE id = auth.uid()
            )
        )
    );

-- ===== TABLE 3: contact_field_mappings (Saved Mapping Templates) =====
CREATE TABLE IF NOT EXISTS public.contact_field_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Template info
    template_name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    
    -- Configuration
    field_mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Usage tracking
    times_used INTEGER NOT NULL DEFAULT 0,
    last_used_at TIMESTAMPTZ NULL,
    
    -- Default template per organization
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure only one default per organization
    UNIQUE(organization_id, template_name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contact_field_mappings_organization_id ON contact_field_mappings(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_field_mappings_default 
    ON contact_field_mappings(organization_id) 
    WHERE is_default = true;

-- Enable RLS
ALTER TABLE contact_field_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Organization isolation
CREATE POLICY "Users can view their organization's field mappings" ON contact_field_mappings
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert field mappings for their organization" ON contact_field_mappings
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid()
        ) AND created_by = auth.uid()
    );

CREATE POLICY "Users can update their organization's field mappings" ON contact_field_mappings
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their organization's field mappings" ON contact_field_mappings
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid()
        )
    );