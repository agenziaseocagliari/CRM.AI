-- =====================================================
-- ATTIVA TUTTI GLI AGENTI AI
-- =====================================================
-- Esegui questo per attivare i 5 agenti

UPDATE automation_agents
SET is_active = true,
    updated_at = NOW()
WHERE is_active = false;

-- Verifica risultato
SELECT 
    name,
    type,
    is_active,
    status,
    updated_at
FROM automation_agents
ORDER BY name;

-- Conta agenti attivi
SELECT 
    COUNT(*) as total_agents,
    SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_agents,
    SUM(CASE WHEN NOT is_active THEN 1 ELSE 0 END) as inactive_agents
FROM automation_agents;

-- Risultato atteso dopo UPDATE:
-- total_agents: 5
-- active_agents: 5  ← TUTTI ATTIVI
-- inactive_agents: 0
