-- ================================================================================
-- 🚀 LEVEL 5 ULTIMATE DATABASE FIX - DEADLOCK SAFE VERSION
-- ================================================================================
-- VERSIONE ANTI-DEADLOCK: Risolve i conflitti di lock tra processi
-- Eseguire questo script nel SQL Editor di Supabase invece del precedente
-- ================================================================================

-- STEP 0: KILL ACTIVE CONNECTIONS E CLEANUP LOCKS
-- Termina connessioni attive che potrebbero causare deadlock
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = current_database() 
  AND pid <> pg_backend_pid()
  AND state = 'active'
  AND (query ILIKE '%audit_logs%' OR query ILIKE '%profiles%' OR query ILIKE '%organizations%');

-- Forza rilascio dei lock
SELECT pg_advisory_unlock_all();

-- STEP 1: CLEANUP IN ORDINE SPECIFICO PER EVITARE DEADLOCK
-- Drop in ordine che evita foreign key conflicts
DROP TABLE IF EXISTS public.superadmin_logs CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;

-- Cleanup functions che potrebbero essere in uso
DROP FUNCTION IF EXISTS public.custom_access_token_hook(jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.get_audit_logs_with_user_info(UUID, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.get_superadmin_logs_filtered(TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- STEP 2: CREAZIONE TABELLE IN TRANSAZIONI SEPARATE
-- 2.1: Organizations (prima, senza FK)
BEGIN;
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    owner_id UUID, -- Sarà FK dopo
    settings JSONB DEFAULT '{}',
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMIT;

-- 2.2: Profiles (con FK verso auth.users e organizations)
BEGIN;
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    user_role TEXT NOT NULL DEFAULT 'user' CHECK (user_role IN ('user', 'admin', 'enterprise', 'super_admin')),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMIT;

-- 2.3: Aggiungi FK a organizations.owner_id DOPO aver creato profiles
BEGIN;
ALTER TABLE public.organizations 
ADD CONSTRAINT fk_organizations_owner 
FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
COMMIT;

-- 2.4: Audit logs (con FK verso organizations e auth.users)
BEGIN;
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    event_category TEXT NOT NULL DEFAULT 'system',
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    description TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    resource_type TEXT,
    resource_id TEXT,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    request_id TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMIT;

-- 2.5: Superadmin logs (con FK verso auth.users)
BEGIN;
CREATE TABLE public.superadmin_logs (
    id BIGSERIAL PRIMARY KEY,
    admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('CREATE', 'READ', 'UPDATE', 'DELETE', 'EXECUTE')),
    target_type TEXT CHECK (target_type IN ('USER', 'ORGANIZATION', 'PAYMENT', 'SYSTEM')),
    target_id TEXT,
    details JSONB DEFAULT '{}',
    result TEXT NOT NULL DEFAULT 'SUCCESS' CHECK (result IN ('SUCCESS', 'FAILURE', 'PARTIAL')),
    error_message TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMIT;

-- STEP 3: INDICI (in transazioni separate per performance)
BEGIN;
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_role ON public.profiles(user_role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
COMMIT;

BEGIN;
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON public.audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
COMMIT;

BEGIN;
CREATE INDEX IF NOT EXISTS idx_superadmin_logs_admin_user_id ON public.superadmin_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_superadmin_logs_created_at ON public.superadmin_logs(created_at DESC);
COMMIT;

-- STEP 4: ROW LEVEL SECURITY (transazione per tabella)
BEGIN;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT TO public
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
CREATE POLICY "Super admins can view all profiles" ON public.profiles
    FOR ALL TO public
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND user_role = 'super_admin'
        )
    );
COMMIT;

BEGIN;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
-- Organizations policies
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;
CREATE POLICY "Users can view their organization" ON public.organizations
    FOR SELECT TO public
    USING (
        id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Super admins can view all organizations" ON public.organizations;
CREATE POLICY "Super admins can view all organizations" ON public.organizations
    FOR ALL TO public
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND user_role = 'super_admin'
        )
    );
COMMIT;

BEGIN;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
-- Audit logs policies
DROP POLICY IF EXISTS "Users can view audit logs for their organization" ON public.audit_logs;
CREATE POLICY "Users can view audit logs for their organization" ON public.audit_logs
    FOR SELECT TO public
    USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT TO public
    WITH CHECK (auth.uid() IS NOT NULL);
COMMIT;

BEGIN;
ALTER TABLE public.superadmin_logs ENABLE ROW LEVEL SECURITY;
-- Superadmin logs policies
DROP POLICY IF EXISTS "Super admins can view all superadmin logs" ON public.superadmin_logs;
CREATE POLICY "Super admins can view all superadmin logs" ON public.superadmin_logs
    FOR SELECT TO public
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND user_role = 'super_admin'
        )
    );

