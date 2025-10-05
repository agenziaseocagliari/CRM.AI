-- =====================================================
-- Super Admin Schema Migration
-- =====================================================
-- This migration adds the necessary tables, policies, and roles
-- for a robust Super Admin security strategy.

-- =====================================================
-- 1. Extend profiles table with super_admin role
-- =====================================================
-- Add role column to profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'user';
    END IF;
END $$;

-- Add index for role queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- =====================================================
-- 2. Create superadmin_logs audit trail table
-- =====================================================
CREATE TABLE IF NOT EXISTS superadmin_logs (
    id BIGSERIAL PRIMARY KEY,
    admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    operation_type TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'READ', 'EXECUTE'
    target_type TEXT, -- 'USER', 'ORGANIZATION', 'PAYMENT', 'SYSTEM'
    target_id TEXT,
    details JSONB,
    result TEXT NOT NULL, -- 'SUCCESS', 'FAILURE', 'PARTIAL'
    error_message TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_superadmin_logs_admin_user_id ON superadmin_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_superadmin_logs_action ON superadmin_logs(action);
CREATE INDEX IF NOT EXISTS idx_superadmin_logs_operation_type ON superadmin_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_superadmin_logs_target_type ON superadmin_logs(target_type);
CREATE INDEX IF NOT EXISTS idx_superadmin_logs_target_id ON superadmin_logs(target_id);
CREATE INDEX IF NOT EXISTS idx_superadmin_logs_created_at ON superadmin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_superadmin_logs_result ON superadmin_logs(result);

-- =====================================================
-- 3. Enable Row Level Security for Super Admin tables
-- =====================================================
ALTER TABLE superadmin_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. Create RLS Policies for superadmin_logs
-- =====================================================
-- Only super admins can view audit logs
DROP POLICY IF EXISTS "Super admins can view all audit logs" ON superadmin_logs;CREATE POLICY "Super admins can view all audit logs" ON superadmin_logs
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- Only super admins can insert audit logs (via edge functions)
DROP POLICY IF EXISTS "Super admins can insert audit logs" ON superadmin_logs;CREATE POLICY "Super admins can insert audit logs" ON superadmin_logs
    FOR INSERT
    TO public
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- =====================================================
-- 5. Update RLS Policies for sensitive tables
-- =====================================================
-- Update profiles table policies to allow super admin access
-- Wrapped in DO block to ensure table exists before modifying policies
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
    ) THEN
        DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
        DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;                CREATE POLICY "Super admins can view all profiles" ON profiles
            FOR SELECT
            TO public
            USING (
                role = 'super_admin' OR
                id = auth.uid()
            );

        DROP POLICY IF EXISTS "Super admins can update all profiles" ON profiles;
        DROP POLICY IF EXISTS "Super admins can update all profiles" ON profiles;                CREATE POLICY "Super admins can update all profiles" ON profiles
            FOR UPDATE
            TO public
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role = 'super_admin'
                )
            );
    END IF;
END $$;

-- Update organizations table policies to allow super admin access
-- Wrapped in DO block to ensure table exists before modifying policies
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'organizations'
    ) THEN
        DROP POLICY IF EXISTS "Super admins can view all organizations" ON organizations;
        DROP POLICY IF EXISTS "Super admins can view all organizations" ON organizations;                CREATE POLICY "Super admins can view all organizations" ON organizations
            FOR SELECT
            TO public
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role = 'super_admin'
                ) OR
                id IN (
                    SELECT organization_id FROM profiles WHERE id = auth.uid()
                )
            );

        DROP POLICY IF EXISTS "Super admins can update all organizations" ON organizations;
        DROP POLICY IF EXISTS "Super admins can update all organizations" ON organizations;                CREATE POLICY "Super admins can update all organizations" ON organizations
            FOR UPDATE
            TO public
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role = 'super_admin'
                )
            );

        DROP POLICY IF EXISTS "Super admins can insert organizations" ON organizations;
        DROP POLICY IF EXISTS "Super admins can insert organizations" ON organizations;                CREATE POLICY "Super admins can insert organizations" ON organizations
            FOR INSERT
            TO public
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role = 'super_admin'
                )
            );
    END IF;
