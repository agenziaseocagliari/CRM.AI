-- ===================================================================
-- GUARDIAN AI CRM - VERTICAL ACCOUNT TYPES SYSTEM
-- Migration: Sistema Account Types per Verticali Specializzati
-- Data: 2025-10-05
-- Priorità: Insurance Agency & Marketing Agency
-- ===================================================================

-- ===================================================================
-- 1. ACCOUNT TYPES ENUM & BASE TABLE
-- ===================================================================

-- Enum per account types supportati
CREATE TYPE account_type_enum AS ENUM (
    'generic',
    'insurance_agency',
    'marketing_agency',
    'fitness_center',
    'legal_practice', 
    'real_estate_agency',
    'wellness_spa',
    'medical_practice',
    'restaurant',
    'seo_agency',
    'consulting_firm'
);

-- Tabella configurazioni per ogni account type
CREATE TABLE IF NOT EXISTS vertical_account_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_type account_type_enum NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    
    -- Visual Configuration
    color_scheme JSONB DEFAULT '{}', -- {"primary": "#2563eb", "secondary": "#64748b"}
    logo_url TEXT,
    theme_config JSONB DEFAULT '{}',
    
    -- Module Configuration 
    enabled_modules JSONB NOT NULL DEFAULT '[]', -- ["contacts", "opportunities", "automations"]
    default_dashboard_layout JSONB DEFAULT '{}',
    
    -- Templates Configuration
    email_templates JSONB DEFAULT '{}',
    form_templates JSONB DEFAULT '{}', 
    automation_templates JSONB DEFAULT '{}',
    
    -- Terminology Customization
    terminology_map JSONB DEFAULT '{}', -- {"contacts": "clients", "deals": "policies"}
    
    -- Pricing Configuration
    base_price_cents INTEGER NOT NULL DEFAULT 0,
    features_included JSONB DEFAULT '[]',
    
    -- Meta
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 2. EXTEND ORGANIZATIONS TABLE FOR VERTICAL SUPPORT
-- ===================================================================

-- Add account type to organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS account_type account_type_enum DEFAULT 'generic',
ADD COLUMN IF NOT EXISTS vertical_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS custom_modules JSONB DEFAULT '[]', -- Per enterprise customizations
ADD COLUMN IF NOT EXISTS enterprise_features JSONB DEFAULT '{}'; -- Custom features per enterprise

-- Index per performance
CREATE INDEX IF NOT EXISTS idx_organizations_account_type ON organizations(account_type);
CREATE INDEX IF NOT EXISTS idx_organizations_vertical_config ON organizations USING GIN(vertical_config);

-- ===================================================================
-- 3. VERTICAL TEMPLATES SYSTEM
-- ===================================================================

