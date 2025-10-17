-- ================================================
-- Insurance Policies Table Migration
-- Date: October 18, 2025
-- Purpose: Complete CRUD system for insurance policies management
-- ================================================

-- Drop table if exists (for clean migration)
DROP TABLE IF EXISTS insurance_policies CASCADE;

-- ================================================
-- Insurance Policies Table
-- ================================================

CREATE TABLE IF NOT EXISTS insurance_policies (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign Keys
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

CREATE INDEX IF NOT EXISTS idx_insurance_policies_org
ON insurance_policies(organization_id);

CREATE INDEX IF NOT EXISTS idx_insurance_policies_contact
ON insurance_policies(contact_id);

CREATE INDEX IF NOT EXISTS idx_insurance_policies_end_date
ON insurance_policies(end_date);

CREATE INDEX IF NOT EXISTS idx_insurance_policies_status
ON insurance_policies(status);

CREATE INDEX IF NOT EXISTS idx_insurance_policies_policy_number
ON insurance_policies(policy_number);

CREATE INDEX IF NOT EXISTS idx_insurance_policies_policy_type
ON insurance_policies(policy_type);

-- ================================================
-- Row Level Security (RLS)
-- ================================================

ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view policies from their organization
CREATE POLICY IF NOT EXISTS "Users can view their organization's policies"
ON insurance_policies
FOR SELECT
TO public
USING (
    organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

-- Policy: Users can insert policies for their organization
CREATE POLICY IF NOT EXISTS "Users can create policies for their organization"
ON insurance_policies
FOR INSERT
TO public
WITH CHECK (
    organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

-- Policy: Users can update policies in their organization
CREATE POLICY IF NOT EXISTS "Users can update their organization's policies"
ON insurance_policies
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

-- Policy: Users can delete policies in their organization
CREATE POLICY IF NOT EXISTS "Users can delete their organization's policies"
ON insurance_policies
FOR DELETE
TO public
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

CREATE OR REPLACE FUNCTION update_insurance_policies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_insurance_policies_updated_at 
    BEFORE UPDATE ON insurance_policies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_insurance_policies_updated_at();

-- ================================================
-- Permissions
-- ================================================

-- Note: Table permissions are managed automatically by Supabase
-- RLS policies above control access for authenticated users

-- ================================================
-- Sample Data for Testing (Optional)
-- ================================================

-- Note: This will be populated by users in the application
-- Sample query structure for verification:
-- INSERT INTO insurance_policies (organization_id, contact_id, policy_number, policy_type, status, insurance_company, premium_amount, premium_frequency, start_date, end_date)
-- VALUES (...);

-- ================================================
-- Verification Query
-- ================================================

-- Test query (should return 0 rows but no error)
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

-- Verify table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'insurance_policies'
ORDER BY ordinal_position;