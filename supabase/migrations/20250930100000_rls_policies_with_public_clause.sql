-- =====================================================
-- RLS Policies Batch Update - TO public with Custom Profile Claims
-- =====================================================
-- This migration ensures all RLS policies explicitly use TO public
-- and rely on custom profile claims (profiles.role) for authorization.
-- 
-- Best Practice: Never use TO authenticated, TO super_admin, or other
-- internal Postgres roles. Always use TO public + custom claim filters.
--
-- This is compatible with JWT custom claims, Edge Functions, and modern
-- Supabase architecture.
-- =====================================================

-- =====================================================
-- 1. superadmin_logs policies
-- =====================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'superadmin_logs'
    ) THEN
        DROP POLICY IF EXISTS "Super admins can view all audit logs" ON superadmin_logs;
        DROP POLICY IF EXISTS "Super admins can view all audit logs" ON superadmin_logs;                CREATE POLICY "Super admins can view all audit logs" ON superadmin_logs
            FOR SELECT
            TO public
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role = 'super_admin'
                )
            );

        DROP POLICY IF EXISTS "Super admins can insert audit logs" ON superadmin_logs;
        DROP POLICY IF EXISTS "Super admins can insert audit logs" ON superadmin_logs;                CREATE POLICY "Super admins can insert audit logs" ON superadmin_logs
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

-- =====================================================
-- 2. profiles policies
-- =====================================================
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

-- =====================================================
-- 3. organizations policies
-- =====================================================
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

-- =====================================================
-- 4. organization_credits policies
-- =====================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'organization_credits'
    ) THEN
        DROP POLICY IF EXISTS "Users can view credits for their organization" ON organization_credits;
        DROP POLICY IF EXISTS "Users can view credits for their organization" ON organization_credits;                CREATE POLICY "Users can view credits for their organization" ON organization_credits
            FOR SELECT
            TO public
            USING (
                organization_id IN (
                    SELECT organization_id FROM profiles WHERE id = auth.uid()
                )
            );

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

-- =====================================================
-- 5. credit_consumption_logs policies
-- =====================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'credit_consumption_logs'
    ) THEN
        DROP POLICY IF EXISTS "Users can view consumption logs for their organization" ON credit_consumption_logs;
        DROP POLICY IF EXISTS "Users can view consumption logs for their organization" ON credit_consumption_logs;                CREATE POLICY "Users can view consumption logs for their organization" ON credit_consumption_logs
            FOR SELECT
            TO public
            USING (
                organization_id IN (
                    SELECT organization_id FROM profiles WHERE id = auth.uid()
                )
            );

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
-- 6. crm_events policies
-- =====================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'crm_events'
    ) THEN
        DROP POLICY IF EXISTS "Users can view events in their organization" ON crm_events;
        DROP POLICY IF EXISTS "Users can view events in their organization" ON crm_events;                CREATE POLICY "Users can view events in their organization" ON crm_events
            FOR SELECT
            TO public
            USING (
                organization_id IN (
                    SELECT organization_id FROM profiles WHERE id = auth.uid()
                )
            );

        DROP POLICY IF EXISTS "Users can insert events in their organization" ON crm_events;
        DROP POLICY IF EXISTS "Users can insert events in their organization" ON crm_events;                CREATE POLICY "Users can insert events in their organization" ON crm_events
            FOR INSERT
            TO public
            WITH CHECK (
                organization_id IN (
                    SELECT organization_id FROM profiles WHERE id = auth.uid()
                )
            );

        DROP POLICY IF EXISTS "Users can update events in their organization" ON crm_events;
        DROP POLICY IF EXISTS "Users can update events in their organization" ON crm_events;                CREATE POLICY "Users can update events in their organization" ON crm_events
            FOR UPDATE
            TO public
            USING (
                organization_id IN (
                    SELECT organization_id FROM profiles WHERE id = auth.uid()
                )
            );

        DROP POLICY IF EXISTS "Users can delete events in their organization" ON crm_events;
        DROP POLICY IF EXISTS "Users can delete events in their organization" ON crm_events;                CREATE POLICY "Users can delete events in their organization" ON crm_events
            FOR DELETE
            TO public
            USING (
                organization_id IN (
                    SELECT organization_id FROM profiles WHERE id = auth.uid()
                )
            );
    END IF;
END $$;

-- =====================================================
-- 7. event_reminders policies
-- =====================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'event_reminders'
    ) THEN
        DROP POLICY IF EXISTS "Users can view reminders in their organization" ON event_reminders;
        DROP POLICY IF EXISTS "Users can view reminders in their organization" ON event_reminders;                CREATE POLICY "Users can view reminders in their organization" ON event_reminders
            FOR SELECT
            TO public
            USING (
                organization_id IN (
                    SELECT organization_id FROM profiles WHERE id = auth.uid()
                )
            );

        DROP POLICY IF EXISTS "Users can insert reminders in their organization" ON event_reminders;
        DROP POLICY IF EXISTS "Users can insert reminders in their organization" ON event_reminders;                CREATE POLICY "Users can insert reminders in their organization" ON event_reminders
            FOR INSERT
            TO public
            WITH CHECK (
                organization_id IN (
                    SELECT organization_id FROM profiles WHERE id = auth.uid()
                )
            );

        DROP POLICY IF EXISTS "Users can update reminders in their organization" ON event_reminders;
        DROP POLICY IF EXISTS "Users can update reminders in their organization" ON event_reminders;                CREATE POLICY "Users can update reminders in their organization" ON event_reminders
            FOR UPDATE
            TO public
            USING (
                organization_id IN (
                    SELECT organization_id FROM profiles WHERE id = auth.uid()
                )
            );

        DROP POLICY IF EXISTS "Users can delete reminders in their organization" ON event_reminders;
        DROP POLICY IF EXISTS "Users can delete reminders in their organization" ON event_reminders;                CREATE POLICY "Users can delete reminders in their organization" ON event_reminders
            FOR DELETE
            TO public
            USING (
                organization_id IN (
                    SELECT organization_id FROM profiles WHERE id = auth.uid()
                )
            );
    END IF;
END $$;

-- =====================================================
-- 8. debug_logs policies
-- =====================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'debug_logs'
    ) THEN
        DROP POLICY IF EXISTS "Users can view debug logs for their organization" ON debug_logs;
        DROP POLICY IF EXISTS "Users can view debug logs for their organization" ON debug_logs;                CREATE POLICY "Users can view debug logs for their organization" ON debug_logs
            FOR SELECT
            TO public
            USING (
                organization_id IN (
                    SELECT organization_id FROM profiles WHERE id = auth.uid()
                )
                OR user_id = auth.uid()
            );

        DROP POLICY IF EXISTS "Service role can insert debug logs" ON debug_logs;
        DROP POLICY IF EXISTS "Authenticated users can insert debug logs" ON debug_logs;
        DROP POLICY IF EXISTS "Authenticated users can insert debug logs" ON debug_logs;                CREATE POLICY "Authenticated users can insert debug logs" ON debug_logs
            FOR INSERT
            TO public
            WITH CHECK (auth.uid() IS NOT NULL);
    END IF;
END $$;

-- =====================================================
-- Comments for Documentation
-- =====================================================
COMMENT ON SCHEMA public IS 'All RLS policies use TO public with custom profile claim filters (profiles.role). Never use internal Postgres roles (TO authenticated, TO super_admin, TO service_role).';
