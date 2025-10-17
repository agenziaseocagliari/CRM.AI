-- Update Standard Vertical Sidebar Configuration
-- This SQL should be run in Supabase SQL editor to restore all original menu items

UPDATE vertical_configurations
SET sidebar_config = '{
  "sections": [
    {"id": "dashboard", "label": "Dashboard", "icon": "Home", "path": "/dashboard"},
    {"id": "opportunities", "label": "Pipeline", "icon": "TrendingUp", "path": "/opportunities"},
    {"id": "contacts", "label": "Contatti", "icon": "Users", "path": "/contacts"},
    {"id": "calendar", "label": "Calendario", "icon": "Calendar", "path": "/calendar"},
    {"id": "reports", "label": "Reports", "icon": "BarChart3", "path": "/reports"},
    {"id": "forms", "label": "Forms", "icon": "FileText", "path": "/forms"},
    {"id": "automation", "label": "Automazioni", "icon": "Zap", "path": "/automation"},
    {"id": "whatsapp", "label": "WhatsApp", "icon": "MessageCircle", "path": "/whatsapp"},
    {"id": "email-marketing", "label": "Email Marketing", "icon": "Mail", "path": "/email-marketing"},
    {"id": "credits", "label": "Sistema Crediti", "icon": "CreditCard", "path": "/universal-credits"},
    {"id": "store", "label": "Prezzi", "icon": "CreditCard", "path": "/store"}
  ]
}'::jsonb
WHERE vertical = 'standard';

-- Verify the update
SELECT vertical, sidebar_config FROM vertical_configurations WHERE vertical = 'standard';