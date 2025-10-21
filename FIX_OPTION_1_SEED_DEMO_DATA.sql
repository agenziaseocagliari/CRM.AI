-- ============================================================================
-- FIX OPTION 1: SEED DEMO DATA
-- Use this if DATABASE_VERIFICATION_SCRIPT.sql showed COUNT = 0 (no data)
-- ============================================================================

-- STEP 1: Replace YOUR_ORG_ID with your actual organization_id from profiles table
-- Get it by running: SELECT organization_id FROM profiles WHERE email = 'your.email@example.com';

-- IMPORTANT: Set your organization_id here (copy from query above)
\set user_org_id 'PASTE_YOUR_ORG_ID_HERE'

-- ============================================================================
-- SEED INSURANCE POLICIES (Demo Data)
-- ============================================================================
INSERT INTO insurance_policies (
  policy_number,
  type,
  status,
  client_name,
  premium,
  organization_id,
  start_date,
  end_date,
  coverage_amount,
  description
) VALUES 
  (
    'POL-2024-001',
    'Auto',
    'active',
    'Mario Rossi',
    800.00,
    :'user_org_id',
    '2024-01-01',
    '2025-01-01',
    50000.00,
    'Polizza auto con copertura completa'
  ),
  (
    'POL-2024-002',
    'Casa',
    'active',
    'Luigi Bianchi',
    1200.00,
    :'user_org_id',
    '2024-02-01',
    '2025-02-01',
    250000.00,
    'Polizza casa con protezione incendio e furto'
  ),
  (
    'POL-2024-003',
    'Vita',
    'active',
    'Anna Verdi',
    2000.00,
    :'user_org_id',
    '2024-03-01',
    '2025-03-01',
    500000.00,
    'Polizza vita con copertura infortuni'
  ),
  (
    'POL-2024-004',
    'RC Professionale',
    'active',
    'Paolo Neri',
    1500.00,
    :'user_org_id',
    '2024-01-15',
    '2025-01-15',
    1000000.00,
    'Responsabilità civile professionale'
  ),
  (
    'POL-2023-099',
    'Auto',
    'expired',
    'Giulia Russo',
    750.00,
    :'user_org_id',
    '2023-06-01',
    '2024-06-01',
    40000.00,
    'Polizza auto scaduta - da rinnovare'
  );

-- Verify policies inserted
SELECT 
  policy_number,
  type,
  status,
  client_name,
  premium,
  organization_id
FROM insurance_policies
WHERE organization_id = :'user_org_id'
ORDER BY created_at DESC;


-- ============================================================================
-- SEED OPPORTUNITIES (Demo Data for Report Module)
-- ============================================================================
INSERT INTO opportunities (
  contact_name,
  value,
  stage,
  organization_id,
  description,
  expected_close_date
) VALUES 
  (
    'Nuova Polizza Auto - Cliente Premium',
    5000.00,
    'Won',
    :'user_org_id',
    'Cliente ha accettato polizza auto con copertura kasko completa',
    '2024-03-15'
  ),
  (
    'Polizza Casa Famiglia Bianchi',
    3500.00,
    'Proposal Sent',
    :'user_org_id',
    'Preventivo inviato per polizza casa con valore immobile 300k',
    '2024-04-10'
  ),
  (
    'Polizza Vita - Consulente Finanziario',
    8000.00,
    'Won',
    :'user_org_id',
    'Contratto firmato per polizza vita con investimento',
    '2024-02-20'
  ),
  (
    'RC Auto Giovane Neopatentato',
    1200.00,
    'Contacted',
    :'user_org_id',
    'Primo contatto telefonico, interessato ma valuta preventivi',
    '2024-05-01'
  ),
  (
    'Polizza Viaggi Corporate',
    2500.00,
    'New Lead',
    :'user_org_id',
    'Lead da campagna marketing, azienda 15 dipendenti',
    '2024-05-15'
  ),
  (
    'Polizza Infortuni Sportivi',
    900.00,
    'Lost',
    :'user_org_id',
    'Cliente ha scelto competitor per prezzo inferiore',
    '2024-03-01'
  );

-- Verify opportunities inserted
SELECT 
  contact_name,
  value,
  stage,
  organization_id,
  created_at
FROM opportunities
WHERE organization_id = :'user_org_id'
ORDER BY created_at DESC;


-- ============================================================================
-- SEED CONTACTS (Demo Data)
-- ============================================================================
INSERT INTO contacts (
  name,
  email,
  phone,
  company,
  organization_id,
  status
) VALUES 
  (
    'Mario Rossi',
    'mario.rossi@email.it',
    '+39 333 1234567',
    'Rossi Auto SRL',
    :'user_org_id',
    'active'
  ),
  (
    'Luigi Bianchi',
    'luigi.bianchi@email.it',
    '+39 334 7654321',
    'Bianchi Costruzioni',
    :'user_org_id',
    'active'
  ),
  (
    'Anna Verdi',
    'anna.verdi@email.it',
    '+39 335 9876543',
    'Studio Verdi',
    :'user_org_id',
    'active'
  );

-- Verify contacts inserted
SELECT 
  name,
  email,
  phone,
  company,
  organization_id
FROM contacts
WHERE organization_id = :'user_org_id'
ORDER BY created_at DESC;


-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================
SELECT 
  'insurance_policies' as table_name,
  COUNT(*) as records_created
FROM insurance_policies
WHERE organization_id = :'user_org_id'

UNION ALL

SELECT 
  'opportunities' as table_name,
  COUNT(*) as records_created
FROM opportunities
WHERE organization_id = :'user_org_id'

UNION ALL

SELECT 
  'contacts' as table_name,
  COUNT(*) as records_created
FROM contacts
WHERE organization_id = :'user_org_id';

-- Expected Results:
-- insurance_policies: 5 records
-- opportunities: 6 records
-- contacts: 3 records

-- ============================================================================
-- WHAT TO DO NEXT:
-- 1. Refresh your CRM application (Ctrl + F5)
-- 2. Navigate to /dashboard/assicurazioni/polizze → Should see 5 policies
-- 3. Navigate to /dashboard/report → Should see €17,000 revenue, 6 opportunities
-- ============================================================================
