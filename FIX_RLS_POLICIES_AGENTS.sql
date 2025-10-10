-- =====================================================
-- FIX RLS POLICIES - AUTOMATION AGENTS & INTEGRATIONS
-- =====================================================
-- PROBLEMA: Le policy usano profiles.role ma la colonna è profiles.user_role
-- ESEGUI QUESTO IN SUPABASE STUDIO SQL EDITOR

-- =====================================================
-- 1. FIX AUTOMATION_AGENTS POLICIES
-- =====================================================

-- DROP old policies
DROP POLICY IF EXISTS "Super admins can view all agents" ON automation_agents;
DROP POLICY IF EXISTS "Super admins can insert agents" ON automation_agents;
DROP POLICY IF EXISTS "Super admins can update agents" ON automation_agents;
DROP POLICY IF EXISTS "Super admins can delete agents" ON automation_agents;

-- CREATE fixed policies with user_role
CREATE POLICY "Super admins can view all agents" ON automation_agents
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can insert agents" ON automation_agents
    FOR INSERT
    TO public
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can update agents" ON automation_agents
    FOR UPDATE
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can delete agents" ON automation_agents
    FOR DELETE
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_role = 'super_admin'
        )
    );

-- =====================================================
-- 2. FIX AGENT_EXECUTION_LOGS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Super admins can view all agent logs" ON agent_execution_logs;
DROP POLICY IF EXISTS "Super admins can insert agent logs" ON agent_execution_logs;

CREATE POLICY "Super admins can view all agent logs" ON agent_execution_logs
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can insert agent logs" ON agent_execution_logs
    FOR INSERT
    TO public
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_role = 'super_admin'
        )
    );

-- =====================================================
-- 3. FIX API_INTEGRATIONS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Super admins can view all integrations" ON api_integrations;
DROP POLICY IF EXISTS "Super admins can insert integrations" ON api_integrations;
DROP POLICY IF EXISTS "Super admins can update integrations" ON api_integrations;
DROP POLICY IF EXISTS "Super admins can delete integrations" ON api_integrations;

CREATE POLICY "Super admins can view all integrations" ON api_integrations
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can insert integrations" ON api_integrations
    FOR INSERT
    TO public
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can update integrations" ON api_integrations
    FOR UPDATE
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can delete integrations" ON api_integrations
    FOR DELETE
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_role = 'super_admin'
        )
    );

-- =====================================================
-- 4. FIX INTEGRATION_USAGE_LOGS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Super admins can view all integration logs" ON integration_usage_logs;
DROP POLICY IF EXISTS "Super admins can insert integration logs" ON integration_usage_logs;

CREATE POLICY "Super admins can view all integration logs" ON integration_usage_logs
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can insert integration logs" ON integration_usage_logs
    FOR INSERT
    TO public
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_role = 'super_admin'
        )
    );

-- =====================================================
-- 5. FIX WORKFLOW_DEFINITIONS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Super admins can view all workflows" ON workflow_definitions;
DROP POLICY IF EXISTS "Super admins can insert workflows" ON workflow_definitions;

CREATE POLICY "Super admins can view all workflows" ON workflow_definitions
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can insert workflows" ON workflow_definitions
    FOR INSERT
    TO public
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_role = 'super_admin'
        )
    );

-- =====================================================
-- 6. FIX WORKFLOW_EXECUTION_LOGS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Super admins can view all workflow logs" ON workflow_execution_logs;

CREATE POLICY "Super admins can view all workflow logs" ON workflow_execution_logs
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_role = 'super_admin'
        )
    );

-- =====================================================
-- 7. VERIFICA POLICIES AGGIORNATE
-- =====================================================

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN (
    'automation_agents', 
    'agent_execution_logs', 
    'api_integrations', 
    'integration_usage_logs',
    'workflow_definitions',
    'workflow_execution_logs'
)
ORDER BY tablename, policyname;

-- =====================================================
-- 8. TEST FINALE - CONTA AGENTI VISIBILI
-- =====================================================

SELECT COUNT(*) as agents_visible_as_superadmin
FROM automation_agents;

-- Se questo restituisce 0, significa che gli agenti non sono ancora stati inseriti
-- Esegui POPULATE_AUTOMATION_AGENTS.sql Step 5 (INSERT)
