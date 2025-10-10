-- =====================================================
-- STEP 6: DETTAGLIO CONFIGURAZIONE AGENTI
-- =====================================================
-- Esegui SOLO questo per vedere le configurazioni di ogni agente

SELECT 
    name,
    type,
    is_active,
    configuration->>'alert_channels' as alert_channels,
    configuration->>'check_interval_minutes' as check_interval,
    configuration as full_config
FROM automation_agents
ORDER BY name;

-- Questo mostra i canali di alert e intervalli di check per ogni agente
