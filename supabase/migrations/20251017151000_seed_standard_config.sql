-- ====================================================================
-- SEED STANDARD CRM CONFIGURATION
-- ====================================================================
-- This is the default vertical for all existing organizations
-- Sidebar reflects current menu structure (11 items)
-- Paths must match current working routes exactly
-- ====================================================================

-- Insert Standard CRM configuration
INSERT INTO vertical_configurations (
  vertical,
  display_name,
  description,
  icon,
  sidebar_config,
  dashboard_config,
  enabled_modules,
  is_active
) VALUES (
  -- Vertical identification
  'standard',
  'CRM Standard',
  'CRM completo per PMI e professionisti - Gestione contatti, pipeline, automazioni',
  'Briefcase',

-- Sidebar config (current menu structure - 11 items)
'{
    "sections": [
      {"id": "dashboard", "label": "Dashboard", "icon": "Home", "path": "/dashboard"},
      {"id": "pipeline", "label": "Pipeline", "icon": "TrendingUp", "path": "/opportunities"},
      {"id": "contacts", "label": "Contatti", "icon": "Users", "path": "/contacts"},
      {"id": "calendar", "label": "Calendario", "icon": "Calendar", "path": "/calendar"},
      {"id": "reports", "label": "Reports", "icon": "BarChart", "path": "/reports"},
      {"id": "forms", "label": "Forms", "icon": "FileText", "path": "/forms"},
      {"id": "automation", "label": "Automazioni", "icon": "Zap", "path": "/automation"},
      {"id": "whatsapp", "label": "WhatsApp", "icon": "MessageCircle", "path": "/whatsapp"},
      {"id": "email", "label": "Email Marketing", "icon": "Mail", "path": "/email-marketing"},
      {"id": "credits", "label": "Crediti", "icon": "CreditCard", "path": "/universal-credits"},
      {"id": "store", "label": "Store", "icon": "ShoppingBag", "path": "/store"}
    ]
  }'::jsonb,

-- Dashboard config (simple layout for now)
'{
    "layout": "standard",
    "widgets": ["metrics", "recent_contacts", "pipeline_chart", "activities"]
  }'::jsonb,

-- Enabled modules (10 core modules)
ARRAY[
    'contacts', 
    'pipeline', 
    'calendar', 
    'reports', 
    'forms', 
    'automation', 
    'whatsapp', 
    'email', 
    'credits', 
    'store'
  ]::TEXT[],

-- Active status
true ) ON CONFLICT (vertical) DO NOTHING;

-- ====================================================================
-- VERIFICATION QUERY (commented - for reference)
-- ====================================================================
-- SELECT
--   vertical,
--   display_name,
--   jsonb_array_length(sidebar_config->'sections') as menu_count,
--   array_length(enabled_modules, 1) as module_count,
--   is_active
-- FROM vertical_configurations
-- WHERE vertical = 'standard';