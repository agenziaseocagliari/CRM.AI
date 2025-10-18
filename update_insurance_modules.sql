-- Update Insurance vertical to add WhatsApp and Email Marketing modules
UPDATE vertical_configurations
SET 
  sidebar_config = '{
    "sections": [
      {"id": "dashboard", "label": "Dashboard", "icon": "Home", "path": "/dashboard"},
      {"id": "contacts", "label": "Contatti", "icon": "Users", "path": "/contacts"},
      {"id": "policies", "label": "Polizze", "icon": "FileText", "path": "/insurance/policies"},
      {"id": "claims", "label": "Sinistri", "icon": "AlertTriangle", "path": "/insurance/claims"},
      {"id": "commissions", "label": "Provvigioni", "icon": "DollarSign", "path": "/insurance/commissions"},
      {"id": "renewals", "label": "Scadenzario", "icon": "Calendar", "path": "/insurance/renewals"},
      {"id": "calendar", "label": "Calendario", "icon": "Calendar", "path": "/calendar"},
      {"id": "automation", "label": "Automazioni", "icon": "Zap", "path": "/automation"},
      {"id": "whatsapp", "label": "WhatsApp", "icon": "MessageCircle", "path": "/whatsapp"},
      {"id": "email", "label": "Email Marketing", "icon": "Mail", "path": "/email-marketing"},
      {"id": "reports", "label": "Reports", "icon": "BarChart", "path": "/reports"}
    ]
  }'::jsonb,
  enabled_modules = ARRAY[
    'contacts', 
    'policies', 
    'claims', 
    'commissions', 
    'renewals', 
    'calendar', 
    'automation', 
    'whatsapp', 
    'email', 
    'reports'
  ]::TEXT[],
  description = 'Soluzione completa per agenzie assicurative - Gestione polizze, sinistri, provvigioni, WhatsApp, Email Marketing',
  updated_at = NOW()
WHERE vertical = 'insurance';

-- Verify the update
SELECT 
  vertical,
  display_name,
  description,
  jsonb_array_length(sidebar_config->'sections') as sidebar_count,
  array_length(enabled_modules, 1) as module_count,
  is_active
FROM vertical_configurations 
WHERE vertical = 'insurance';