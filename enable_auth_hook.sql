-- Verifica lo stato attuale dell'Auth Hook
SELECT 
    key,
    value
FROM auth.config
WHERE key LIKE '%hook%'
ORDER BY key;