-- Templates storage per ogni vertical
CREATE TABLE IF NOT EXISTS vertical_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_type account_type_enum NOT NULL,
    template_type TEXT NOT NULL, -- 'dashboard_widget', 'email_template', 'form_template', 'automation_rule'
    template_name TEXT NOT NULL,
    template_category TEXT, -- 'onboarding', 'follow_up', 'renewal', etc.
    
    -- Template Configuration
    template_config JSONB NOT NULL,
    default_settings JSONB DEFAULT '{}',
    
    -- Metadata
    description TEXT,
    is_system_template BOOLEAN DEFAULT TRUE, -- System vs custom
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Versioning
    version INTEGER DEFAULT 1,
    parent_template_id UUID REFERENCES vertical_templates(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(account_type, template_type, template_name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vertical_templates_account_type ON vertical_templates(account_type);
CREATE INDEX IF NOT EXISTS idx_vertical_templates_type ON vertical_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_vertical_templates_active ON vertical_templates(is_active) WHERE is_active = TRUE;

-- ===================================================================
-- 4. CUSTOM FIELDS PER VERTICAL
-- ===================================================================

-- Campi personalizzati per ogni vertical
CREATE TABLE IF NOT EXISTS vertical_custom_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_type account_type_enum NOT NULL,
    entity_type TEXT NOT NULL, -- 'contact', 'opportunity', 'organization'
    field_name TEXT NOT NULL,
    field_label TEXT NOT NULL,
    field_type TEXT NOT NULL, -- 'text', 'number', 'date', 'select', 'multiselect'
    field_config JSONB DEFAULT '{}', -- Options for select, validation rules, etc.
    
    -- Field Properties
    is_required BOOLEAN DEFAULT FALSE,
    is_searchable BOOLEAN DEFAULT TRUE,
    is_reportable BOOLEAN DEFAULT TRUE,
    default_value TEXT,
    
    -- Display
    display_order INTEGER DEFAULT 0,
    field_group TEXT, -- Group fields together
    help_text TEXT,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(account_type, entity_type, field_name)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_vertical_custom_fields_account_entity ON vertical_custom_fields(account_type, entity_type);

-- ===================================================================
-- 5. ENTERPRISE CUSTOMIZATION TRACKING
-- ===================================================================

-- Tracciamento customizzazioni enterprise per non impattare altri tenant
CREATE TABLE IF NOT EXISTS enterprise_customizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customization_type TEXT NOT NULL, -- 'template', 'field', 'module', 'workflow'
    customization_name TEXT NOT NULL,
    
    -- Customization Data
    base_template_id UUID REFERENCES vertical_templates(id), -- Se deriva da template base
    customization_config JSONB NOT NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    approved_by UUID REFERENCES auth.users(id), -- Chi ha approvato la customizzazione
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    description TEXT,
    impact_assessment TEXT, -- Note sull'impatto
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(organization_id, customization_type, customization_name)
);

-- Index per performance
CREATE INDEX IF NOT EXISTS idx_enterprise_customizations_org ON enterprise_customizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_customizations_type ON enterprise_customizations(customization_type);

-- ===================================================================
-- 6. RLS POLICIES
-- ===================================================================

-- Enable RLS on all new tables
ALTER TABLE vertical_account_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vertical_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE vertical_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_customizations ENABLE ROW LEVEL SECURITY;

-- Policies for vertical_account_configs (public read, admin write)
CREATE POLICY vertical_configs_public_read ON vertical_account_configs
    FOR SELECT
    USING (TRUE); -- Public read for account type selection

CREATE POLICY vertical_configs_admin_write ON vertical_account_configs
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

-- Policies for vertical_templates (public read system templates, org-specific for custom)
CREATE POLICY vertical_templates_system_read ON vertical_templates
    FOR SELECT
    USING (is_system_template = TRUE OR is_system_template IS NULL);

CREATE POLICY vertical_templates_admin_write ON vertical_templates
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('superadmin', 'admin')
        )
    );

-- Policies for vertical_custom_fields
CREATE POLICY vertical_custom_fields_read ON vertical_custom_fields
    FOR SELECT
    USING (TRUE); -- Public read

CREATE POLICY vertical_custom_fields_admin_write ON vertical_custom_fields
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

-- Policies for enterprise_customizations (organization-specific)
CREATE POLICY enterprise_customizations_org_access ON enterprise_customizations
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- ===================================================================
-- 7. FUNCTIONS & TRIGGERS
-- ===================================================================

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_vertical_account_configs_updated_at ON vertical_account_configs;

CREATE TRIGGER update_vertical_account_configs_updated_at
    BEFORE UPDATE ON vertical_account_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vertical_templates_updated_at ON vertical_templates;

CREATE TRIGGER update_vertical_templates_updated_at
    BEFORE UPDATE ON vertical_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_enterprise_customizations_updated_at ON enterprise_customizations;

CREATE TRIGGER update_enterprise_customizations_updated_at
    BEFORE UPDATE ON enterprise_customizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get vertical config for organization
