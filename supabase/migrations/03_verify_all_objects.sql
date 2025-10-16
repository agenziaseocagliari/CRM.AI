-- ===========================================
-- STEP 3: COMPLETE VERIFICATION
-- ===========================================

-- Check all dashboard objects exist
SELECT
    table_name,
    table_type,
    CASE
        WHEN table_type = 'VIEW' THEN '✅ VIEW'
        WHEN table_type = 'BASE TABLE' THEN '✅ TABLE'
        ELSE table_type
    END AS object_status
FROM information_schema.tables
WHERE
    table_schema = 'public'
    AND table_name IN (
        'dashboard_opportunities',
        'dashboard_events',
        'form_submissions'
    )
ORDER BY table_name;

-- ===========================================
-- TEST ALL DASHBOARD QUERIES
-- ===========================================

-- Test 1: dashboard_opportunities (should have 'name' column)
SELECT 'TEST 1: dashboard_opportunities' AS test_name;

SELECT 'Columns available:' AS info, string_agg (
        column_name, ', '
        ORDER BY ordinal_position
    ) AS columns
FROM information_schema.columns
WHERE
    table_name = 'dashboard_opportunities';

-- Test actual query (first 3 records)
SELECT 'Sample data from dashboard_opportunities:' AS info;

SELECT id, name, stage, value FROM dashboard_opportunities LIMIT 3;

-- Test 2: dashboard_events (should have 'start_date' column)
SELECT 'TEST 2: dashboard_events' AS test_name;

SELECT 'Columns available:' AS info, string_agg (
        column_name, ', '
        ORDER BY ordinal_position
    ) AS columns
FROM information_schema.columns
WHERE
    table_name = 'dashboard_events';

-- Test actual query (first 3 records)
SELECT 'Sample data from dashboard_events:' AS info;

SELECT id, title, start_date FROM dashboard_events LIMIT 3;

-- Test 3: form_submissions (should exist as table)
SELECT 'TEST 3: form_submissions' AS test_name;

SELECT 'Columns available:' AS info, string_agg (
        column_name, ', '
        ORDER BY ordinal_position
    ) AS columns
FROM information_schema.columns
WHERE
    table_name = 'form_submissions';

-- Test actual query
SELECT 'Sample data from form_submissions:' AS info;

SELECT COUNT(*) AS total_records FROM form_submissions;

-- ===========================================
-- FINAL STATUS REPORT
-- ===========================================

SELECT 'MIGRATION STATUS REPORT' AS report_title;

SELECT
    'VIEWS CREATED: ' || COUNT(*) FILTER (
        WHERE
            table_type = 'VIEW'
    ) AS views,
    'TABLES AVAILABLE: ' || COUNT(*) FILTER (
        WHERE
            table_type = 'BASE TABLE'
    ) AS tables,
    'TOTAL DASHBOARD OBJECTS: ' || COUNT(*) AS total
FROM information_schema.tables
WHERE
    table_schema = 'public'
    AND table_name IN (
        'dashboard_opportunities',
        'dashboard_events',
        'form_submissions'
    );

-- Success message
SELECT '🎯 DASHBOARD MIGRATION COMPLETE - Test your dashboard now!' AS final_status;