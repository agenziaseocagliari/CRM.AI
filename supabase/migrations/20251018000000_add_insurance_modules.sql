-- ====================================================================
-- ADD MISSING MODULES TO INSURANCE VERTICAL
-- ====================================================================
-- Migration to add WhatsApp, Email Marketing, Sistema Crediti, and Prezzi
-- to Insurance vertical sidebar configuration
-- ====================================================================

-- Update Insurance sidebar configuration
UPDATE vertical_configurations
SET sidebar_config = '{
  "sections": [
    {
      "title": "Assicurazioni",
      "items": [
        {"name": "Dashboard", "path": "/", "icon": "LayoutDashboard"},
        {"name": "Polizze", "path": "/assicurazioni/polizze", "icon": "FileText"},
        {"name": "Sinistri", "path": "/assicurazioni/sinistri", "icon": "AlertCircle"},
        {"name": "Provvigioni", "path": "/assicurazioni/provvigioni", "icon": "DollarSign"},
        {"name": "Scadenzario", "path": "/assicurazioni/scadenzario", "icon": "Calendar"}
      ]
    },
    {
      "title": "Strumenti",
      "items": [
        {"name": "Contatti", "path": "/contatti", "icon": "Users"},
        {"name": "WhatsApp", "path": "/whatsapp", "icon": "MessageCircle"},
        {"name": "Email Marketing", "path": "/email-marketing", "icon": "Mail"},
        {"name": "Calendario", "path": "/calendario", "icon": "CalendarDays"},
        {"name": "Automazioni", "path": "/automazioni", "icon": "Zap"},
        {"name": "Report", "path": "/report", "icon": "BarChart"}
      ]
    },
    {
      "title": "Sistema",
      "items": [
        {"name": "Sistema Crediti", "path": "/universal-credits", "icon": "Coins"},
        {"name": "Prezzi", "path": "/pricing", "icon": "DollarSign"},
        {"name": "Impostazioni", "path": "/dashboard/settings", "icon": "Settings"}
      ]
    }
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
  'reports',
  'credits',
  'pricing'
]::TEXT[],
updated_at = NOW()
WHERE vertical = 'insurance';

-- Verify the update
SELECT 
  vertical,
  jsonb_array_length(sidebar_config->'sections') as section_count,
  array_length(enabled_modules, 1) as module_count
FROM vertical_configurations 
WHERE vertical = 'insurance';