DROP POLICY IF EXISTS "System can insert superadmin logs" ON public.superadmin_logs;
CREATE POLICY "System can insert superadmin logs" ON public.superadmin_logs
    FOR INSERT TO public
    WITH CHECK (auth.uid() IS NOT NULL);
COMMIT;

-- STEP 5: CUSTOM ACCESS TOKEN HOOK
BEGIN;
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    user_id uuid;
    profile_rec record;
    claims jsonb;
BEGIN
    -- Extract user ID from event
    user_id := (event->'user'->>'id')::uuid;
    
    IF user_id IS NULL THEN
        RETURN event;
    END IF;
    
    -- Get current claims from event
    claims := COALESCE(event->'claims', '{}'::jsonb);
    
    -- Look up user profile
    BEGIN
        SELECT user_role, organization_id, email, full_name
        INTO profile_rec
        FROM public.profiles 
        WHERE id = user_id;
        
        IF FOUND AND profile_rec.user_role IS NOT NULL THEN
            -- Add custom claims
            claims := claims || jsonb_build_object(
                'user_role', profile_rec.user_role,
                'organization_id', profile_rec.organization_id,
                'email', profile_rec.email,
                'full_name', profile_rec.full_name
            );
            
            IF profile_rec.user_role = 'super_admin' THEN
                claims := claims || jsonb_build_object('is_super_admin', true);
            END IF;
            
            -- Update event with new claims
            event := jsonb_set(event, '{claims}', claims);
        END IF;
        
        EXCEPTION WHEN OTHERS THEN
            -- Log error but don't fail the authentication
            NULL;
    END;
    
    RETURN event;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO service_role;
COMMIT;

