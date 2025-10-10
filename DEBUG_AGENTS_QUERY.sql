-- =====================================================
-- DEBUG: TEST QUERY IDENTICA AL FRONTEND
-- =====================================================
-- Questa è la STESSA query che esegue il componente React

-- Test 1: Query base (come fa il componente)
SELECT *
FROM automation_agents
ORDER BY created_at ASC;

-- Test 2: Verifica che auth.uid() funzioni
SELECT 
    auth.uid() as current_user_id,
    (SELECT COUNT(*) FROM profiles WHERE id = auth.uid()) as profile_exists,
    (SELECT user_role FROM profiles WHERE id = auth.uid()) as my_role;

-- Test 3: Simula la policy RLS
SELECT 
    aa.*,
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.user_role = 'super_admin'
    ) as has_permission
FROM automation_agents aa;

-- Test 4: Verifica se ci sono constraint violations
SELECT
    conname as constraint_name,
    contype as constraint_type,
    conrelid::regclass as table_name
FROM pg_constraint
WHERE conrelid = 'automation_agents'::regclass;

-- Test 5: Verifica colonne della tabella
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'automation_agents'
ORDER BY ordinal_position;
