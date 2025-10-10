-- =====================================================
-- STEP 5: TEST RLS - CONTA TUTTI GLI AGENTI
-- =====================================================
-- Esegui SOLO questo per verificare che vedi gli agenti come super_admin

SELECT COUNT(*) as total_agents_visible
FROM automation_agents;

-- Risultato atteso: 5

-- Breakdown per tipo
SELECT 
    type,
    COUNT(*) as count,
    SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_count
FROM automation_agents
GROUP BY type
ORDER BY type;

-- Risultato atteso: 5 righe, uno per ogni tipo di agente
