# PHASE 4.1 TASK 1 - MANUAL EXECUTION REQUIRED

## CURRENT STATUS: Phase 2 - Manual SQL Execution Needed

**Problem**: The remote Supabase instance doesn't have SQL execution RPC functions enabled, so we need to execute the migration manually in Supabase Studio.

## EXECUTE IN SUPABASE STUDIO

**Instructions**:
1. Go to https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi
2. Navigate to SQL Editor
3. Execute the following SQL statements **one by one**:

### STEP 1: Create contact_imports table

```sql
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
```

### STEP 2: Create indexes for contact_imports

```sql
CREATE INDEX IF NOT EXISTS idx_contact_imports_organization_id ON contact_imports(organization_id);
CREATE INDEX IF NOT EXISTS idx_contact_imports_status ON contact_imports(status);
CREATE INDEX IF NOT EXISTS idx_contact_imports_created_at ON contact_imports(created_at DESC);
```

### STEP 3: Enable RLS on contact_imports

```sql
ALTER TABLE contact_imports ENABLE ROW LEVEL SECURITY;
```

### STEP 4: Create RLS policies for contact_imports

```sql
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
```

### STEP 5: Create contact_import_logs table

```sql
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
```

### STEP 6: Create indexes for contact_import_logs

```sql
CREATE INDEX IF NOT EXISTS idx_contact_import_logs_import_id ON contact_import_logs(import_id);
CREATE INDEX IF NOT EXISTS idx_contact_import_logs_status ON contact_import_logs(status);
CREATE INDEX IF NOT EXISTS idx_contact_import_logs_contact_id ON contact_import_logs(contact_id) WHERE contact_id IS NOT NULL;
```

### STEP 7: Enable RLS on contact_import_logs

```sql
ALTER TABLE contact_import_logs ENABLE ROW LEVEL SECURITY;
```

### STEP 8: Create RLS policies for contact_import_logs

```sql
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
```

### STEP 9: Create contact_field_mappings table

```sql
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
```

### STEP 10: Create indexes for contact_field_mappings

```sql
CREATE INDEX IF NOT EXISTS idx_contact_field_mappings_organization_id ON contact_field_mappings(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_field_mappings_default 
    ON contact_field_mappings(organization_id) 
    WHERE is_default = true;
```

### STEP 11: Enable RLS on contact_field_mappings

```sql
ALTER TABLE contact_field_mappings ENABLE ROW LEVEL SECURITY;
```

### STEP 12: Create RLS policies for contact_field_mappings

```sql
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
```

## VERIFICATION QUERIES

After executing all the above, run these to verify:

```sql
-- Check if tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%import%' 
ORDER BY table_name;

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('contact_imports', 'contact_import_logs', 'contact_field_mappings')
AND schemaname = 'public';

-- Test insert (will fail if RLS not working properly)
INSERT INTO contact_imports (organization_id, uploaded_by, filename, file_size, file_type)
VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'test.csv', 1024, 'csv');
```

## NEXT STEPS AFTER MANUAL EXECUTION

Once you've executed all SQL in Supabase Studio, I can continue with:
- Phase 3: Enhance existing contacts table
- Phase 4: Create helper functions  
- Phase 5: Testing and verification
- Phase 6: Documentation
- Phase 7: Git commit

## STATUS
- ❌ Phase 2: BLOCKED - Requires manual SQL execution in Supabase Studio
- ⏳ Waiting for manual execution to continue

**CRITICAL**: Execute all SQL above in Supabase Studio, then let me know when complete so I can continue with the remaining phases.