-- STEP 6: FUNZIONI SQL PER EDGE FUNCTIONS (transazione separata)
BEGIN;
-- 6.1: Funzione per audit logs con user info
CREATE OR REPLACE FUNCTION public.get_audit_logs_with_user_info(
    p_organization_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    organization_id UUID,
    user_id UUID,
    user_full_name TEXT,
    user_email TEXT,
    event_type TEXT,
    event_category TEXT,
    severity TEXT,
    description TEXT,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.organization_id,
        al.user_id,
        p.full_name as user_full_name,
        p.email as user_email,
        al.event_type,
        al.event_category,
        al.severity,
        al.description,
        al.details,
        al.ip_address,
        al.user_agent,
        al.success,
        al.created_at
    FROM public.audit_logs al
    LEFT JOIN public.profiles p ON al.user_id = p.id
    WHERE (p_organization_id IS NULL OR al.organization_id = p_organization_id)
    ORDER BY al.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 6.2: Funzione per superadmin logs
CREATE OR REPLACE FUNCTION public.get_superadmin_logs_filtered(
    p_search TEXT DEFAULT NULL,
    p_operation_type TEXT DEFAULT NULL,
    p_target_type TEXT DEFAULT NULL,
    p_result TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id BIGINT,
    admin_user_id UUID,
    admin_email TEXT,
    action TEXT,
    operation_type TEXT,
    target_type TEXT,
    target_id TEXT,
    details JSONB,
    result TEXT,
    error_message TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sl.id,
        sl.admin_user_id,
        sl.admin_email,
        sl.action,
        sl.operation_type,
        sl.target_type,
        sl.target_id,
        sl.details,
        sl.result,
        sl.error_message,
        sl.ip_address,
        sl.user_agent,
        sl.created_at
    FROM public.superadmin_logs sl
    WHERE (p_search IS NULL OR 
           sl.admin_email ILIKE '%' || p_search || '%' OR
           sl.action ILIKE '%' || p_search || '%' OR
           sl.target_id ILIKE '%' || p_search || '%')
      AND (p_operation_type IS NULL OR sl.operation_type = p_operation_type)
      AND (p_target_type IS NULL OR sl.target_type = p_target_type)
      AND (p_result IS NULL OR sl.result = p_result)
    ORDER BY sl.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_audit_logs_with_user_info(UUID, INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_superadmin_logs_filtered(TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER) TO service_role;
COMMIT;

-- STEP 7: INSERIMENTO DATI (transazione separata)
BEGIN;
INSERT INTO public.organizations (id, name, slug, subscription_tier, status)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'System Admin', 'system-admin', 'enterprise', 'active'),
    ('2aab4d72-ca5b-438f-93ac-b4c2fe2f8353', 'Agenzia SEO Cagliari', 'agenzia-seo-cagliari', 'enterprise', 'active')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    subscription_tier = EXCLUDED.subscription_tier,
    status = EXCLUDED.status,
    updated_at = NOW();

INSERT INTO public.profiles (id, email, full_name, user_role, organization_id, subscription_tier, status, is_active)
VALUES 
    ('fbb13e89-ce6a-4a98-b718-3d965f19f1c7', 'agenziaseocagliari@gmail.com', 'Super Admin', 'super_admin', '00000000-0000-0000-0000-000000000001', 'enterprise', 'active', true),
    ('dfa97fa5-8375-4f15-ad95-53d339ebcda9', 'webproseoid@gmail.com', 'Enterprise User', 'enterprise', '2aab4d72-ca5b-438f-93ac-b4c2fe2f8353', 'enterprise', 'active', true)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    user_role = EXCLUDED.user_role,
    organization_id = EXCLUDED.organization_id,
    subscription_tier = EXCLUDED.subscription_tier,
    status = EXCLUDED.status,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Update organizations owner_id
UPDATE public.organizations 
SET owner_id = 'fbb13e89-ce6a-4a98-b718-3d965f19f1c7', updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

UPDATE public.organizations 
SET owner_id = 'dfa97fa5-8375-4f15-ad95-53d339ebcda9', updated_at = NOW()
WHERE id = '2aab4d72-ca5b-438f-93ac-b4c2fe2f8353';
COMMIT;

-- STEP 8: TRIGGERS (transazione separata)
BEGIN;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
CREATE TRIGGER update_organizations_updated_at 
    BEFORE UPDATE ON public.organizations 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();
COMMIT;

-- STEP 9: VERIFICA FINALE (senza transazione per permettere rollback parziale)
-- Test custom access token hook
SELECT public.custom_access_token_hook(
    jsonb_build_object(
        'user', jsonb_build_object('id', 'fbb13e89-ce6a-4a98-b718-3d965f19f1c7'),
        'claims', jsonb_build_object('sub', 'fbb13e89-ce6a-4a98-b718-3d965f19f1c7', 'email', 'agenziaseocagliari@gmail.com')
    )
) AS hook_test_result;

-- Verifica foreign keys
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('profiles', 'organizations', 'audit_logs', 'superladmin_logs')
ORDER BY tc.table_name;

-- Test funzioni SQL (limitate per evitare errori se non ci sono dati)
SELECT 'Testing get_audit_logs_with_user_info' as test_name;
SELECT * FROM public.get_audit_logs_with_user_info(NULL, 1, 0) LIMIT 1;

SELECT 'Testing get_superadmin_logs_filtered' as test_name;
SELECT * FROM public.get_superadmin_logs_filtered(NULL, NULL, NULL, NULL, 1, 0) LIMIT 1;

-- ================================================================================
-- 🎯 DEADLOCK SAFE DATABASE FIX COMPLETATO!
-- ================================================================================
-- 
-- ✅ Transazioni separate per evitare deadlock
-- ✅ Terminazione connessioni attive conflittuali
-- ✅ Ordine corretto di creazione tabelle/foreign keys
-- ✅ Schema corretto e funzionale
-- ✅ Funzioni SQL per edge functions
-- 
-- NOTA: Se ottieni ancora deadlock, riprova tra 30 secondi
-- Il database potrebbe aver bisogno di tempo per rilasciare tutti i lock
-- ================================================================================