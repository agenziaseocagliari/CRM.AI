-- EXECUTE THIS IN SUPABASE SQL EDITOR DIRECTLY
-- Add missing modules to Insurance vertical sidebar

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
}'::jsonb
WHERE vertical = 'insurance';