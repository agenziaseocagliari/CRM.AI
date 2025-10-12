-- ===== PHASE 5: COMPREHENSIVE TEST SUITE =====
-- Testing all new import functionality

-- ===== TEST 1: Create Mock Import Record =====
INSERT INTO contact_imports (
    organization_id,
    uploaded_by, 
    filename,
    file_size,
    file_type,
    total_rows,
    successful_imports,
    failed_imports,
    duplicate_skipped,
    status,
    field_mapping,
    duplicate_strategy
) VALUES (
    (SELECT id FROM organizations LIMIT 1), -- First organization
    (SELECT id FROM profiles LIMIT 1),      -- First profile
    'test_import_contacts.csv',
    1048576, -- 1MB
    'csv',
    100,
    95,
    3,
    2,
    'completed',
    '{"email": "Email", "phone": "Phone Number", "name": "Full Name", "company": "Company Name"}'::jsonb,
    'skip'
) RETURNING id;

-- ===== TEST 2: Create Mock Log Entries =====
-- (Run this after TEST 1, replace import_id with actual ID from above)
WITH mock_import AS (
    SELECT id as import_id FROM contact_imports WHERE filename = 'test_import_contacts.csv' LIMIT 1
)
INSERT INTO contact_import_logs (
    import_id,
    row_number,
    raw_data,
    status,
    error_type,
    error_message
) 
SELECT 
    mock_import.import_id,
    row_num,
    ('{"email": "test' || row_num || '@example.com", "name": "Test User ' || row_num || '", "phone": "+1234567890"}')::jsonb,
    CASE 
        WHEN row_num <= 95 THEN 'success'
        WHEN row_num <= 98 THEN 'failed'
        ELSE 'duplicate_skipped'
    END,
    CASE 
        WHEN row_num > 95 AND row_num <= 98 THEN 'validation_error'
        ELSE NULL
    END,
    CASE 
        WHEN row_num > 95 AND row_num <= 98 THEN 'Invalid email format'
        ELSE NULL
    END
FROM mock_import, generate_series(1, 100) as row_num;

-- ===== TEST 3: Create Contact with Import Tracking =====
WITH mock_import AS (
    SELECT id as import_id FROM contact_imports WHERE filename = 'test_import_contacts.csv' LIMIT 1
)
INSERT INTO contacts (
    organization_id,
    name,
    email,
    phone,
    company,
    imported_from,
    import_row_number,
    last_import_update,
    import_metadata
) VALUES (
    (SELECT id FROM organizations LIMIT 1),
    'John Doe',
    'john.doe@example.com', 
    '+1-555-123-4567',
    'Acme Corp',
    (SELECT import_id FROM mock_import),
    1,
    NOW(),
    '{"csv_row": 1, "original_data": {"Email": "john.doe@example.com", "Full Name": "John Doe"}}'::jsonb
) RETURNING id, normalized_email, normalized_phone, duplicate_check_hash;

-- ===== TEST 4: Test RLS Policies =====
-- This test simulates querying as different organization (should return 0 rows)
-- Note: This will work properly with actual auth.uid() in real usage
SELECT
    COUNT(*) as import_count_should_be_filtered
FROM contact_imports
WHERE
    organization_id != (
        SELECT id
        FROM organizations
        LIMIT 1
    );

-- ===== TEST 5: Create Field Mapping Template =====
INSERT INTO contact_field_mappings (
    organization_id,
    created_by,
    template_name,
    description,
    field_mapping,
    is_default
) VALUES (
    (SELECT id FROM organizations LIMIT 1),
    (SELECT id FROM profiles LIMIT 1),
    'Standard CSV Template',
    'Standard mapping for CSV exports from CRM systems',
    '{
        "name": "Full Name",
        "email": "Email Address", 
        "phone": "Phone",
        "company": "Company Name",
        "title": "Job Title",
        "address": "Address",
        "city": "City",
        "state": "State",
        "zip": "ZIP Code"
    }'::jsonb,
    true
) RETURNING id, template_name;

-- ===== TEST 6: Test Duplicate Detection =====
-- Insert contact with same email (should have same normalized_email)
INSERT INTO
    contacts (
        organization_id,
        name,
        email,
        phone
    )
VALUES (
        (
            SELECT id
            FROM organizations
            LIMIT 1
        ),
        'Jane Smith',
        '  JOHN.DOE@EXAMPLE.COM  ', -- Same email but different case/spacing
        '(555) 123-4567' -- Same phone but different format
    ) RETURNING id,
    email,
    normalized_email,
    phone,
    normalized_phone,
    duplicate_check_hash,
    duplicate_check_hash = (
        SELECT duplicate_check_hash
        FROM contacts
        WHERE
            email = 'john.doe@example.com'
        LIMIT 1
    ) as is_duplicate_detected;

-- ===== TEST 7: Performance Test =====
-- Query all imports for an organization (should use indexes)
EXPLAIN (ANALYZE, BUFFERS)
SELECT ci.id, ci.filename, ci.status, ci.total_rows, ci.successful_imports, ci.created_at, p.full_name as uploaded_by_name
FROM
    contact_imports ci
    JOIN profiles p ON ci.uploaded_by = p.id
WHERE
    ci.organization_id = (
        SELECT id
        FROM organizations
        LIMIT 1
    )
ORDER BY ci.created_at DESC;

-- ===== VERIFICATION QUERIES =====

-- Check all tables exist
SELECT
    table_name,
    CASE
        WHEN table_name IN (
            'contact_imports',
            'contact_import_logs',
            'contact_field_mappings'
        ) THEN '✅ NEW TABLE'
        ELSE '✅ EXISTING TABLE'
    END as status
FROM information_schema.tables
WHERE
    table_schema = 'public'
    AND table_name IN (
        'contacts',
        'contact_imports',
        'contact_import_logs',
        'contact_field_mappings'
    )
ORDER BY table_name;

-- Check RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE
    schemaname = 'public'
    AND tablename IN (
        'contact_imports',
        'contact_import_logs',
        'contact_field_mappings'
    )
ORDER BY tablename, policyname;

-- Check indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE
    schemaname = 'public'
    AND tablename IN (
        'contacts',
        'contact_imports',
        'contact_import_logs',
        'contact_field_mappings'
    )
    AND indexname NOT LIKE '%_pkey'
ORDER BY tablename, indexname;

-- Check functions
SELECT
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE
    routine_schema = 'public'
    AND routine_name IN (
        'normalize_email',
        'normalize_phone',
        'calculate_duplicate_hash'
    )
ORDER BY routine_name;

-- Check triggers
SELECT
    event_object_table,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE
    event_object_schema = 'public'
    AND event_object_table = 'contacts'
    AND trigger_name LIKE '%normalized%'
ORDER BY trigger_name;

-- Final row counts
SELECT 'contact_imports' as table_name, COUNT(*) as row_count
FROM contact_imports
UNION ALL
SELECT 'contact_import_logs' as table_name, COUNT(*) as row_count
FROM contact_import_logs
UNION ALL
SELECT 'contact_field_mappings' as table_name, COUNT(*) as row_count
FROM contact_field_mappings
UNION ALL
SELECT 'contacts_with_import_tracking' as table_name, COUNT(*) as row_count
FROM contacts
WHERE
    imported_from IS NOT NULL;

-- Test normalization functions
SELECT
    normalize_email ('  TEST@EXAMPLE.COM  ') as normalized_email_result,
    normalize_phone ('+1 (555) 123-4567 ext 890') as normalized_phone_result,
    calculate_duplicate_hash (
        'test@example.com',
        '5551234567',
        'John Doe'
    ) as hash_result;