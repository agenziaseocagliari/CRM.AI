-- =====================================================
-- STEP 2: LISTA COMPLETA DEGLI AGENTI
-- =====================================================
-- Esegui SOLO questo per vedere i 5 agenti in dettaglio

SELECT 
    id,
    name,
    type,
    description,
    is_active,
    status,
    configuration,
    last_run_at,
    created_at
FROM automation_agents
ORDER BY name;

-- Risultato atteso: 5 righe con tutti i dettagli
