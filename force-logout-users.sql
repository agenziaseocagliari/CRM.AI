-- ====================================================================
-- FORCE LOGOUT USERS WITH OLD JWT TOKENS
-- ====================================================================
-- Questo script invalida le sessioni degli utenti che non hanno ancora
-- JWT token con user_role claims, forzandoli a rifare login
-- ====================================================================

-- OPZIONE 1: Invalidare SOLO le sessioni dei due utenti specifici
-- (Approccio conservativo - raccomandato)
DELETE FROM auth.sessions 
WHERE user_id IN (
  'fbb13e89-ce6a-4a98-b718-3d965f19f1c7',  -- agenziaseocagliari@gmail.com
  'dfa97fa5-8375-4f15-ad95-53d339ebcda9'   -- webproseoid@gmail.com
);

-- Verifica quante sessioni sono state eliminate
SELECT 'Sessioni eliminate per utenti specifici' as action;

-- OPZIONE 2: Invalidare TUTTE le sessioni (use con cautela!)
-- Decommentare solo se necessario invalidare tutti gli utenti
-- 
-- DELETE FROM auth.sessions;
-- SELECT 'TUTTE le sessioni sono state eliminate - TUTTI gli utenti dovranno rifare login' as warning;

-- ====================================================================
-- RISULTATO ATTESO:
-- - Le sessioni correnti vengono eliminate
-- - Al prossimo tentativo di accesso, gli utenti riceveranno errore 401
-- - Dovranno rifare login
-- - I nuovi JWT conterranno user_role e organization_id grazie al hook
-- ====================================================================