END $$;

-- Update organization_credits policies for super admin access
-- Wrapped in DO block to ensure table exists before modifying policies
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'organization_credits'
    ) THEN
        DROP POLICY IF EXISTS "Super admins can view all organization credits" ON organization_credits;
        DROP POLICY IF EXISTS "Super admins can view all organization credits" ON organization_credits;                CREATE POLICY "Super admins can view all organization credits" ON organization_credits
            FOR SELECT
            TO public
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role = 'super_admin'
                ) OR
                organization_id IN (
                    SELECT organization_id FROM profiles WHERE id = auth.uid()
                )
            );

        DROP POLICY IF EXISTS "Super admins can update all organization credits" ON organization_credits;
        DROP POLICY IF EXISTS "Super admins can update all organization credits" ON organization_credits;                CREATE POLICY "Super admins can update all organization credits" ON organization_credits
            FOR UPDATE
            TO public
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role = 'super_admin'
                )
            );
    END IF;
END $$;

-- Update credit_consumption_logs policies for super admin access
-- Wrapped in DO block to ensure table exists before modifying policies
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'credit_consumption_logs'
    ) THEN
        DROP POLICY IF EXISTS "Super admins can view all credit consumption logs" ON credit_consumption_logs;
        DROP POLICY IF EXISTS "Super admins can view all credit consumption logs" ON credit_consumption_logs;                CREATE POLICY "Super admins can view all credit consumption logs" ON credit_consumption_logs
            FOR SELECT
            TO public
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role = 'super_admin'
                ) OR
                organization_id IN (
                    SELECT organization_id FROM profiles WHERE id = auth.uid()
                )
            );
    END IF;
END $$;

-- =====================================================
-- 6. Create helper function to check super admin role
-- =====================================================
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. Create function to log super admin actions
-- =====================================================
CREATE OR REPLACE FUNCTION log_superadmin_action(
    p_action TEXT,
    p_operation_type TEXT,
    p_target_type TEXT DEFAULT NULL,
    p_target_id TEXT DEFAULT NULL,
    p_details JSONB DEFAULT NULL,
    p_result TEXT DEFAULT 'SUCCESS',
    p_error_message TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    v_log_id BIGINT;
    v_admin_email TEXT;
BEGIN
    -- Get admin email
    SELECT email INTO v_admin_email
    FROM auth.users
    WHERE id = auth.uid();

    -- Insert log record
    INSERT INTO superadmin_logs (
        admin_user_id,
        admin_email,
        action,
        operation_type,
        target_type,
        target_id,
        details,
        result,
        error_message,
        ip_address,
        user_agent
    ) VALUES (
        auth.uid(),
        v_admin_email,
        p_action,
        p_operation_type,
        p_target_type,
        p_target_id,
        p_details,
        p_result,
        p_error_message,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. Grant necessary permissions
-- =====================================================
-- Grant execute permission on helper functions to public (authenticated users will use these)
-- Note: Using TO public with RLS ensures only authenticated users can execute these functions
GRANT EXECUTE ON FUNCTION is_super_admin() TO public;
GRANT EXECUTE ON FUNCTION log_superadmin_action(TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT) TO public;

-- =====================================================
-- 9. Add comments for documentation
-- =====================================================
COMMENT ON TABLE superadmin_logs IS 'Audit trail for all super admin operations';
COMMENT ON COLUMN superadmin_logs.operation_type IS 'Type of operation: CREATE, UPDATE, DELETE, READ, EXECUTE';
COMMENT ON COLUMN superadmin_logs.target_type IS 'Type of entity affected: USER, ORGANIZATION, PAYMENT, SYSTEM';
COMMENT ON COLUMN superadmin_logs.result IS 'Operation result: SUCCESS, FAILURE, PARTIAL';
COMMENT ON FUNCTION is_super_admin() IS 'Check if current user has super_admin role';
COMMENT ON FUNCTION log_superadmin_action(TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT) IS 'Log super admin action to audit trail';
