-- =====================================================
-- CHECK & POPULATE AUTOMATION AGENTS
-- =====================================================
-- Script per verificare e popolare gli agenti AI mancanti

-- 1. Verifica se la tabella esiste
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'automation_agents';

-- 2. Conta agenti esistenti
SELECT COUNT(*) as total_agents FROM automation_agents;

-- 3. Lista agenti esistenti
SELECT 
    id,
    name,
    type,
    is_active,
    status,
    created_at
FROM automation_agents
ORDER BY created_at;

-- 4. Inserisci agenti se mancanti
INSERT INTO automation_agents (name, type, description, is_active, configuration) VALUES
    ('Health Monitor', 'health_monitor', 'Monitora uptime, errori API, anomalie login, warning sicurezza, dashboard health', 
     true,
     '{"alert_channels": ["in_app", "email"], "check_interval_minutes": 15, "thresholds": {"error_rate": 5, "uptime_percentage": 99}}'::jsonb),
    ('Payment/Revenue Agent', 'payment_revenue', 'Monitora pagamenti ricorrenti, crediti, rinnovi, abbonamenti, transazioni failed',
     true,
     '{"alert_channels": ["email", "whatsapp"], "check_interval_minutes": 30, "thresholds": {"failed_payment_count": 3}}'::jsonb),
    ('Support/Ticket Agent', 'support_ticket', 'Classe, smista, risponde alle richieste support incoming con escalation automatica',
     true,
     '{"alert_channels": ["in_app", "email"], "auto_response_enabled": true, "escalation_threshold_hours": 24}'::jsonb),
    ('User Engagement Agent', 'user_engagement', 'Automatizza onboarding clienti, invio remind upgrade, campagne marketing',
     true,
     '{"channels": ["email", "whatsapp"], "onboarding_enabled": true, "upgrade_reminder_days": 7}'::jsonb),
    ('Security Watcher', 'security_watcher', 'Scannerizza log auth/API, segnala anomalie, tentativi login irregolari',
     true,
     '{"alert_channels": ["email", "telegram"], "auto_lock_enabled": false, "failed_login_threshold": 5, "anomaly_detection_enabled": true}'::jsonb)
ON CONFLICT (name) DO UPDATE SET
    is_active = EXCLUDED.is_active,
    configuration = EXCLUDED.configuration,
    updated_at = NOW();

-- 5. Verifica inserimento
SELECT 
    id,
    name,
    type,
    is_active,
    status,
    created_at
FROM automation_agents
ORDER BY name;

-- 6. Test RLS policy per super_admin
-- Verifica che il super_admin possa vedere gli agenti
SELECT 
    p.id as profile_id,
    p.email,
    p.role,
    (SELECT COUNT(*) FROM automation_agents) as visible_agents
FROM profiles p
WHERE p.role = 'super_admin'
LIMIT 1;