CREATE OR REPLACE FUNCTION get_organization_vertical_config(org_id UUID)
RETURNS TABLE (
    account_type account_type_enum,
    config JSONB,
    templates JSONB,
    custom_fields JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.account_type,
        COALESCE(o.vertical_config, vac.default_dashboard_layout) as config,
        (
            SELECT json_agg(
                json_build_object(
                    'type', vt.template_type,
                    'name', vt.template_name,
                    'config', vt.template_config
                )
            )
            FROM vertical_templates vt 
            WHERE vt.account_type = o.account_type AND vt.is_active = TRUE
        ) as templates,
        (
            SELECT json_agg(
                json_build_object(
                    'entity_type', vcf.entity_type,
                    'field_name', vcf.field_name,
                    'field_label', vcf.field_label,
                    'field_type', vcf.field_type,
                    'field_config', vcf.field_config,
                    'is_required', vcf.is_required
                )
            )
            FROM vertical_custom_fields vcf 
            WHERE vcf.account_type = o.account_type AND vcf.is_active = TRUE
        ) as custom_fields
    FROM organizations o
    LEFT JOIN vertical_account_configs vac ON vac.account_type = o.account_type
    WHERE o.id = org_id;
END;
$$;

-- ===================================================================
-- 8. INITIAL DATA - INSURANCE AGENCY CONFIGURATION
-- ===================================================================

-- Insurance Agency Account Type Configuration
INSERT INTO vertical_account_configs (
    account_type,
    display_name,
    description,
    color_scheme,
    enabled_modules,
    terminology_map,
    base_price_cents,
    features_included,
    default_dashboard_layout
) VALUES (
    'insurance_agency',
    'Agenzia Assicurativa',
    'CRM specializzato per agenzie assicurative con gestione polizze, rinnovi e sinistri',
    '{"primary": "#1e40af", "secondary": "#64748b", "accent": "#dc2626"}',
    '["contacts", "opportunities", "automations", "email_campaigns", "reports", "calendar"]',
    '{
        "contacts": "Clienti",
        "opportunities": "Polizze", 
        "deals": "Contratti",
        "pipeline": "Pipeline Vendite",
        "tasks": "Attività",
        "meetings": "Appuntamenti",
        "emails": "Comunicazioni",
        "reports": "Reports Agenzia"
    }',
    14900, -- €149/mese
    '["policy_management", "renewal_tracking", "claims_management", "compliance_tools", "commission_tracking"]',
    '{
        "widgets": [
            {"type": "policies_overview", "position": {"x": 0, "y": 0, "w": 6, "h": 3}},
            {"type": "renewals_thismonth", "position": {"x": 6, "y": 0, "w": 6, "h": 3}},
            {"type": "revenue_chart", "position": {"x": 0, "y": 3, "w": 8, "h": 4}},
            {"type": "top_clients", "position": {"x": 8, "y": 3, "w": 4, "h": 4}},
            {"type": "pending_claims", "position": {"x": 0, "y": 7, "w": 6, "h": 3}},
            {"type": "commission_summary", "position": {"x": 6, "y": 7, "w": 6, "h": 3}}
        ]
    }'
);

-- Marketing Agency Account Type Configuration  
INSERT INTO vertical_account_configs (
    account_type,
    display_name,
    description,
    color_scheme,
    enabled_modules,
    terminology_map,
    base_price_cents,
    features_included,
    default_dashboard_layout
) VALUES (
    'marketing_agency',
    'Agenzia Marketing',
    'CRM ottimizzato per agenzie marketing con gestione campagne, clienti e ROI',
    '{"primary": "#7c3aed", "secondary": "#64748b", "accent": "#f59e0b"}',
    '["contacts", "opportunities", "automations", "email_campaigns", "reports", "calendar", "projects"]',
    '{
        "contacts": "Clienti",
        "opportunities": "Progetti", 
        "deals": "Contratti",
        "pipeline": "Pipeline Progetti",
        "tasks": "Task Campagne",
        "meetings": "Brief Clienti",
        "emails": "Comunicazioni",
        "reports": "Reports Performance"
    }',
    11900, -- €119/mese
    '["campaign_management", "client_reporting", "project_tracking", "roi_analytics", "team_collaboration"]',
    '{
        "widgets": [
            {"type": "active_campaigns", "position": {"x": 0, "y": 0, "w": 6, "h": 3}},
            {"type": "client_revenue", "position": {"x": 6, "y": 0, "w": 6, "h": 3}},
            {"type": "campaign_performance", "position": {"x": 0, "y": 3, "w": 8, "h": 4}},
            {"type": "team_workload", "position": {"x": 8, "y": 3, "w": 4, "h": 4}},
            {"type": "upcoming_deadlines", "position": {"x": 0, "y": 7, "w": 6, "h": 3}},
            {"type": "monthly_revenue", "position": {"x": 6, "y": 7, "w": 6, "h": 3}}
        ]
    }'
);

-- ===================================================================
-- 9. INITIAL TEMPLATES - INSURANCE AGENCY
-- ===================================================================

-- Insurance Agency Dashboard Widgets
INSERT INTO vertical_templates (account_type, template_type, template_name, template_category, template_config, description) VALUES

