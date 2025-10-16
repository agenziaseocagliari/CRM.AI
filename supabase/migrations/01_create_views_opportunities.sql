-- ===========================================
-- STEP 1: CREATE dashboard_opportunities VIEW
-- ===========================================

-- Drop existing view if any
DROP VIEW IF EXISTS dashboard_opportunities CASCADE;

-- Create dashboard_opportunities view
CREATE VIEW dashboard_opportunities AS
SELECT
    id,
    contact_name AS name, -- ✅ Alias contact_name to name for dashboard
    stage,
    value,
    created_at,
    updated_at,
    organization_id
FROM opportunities;

-- Set security invoker
ALTER VIEW dashboard_opportunities SET(security_invoker = true);

-- Add comment for documentation
COMMENT ON VIEW dashboard_opportunities IS 'Dashboard view: aliases contact_name to name for dashboard compatibility';

-- ===========================================
-- VERIFICATION
-- ===========================================

-- Verify view was created
SELECT 'dashboard_opportunities VIEW created successfully ✅' AS status;

-- Check view structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE
    table_name = 'dashboard_opportunities'
ORDER BY ordinal_position;

-- Test view works (should show count)
SELECT 'Record count in dashboard_opportunities:' AS info, COUNT(*) AS count
FROM dashboard_opportunities;