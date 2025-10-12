-- CRITICAL VERIFICATION: Trial Users Schema Check
-- Check organization_credits for trial-related columns

SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE
    table_name = 'organization_credits'
    AND (
        column_name LIKE '%trial%'
        OR column_name LIKE '%expiry%'
        OR column_name LIKE '%expires%'
        OR column_name LIKE '%free%'
    )
ORDER BY column_name;

-- Also get ALL columns to see the full schema
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE
    table_name = 'organization_credits'
ORDER BY ordinal_position;