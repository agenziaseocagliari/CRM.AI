-- =====================================================
-- FIX INFINITE RECURSION - PROFILES TABLE RLS POLICIES
-- =====================================================
-- PROBLEMA: Policies su profiles fanno query su profiles → infinite recursion
-- SOLUZIONE: Usare auth.jwt() e auth.uid() direttamente

-- =====================================================
-- 1. VERIFICA POLICIES ATTUALI SU PROFILES
-- =====================================================

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- =====================================================
-- 2. DROP TUTTE LE POLICIES ESISTENTI SU PROFILES
-- =====================================================

-- Drop policies che potrebbero causare ricorsione
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;

-- =====================================================
-- 3. CREATE POLICIES CORRETTE (NO RECURSION)
-- =====================================================

-- Policy 1: Users can view their OWN profile (usa solo auth.uid())
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT
    TO public
    USING (
        id = auth.uid()  -- ✅ Nessuna query su profiles, solo confronto diretto
    );

-- Policy 2: Users can UPDATE their OWN profile (usa solo auth.uid())
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    TO public
    USING (
        id = auth.uid()  -- ✅ Nessuna query su profiles
    )
    WITH CHECK (
        id = auth.uid()  -- ✅ Nessuna query su profiles
    );

-- Policy 3: Users can INSERT their own profile during signup (auth.uid())
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT
    TO public
    WITH CHECK (
        id = auth.uid()  -- ✅ Nessuna query su profiles
    );

-- Policy 4: Super admins can view ALL profiles (usa auth.jwt() diretto)
CREATE POLICY "Super admins can view all profiles" ON profiles
    FOR SELECT
    TO public
    USING (
        -- Super admin check usando JWT direttamente (NO query su profiles)
        COALESCE(
            (auth.jwt()->>'user_role'),
            (auth.jwt()->'user_metadata'->>'user_role')
        ) = 'super_admin'
        OR
        -- OR utente può vedere il proprio profilo
        id = auth.uid()
    );

-- Policy 5: Super admins can UPDATE all profiles (usa auth.jwt() diretto)
CREATE POLICY "Super admins can update all profiles" ON profiles
    FOR UPDATE
    TO public
    USING (
        COALESCE(
            (auth.jwt()->>'user_role'),
            (auth.jwt()->'user_metadata'->>'user_role')
        ) = 'super_admin'
        OR
        id = auth.uid()
    )
    WITH CHECK (
        COALESCE(
            (auth.jwt()->>'user_role'),
            (auth.jwt()->'user_metadata'->>'user_role')
        ) = 'super_admin'
        OR
        id = auth.uid()
    );

-- Policy 6: Super admins can INSERT profiles (usa auth.jwt() diretto)
CREATE POLICY "Super admins can insert profiles" ON profiles
    FOR INSERT
    TO public
    WITH CHECK (
        COALESCE(
            (auth.jwt()->>'user_role'),
            (auth.jwt()->'user_metadata'->>'user_role')
        ) = 'super_admin'
        OR
        id = auth.uid()
    );

-- Policy 7: Super admins can DELETE profiles (usa auth.jwt() diretto)
CREATE POLICY "Super admins can delete profiles" ON profiles
    FOR DELETE
    TO public
    USING (
        COALESCE(
            (auth.jwt()->>'user_role'),
            (auth.jwt()->'user_metadata'->>'user_role')
        ) = 'super_admin'
    );

-- =====================================================
-- 4. VERIFICA POLICIES AGGIORNATE
-- =====================================================

SELECT 
    policyname,
    cmd as operation,
    CASE 
        WHEN qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%' THEN '✅ Direct auth.uid()'
        WHEN qual LIKE '%auth.jwt()%' OR with_check LIKE '%auth.jwt()%' THEN '✅ Direct auth.jwt()'
        WHEN qual LIKE '%FROM profiles%' OR with_check LIKE '%FROM profiles%' THEN '❌ Query on profiles (RECURSION!)'
        ELSE '⚠️ Check manually'
    END as recursion_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- =====================================================
-- 5. TEST ACCESSO PROFILO ENTERPRISE USER
-- =====================================================

-- Test 1: Verifica che l'utente enterprise possa vedere il proprio profilo
SELECT 
    id,
    email,
    user_role,
    organization_id,
    created_at
FROM profiles
WHERE email = 'webproseoid@gmail.com';

-- Test 2: Verifica che tu (super_admin) possa vedere tutti i profili
SELECT 
    id,
    email,
    user_role,
    organization_id
FROM profiles
ORDER BY user_role, email;

-- Test 3: Conta profili visibili
SELECT 
    COUNT(*) as total_profiles_visible,
    COUNT(CASE WHEN user_role = 'super_admin' THEN 1 END) as super_admins,
    COUNT(CASE WHEN user_role = 'enterprise' THEN 1 END) as enterprise_users,
    COUNT(CASE WHEN user_role NOT IN ('super_admin', 'enterprise') THEN 1 END) as other_users
FROM profiles;

-- =====================================================
-- 6. VERIFICA JWT DELL'UTENTE ENTERPRISE
-- =====================================================

-- Questo mostra i metadata dell'utente enterprise (dove sono user_role e organization_id)
SELECT 
    id,
    email,
    raw_user_meta_data,
    raw_user_meta_data->>'user_role' as user_role_from_metadata,
    raw_user_meta_data->>'organization_id' as org_id_from_metadata,
    created_at
FROM auth.users
WHERE email = 'webproseoid@gmail.com';

-- =====================================================
-- 7. TROUBLESHOOTING - SE ANCORA PROBLEMI
-- =====================================================

-- Verifica che RLS sia abilitato
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles' 
AND schemaname = 'public';

-- Verifica permessi sulla tabella
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'profiles' 
AND table_schema = 'public';
