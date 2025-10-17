-- ================================================
-- Insurance Policies Table Migration - FIXED VERSION
-- Date: October 17, 2025
-- Purpose: Complete CRUD system for insurance policies management
-- FIXES:
-- 1. contact_id type: INTEGER → UUID (confirmed from investigation)
-- 2. CREATE POLICY syntax: removed IF NOT EXISTS (not supported)
-- 3. Added safety: DROP POLICY IF EXISTS before CREATE POLICY
-- ================================================

-- Drop table if exists (for clean migration)
DROP TABLE IF EXISTS insurance_policies CASCADE;

-- ================================================
-- Insurance Policies Table
-- ================================================

CREATE TABLE insurance_policies (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign Keys (FIXED: contact_id is now UUID)
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    
    -- Policy Information
    policy_number VARCHAR(50) UNIQUE NOT NULL,
    policy_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    insurance_company VARCHAR(100) NOT NULL,
    
    -- Financial Information
    premium_amount DECIMAL(10,2) NOT NULL,
    premium_frequency VARCHAR(20) NOT NULL,
    coverage_amount DECIMAL(12,2),
    deductible DECIMAL(10,2),
    
    -- Dates
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Additional Info
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT check_policy_type CHECK (policy_type IN ('Auto', 'Casa', 'Vita', 'Infortuni', 'Salute')),
    CONSTRAINT check_status CHECK (status IN ('active', 'expired', 'cancelled', 'renewed')),
    CONSTRAINT check_premium_frequency CHECK (premium_frequency IN ('monthly', 'quarterly', 'annual')),
    CONSTRAINT check_premium_amount CHECK (premium_amount > 0),
    CONSTRAINT check_dates CHECK (end_date > start_date)
);

-- ================================================
-- Indexes for Performance
-- ================================================

CREATE INDEX idx_insurance_policies_org
ON insurance_policies(organization_id);

CREATE INDEX idx_insurance_policies_contact
ON insurance_policies(contact_id);

CREATE INDEX idx_insurance_policies_end_date
ON insurance_policies(end_date);

CREATE INDEX idx_insurance_policies_status
ON insurance_policies(status);

CREATE INDEX idx_insurance_policies_policy_number
ON insurance_policies(policy_number);

CREATE INDEX idx_insurance_policies_policy_type
ON insurance_policies(policy_type);

-- ================================================
-- Row Level Security (RLS)
-- ================================================

ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (safety measure)
DROP POLICY IF EXISTS "Users can view their organization's policies" ON insurance_policies;
DROP POLICY IF EXISTS "Users can create policies for their organization" ON insurance_policies;
DROP POLICY IF EXISTS "Users can update their organization's policies" ON insurance_policies;
DROP POLICY IF EXISTS "Users can delete their organization's policies" ON insurance_policies;

-- Policy 1: SELECT (View) - FIXED: Removed IF NOT EXISTS
CREATE POLICY "Users can view their organization's policies"
ON insurance_policies
FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

-- Policy 2: INSERT (Create)
CREATE POLICY "Users can create policies for their organization"
ON insurance_policies
FOR INSERT
TO authenticated
WITH CHECK (
    organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

-- Policy 3: UPDATE (Modify)
CREATE POLICY "Users can update their organization's policies"
ON insurance_policies
FOR UPDATE
TO authenticated
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

-- Policy 4: DELETE (Remove)
CREATE POLICY "Users can delete their organization's policies"
ON insurance_policies
FOR DELETE
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

-- ================================================
-- Trigger for updated_at
-- ================================================

-- Drop function if exists (idempotent)
DROP FUNCTION IF EXISTS update_insurance_policies_updated_at() CASCADE;

-- Create function
CREATE FUNCTION update_insurance_policies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_insurance_policies_updated_at 
    BEFORE UPDATE ON insurance_policies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_insurance_policies_updated_at();

-- ================================================
-- Permissions
-- ================================================

GRANT ALL ON insurance_policies TO authenticated;
GRANT ALL ON insurance_policies TO service_role;

-- ================================================
-- Verification Queries
-- ================================================

-- 1. Verify table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'insurance_policies'
ORDER BY ordinal_position;

-- 2. Verify foreign keys
SELECT 
    tc.constraint_name,
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'insurance_policies' 
    AND tc.constraint_type = 'FOREIGN KEY';

-- 3. Verify RLS policies
SELECT 
    schemaname,
    tablename, 
    policyname, 
    permissive,
    roles, 
    cmd 
FROM pg_policies 
WHERE tablename = 'insurance_policies';

-- 4. Verify indexes
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'insurance_policies';

-- 5. Test query (should return 0 rows but no error)
SELECT 
    id,
    policy_number,
    policy_type,
    status,
    insurance_company,
    premium_amount,
    start_date,
    end_date
FROM insurance_policies 
LIMIT 1;