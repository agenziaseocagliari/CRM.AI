-- ================================================================================
-- 🚀 LEVEL 5 ULTIMATE DATABASE FIX - ENGINEERING FELLOW SOLUTION
-- ================================================================================
-- SOLUZIONE DEFINITIVA per tutti i problemi identificati:
-- 1. Foreign key relationships corrette per PostgREST
-- 2. Schema ottimizzato per performance
-- 3. Constraints appropriati per integrità dati
-- 4. Funzioni SQL per le edge functions
-- ================================================================================

-- STEP 1: DROP E RICREARE TUTTO CON ARCHITETTURA CORRETTA
-- ========================================================

-- 1.1: Cleanup completo esistenti
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS superadmin_logs CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- 1.2: Ensure extensions necessarie
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- STEP 2: CREARE TABELLE CON FOREIGN KEYS CORRETTE
-- ================================================

-- 2.1: Organizations (base table)
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    owner_id UUID, -- Will be FK after profiles table exists
    settings JSONB DEFAULT '{}',
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2: Profiles (references auth.users and organizations)
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

-- 2.3: Add foreign key constraint to organizations.owner_id
ALTER TABLE public.organizations 
ADD CONSTRAINT fk_organizations_owner 
FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2.4: Audit logs con foreign keys corrette
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

-- 2.5: Superadmin logs 
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

