-- =====================================================
-- POPULATE AUTOMATION AGENTS - EXECUTE IN SUPABASE STUDIO
-- =====================================================

-- Step 1: Verifica se la tabella esiste
SELECT 
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'automation_agents'
    ) as table_exists;

-- Step 2: Se la tabella esiste, conta gli agenti
SELECT COUNT(*) as total_agents FROM automation_agents;

-- Step 3: Lista agenti esistenti (se ce ne sono)
SELECT 
    id,
    name,
    type,
    is_active,
    status,
    created_at
FROM automation_agents
ORDER BY created_at;

-- Step 4: Verifica il tuo profilo super_admin
SELECT 
    id,
    email,
    user_role,
    organization_id
FROM profiles
WHERE email = 'agenziaseocagliari@gmail.com';

-- Step 5: POPOLA GLI AGENTI (esegui questo solo se il COUNT sopra è 0)
-- IMPORTANTE: Rimuovi il commento per eseguire
/*
INSERT INTO automation_agents (name, type, description, is_active, configuration, status) VALUES
    ('Health Monitor', 'health_monitor', 'Monitora uptime, errori API, anomalie login, warning sicurezza, dashboard health', 
     true,
     '{"alert_channels": ["in_app", "email"], "check_interval_minutes": 15, "thresholds": {"error_rate": 5, "uptime_percentage": 99}}'::jsonb,
     'idle'),
    ('Payment/Revenue Agent', 'payment_revenue', 'Monitora pagamenti ricorrenti, crediti, rinnovi, abbonamenti, transazioni failed',
     true,
     '{"alert_channels": ["email", "whatsapp"], "check_interval_minutes": 30, "thresholds": {"failed_payment_count": 3}}'::jsonb,
     'idle'),
    ('Support/Ticket Agent', 'support_ticket', 'Classe, smista, risponde alle richieste support incoming con escalation automatica',
     true,
     '{"alert_channels": ["in_app", "email"], "auto_response_enabled": true, "escalation_threshold_hours": 24}'::jsonb,
     'idle'),
    ('User Engagement Agent', 'user_engagement', 'Automatizza onboarding clienti, invio remind upgrade, campagne marketing',
     true,
     '{"channels": ["email", "whatsapp"], "onboarding_enabled": true, "upgrade_reminder_days": 7}'::jsonb,
     'idle'),
    ('Security Watcher', 'security_watcher', 'Scannerizza log auth/API, segnala anomalie, tentativi login irregolari',
     true,
     '{"alert_channels": ["email", "telegram"], "auto_lock_enabled": false, "failed_login_threshold": 5, "anomaly_detection_enabled": true}'::jsonb,
     'idle');
*/

-- Step 6: Verifica inserimento (esegui dopo l'INSERT)
SELECT 
    id,
    name,
    type,
    is_active,
    status,
    configuration,
    created_at
FROM automation_agents
ORDER BY name;

-- Step 7: Test RLS - verifica che tu possa vederli come super_admin
-- Questo deve restituire il numero di agenti (5)
SELECT COUNT(*) as agents_visible_to_me
FROM automation_agents;

-- Step 8: Se il test RLS fallisce, verifica le policy
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'automation_agents';
