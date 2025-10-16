-- ===========================================
-- STEP 2: CREATE dashboard_events VIEW
-- ===========================================

-- Drop existing view if any
DROP VIEW IF EXISTS dashboard_events CASCADE;

-- Create dashboard_events view
CREATE VIEW dashboard_events AS
SELECT
    id,
    title,
    start_time AS start_date,  -- ✅ Alias start_time to start_date for dashboard
    created_at,
    organization_id
FROM events;

-- Set security invoker
ALTER VIEW dashboard_events SET (security_invoker = true);

-- Grant permissions
GRANT SELECT ON dashboard_events TO authenticated;

-- Add comment for documentation
COMMENT ON VIEW dashboard_events IS 'Dashboard view: aliases start_time to start_date for dashboard compatibility';

-- ===========================================
-- VERIFICATION
-- ===========================================

-- Verify view was created
SELECT 'dashboard_events VIEW created successfully ✅' AS status;

-- Check view structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'dashboard_events' 
ORDER BY ordinal_position;

-- Test view works (should show count)
SELECT 'Record count in dashboard_events:' AS info, COUNT(*) AS count 
FROM dashboard_events;