-- STEP 3: INDICI PER PERFORMANCE
-- ===============================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_role ON public.profiles(user_role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- Organizations indexes
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON public.organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_tier ON public.organizations(subscription_tier);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON public.audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON public.audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.audit_logs(severity);

-- Superadmin logs indexes
CREATE INDEX IF NOT EXISTS idx_superadmin_logs_admin_user_id ON public.superadmin_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_superadmin_logs_created_at ON public.superadmin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_superadmin_logs_operation_type ON public.superadmin_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_superadmin_logs_target_type ON public.superadmin_logs(target_type);

-- STEP 4: ROW LEVEL SECURITY
-- ==========================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmin_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT TO public
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO public
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

-- Superadmin logs policies (only super admins can view)
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

-- STEP 5: CUSTOM ACCESS TOKEN HOOK DEFINITIVO
-- ===========================================

DROP FUNCTION IF EXISTS public.custom_access_token_hook(jsonb) CASCADE;

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
    -- Log hook execution for debugging
    RAISE LOG 'custom_access_token_hook called for event: %', event;
    
    -- Extract user ID from event
    user_id := (event->'user'->>'id')::uuid;
    
    -- If no user ID, return original event
    IF user_id IS NULL THEN
        RAISE LOG 'No user ID found in event';
        RETURN event;
    END IF;
    
    -- Get current claims from event
    claims := COALESCE(event->'claims', '{}'::jsonb);
    
    -- Look up user profile with error handling
    BEGIN
        SELECT user_role, organization_id, email, full_name
        INTO profile_rec
        FROM public.profiles 
        WHERE id = user_id;
        
        -- If profile found and has user_role, add custom claims
        IF FOUND AND profile_rec.user_role IS NOT NULL THEN
            RAISE LOG 'Found profile for user %, role: %', user_id, profile_rec.user_role;
            
            -- Add custom claims
            claims := claims || jsonb_build_object(
                'user_role', profile_rec.user_role,
                'organization_id', profile_rec.organization_id,
                'email', profile_rec.email,
                'full_name', profile_rec.full_name
            );
            
            -- Add superadmin flag if applicable
            IF profile_rec.user_role = 'super_admin' THEN
                claims := claims || jsonb_build_object('is_super_admin', true);
            END IF;
            
            -- Update event with new claims
            event := jsonb_set(event, '{claims}', claims);
            
            RAISE LOG 'Claims updated for user %: %', user_id, claims;
        ELSE
            RAISE LOG 'No profile found for user %', user_id;
        END IF;
        
        EXCEPTION WHEN OTHERS THEN
            RAISE LOG 'Error in custom_access_token_hook: %', SQLERRM;
    END;
    
    RETURN event;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO service_role;

-- STEP 6: FUNZIONI SQL PER EDGE FUNCTIONS
-- =======================================

-- 6.1: Funzione per ottenere audit logs con joins
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
    resource_type TEXT,
    resource_id TEXT,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    request_id TEXT,
    success BOOLEAN,
    error_message TEXT,
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
        al.resource_type,
        al.resource_id,
        al.ip_address,
        al.user_agent,
        al.session_id,
        al.request_id,
        al.success,
        al.error_message,
        al.created_at
    FROM public.audit_logs al
    LEFT JOIN public.profiles p ON al.user_id = p.id
    WHERE (p_organization_id IS NULL OR al.organization_id = p_organization_id)
    ORDER BY al.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 6.2: Funzione per ottenere payments logs con user info 
CREATE OR REPLACE FUNCTION public.get_payments_with_user_info(
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id BIGINT,
    user_id UUID,
    user_full_name TEXT,
    user_email TEXT,
    organization_id UUID,
    organization_name TEXT,
    amount DECIMAL,
    credits_purchased INTEGER,
    status TEXT,
    payment_method TEXT,
    transaction_id TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Note: Adapt this based on actual payment table structure
    RETURN QUERY
    SELECT 
        ccl.id,
        ccl.user_id,
        p.full_name as user_full_name,
        p.email as user_email,
        p.organization_id,
        o.name as organization_name,
        ccl.credits_cost as amount,
        ccl.credits_used as credits_purchased,
        'completed'::TEXT as status,
        'system'::TEXT as payment_method,
        ccl.id::TEXT as transaction_id,
        ccl.created_at
    FROM public.credit_consumption_logs ccl
    LEFT JOIN public.profiles p ON ccl.user_id = p.id
    LEFT JOIN public.organizations o ON p.organization_id = o.id
    ORDER BY ccl.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 6.3: Funzione exec_sql per query dirette (utile per debugging)
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result TEXT;
BEGIN
    -- Log the query for security audit
    RAISE LOG 'exec_sql called with query: %', sql_query;
    
    -- Only allow SELECT statements for security
    IF NOT (sql_query ILIKE 'SELECT%') THEN
        RAISE EXCEPTION 'Only SELECT statements are allowed';
    END IF;
    
    -- Execute the query and return results as JSON
    EXECUTE 'SELECT array_to_json(array_agg(row_to_json(t))) FROM (' || sql_query || ') t' INTO result;
    
    RETURN COALESCE(result, '[]');
END;
$$;

-- Grant permissions to service role
GRANT EXECUTE ON FUNCTION public.get_audit_logs_with_user_info(UUID, INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_payments_with_user_info(INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO service_role;

-- STEP 7: INSERIMENTO DATI INIZIALI
-- ==================================

-- 7.1: Inserimento organizzazioni
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

-- 7.2: Inserimento profili
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

-- 7.3: Update organizations owner_id
UPDATE public.organizations 
SET owner_id = 'fbb13e89-ce6a-4a98-b718-3d965f19f1c7', updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

UPDATE public.organizations 
SET owner_id = 'dfa97fa5-8375-4f15-ad95-53d339ebcda9', updated_at = NOW()
WHERE id = '2aab4d72-ca5b-438f-93ac-b4c2fe2f8353';

-- STEP 8: TRIGGERS PER UPDATED_AT
-- ================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
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

-- STEP 9: VERIFICA FINALE
-- =======================

-- 9.1: Test custom access token hook
SELECT public.custom_access_token_hook(
    jsonb_build_object(
        'user', jsonb_build_object('id', 'fbb13e89-ce6a-4a98-b718-3d965f19f1c7'),
        'claims', jsonb_build_object('sub', 'fbb13e89-ce6a-4a98-b718-3d965f19f1c7', 'email', 'agenziaseocagliari@gmail.com')
    )
) AS hook_test_result;

-- 9.2: Verifica foreign keys create
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
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('profiles', 'organizations', 'audit_logs', 'superadmin_logs')
ORDER BY tc.table_name;

-- 9.3: Verifica dati inseriti
SELECT 
    'Database verification' as check_type,
    COUNT(*) as total_profiles,
    COUNT(*) FILTER (WHERE user_role = 'super_admin') as super_admin_count,
    COUNT(*) FILTER (WHERE user_role = 'enterprise') as enterprise_count
FROM public.profiles

UNION ALL

SELECT 
    'Organizations verification' as check_type,
    COUNT(*) as total_orgs,
    COUNT(*) FILTER (WHERE owner_id IS NOT NULL) as orgs_with_owners,
    0 as unused
FROM public.organizations;

-- 9.4: Test funzioni SQL per edge functions
SELECT * FROM public.get_audit_logs_with_user_info(NULL, 5, 0);

-- ================================================================================
-- 🎯 COMPLETATO! LEVEL 5 ULTIMATE DATABASE FIX
-- ================================================================================
-- 
-- Questo script ha creato:
-- ✅ Schema corretto con foreign keys funzionanti
-- ✅ Custom access token hook ottimizzato  
-- ✅ Funzioni SQL per edge functions (elimina problema PostgREST)
-- ✅ RLS policies sicure
-- ✅ Indici per performance
-- ✅ Dati iniziali configurati
-- 
-- Prossimo step: Aggiornare le edge functions per usare le nuove funzioni SQL
-- ================================================================================