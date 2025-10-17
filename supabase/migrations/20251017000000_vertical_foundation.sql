-- ============================================================================
-- VERTICAL SYSTEM FOUNDATION
-- ============================================================================

-- Add vertical support to core tables
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS vertical TEXT DEFAULT 'standard';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vertical TEXT DEFAULT 'standard';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_vertical ON organizations(vertical);
CREATE INDEX IF NOT EXISTS idx_profiles_vertical ON profiles(vertical);

-- Add check constraints
ALTER TABLE organizations
ADD CONSTRAINT valid_vertical
CHECK (vertical IN ('standard', 'insurance', 'marketing', 'real_estate'));

-- ============================================================================
-- VERTICAL CONFIGURATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS vertical_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vertical TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    icon TEXT,

    -- UI Configuration
    sidebar_config JSONB NOT NULL,
    dashboard_config JSONB NOT NULL DEFAULT '{}',
    theme_config JSONB DEFAULT '{}',

    -- Features & Modules
    enabled_modules TEXT[] DEFAULT ARRAY[]::TEXT[],
    required_tables TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Settings
    default_settings JSONB DEFAULT '{}',
    onboarding_config JSONB DEFAULT '{}',

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT false,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TEMPLATE SYSTEM TABLES
-- ============================================================================

-- Global workflow templates (master templates)
CREATE TABLE IF NOT EXISTS workflow_templates_global (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_key TEXT UNIQUE NOT NULL,
    vertical TEXT NOT NULL,

    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Workflow Definition
    nodes JSONB NOT NULL,
    edges JSONB NOT NULL,
    variables JSONB DEFAULT '[]',
    settings JSONB DEFAULT '{}',

    -- Usage Stats
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2),

    -- Versioning
    version INTEGER DEFAULT 1,
    changelog TEXT,

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_templates_vertical ON workflow_templates_global(vertical);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_active ON workflow_templates_global(is_active);

-- Global email templates
CREATE TABLE IF NOT EXISTS email_templates_global (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_key TEXT UNIQUE NOT NULL,
    vertical TEXT NOT NULL,

    name TEXT NOT NULL,
    description TEXT,
    category TEXT,

    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    variables JSONB DEFAULT '[]',

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_vertical ON email_templates_global(vertical);

-- Global form templates
CREATE TABLE IF NOT EXISTS form_templates_global (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_key TEXT UNIQUE NOT NULL,
    vertical TEXT NOT NULL,

    name TEXT NOT NULL,
    description TEXT,
    fields JSONB NOT NULL,
    settings JSONB DEFAULT '{}',

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_form_templates_vertical ON form_templates_global(vertical);

-- Template usage tracking
CREATE TABLE IF NOT EXISTS template_clones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    template_type TEXT NOT NULL,
    template_key TEXT NOT NULL,
    template_version INTEGER DEFAULT 1,

    cloned_at TIMESTAMPTZ DEFAULT NOW(),
    last_synced_at TIMESTAMPTZ,

    UNIQUE(organization_id, template_type, template_key)
);

-- ============================================================================
-- SEED DATA: STANDARD VERTICAL
-- ============================================================================

INSERT INTO vertical_configurations (
    vertical,
    display_name,
    description,
    icon,
    sidebar_config,
    dashboard_config,
    enabled_modules
) VALUES (
    'standard',
    'CRM Standard',
    'CRM generico per PMI e professionisti',
    'briefcase',
    '{
        "sections": [
            {"id": "dashboard", "label": "Dashboard", "icon": "home", "path": "/dashboard"},
            {"id": "contacts", "label": "Contatti", "icon": "users", "path": "/contacts"},
            {"id": "pipeline", "label": "Pipeline", "icon": "trending-up", "path": "/pipeline"},
            {"id": "calendar", "label": "Calendario", "icon": "calendar", "path": "/calendar"},
            {"id": "forms", "label": "Forms", "icon": "file-text", "path": "/forms"},
            {"id": "automation", "label": "Automazioni", "icon": "zap", "path": "/automation"},
            {"id": "reports", "label": "Reports", "icon": "bar-chart", "path": "/reports"}
        ]
    }'::jsonb,
    '{
        "widgets": [
            {"id": "revenue", "type": "metric", "position": {"x": 0, "y": 0}},
            {"id": "contacts", "type": "metric", "position": {"x": 1, "y": 0}},
            {"id": "pipeline", "type": "chart", "position": {"x": 0, "y": 1}}
        ]
    }'::jsonb,
    ARRAY['contacts', 'pipeline', 'calendar', 'forms', 'automation', 'reports']
) ON CONFLICT (vertical) DO NOTHING;

-- Seed insurance vertical configuration (ready for future)
INSERT INTO vertical_configurations (
    vertical,
    display_name,
    description,
    icon,
    sidebar_config,
    enabled_modules
) VALUES (
    'insurance',
    'CRM Assicurazioni',
    'Soluzione completa per agenzie assicurative',
    'shield',
    '{
        "sections": [
            {"id": "dashboard", "label": "Dashboard", "icon": "home", "path": "/dashboard"},
            {"id": "contacts", "label": "Contatti", "icon": "users", "path": "/contacts"},
            {"id": "policies", "label": "Polizze", "icon": "shield", "path": "/insurance/policies"},
            {"id": "claims", "label": "Sinistri", "icon": "alert-circle", "path": "/insurance/claims"},
            {"id": "commissions", "label": "Provvigioni", "icon": "dollar-sign", "path": "/insurance/commissions"},
            {"id": "renewals", "label": "Scadenzario", "icon": "calendar-check", "path": "/insurance/renewals"},
            {"id": "calendar", "label": "Calendario", "icon": "calendar", "path": "/calendar"},
            {"id": "automation", "label": "Automazioni", "icon": "zap", "path": "/automation"},
            {"id": "reports", "label": "Reports", "icon": "bar-chart", "path": "/reports"}
        ]
    }'::jsonb,
    ARRAY['policies', 'claims', 'commissions', 'renewals', 'risk_profiling', 'contacts', 'calendar', 'automation', 'reports']
) ON CONFLICT (vertical) DO NOTHING;

-- ============================================================================
-- UPDATE EXISTING ORGANIZATIONS
-- ============================================================================

-- Set all existing organizations to 'standard' vertical
UPDATE organizations SET vertical = 'standard' WHERE vertical IS NULL;
UPDATE profiles SET vertical = 'standard' WHERE vertical IS NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE vertical_configurations IS 'Master configuration for each CRM vertical';
COMMENT ON TABLE workflow_templates_global IS 'Global workflow templates cloned to new organizations';
COMMENT ON TABLE email_templates_global IS 'Global email templates cloned to new organizations';
COMMENT ON TABLE form_templates_global IS 'Global form templates cloned to new organizations';
COMMENT ON COLUMN organizations.vertical IS 'CRM vertical type: standard, insurance, marketing, etc.';