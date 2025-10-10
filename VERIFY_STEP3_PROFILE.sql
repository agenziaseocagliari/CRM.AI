-- =====================================================
-- STEP 3: VERIFICA TUO PROFILO SUPER ADMIN
-- =====================================================
-- Esegui SOLO questo per verificare il tuo profilo

SELECT 
    id,
    email,
    user_role,
    organization_id,
    created_at
FROM profiles
WHERE email = 'agenziaseocagliari@gmail.com';

-- Risultato atteso: 1 riga con user_role = 'super_admin'
