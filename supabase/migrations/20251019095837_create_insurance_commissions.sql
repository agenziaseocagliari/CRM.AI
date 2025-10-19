-- Create insurance_commissions table for Commission Tracking module
-- Sprint 2 Session 1 - Database Foundation

CREATE TABLE IF NOT EXISTS insurance_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    policy_id UUID REFERENCES insurance_policies (id) ON DELETE SET NULL,
    contact_id UUID NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
    commission_type TEXT NOT NULL CHECK (
        commission_type IN (
            'base',
            'renewal',
            'bonus',
            'override'
        )
    ),
    base_premium NUMERIC(12, 2) NOT NULL CHECK (base_premium >= 0),
    commission_rate NUMERIC(5, 2) NOT NULL CHECK (
        commission_rate >= 0
        AND commission_rate <= 100
    ),
    commission_amount NUMERIC(12, 2) NOT NULL CHECK (commission_amount >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN (
            'pending',
            'calculated',
            'paid',
            'cancelled'
        )
    ),
    calculation_date TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        payment_date TIMESTAMP
    WITH
        TIME ZONE,
        notes TEXT,
        created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_insurance_commissions_organization_id ON insurance_commissions (organization_id);

CREATE INDEX IF NOT EXISTS idx_insurance_commissions_policy_id ON insurance_commissions (policy_id)
WHERE
    policy_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_insurance_commissions_contact_id ON insurance_commissions (contact_id);

CREATE INDEX IF NOT EXISTS idx_insurance_commissions_status ON insurance_commissions (status);

CREATE INDEX IF NOT EXISTS idx_insurance_commissions_calculation_date ON insurance_commissions (calculation_date);

CREATE INDEX IF NOT EXISTS idx_insurance_commissions_commission_type ON insurance_commissions (commission_type);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_insurance_commissions_org_status_date ON insurance_commissions (
    organization_id,
    status,
    calculation_date DESC
);

-- Enable Row Level Security
ALTER TABLE insurance_commissions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see commissions from their organization
CREATE POLICY "insurance_commissions_select_org" ON insurance_commissions FOR
SELECT TO public USING (
        organization_id IN (
            SELECT organization_id
            FROM profiles
            WHERE
                id = auth.uid ()
        )
    );

-- RLS Policy: Users can only insert commissions for their organization
CREATE POLICY "insurance_commissions_insert_org" ON insurance_commissions FOR
INSERT TO public
WITH
    CHECK (
        organization_id IN (
            SELECT organization_id
            FROM profiles
            WHERE
                id = auth.uid ()
        )
    );

-- RLS Policy: Users can only update commissions from their organization
CREATE POLICY "insurance_commissions_update_org" ON insurance_commissions FOR
UPDATE TO public USING (
    organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE
            id = auth.uid ()
    )
)
WITH
    CHECK (
        organization_id IN (
            SELECT organization_id
            FROM profiles
            WHERE
                id = auth.uid ()
        )
    );

-- RLS Policy: Users can only delete commissions from their organization
CREATE POLICY "insurance_commissions_delete_org" ON insurance_commissions FOR DELETE TO public USING (
    organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE
            id = auth.uid ()
    )
);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_insurance_commissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updated_at updates
CREATE TRIGGER insurance_commissions_updated_at_trigger
    BEFORE UPDATE ON insurance_commissions
    FOR EACH ROW
    EXECUTE FUNCTION update_insurance_commissions_updated_at();

-- Add comments for documentation
COMMENT ON
TABLE insurance_commissions IS 'Insurance commission tracking and management';

COMMENT ON COLUMN insurance_commissions.commission_type IS 'Type of commission: base, renewal, bonus, override';

COMMENT ON COLUMN insurance_commissions.base_premium IS 'Base premium amount used for commission calculation';

COMMENT ON COLUMN insurance_commissions.commission_rate IS 'Commission rate as percentage (0-100)';

COMMENT ON COLUMN insurance_commissions.commission_amount IS 'Calculated commission amount in euros';

COMMENT ON COLUMN insurance_commissions.status IS 'Commission status: pending, calculated, paid, cancelled';

COMMENT ON COLUMN insurance_commissions.calculation_date IS 'When the commission was calculated';

COMMENT ON COLUMN insurance_commissions.payment_date IS 'When the commission was paid';