-- Dashboard Widgets
('insurance_agency', 'dashboard_widget', 'policies_overview', 'dashboard', 
'{
    "title": "Panoramica Polizze",
    "type": "stats_grid",
    "config": {
        "stats": [
            {"label": "Polizze Attive", "field": "active_policies", "color": "green"},
            {"label": "In Scadenza (30gg)", "field": "expiring_policies", "color": "orange"},
            {"label": "Nuove questo Mese", "field": "new_policies", "color": "blue"},
            {"label": "Valore Portafoglio", "field": "portfolio_value", "format": "currency", "color": "purple"}
        ]
    }
}', 'Widget panoramica polizze per dashboard assicurativa'),

('insurance_agency', 'dashboard_widget', 'renewals_thismonth', 'dashboard',
'{
    "title": "Rinnovi Questo Mese", 
    "type": "list",
    "config": {
        "fields": ["client_name", "policy_type", "expiration_date", "premium_amount"],
        "actions": ["call_client", "send_renewal_quote", "schedule_meeting"],
        "limit": 10,
        "sort": "expiration_date ASC"
    }
}', 'Lista rinnovi polizze in scadenza'),

('insurance_agency', 'dashboard_widget', 'pending_claims', 'dashboard',
'{
    "title": "Sinistri Pendenti",
    "type": "table", 
    "config": {
        "fields": ["claim_number", "client_name", "claim_type", "status", "amount", "date_filed"],
        "status_colors": {
            "pending": "yellow",
            "investigating": "blue", 
            "approved": "green",
            "denied": "red"
        }
    }
}', 'Tabella sinistri in gestione'),

-- Email Templates
('insurance_agency', 'email_template', 'policy_renewal_reminder', 'renewals',
'{
    "subject": "La tua polizza {{policy_type}} scade tra {{days_to_expiry}} giorni",
    "content": "Caro {{client_name}},\\n\\nLa tua polizza {{policy_type}} numero {{policy_number}} scadrà il {{expiration_date}}.\\n\\nPer garantire continuità di copertura, contattaci per il rinnovo.\\n\\nPremi attuali: €{{current_premium}}\\nNuova quotazione: €{{new_quote}}\\n\\nRisparmio: €{{savings}}\\n\\nCordiali saluti,\\n{{agent_name}}",
    "variables": ["client_name", "policy_type", "policy_number", "expiration_date", "current_premium", "new_quote", "savings", "agent_name", "days_to_expiry"]
}', 'Template per reminder rinnovo polizze'),

('insurance_agency', 'email_template', 'new_client_welcome', 'onboarding',
'{
    "subject": "Benvenuto in {{agency_name}} - La tua polizza {{policy_type}} è attiva",
    "content": "Caro {{client_name}},\\n\\nBenvenuto nella famiglia {{agency_name}}!\\n\\nLa tua polizza {{policy_type}} numero {{policy_number}} è ora attiva.\\n\\nDettagli copertura:\\n- Massimale: €{{coverage_limit}}\\n- Franchigia: €{{deductible}} \\n- Validità: dal {{start_date}} al {{end_date}}\\n\\nIn caso di sinistro, contattaci al {{emergency_phone}}.\\n\\nGrazie per aver scelto {{agency_name}}!",
    "variables": ["client_name", "agency_name", "policy_type", "policy_number", "coverage_limit", "deductible", "start_date", "end_date", "emergency_phone"]
}', 'Benvenuto nuovo cliente con dettagli polizza'),

-- Form Templates  
('insurance_agency', 'form_template', 'quote_request_form', 'lead_generation',
'{
    "title": "Richiesta Preventivo Assicurazione",
    "fields": [
        {"name": "client_type", "type": "select", "label": "Tipo Cliente", "options": ["Privato", "Azienda"], "required": true},
        {"name": "insurance_type", "type": "select", "label": "Tipo Assicurazione", "options": ["Auto", "Casa", "Vita", "Salute", "Azienda"], "required": true},
        {"name": "current_insurer", "type": "text", "label": "Assicuratore Attuale", "required": false},
        {"name": "current_premium", "type": "number", "label": "Premio Attuale (€/anno)", "required": false},
        {"name": "coverage_needs", "type": "textarea", "label": "Esigenze di Copertura", "required": true},
        {"name": "preferred_contact", "type": "select", "label": "Contatto Preferito", "options": ["Telefono", "Email", "WhatsApp"], "required": true}
    ],
    "automation_trigger": "new_quote_request"
}', 'Form per richieste preventivo personalizzato'),

