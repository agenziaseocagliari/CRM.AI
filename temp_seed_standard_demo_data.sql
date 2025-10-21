-- ========================================
-- SEED DEMO DATA FOR STANDARD VERTICAL
-- ========================================
-- Organization: 2aab4d72-ca5b-438f-93ac-b4c2fe2f8353 (Mario Rossi - Standard)
-- Purpose: Populate Pipeline and Report modules with realistic demo data

BEGIN;

-- ========================================
-- 1. SEED OPPORTUNITIES (for Pipeline module)
-- ========================================
-- 6 opportunities across different stages

INSERT INTO opportunities (
  contact_name,
  value,
  stage,
  organization_id,
  created_at,
  updated_at
)
VALUES
-- NEW LEAD (1)
(
  'New Client - Web Development Project',
  15000.00,
  'New Lead',
  '2aab4d72-ca5b-438f-93ac-b4c2fe2f8353',
  NOW(),
  NOW()
),

-- CONTACTED (1)
(
  'Existing Client - SEO Campaign Q4',
  8000.00,
  'Contacted',
  '2aab4d72-ca5b-438f-93ac-b4c2fe2f8353',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
),

-- PROPOSAL SENT (2)
(
  'Enterprise Deal - CRM Integration',
  50000.00,
  'Proposal Sent',
  '2aab4d72-ca5b-438f-93ac-b4c2fe2f8353',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
),
(
  'Renewal - Marketing Package Annual',
  12000.00,
  'Proposal Sent',
  '2aab4d72-ca5b-438f-93ac-b4c2fe2f8353',
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '7 days'
),

-- WON (2)
(
  'Won Deal - E-commerce Website Redesign',
  25000.00,
  'Won',
  '2aab4d72-ca5b-438f-93ac-b4c2fe2f8353',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '10 days'
),
(
  'Won Deal - Mobile App Development',
  35000.00,
  'Won',
  '2aab4d72-ca5b-438f-93ac-b4c2fe2f8353',
  NOW() - INTERVAL '15 days',
  NOW() - INTERVAL '15 days'
);

-- ========================================
-- 2. SEED DEALS (for Report module revenue)
-- ========================================
-- 3 closed-won deals for revenue calculation

INSERT INTO deals (
  title,
  value,
  status,
  organization_id,
  created_at,
  updated_at,
  closed_at
)
VALUES
-- Closed Won Deal 1
(
  'Website Redesign Project',
  18000.00,
  'won',
  '2aab4d72-ca5b-438f-93ac-b4c2fe2f8353',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
),

-- Closed Won Deal 2
(
  'SEO Package Q1 2025',
  9000.00,
  'won',
  '2aab4d72-ca5b-438f-93ac-b4c2fe2f8353',
  NOW() - INTERVAL '15 days',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '10 days'
),

-- Closed Won Deal 3
(
  'Consulting Services Contract',
  6000.00,
  'won',
  '2aab4d72-ca5b-438f-93ac-b4c2fe2f8353',
  NOW() - INTERVAL '25 days',
  NOW() - INTERVAL '20 days',
  NOW() - INTERVAL '20 days'
);

COMMIT;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Count opportunities for Standard org
SELECT 
  'OPPORTUNITIES' as table_name,
  COUNT(*) as total_count,
  SUM(value)::numeric as total_value
FROM opportunities
WHERE organization_id = '2aab4d72-ca5b-438f-93ac-b4c2fe2f8353';

-- Breakdown by stage
SELECT
  stage,
  COUNT(*) as count,
  SUM(value)::numeric as stage_value
FROM opportunities
WHERE organization_id = '2aab4d72-ca5b-438f-93ac-b4c2fe2f8353'
GROUP BY stage
ORDER BY stage;

-- Count deals for Standard org
SELECT
  'DEALS' as table_name,
  COUNT(*) as total_count,
  SUM(value)::numeric as total_revenue
FROM deals
WHERE organization_id = '2aab4d72-ca5b-438f-93ac-b4c2fe2f8353'
AND status = 'won';

-- ========================================
-- EXPECTED RESULTS SUMMARY
-- ========================================
-- Opportunities:
--   - Total: 6
--   - Pipeline Value: €145,000
--   - New Lead: 1 (€15,000)
--   - Contacted: 1 (€8,000)
--   - Proposal Sent: 2 (€62,000)
--   - Won: 2 (€60,000)
--
-- Deals (Revenue):
--   - Total Won: 3
--   - Total Revenue: €33,000
--
-- Report Module Should Show:
--   - Revenue: €33,000
--   - Opportunities: 6
--   - Conversion Rate: 33.3% (2 won / 6 total)
--   - Avg Deal Size: €5,500
-- ========================================
