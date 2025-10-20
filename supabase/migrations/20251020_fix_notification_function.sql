-- Migration: Fix get_policies_needing_notification function column name
-- Date: 2025-10-20
-- Author: Claude Sonnet 4.5
-- Description: Change expiration_date to end_date to match actual schema

DROP FUNCTION IF EXISTS get_policies_needing_notification();

CREATE OR REPLACE FUNCTION get_policies_needing_notification()
RETURNS TABLE (
  policy_id UUID,
  policy_number VARCHAR(50),
  contact_name TEXT,
  contact_email TEXT,
  end_date DATE,
  days_until_expiry INTEGER,
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
    p.end_date,
    (p.end_date - CURRENT_DATE) AS days_until_expiry,
    p.organization_id,
    COALESCE(rs.notification_email, c.email) AS notification_email
  FROM insurance_policies p
  INNER JOIN contacts c ON p.contact_id = c.id
  INNER JOIN renewal_settings rs ON p.organization_id = rs.organization_id
  WHERE
    p.status = 'active'
    AND rs.email_enabled = true
    AND p.end_date > CURRENT_DATE
    AND p.end_date <= CURRENT_DATE + INTERVAL '90 days'
    AND (
      -- 7-day reminder
      (rs.reminder_7_days = true AND p.end_date = CURRENT_DATE + 7
        AND (p.last_renewal_email_sent IS NULL OR p.last_renewal_email_sent < CURRENT_DATE))
      OR
      -- 30-day reminder
      (rs.reminder_30_days = true AND p.end_date = CURRENT_DATE + 30
        AND (p.last_renewal_email_sent IS NULL OR p.last_renewal_email_sent < CURRENT_DATE - 23))
      OR
      -- 60-day reminder
      (rs.reminder_60_days = true AND p.end_date = CURRENT_DATE + 60
        AND (p.last_renewal_email_sent IS NULL OR p.last_renewal_email_sent < CURRENT_DATE - 53))
      OR
      -- 90-day reminder
      (rs.reminder_90_days = true AND p.end_date = CURRENT_DATE + 90
        AND (p.last_renewal_email_sent IS NULL OR p.last_renewal_email_sent < CURRENT_DATE - 83))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_policies_needing_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION get_policies_needing_notification() TO service_role;

-- Add comment
COMMENT ON FUNCTION get_policies_needing_notification() IS 
'Returns list of active insurance policies that need renewal notifications based on organization renewal_settings preferences. Checks for 7, 30, 60, and 90-day reminders.';
