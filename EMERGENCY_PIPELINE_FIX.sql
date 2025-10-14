-- EMERGENCY PIPELINE FIX - RUN IMMEDIATELY
-- This addresses the top 3 most likely remaining issues

-- ==========================================
-- FIX 1: ENSURE TEST DATA EXISTS
-- ==========================================

-- First, let's make sure we have a proper test opportunity
DELETE FROM opportunities WHERE contact_name = 'PIPELINE TEST CONTACT';

INSERT INTO opportunities (
    id,
    contact_name,
    contact_id,
    stage,
    value,
    probability,
    status,
    organization_id,
    created_by,
    created_at,
    updated_at,
    close_date
) VALUES (
    gen_random_uuid(),
    'PIPELINE TEST CONTACT',
    (SELECT id FROM contacts LIMIT 1),
    'New Lead',  -- CRITICAL: Must be exactly "New Lead"
    5000,
    50,
    'open',
    (SELECT id FROM organizations LIMIT 1),
    (SELECT id FROM profiles LIMIT 1),
    NOW(),
    NOW(),
    CURRENT_DATE + INTERVAL '30 days'
);

-- ==========================================
-- FIX 2: CHECK USER-ORGANIZATION LINKING
-- ==========================================

-- Ensure there's a user linked to the organization with the opportunity
INSERT INTO user_organizations (user_id, organization_id, role)
SELECT 
    p.id as user_id,
    o.organization_id,
    'admin' as role
FROM profiles p
CROSS JOIN opportunities o
WHERE NOT EXISTS (
    SELECT 1 FROM user_organizations uo
    WHERE uo.user_id = p.id 
    AND uo.organization_id = o.organization_id
)
LIMIT 1
ON CONFLICT (user_id, organization_id) DO NOTHING;

-- ==========================================
-- FIX 3: UPDATE ALL EXISTING OPPORTUNITIES
-- ==========================================

-- Fix any remaining opportunities with old stage values
UPDATE opportunities 
SET stage = CASE 
    WHEN stage IN ('Lead', 'New', 'lead', 'new lead') THEN 'New Lead'
    WHEN stage IN ('Contact', 'contacted') THEN 'Contacted'
    WHEN stage IN ('Proposal', 'proposal sent') THEN 'Proposal Sent'
    WHEN stage IN ('won', 'Win') THEN 'Won'
    WHEN stage IN ('lost', 'Lost') THEN 'Lost'
    ELSE stage
END
WHERE stage NOT IN ('New Lead', 'Contacted', 'Proposal Sent', 'Won', 'Lost');

-- ==========================================
-- FIX 4: VERIFICATION QUERIES
-- ==========================================

-- Show final state
SELECT 'VERIFICATION: Opportunities per organization' as check_type;

SELECT 
    o.name as organization_name,
    org.id as organization_id,
    COUNT(opp.id) as opportunity_count,
    STRING_AGG(DISTINCT opp.stage, ', ') as stages_present
FROM organizations org
LEFT JOIN opportunities opp ON org.id = opp.organization_id  
LEFT JOIN organizations o ON org.id = o.id
GROUP BY org.id, o.name
ORDER BY opportunity_count DESC;

SELECT 'VERIFICATION: User-Organization links' as check_type;

SELECT 
    org.name as organization_name,
    COUNT(uo.user_id) as linked_users
FROM organizations org
LEFT JOIN user_organizations uo ON org.id = uo.organization_id
GROUP BY org.id, org.name
ORDER BY linked_users DESC;

SELECT 'VERIFICATION: Stage distribution' as check_type;

SELECT 
    stage,
    COUNT(*) as count
FROM opportunities 
GROUP BY stage
ORDER BY count DESC;