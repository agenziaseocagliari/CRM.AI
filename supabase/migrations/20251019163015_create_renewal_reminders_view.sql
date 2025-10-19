-- =================================
-- MIGRATION: Create renewal_reminders view
-- Purpose: Calculate policy renewal dates and days remaining for upcoming renewals
-- Date: 2025-10-19
-- =================================

-- Create the renewal_reminders view
CREATE OR REPLACE VIEW renewal_reminders AS
SELECT 
    ip.id as policy_id,
    ip.contact_id,
    c.name as client_name,
    ip.policy_number,
    ip.end_date as renewal_date,
    ip.policy_type,
    ip.premium_amount,
    ip.organization_id,
    -- Calculate days to renewal (can be negative if expired)
    (ip.end_date - CURRENT_DATE) as days_to_renewal,
    -- Calculate renewal priority based on days remaining
    CASE 
        WHEN (ip.end_date - CURRENT_DATE) <= 7 THEN 'critical'
        WHEN (ip.end_date - CURRENT_DATE) <= 30 THEN 'high'
        WHEN (ip.end_date - CURRENT_DATE) <= 60 THEN 'medium'
        ELSE 'low'
    END as priority_level,
    -- Status indicators
    CASE 
        WHEN ip.end_date < CURRENT_DATE THEN 'expired'
        WHEN (ip.end_date - CURRENT_DATE) <= 7 THEN 'urgent'
        WHEN (ip.end_date - CURRENT_DATE) <= 30 THEN 'upcoming'
        ELSE 'future'
    END as renewal_status,
    -- Metadata
    ip.created_at,
    ip.updated_at
FROM 
    insurance_policies ip
    LEFT JOIN contacts c ON ip.contact_id = c.id
WHERE 
    -- Only include policies expiring within next 90 days or already expired (last 30 days)
    ip.end_date BETWEEN (CURRENT_DATE - INTERVAL '30 days') AND (CURRENT_DATE + INTERVAL '90 days')
    AND ip.status = 'active' -- Only active policies need renewal reminders
ORDER BY 
    ip.end_date ASC,
    ip.created_at DESC;

-- RLS is inherited from underlying tables (insurance_policies and contacts)
-- Views don't support direct RLS but inherit security from base tables

-- Create indexes for better performance (using correct column names)
-- Note: idx_insurance_policies_end_date already exists, so we skip creating it
-- CREATE INDEX IF NOT EXISTS idx_insurance_policies_end_date ON insurance_policies(end_date);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_org_end_date ON insurance_policies(organization_id, end_date);

-- Grant permissions
GRANT SELECT ON renewal_reminders TO authenticated;
GRANT SELECT ON renewal_reminders TO service_role;

-- Add comment for documentation
COMMENT ON VIEW renewal_reminders IS 'View for calculating policy renewal reminders with priority levels and status indicators. Filters policies expiring within 90 days or expired within last 30 days.';
