-- Update Insurance sidebar to add missing provvigioni items
UPDATE vertical_configurations 
SET sidebar_config = '{
  "sections": [
    {
      "title": "Assicurazioni",
      "items": [
        {"name": "Dashboard", "path": "/", "icon": "LayoutDashboard"},
        {"name": "Polizze", "path": "/assicurazioni/polizze", "icon": "FileText"},
        {"name": "Sinistri", "path": "/assicurazioni/sinistri", "icon": "AlertCircle"},
        {"name": "Dashboard Provvigioni", "path": "/assicurazioni/provvigioni", "icon": "BarChart"},
        {"name": "Lista Provvigioni", "path": "/assicurazioni/provvigioni/list", "icon": "FileText"},
        {"name": "Calcola Nuova Provvigione", "path": "/assicurazioni/provvigioni/new", "icon": "Calculator"},
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
        {"name": "Report", "path": "/report", "icon": "BarChart"},
        {"name": "Moduli", "path": "/moduli", "icon": "FileText"}
      ]
    },
    {
      "title": "Sistema",
      "items": [
        {"name": "Sistema Crediti", "path": "/universal-credits", "icon": "Coins"},
        {"name": "Crediti Extra", "path": "/crediti-extra", "icon": "DollarSign"}
      ]
    }
  ]
}'::jsonb
WHERE vertical = 'insurance';

-- Verify the update
SELECT 
  vertical,
  jsonb_array_length(sidebar_config->'sections') as sections_count,
  (sidebar_config->'sections'->0->'items') as assicurazioni_items
FROM vertical_configurations 
WHERE vertical = 'insurance';