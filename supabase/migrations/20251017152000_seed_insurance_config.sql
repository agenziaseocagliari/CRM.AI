-- ====================================================================
-- SEED INSURANCE VERTICAL CONFIGURATION
-- ====================================================================
-- Insurance CRM vertical with specialized modules for:
-- - Policy management (/insurance/policies)
-- - Claims processing (/insurance/claims)
-- - Commission tracking (/insurance/commissions)
-- - Renewal scheduling (/insurance/renewals)
-- ====================================================================

-- Insert Insurance CRM configuration
INSERT INTO vertical_configurations (
  vertical,
  display_name,
  description,
  icon,
  sidebar_config,
  dashboard_config,
  enabled_modules,
  is_active,
  is_public
) VALUES (
  -- Vertical identification
  'insurance',
  'CRM Assicurazioni',
  'Soluzione completa per agenzie assicurative - Gestione polizze, sinistri, provvigioni',
  'Shield',

-- Insurance-specific sidebar (9 items)
'{
    "sections": [
      {"id": "dashboard", "label": "Dashboard", "icon": "Home", "path": "/dashboard"},
      {"id": "contacts", "label": "Contatti", "icon": "Users", "path": "/contacts"},
      {"id": "policies", "label": "Polizze", "icon": "FileText", "path": "/insurance/policies"},
      {"id": "claims", "label": "Sinistri", "icon": "AlertTriangle", "path": "/insurance/claims"},
      {"id": "commissions", "label": "Provvigioni", "icon": "DollarSign", "path": "/insurance/commissions"},
      {"id": "renewals", "label": "Scadenzario", "icon": "Calendar", "path": "/insurance/renewals"},
      {"id": "calendar", "label": "Calendario", "icon": "Calendar", "path": "/calendar"},
      {"id": "automation", "label": "Automazioni", "icon": "Zap", "path": "/automation"},
      {"id": "reports", "label": "Reports", "icon": "BarChart", "path": "/reports"}
    ]
  }'::jsonb,

-- Dashboard config for Insurance
'{
    "layout": "insurance",
    "widgets": ["policies_overview", "claims_pending", "renewals_upcoming", "commissions_monthly"]
  }'::jsonb,

-- Enabled modules (8 core Insurance modules)
ARRAY[
    'contacts', 
    'policies', 
    'claims', 
    'commissions', 
    'renewals', 
    'calendar', 
    'automation', 
    'reports'
  ]::TEXT[],

-- Active and public status
true,
  true
)
ON CONFLICT (vertical) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  sidebar_config = EXCLUDED.sidebar_config,
  dashboard_config = EXCLUDED.dashboard_config,
  enabled_modules = EXCLUDED.enabled_modules,
  updated_at = NOW();

-- ====================================================================
-- VERIFICATION QUERY (commented - for reference)
-- ====================================================================
-- Verify both Standard and Insurance configurations exist:
-- SELECT
--   vertical,
--   display_name,
--   jsonb_array_length(sidebar_config->'sections') as sidebar_items,
--   array_length(enabled_modules, 1) as module_count,
--   is_active,
--   is_public
-- FROM vertical_configurations
-- ORDER BY vertical;
--
-- Expected result: 2 rows
-- insurance: 9 sidebar items, 8 modules
-- standard: 11 sidebar items, 10 modules