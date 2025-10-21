-- ============================================================================
-- FIX OPTION 2: UPDATE ORGANIZATION_ID
-- Use this if data exists but organization_id doesn't match your user's org
-- ============================================================================

-- STEP 1: Get your actual organization_id
SELECT 
  id as user_id,
  email,
  organization_id as your_org_id
FROM profiles
WHERE email = 'your.email@example.com'; -- ⚠️ REPLACE WITH YOUR EMAIL

-- Copy the organization_id value from the result above


-- STEP 2: See what organization_ids currently exist in the data
SELECT 
  'insurance_policies' as table_name,
  organization_id,
  COUNT(*) as record_count
FROM insurance_policies
GROUP BY organization_id

UNION ALL

SELECT 
  'opportunities' as table_name,
  organization_id,
  COUNT(*) as record_count
FROM opportunities
GROUP BY organization_id

UNION ALL

SELECT 
  'contacts' as table_name,
  organization_id,
  COUNT(*) as record_count
FROM contacts
GROUP BY organization_id;


-- ============================================================================
-- STEP 3: UPDATE DATA TO YOUR ORGANIZATION_ID
-- ============================================================================

-- IMPORTANT: Replace these values:
-- - 'YOUR_ORG_ID_HERE' with your organization_id from STEP 1
-- - 'OLD_ORG_ID_HERE' with the wrong org_id from STEP 2 (if data exists with wrong org)

\set correct_org_id 'YOUR_ORG_ID_HERE'
\set wrong_org_id 'OLD_ORG_ID_HERE'

-- Update insurance policies
UPDATE insurance_policies
SET organization_id = :'correct_org_id'
WHERE organization_id = :'wrong_org_id';

-- Check how many were updated
SELECT 
  'insurance_policies' as updated_table,
  COUNT(*) as records_updated
FROM insurance_policies
WHERE organization_id = :'correct_org_id';


-- Update opportunities
UPDATE opportunities
SET organization_id = :'correct_org_id'
WHERE organization_id = :'wrong_org_id';

-- Check how many were updated
SELECT 
  'opportunities' as updated_table,
  COUNT(*) as records_updated
FROM opportunities
WHERE organization_id = :'correct_org_id';


-- Update contacts
UPDATE contacts
SET organization_id = :'correct_org_id'
WHERE organization_id = :'wrong_org_id';

-- Check how many were updated
SELECT 
  'contacts' as updated_table,
  COUNT(*) as records_updated
FROM contacts
WHERE organization_id = :'correct_org_id';


-- ============================================================================
-- ALTERNATIVE: Update ALL data to your org_id (if unsure which org_id to update)
-- ============================================================================

-- CAUTION: This updates ALL records to your org_id. Only use if:
-- - You're the only user in the system
-- - OR you want to claim all existing demo data

-- Uncomment these lines if you want to run this approach:

-- UPDATE insurance_policies SET organization_id = :'correct_org_id';
-- UPDATE opportunities SET organization_id = :'correct_org_id';
-- UPDATE contacts SET organization_id = :'correct_org_id';


-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================

-- Verify all data now belongs to your organization
SELECT 
  'insurance_policies' as table_name,
  organization_id,
  COUNT(*) as records_with_your_org
FROM insurance_policies
WHERE organization_id = :'correct_org_id'
GROUP BY organization_id

UNION ALL

SELECT 
  'opportunities' as table_name,
  organization_id,
  COUNT(*) as records_with_your_org
FROM opportunities
WHERE organization_id = :'correct_org_id'
GROUP BY organization_id

UNION ALL

SELECT 
  'contacts' as table_name,
  organization_id,
  COUNT(*) as records_with_your_org
FROM contacts
WHERE organization_id = :'correct_org_id'
GROUP BY organization_id;


-- ============================================================================
-- WHAT TO DO NEXT:
-- 1. Refresh your CRM application (Ctrl + F5)
-- 2. Navigate to /dashboard/assicurazioni/polizze → Should now see policies
-- 3. Navigate to /dashboard/report → Should now see revenue and opportunities
-- ============================================================================
