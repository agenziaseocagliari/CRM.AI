-- ======================================
-- SMART SEED DEMO COMMISSION RECORDS
-- ======================================
-- Purpose: Populate insurance_commissions using existing contacts/policies
-- Target: Assicurazioni organization (dcfbec5c-6049-4d4d-ba80-a1c412a5861d)
-- Method: Dynamic INSERT using existing data

-- STEP 1: Insert 3 demo commission records using existing contacts and policies
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
)
-- Use existing contacts and policies from the organization
SELECT 
    'dcfbec5c-6049-4d4d-ba80-a1c412a5861d' as organization_id,
    ip.id as policy_id,
    c.id as contact_id,
    -- Different commission types for variety
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) = 1 THEN 'base'
        WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) = 2 THEN 'renewal'
        ELSE 'bonus'
    END as commission_type,
    -- Different premium amounts
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) = 1 THEN 1200.00
        WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) = 2 THEN 1500.00
        ELSE 2000.00
    END as base_premium,
    -- Different commission rates
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) = 1 THEN 5.00
        WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) = 2 THEN 7.50
        ELSE 10.00
    END as commission_rate,
    -- Calculate commission amounts
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) = 1 THEN 60.00   -- 1200 * 5%
        WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) = 2 THEN 112.50  -- 1500 * 7.5%
        ELSE 200.00                                                     -- 2000 * 10%
    END as commission_amount,
    -- Different statuses
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) = 1 THEN 'paid'
        WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) = 2 THEN 'pending'
        ELSE 'calculated'
    END as status,
    -- Different calculation dates
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) = 1 THEN '2025-10-05'::date
        WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) = 2 THEN '2025-10-12'::date
        ELSE '2025-10-15'::date
    END as calculation_date,
    -- Payment date only for paid status
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) = 1 THEN '2025-10-10'::date
        ELSE NULL
    END as payment_date,
    -- Different notes
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) = 1 THEN 'Demo base commission - October payment processed'
        WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) = 2 THEN 'Demo renewal commission - awaiting approval'
        ELSE 'Demo bonus commission - Q3 performance target achieved'
    END as notes
FROM contacts c
JOIN insurance_policies ip ON ip.contact_id = c.id
WHERE c.organization_id = 'dcfbec5c-6049-4d4d-ba80-a1c412a5861d'
  AND ip.organization_id = 'dcfbec5c-6049-4d4d-ba80-a1c412a5861d'
LIMIT 3;

-- STEP 2: Verify the commissions were created
SELECT 
    ic.id,
    ic.commission_type,
    ic.commission_amount,
    ic.status,
    ic.calculation_date,
    ic.payment_date,
    c.name as contact_name,
    ip.policy_number,
    ic.notes
FROM insurance_commissions ic
JOIN contacts c ON ic.contact_id = c.id
JOIN insurance_policies ip ON ic.policy_id = ip.id
WHERE ic.organization_id = 'dcfbec5c-6049-4d4d-ba80-a1c412a5861d'
ORDER BY ic.calculation_date DESC;

-- STEP 3: Count total commissions in the organization
SELECT COUNT(*) as total_commissions_created 
FROM insurance_commissions 
WHERE organization_id = 'dcfbec5c-6049-4d4d-ba80-a1c412a5861d';

-- STEP 4: Display summary for dashboard verification
SELECT 
    commission_type,
    status,
    COUNT(*) as count,
    SUM(commission_amount) as total_amount
FROM insurance_commissions 
WHERE organization_id = 'dcfbec5c-6049-4d4d-ba80-a1c412a5861d'
GROUP BY commission_type, status
ORDER BY commission_type, status;