-- Automation Templates
('insurance_agency', 'automation_rule', 'renewal_reminder_sequence', 'renewals',
'{
    "name": "Sequenza Reminder Rinnovi",
    "trigger": {"type": "date_field", "field": "expiration_date", "days_before": 60},
    "conditions": [
        {"field": "policy_status", "operator": "equals", "value": "active"},
        {"field": "client_status", "operator": "not_equals", "value": "churned"}  
    ],
    "actions": [
        {
            "type": "send_email",
            "template": "policy_renewal_reminder", 
            "delay_days": 0
        },
        {
            "type": "create_task",
            "title": "Contatta {{client_name}} per rinnovo {{policy_type}}",
            "assigned_to": "{{policy_agent}}",
            "due_days": 3
        },
        {
            "type": "send_email", 
            "template": "renewal_final_notice",
            "delay_days": 30,
            "condition": {"field": "renewal_status", "operator": "equals", "value": "pending"}
        }
    ]
}', 'Automazione completa per gestione rinnovi polizze');

-- ===================================================================
-- 10. INITIAL TEMPLATES - MARKETING AGENCY  
-- ===================================================================

-- Marketing Agency Dashboard Widgets
INSERT INTO vertical_templates (account_type, template_type, template_name, template_category, template_config, description) VALUES

-- Dashboard Widgets
('marketing_agency', 'dashboard_widget', 'active_campaigns', 'dashboard',
'{
    "title": "Campagne Attive",
    "type": "stats_cards",
    "config": {
        "cards": [
            {"label": "Facebook Ads", "value": "{{facebook_campaigns}}", "status": "active", "color": "blue"},
            {"label": "Google Ads", "value": "{{google_campaigns}}", "status": "active", "color": "green"}, 
            {"label": "Email Marketing", "value": "{{email_campaigns}}", "status": "active", "color": "purple"},
            {"label": "Content Marketing", "value": "{{content_campaigns}}", "status": "active", "color": "orange"}
        ]
    }
}', 'Overview campagne marketing attive'),

('marketing_agency', 'dashboard_widget', 'campaign_performance', 'dashboard',
'{
    "title": "Performance Campagne",
    "type": "chart",
    "config": {
        "chart_type": "line",
        "metrics": ["impressions", "clicks", "conversions", "roi"],
        "time_period": "last_30_days",
        "group_by": "campaign_type"
    }
}', 'Grafico performance campagne marketing'),

('marketing_agency', 'dashboard_widget', 'client_revenue', 'dashboard',
'{
    "title": "Revenue per Cliente",
    "type": "horizontal_bar",
    "config": {
        "metric": "monthly_revenue",
        "limit": 10,
        "sort": "desc",
        "color_scheme": "revenue_gradient"
    }
}', 'Grafico revenue mensile per cliente'),

-- Email Templates
('marketing_agency', 'email_template', 'monthly_report_client', 'reporting',
'{
    "subject": "Report Mensile {{month}} - {{client_name}}",
    "content": "Caro {{client_name}},\\n\\nEcco il report delle performance per {{month}}:\\n\\n📊 RISULTATI CHIAVE\\n- Impressions: {{total_impressions}} (+{{impressions_growth}}%)\\n- Click: {{total_clicks}} (CTR: {{ctr}}%)\\n- Conversioni: {{total_conversions}} ({{conversion_rate}}%)\\n- ROI: {{roi}}% \\n\\n💰 INVESTIMENTI\\n- Budget Totale: €{{total_budget}}\\n- Costo per Conversione: €{{cost_per_conversion}}\\n- Revenue Generato: €{{revenue_generated}}\\n\\n🎯 PROSSIMI OBIETTIVI\\n{{next_month_goals}}\\n\\nGrazie per la fiducia!\\n{{account_manager}}",
    "variables": ["client_name", "month", "total_impressions", "impressions_growth", "total_clicks", "ctr", "total_conversions", "conversion_rate", "roi", "total_budget", "cost_per_conversion", "revenue_generated", "next_month_goals", "account_manager"]
}', 'Report mensile performance per clienti'),

