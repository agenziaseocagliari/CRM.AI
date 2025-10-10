-- ====================================================================
-- TEST VARIANTI EVENTO GOTURE
-- ====================================================================
-- GoTrue potrebbe passare l'evento in formati diversi
-- Testiamo tutte le varianti possibili
-- ====================================================================

-- VARIANTE 1: user_id come stringa top-level (quello che abbiamo ora)
SELECT 
    '1. user_id top-level (CURRENT)' as variant,
    public.custom_access_token_hook(
        jsonb_build_object(
            'user_id', 'fbb13e89-ce6a-4a98-b718-3d965f19f1c7',
            'claims', jsonb_build_object(
                'sub', 'fbb13e89-ce6a-4a98-b718-3d965f19f1c7'
            )
        )
    ) as result;

-- VARIANTE 2: user come oggetto con id dentro
SELECT 
    '2. user object with id (OLD FORMAT)' as variant,
    public.custom_access_token_hook(
        jsonb_build_object(
            'user', jsonb_build_object(
                'id', 'fbb13e89-ce6a-4a98-b718-3d965f19f1c7',
                'email', 'agenziaseocagliari@gmail.com'
            ),
            'claims', jsonb_build_object(
                'sub', 'fbb13e89-ce6a-4a98-b718-3d965f19f1c7'
            )
        )
    ) as result;

-- VARIANTE 3: authentication come root object
SELECT 
    '3. authentication root object' as variant,
    public.custom_access_token_hook(
        jsonb_build_object(
            'authentication', jsonb_build_object(
                'user_id', 'fbb13e89-ce6a-4a98-b718-3d965f19f1c7'
            ),
            'claims', jsonb_build_object(
                'sub', 'fbb13e89-ce6a-4a98-b718-3d965f19f1c7'
            )
        )
    ) as result;

-- VARIANTE 4: Solo claims con sub
SELECT 
    '4. Only claims with sub' as variant,
    public.custom_access_token_hook(
        jsonb_build_object(
            'claims', jsonb_build_object(
                'sub', 'fbb13e89-ce6a-4a98-b718-3d965f19f1c7',
                'email', 'agenziaseocagliari@gmail.com',
                'role', 'authenticated'
            )
        )
    ) as result;

-- Test per vedere quale funziona
