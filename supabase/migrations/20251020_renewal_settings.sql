-- =============================================
-- PHASE 1.2: Renewal Settings & Notifications
-- =============================================

-- 1. Create renewal_settings table for configurable reminders
CREATE TABLE IF NOT EXISTS renewal_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Notification lead times (days before expiration)
  reminder_7_days BOOLEAN DEFAULT true,
  reminder_30_days BOOLEAN DEFAULT true,
  reminder_60_days BOOLEAN DEFAULT true,
  reminder_90_days BOOLEAN DEFAULT false,
  
  -- Email settings
  notification_email TEXT,
  email_enabled BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one settings row per organization
  UNIQUE(organization_id)
);

-- 2. Add email tracking column to insurance_policies
ALTER TABLE insurance_policies 
ADD COLUMN IF NOT EXISTS last_renewal_email_sent TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS renewal_email_count INT DEFAULT 0;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_renewal_settings_org 
  ON renewal_settings(organization_id);

CREATE INDEX IF NOT EXISTS idx_policies_expiry_email 
  ON insurance_policies(expiration_date, last_renewal_email_sent) 
  WHERE status = 'active';

-- 4. RLS Policies for renewal_settings
ALTER TABLE renewal_settings ENABLE ROW LEVEL SECURITY;

-- Read: Users can view their organization's settings
DROP POLICY IF EXISTS "Users can view renewal settings for their organization" ON renewal_settings;
CREATE POLICY "Users can view renewal settings for their organization"
  ON renewal_settings FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Insert/Update: Users can manage their organization's settings
DROP POLICY IF EXISTS "Users can manage renewal settings for their organization" ON renewal_settings;
CREATE POLICY "Users can manage renewal settings for their organization"
  ON renewal_settings FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- 5. Seed default settings for existing insurance organizations
INSERT INTO renewal_settings (organization_id, reminder_7_days, reminder_30_days, reminder_60_days)
SELECT DISTINCT organization_id, true, true, true
FROM insurance_policies
WHERE organization_id NOT IN (SELECT organization_id FROM renewal_settings)
ON CONFLICT (organization_id) DO NOTHING;

-- 6. Create helper function to get policies needing notifications
CREATE OR REPLACE FUNCTION get_policies_needing_notification()
RETURNS TABLE (
  policy_id UUID,
  policy_number TEXT,
  contact_name TEXT,
  contact_email TEXT,
  expiration_date DATE,
  days_until_expiry INT,
  organization_id UUID,
  notification_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS policy_id,
    p.policy_number,
    c.name AS contact_name,
    c.email AS contact_email,
    p.expiration_date,
    (p.expiration_date - CURRENT_DATE) AS days_until_expiry,
    p.organization_id,
    COALESCE(rs.notification_email, c.email) AS notification_email
  FROM insurance_policies p
  INNER JOIN contacts c ON p.contact_id = c.id
  INNER JOIN renewal_settings rs ON p.organization_id = rs.organization_id
  WHERE 
    p.status = 'active'
    AND rs.email_enabled = true
    AND p.expiration_date > CURRENT_DATE
    AND p.expiration_date <= CURRENT_DATE + INTERVAL '90 days'
    AND (
      -- 7-day reminder
      (rs.reminder_7_days = true AND p.expiration_date = CURRENT_DATE + 7 
       AND (p.last_renewal_email_sent IS NULL OR p.last_renewal_email_sent < CURRENT_DATE))
      OR
      -- 30-day reminder
      (rs.reminder_30_days = true AND p.expiration_date = CURRENT_DATE + 30
       AND (p.last_renewal_email_sent IS NULL OR p.last_renewal_email_sent < CURRENT_DATE - 23))
      OR
      -- 60-day reminder
      (rs.reminder_60_days = true AND p.expiration_date = CURRENT_DATE + 60
       AND (p.last_renewal_email_sent IS NULL OR p.last_renewal_email_sent < CURRENT_DATE - 53))
      OR
      -- 90-day reminder
      (rs.reminder_90_days = true AND p.expiration_date = CURRENT_DATE + 90
       AND (p.last_renewal_email_sent IS NULL OR p.last_renewal_email_sent < CURRENT_DATE - 83))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_policies_needing_notification() IS 
'Returns insurance policies that need renewal email notifications based on organization settings';
