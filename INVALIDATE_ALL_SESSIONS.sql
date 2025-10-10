-- ====================================================================
-- INVALIDAZIONE COMPLETA SESSIONI + FORCE REFRESH
-- ====================================================================
-- Elimina tutte le sessioni per forzare nuovi JWT con l'hook
-- ====================================================================

-- STEP 1: Conta sessioni prima dell'eliminazione
SELECT 
    'BEFORE: Sessioni totali' as step,
    COUNT(*) as total_sessions
FROM auth.sessions;

-- STEP 2: Elimina TUTTE le sessioni
DELETE FROM auth.sessions;

-- STEP 3: Verifica eliminazione
SELECT 
    'AFTER: Sessioni rimaste' as step,
    COUNT(*) as total_sessions
FROM auth.sessions;

-- STEP 4: Verifica refresh_tokens
SELECT 
    'Refresh tokens eliminati' as step,
    COUNT(*) as total_tokens
FROM auth.refresh_tokens;

-- ====================================================================
-- DOPO QUESTO:
-- 1. Chiudi TUTTI i browser
-- 2. Riapri nuovo browser
-- 3. Vai all'app
-- 4. Login con agenziaseocagliari@gmail.com
-- 5. L'hook DEVE essere chiamato e generare il JWT corretto
-- ====================================================================
