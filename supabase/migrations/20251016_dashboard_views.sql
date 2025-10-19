-- Dashboard Views and Missing Tables Migration
-- Date: October 16, 2025
-- Purpose: Create views and tables for dashboard without breaking existing queries

-- =======================
-- 1. CREATE DASHBOARD VIEWS
-- =======================

-- Dashboard Opportunities View - Maps contact_name to name
CREATE OR REPLACE VIEW dashboard_opportunities AS
SELECT
    id,
    contact_name AS name, -- ✅ Alias to match dashboard expectations
    stage,
    value,
    created_at,
    updated_at,
    organization_id
FROM opportunities;

-- Dashboard Events View - Maps start_time to start_date
CREATE OR REPLACE VIEW dashboard_events AS
SELECT
    id,
    title,
    start_time AS start_date, -- ✅ Alias to match dashboard expectations
    created_at,
    organization_id
FROM events;

-- =======================
-- 2. CREATE MISSING TABLES
-- =======================

-- Form Submissions Table (was missing causing 404)
CREATE TABLE IF NOT EXISTS form_submissions (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    form_id UUID REFERENCES forms (id) ON DELETE CASCADE,
    organization_id UUID NOT NULL,
    form_name TEXT,
    submitted_data JSONB,
    submitter_email TEXT,
    submitter_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================
-- 3. INDEXES FOR PERFORMANCE
-- =======================

CREATE INDEX IF NOT EXISTS idx_form_submissions_org ON form_submissions (organization_id);

CREATE INDEX IF NOT EXISTS idx_form_submissions_form ON form_submissions (form_id);

CREATE INDEX IF NOT EXISTS idx_form_submissions_created ON form_submissions (created_at DESC);

-- =======================
-- 4. ROW LEVEL SECURITY
-- =======================

-- Enable RLS on form_submissions
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policy for form_submissions
CREATE POLICY "org_access_form_submissions" ON form_submissions FOR ALL TO public USING (
    organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE
            id = auth.uid ()
    )
);

-- Views inherit RLS from base tables, but set security invoker for clarity
ALTER VIEW dashboard_opportunities SET(security_invoker = true);

ALTER VIEW dashboard_events SET(security_invoker = true);

-- =======================
-- 5. PERMISSIONS
-- =======================

-- Note: Views inherit permissions from base tables via RLS
-- No explicit GRANT statements needed - security handled by RLS policies

-- =======================
-- 6. TRIGGER FOR AUTO-UPDATING
-- =======================

-- Update timestamp trigger for form_submissions
CREATE OR REPLACE FUNCTION update_form_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER form_submissions_updated_at
    BEFORE UPDATE ON form_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_form_submissions_updated_at();

-- =======================
-- VERIFICATION QUERIES
-- =======================

-- Test views work correctly
SELECT 'dashboard_opportunities' as table_name, count(*) as record_count
FROM dashboard_opportunities;

SELECT 'dashboard_events' as table_name, count(*) as record_count
FROM dashboard_events;

SELECT 'form_submissions' as table_name, count(*) as record_count
FROM form_submissions;