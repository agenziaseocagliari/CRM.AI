-- ====================================================================
-- INVALIDA TUTTE LE SESSIONI PER FORZARE RIGENERAZIONE JWT
-- ====================================================================

DELETE FROM auth.sessions 
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email IN ('agenziaseocagliari@gmail.com', 'webproseoid@gmail.com')
)
RETURNING 
    user_id,
    (SELECT email FROM auth.users WHERE id = user_id) as email,
    'Session invalidated - user must login again' as status;

-- ====================================================================
-- VERIFICA: Nessuna sessione attiva
-- ====================================================================

SELECT 
    'Sessioni Attive' as check_type,
    COUNT(*) as active_sessions,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Nessuna sessione attiva - pronto per nuovo login'
        ELSE '⚠️ Ci sono ancora sessioni attive'
    END as status
FROM auth.sessions
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email IN ('agenziaseocagliari@gmail.com', 'webproseoid@gmail.com')
);