('marketing_agency', 'email_template', 'campaign_launch_notification', 'campaigns',
'{
    "subject": "🚀 Nuova Campagna Lanciata: {{campaign_name}}",
    "content": "Caro {{client_name}},\\n\\nAbbiamo lanciato con successo la tua nuova campagna {{campaign_name}}!\\n\\n📋 DETTAGLI CAMPAGNA\\n- Obiettivo: {{campaign_objective}}\\n- Budget: €{{campaign_budget}}\\n- Durata: {{campaign_duration}}\\n- Target: {{target_audience}}\\n\\n📊 MONITORAGGIO\\nPotrai seguire i risultati in tempo reale nel tuo dashboard.\\n\\n🎯 RISULTATI ATTESI\\n- Impressions stimate: {{estimated_impressions}}\\n- Click stimati: {{estimated_clicks}}\\n- Conversioni stimate: {{estimated_conversions}}\\n\\nTi terremo aggiornato sui progressi!\\n{{account_manager}}",
    "variables": ["client_name", "campaign_name", "campaign_objective", "campaign_budget", "campaign_duration", "target_audience", "estimated_impressions", "estimated_clicks", "estimated_conversions", "account_manager"]
}', 'Notifica lancio nuova campagna marketing');

-- ===================================================================
-- 11. CUSTOM FIELDS - INSURANCE AGENCY
-- ===================================================================

-- Custom fields for Insurance Agency contacts
INSERT INTO vertical_custom_fields (account_type, entity_type, field_name, field_label, field_type, field_config, is_required, display_order, field_group) VALUES

-- Contact Fields - Insurance specific
('insurance_agency', 'contact', 'client_type', 'Tipo Cliente', 'select', 
'{"options": ["Privato", "Azienda", "Libero Professionista"]}', true, 1, 'Informazioni Base'),

('insurance_agency', 'contact', 'current_insurer', 'Assicuratore Attuale', 'text', 
'{"placeholder": "Es: Generali, Allianz, UnipolSai"}', false, 2, 'Informazioni Assicurative'),

('insurance_agency', 'contact', 'policy_renewal_date', 'Data Rinnovo Polizza', 'date', 
'{"format": "DD/MM/YYYY"}', false, 3, 'Informazioni Assicurative'),

('insurance_agency', 'contact', 'current_premium', 'Premio Attuale (€/anno)', 'number', 
'{"min": 0, "step": 0.01, "currency": "EUR"}', false, 4, 'Informazioni Assicurative'),

('insurance_agency', 'contact', 'risk_profile', 'Profilo di Rischio', 'select',
'{"options": ["Basso", "Medio", "Alto"]}', false, 5, 'Valutazione'),

('insurance_agency', 'contact', 'preferred_contact_time', 'Orario Contatto Preferito', 'select',
'{"options": ["Mattina (9-12)", "Pomeriggio (14-17)", "Sera (18-20)", "Weekend"]}', false, 6, 'Comunicazione'),

-- Opportunity Fields - Policy specific  
('insurance_agency', 'opportunity', 'policy_type', 'Tipo Polizza', 'select',
'{"options": ["Auto", "Casa", "Vita", "Salute", "Azienda", "Responsabilità Civile", "Infortuni"]}', true, 1, 'Dettagli Polizza'),

('insurance_agency', 'opportunity', 'coverage_amount', 'Massimale Copertura (€)', 'number',
'{"min": 0, "step": 1000, "currency": "EUR"}', false, 2, 'Dettagli Polizza'),

('insurance_agency', 'opportunity', 'deductible', 'Franchigia (€)', 'number',
'{"min": 0, "step": 100, "currency": "EUR"}', false, 3, 'Dettagli Polizza'),

('insurance_agency', 'opportunity', 'policy_term', 'Durata Polizza', 'select',
'{"options": ["1 anno", "2 anni", "5 anni", "10 anni", "Vita"]}', false, 4, 'Dettagli Polizza'),

('insurance_agency', 'opportunity', 'commission_rate', 'Tasso Commissione (%)', 'number',
'{"min": 0, "max": 100, "step": 0.1}', false, 5, 'Commissioni');

-- ===================================================================
-- 12. CUSTOM FIELDS - MARKETING AGENCY
-- ===================================================================

