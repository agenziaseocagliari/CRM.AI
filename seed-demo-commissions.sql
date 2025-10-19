-- ======================================
-- SEED DEMO COMMISSION RECORDS
-- ======================================
-- Purpose: Populate insurance_commissions table with demo data
-- Target: Assicurazioni organization (primassicurazionibari@gmail.com)
-- Date: 2025-10-19

-- STEP 1: Extract existing contacts and policies
-- Run these first to get UUIDs

-- Get 3 demo contacts
SELECT id, name, email FROM contacts 
WHERE organization_id = 'dcfbec5c-6049-4d4d-ba80-a1c412a5861d'
LIMIT 3;

-- Get 3 demo policies  
SELECT id, policy_number, contact_id FROM insurance_policies
WHERE organization_id = 'dcfbec5c-6049-4d4d-ba80-a1c412a5861d'
LIMIT 3;

-- STEP 2: Insert demo commission records
-- REPLACE THE UUIDs BELOW WITH ACTUAL VALUES FROM STEP 1

INSERT INTO insurance_commissions (
    organization_id,
    policy_id,
    contact_id,
    commission_type,
    base_premium,
    commission_rate,
    commission_amount,
    status,
    calculation_date,
    payment_date,
    notes
) VALUES
-- Record 1: Paid base commission
(
    'dcfbec5c-6049-4d4d-ba80-a1c412a5861d',
    'REPLACE_WITH_POLICY_UUID_1',  -- From insurance_policies query above
    'REPLACE_WITH_CONTACT_UUID_1', -- From contacts query above
    'base',
    1200.00,
    5.00,
    60.00,
    'paid',
    '2025-10-05',
    '2025-10-10',
    'Demo base commission - October payment'
),
-- Record 2: Pending renewal commission
(
    'dcfbec5c-6049-4d4d-ba80-a1c412a5861d',
    'REPLACE_WITH_POLICY_UUID_2',  -- From insurance_policies query above
    'REPLACE_WITH_CONTACT_UUID_2', -- From contacts query above
    'renewal',
    1500.00,
    7.50,
    112.50,
    'pending',
    '2025-10-12',
    NULL,
    'Demo renewal commission - pending approval'
),
-- Record 3: Calculated bonus commission
(
    'dcfbec5c-6049-4d4d-ba80-a1c412a5861d',
    'REPLACE_WITH_POLICY_UUID_3',  -- From insurance_policies query above
    'REPLACE_WITH_CONTACT_UUID_3', -- From contacts query above
    'bonus',
    2000.00,
    10.00,
    200.00,
    'calculated',
    '2025-10-15',
    NULL,
    'Demo bonus commission - Q3 performance'
);

-- STEP 3: Verify data inserted
SELECT 
    ic.id,
    ic.commission_type,
    ic.commission_amount,
    ic.status,
    ic.calculation_date,
    ic.payment_date,
    c.name as contact_name,
    ip.policy_number
FROM insurance_commissions ic
JOIN contacts c ON ic.contact_id = c.id
LEFT JOIN insurance_policies ip ON ic.policy_id = ip.id
WHERE ic.organization_id = 'dcfbec5c-6049-4d4d-ba80-a1c412a5861d'
ORDER BY ic.calculation_date DESC;

-- STEP 4: Count total commissions
SELECT COUNT(*) as total_commissions 
FROM insurance_commissions 
WHERE organization_id = 'dcfbec5c-6049-4d4d-ba80-a1c412a5861d';