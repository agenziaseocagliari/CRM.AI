-- =====================================================
-- FIX INFINITE RECURSION - RLS POLICIES
-- =====================================================
-- PROBLEMA: Policies fanno query su profiles → infinite recursion
-- SOLUZIONE: Usare auth.jwt() direttamente

-- =====================================================
-- 1. FIX AUTOMATION_AGENTS POLICIES (no recursion)
-- =====================================================

DROP POLICY IF EXISTS "Super admins can view all agents" ON automation_agents;
DROP POLICY IF EXISTS "Super admins can insert agents" ON automation_agents;
DROP POLICY IF EXISTS "Super admins can update agents" ON automation_agents;
DROP POLICY IF EXISTS "Super admins can delete agents" ON automation_agents;

-- Usa auth.jwt() invece di query su profiles
CREATE POLICY "Super admins can view all agents" ON automation_agents
    FOR SELECT
    TO public
    USING (
        COALESCE(
            (auth.jwt()->>'user_role'),
            (auth.jwt()->'user_metadata'->>'user_role')
        ) = 'super_admin'
    );

CREATE POLICY "Super admins can insert agents" ON automation_agents
    FOR INSERT
    TO public
    WITH CHECK (
        COALESCE(
            (auth.jwt()->>'user_role'),
            (auth.jwt()->'user_metadata'->>'user_role')
        ) = 'super_admin'
    );

CREATE POLICY "Super admins can update agents" ON automation_agents
    FOR UPDATE
    TO public
    USING (
        COALESCE(
            (auth.jwt()->>'user_role'),
            (auth.jwt()->'user_metadata'->>'user_role')
        ) = 'super_admin'
    );

CREATE POLICY "Super admins can delete agents" ON automation_agents
    FOR DELETE
    TO public
    USING (
        COALESCE(
            (auth.jwt()->>'user_role'),
            (auth.jwt()->'user_metadata'->>'user_role')
        ) = 'super_admin'
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
        COALESCE(
            (auth.jwt()->>'user_role'),
            (auth.jwt()->'user_metadata'->>'user_role')
        ) = 'super_admin'
    );

CREATE POLICY "Super admins can insert agent logs" ON agent_execution_logs
    FOR INSERT
    TO public
    WITH CHECK (
        COALESCE(
            (auth.jwt()->>'user_role'),
            (auth.jwt()->'user_metadata'->>'user_role')
        ) = 'super_admin'
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
        COALESCE(
            (auth.jwt()->>'user_role'),
            (auth.jwt()->'user_metadata'->>'user_role')
        ) = 'super_admin'
    );

CREATE POLICY "Super admins can insert integrations" ON api_integrations
    FOR INSERT
    TO public
    WITH CHECK (
        COALESCE(
            (auth.jwt()->>'user_role'),
            (auth.jwt()->'user_metadata'->>'user_role')
        ) = 'super_admin'
    );

CREATE POLICY "Super admins can update integrations" ON api_integrations
    FOR UPDATE
    TO public
    USING (
        COALESCE(
            (auth.jwt()->>'user_role'),
            (auth.jwt()->'user_metadata'->>'user_role')
        ) = 'super_admin'
    );

CREATE POLICY "Super admins can delete integrations" ON api_integrations
    FOR DELETE
    TO public
    USING (
        COALESCE(
            (auth.jwt()->>'user_role'),
            (auth.jwt()->'user_metadata'->>'user_role')
        ) = 'super_admin'
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
        COALESCE(
            (auth.jwt()->>'user_role'),
            (auth.jwt()->'user_metadata'->>'user_role')
        ) = 'super_admin'
    );

CREATE POLICY "Super admins can insert integration logs" ON integration_usage_logs
    FOR INSERT
    TO public
    WITH CHECK (
        COALESCE(
            (auth.jwt()->>'user_role'),
            (auth.jwt()->'user_metadata'->>'user_role')
        ) = 'super_admin'
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
        COALESCE(
            (auth.jwt()->>'user_role'),
            (auth.jwt()->'user_metadata'->>'user_role')
        ) = 'super_admin'
    );

CREATE POLICY "Super admins can insert workflows" ON workflow_definitions
    FOR INSERT
    TO public
    WITH CHECK (
        COALESCE(
            (auth.jwt()->>'user_role'),
            (auth.jwt()->'user_metadata'->>'user_role')
        ) = 'super_admin'
    );

-- =====================================================
-- 6. FIX WORKFLOW_EXECUTION_LOGS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Super admins can view all workflow logs" ON workflow_execution_logs;

CREATE POLICY "Super admins can view all workflow logs" ON workflow_execution_logs
    FOR SELECT
    TO public
    USING (
        COALESCE(
            (auth.jwt()->>'user_role'),
            (auth.jwt()->'user_metadata'->>'user_role')
        ) = 'super_admin'
    );

-- =====================================================
-- 7. VERIFICA JWT TOKEN
-- =====================================================

-- Questo mostra cosa c'è nel tuo JWT
SELECT 
    auth.uid() as user_id,
    auth.jwt() as full_jwt,
    auth.jwt()->>'user_role' as user_role_top_level,
    auth.jwt()->'user_metadata'->>'user_role' as user_role_metadata,
    COALESCE(
        (auth.jwt()->>'user_role'),
        (auth.jwt()->'user_metadata'->>'user_role')
    ) as final_user_role;

-- =====================================================
-- 8. TEST FINALE - CONTA AGENTI VISIBILI
-- =====================================================

SELECT COUNT(*) as agents_visible_with_new_policy
FROM automation_agents;

-- Risultato atteso: 5 agenti visibili
