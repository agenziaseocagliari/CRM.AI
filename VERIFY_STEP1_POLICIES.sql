-- =====================================================
-- STEP 1: VERIFICA POLICIES AGGIORNATE
-- =====================================================
-- Esegui SOLO questo per vedere le policy corrette

SELECT 
    tablename,
    policyname,
    cmd as operation
FROM pg_policies
WHERE tablename IN (
    'automation_agents', 
    'agent_execution_logs', 
    'api_integrations', 
    'integration_usage_logs',
    'workflow_definitions',
    'workflow_execution_logs'
)
ORDER BY tablename, policyname;

-- Risultato atteso: 15 righe (tutte le policy fixate)
