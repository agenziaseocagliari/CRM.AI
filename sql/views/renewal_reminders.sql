-- =================================
-- VIEW: renewal_reminders
-- Purpose: Calculate policy renewal dates and days remaining for upcoming renewals
-- Filters: Only policies expiring within next 90 days
-- RLS: Respects existing insurance_policies RLS policies
-- =================================

CREATE OR REPLACE VIEW renewal_reminders AS
SELECT 
    ip.id as policy_id,
    ip.user_id,
    ip.policy_number,
    ip.expiry_date as renewal_date,
    ip.client_name,
    ip.policy_type,
    ip.premium_amount,
    ip.organization_id,
    -- Calculate days to renewal (can be negative if expired)
    EXTRACT(DAY FROM (ip.expiry_date - CURRENT_DATE)) as days_to_renewal,
    -- Calculate renewal priority based on days remaining
    CASE 
        WHEN EXTRACT(DAY FROM (ip.expiry_date - CURRENT_DATE)) <= 7 THEN 'critical'
        WHEN EXTRACT(DAY FROM (ip.expiry_date - CURRENT_DATE)) <= 30 THEN 'high'
        WHEN EXTRACT(DAY FROM (ip.expiry_date - CURRENT_DATE)) <= 60 THEN 'medium'
        ELSE 'low'
    END as priority_level,
    -- Status indicators
    CASE 
        WHEN ip.expiry_date < CURRENT_DATE THEN 'expired'
        WHEN EXTRACT(DAY FROM (ip.expiry_date - CURRENT_DATE)) <= 7 THEN 'urgent'
        WHEN EXTRACT(DAY FROM (ip.expiry_date - CURRENT_DATE)) <= 30 THEN 'upcoming'
        ELSE 'future'
    END as renewal_status,
    -- Metadata
    ip.created_at,
    ip.updated_at
FROM 
    insurance_policies ip
WHERE 
    -- Only include policies expiring within next 90 days or already expired (last 30 days)
    ip.expiry_date BETWEEN (CURRENT_DATE - INTERVAL '30 days') AND (CURRENT_DATE + INTERVAL '90 days')
    AND ip.status = 'active' -- Only active policies need renewal reminders
ORDER BY 
    ip.expiry_date ASC,
    ip.created_at DESC;

-- Enable RLS on the view (inherits from insurance_policies)
ALTER VIEW renewal_reminders ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_insurance_policies_expiry_date ON insurance_policies(expiry_date);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_org_expiry ON insurance_policies(organization_id, expiry_date);

-- Grant permissions
GRANT SELECT ON renewal_reminders TO authenticated;
GRANT SELECT ON renewal_reminders TO service_role;