-- Custom fields for Marketing Agency contacts  
INSERT INTO vertical_custom_fields (account_type, entity_type, field_name, field_label, field_type, field_config, is_required, display_order, field_group) VALUES

-- Contact Fields - Marketing specific
('marketing_agency', 'contact', 'company_size', 'Dimensione Azienda', 'select',
'{"options": ["Startup (1-10)", "PMI (11-50)", "Media (51-250)", "Grande (250+)"]}', false, 1, 'Informazioni Azienda'),

('marketing_agency', 'contact', 'industry_sector', 'Settore di Attività', 'select', 
'{"options": ["E-commerce", "Servizi", "Manifatturiero", "Tecnologia", "Salute", "Immobiliare", "Ristorazione", "Altro"]}', true, 2, 'Informazioni Azienda'),

('marketing_agency', 'contact', 'monthly_marketing_budget', 'Budget Marketing Mensile (€)', 'number',
'{"min": 0, "step": 500, "currency": "EUR"}', false, 3, 'Budget'),

('marketing_agency', 'contact', 'main_competitor', 'Competitor Principale', 'text',
'{"placeholder": "Nome del principale competitor"}', false, 4, 'Mercato'),

('marketing_agency', 'contact', 'current_marketing_channels', 'Canali Marketing Attuali', 'multiselect',
'{"options": ["Google Ads", "Facebook Ads", "Instagram", "LinkedIn", "Email Marketing", "SEO", "Content Marketing", "Influencer", "Radio/TV", "Stampa"]}', false, 5, 'Canali Attuali'),

('marketing_agency', 'contact', 'main_goals', 'Obiettivi Principali', 'multiselect',
'{"options": ["Aumentare vendite", "Brand awareness", "Lead generation", "Customer retention", "Espansione mercato", "Lancio prodotto"]}', true, 6, 'Obiettivi'),

-- Opportunity Fields - Campaign/Project specific
('marketing_agency', 'opportunity', 'project_type', 'Tipo Progetto', 'select',
'{"options": ["Campagna Ads", "SEO", "Social Media Management", "Email Marketing", "Brand Identity", "Sito Web", "E-commerce", "Consulenza Strategica"]}', true, 1, 'Progetto'),

('marketing_agency', 'opportunity', 'campaign_duration', 'Durata Campagna', 'select',
'{"options": ["1 mese", "3 mesi", "6 mesi", "12 mesi", "Continuativo"]}', false, 2, 'Progetto'),

('marketing_agency', 'opportunity', 'target_audience', 'Target Audience', 'textarea',
'{"placeholder": "Descrivi il target di riferimento..."}', false, 3, 'Targeting'),

('marketing_agency', 'opportunity', 'kpi_objectives', 'KPI Obiettivi', 'multiselect',
'{"options": ["ROI", "ROAS", "CPL", "CPA", "CTR", "Impressions", "Reach", "Engagement", "Conversioni", "Revenue"]}', false, 4, 'Performance'),

('marketing_agency', 'opportunity', 'monthly_retainer', 'Retainer Mensile (€)', 'number',
'{"min": 0, "step": 100, "currency": "EUR"}', false, 5, 'Pricing');

-- ===================================================================
-- 13. COMPLETION COMMENTS
-- ===================================================================

-- Add comments for documentation
COMMENT ON TABLE vertical_account_configs IS 'Configurazioni per ogni tipo di account verticale (Insurance, Marketing, etc.)';
COMMENT ON TABLE vertical_templates IS 'Templates (dashboard, email, form, automation) specifici per ogni vertical';
COMMENT ON TABLE vertical_custom_fields IS 'Campi personalizzati per ogni vertical (contatti, opportunità, etc.)';
COMMENT ON TABLE enterprise_customizations IS 'Customizzazioni enterprise isolate per non impattare altri tenant';

COMMENT ON FUNCTION get_organization_vertical_config IS 'Recupera configurazione completa vertical per organizzazione';

-- Success notification
DO $$
BEGIN
    RAISE NOTICE 'VERTICAL ACCOUNT TYPES SYSTEM SUCCESSFULLY CREATED!';
    RAISE NOTICE 'Configured account types: insurance_agency, marketing_agency';
    RAISE NOTICE 'Ready for: Template duplication, Enterprise customization, Testing environment';
END $$;