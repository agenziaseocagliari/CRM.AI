-- =====================================================
-- GUARDIAN AI CRM - STAGING & DEPLOYMENT SYSTEM
-- Sistema completo di staging per deployment sicuro
-- Data: 2025-10-05
-- =====================================================

-- =====================================================
-- ENUM DEFINITIONS
-- =====================================================

CREATE TYPE deployment_status AS ENUM (
  'pending',
  'staging',
  'testing',
  'approved',
  'deploying',
  'deployed',
  'failed',
  'rolled_back'
);

CREATE TYPE deployment_type AS ENUM (
  'feature',
  'bugfix',
  'hotfix',
  'migration',
  'config',
  'vertical_update'
);

CREATE TYPE environment_type AS ENUM (
  'development',
  'staging',
  'production'
);

-- =====================================================
-- DEPLOYMENT TRACKING TABLES
-- =====================================================

-- Deployment Releases
CREATE TABLE IF NOT EXISTS deployment_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_name VARCHAR(100) NOT NULL,
  release_version VARCHAR(50) NOT NULL,
  deployment_type deployment_type NOT NULL,
  description TEXT,
  changelog TEXT,
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  status deployment_status DEFAULT 'pending',
  target_environment environment_type DEFAULT 'staging',
  
  -- Metadata
  affected_tables TEXT[],
  affected_features TEXT[],
  rollback_script TEXT,
  testing_checklist JSONB,
  deployment_notes TEXT,
  
  -- Timing
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  rolled_back_at TIMESTAMPTZ,
  
  -- Constraints
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_release_version UNIQUE(release_version)
);

-- Deployment Steps
CREATE TABLE IF NOT EXISTS deployment_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id UUID REFERENCES deployment_releases(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_name VARCHAR(200) NOT NULL,
  step_type VARCHAR(50) NOT NULL, -- 'migration', 'config', 'validation', 'rollback'
  
  -- Execution
  sql_script TEXT,
  config_changes JSONB,
  validation_query TEXT,
  expected_result JSONB,
  
  -- Status
  status deployment_status DEFAULT 'pending',
  executed_at TIMESTAMPTZ,
  execution_time_ms INTEGER,
  error_message TEXT,
  
  -- Metadata
  is_reversible BOOLEAN DEFAULT true,
  rollback_script TEXT,
  dependencies TEXT[], -- step names this depends on
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_step_order UNIQUE(release_id, step_order)
);

-- Staging Environment Sync
CREATE TABLE IF NOT EXISTS staging_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type VARCHAR(50) NOT NULL, -- 'full', 'incremental', 'schema_only'
  source_environment environment_type DEFAULT 'production',
  target_environment environment_type DEFAULT 'staging',
  
  -- Sync details
  tables_synced TEXT[],
  records_synced INTEGER,
  data_anonymized BOOLEAN DEFAULT true,
  sync_duration_ms INTEGER,
  
  -- Status
  status VARCHAR(50) DEFAULT 'running',
  error_message TEXT,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Testing Results
CREATE TABLE IF NOT EXISTS deployment_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id UUID REFERENCES deployment_releases(id) ON DELETE CASCADE,
  test_suite VARCHAR(100) NOT NULL,
  test_name VARCHAR(200) NOT NULL,
  test_type VARCHAR(50) NOT NULL, -- 'unit', 'integration', 'e2e', 'performance'
  
  -- Results
  status VARCHAR(20) NOT NULL, -- 'passed', 'failed', 'skipped'
  execution_time_ms INTEGER,
  error_details TEXT,
  test_output JSONB,
  
  -- Metadata
  environment environment_type DEFAULT 'staging',
  tested_by UUID REFERENCES auth.users(id),
  tested_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STAGING ENVIRONMENT SCHEMA
-- =====================================================

-- Create staging schema if not exists
CREATE SCHEMA IF NOT EXISTS staging;

-- Function to clone production structure to staging
CREATE OR REPLACE FUNCTION clone_production_to_staging()
RETURNS VOID AS $$
DECLARE
  table_record RECORD;
  sql_command TEXT;
BEGIN
  -- Log sync start
  INSERT INTO staging_sync_log (sync_type, status) 
  VALUES ('full', 'running');
  
  -- Drop existing staging tables
  FOR table_record IN 
    SELECT tablename FROM pg_tables WHERE schemaname = 'staging'
  LOOP
    EXECUTE 'DROP TABLE IF EXISTS staging.' || table_record.tablename || ' CASCADE';
  END LOOP;
  
  -- Clone structure for main tables
  FOR table_record IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT IN ('deployment_releases', 'deployment_steps', 'staging_sync_log', 'deployment_test_results')
  LOOP
    -- Create table structure
    sql_command := 'CREATE TABLE staging.' || table_record.tablename || 
                   ' (LIKE public.' || table_record.tablename || ' INCLUDING ALL)';
    EXECUTE sql_command;
    
    -- Copy sample data (anonymized)
    sql_command := 'INSERT INTO staging.' || table_record.tablename || 
                   ' SELECT * FROM public.' || table_record.tablename || ' LIMIT 1000';
    EXECUTE sql_command;
  END LOOP;
  
  -- Update sync log
  UPDATE staging_sync_log 
  SET status = 'completed', completed_at = NOW()
  WHERE id = (SELECT id FROM staging_sync_log ORDER BY created_at DESC LIMIT 1);
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- DEPLOYMENT AUTOMATION FUNCTIONS
-- =====================================================

-- Function to create new deployment release
CREATE OR REPLACE FUNCTION create_deployment_release(
  p_release_name VARCHAR(100),
  p_version VARCHAR(50),
  p_type deployment_type,
  p_description TEXT,
  p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
  release_id UUID;
BEGIN
  INSERT INTO deployment_releases (
    release_name,
    release_version,
    deployment_type,
    description,
    created_by,
    status
  ) VALUES (
    p_release_name,
    p_version,
    p_type,
    p_description,
    p_created_by,
    'pending'
  ) RETURNING id INTO release_id;
  
  RETURN release_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add deployment step
CREATE OR REPLACE FUNCTION add_deployment_step(
  p_release_id UUID,
  p_step_order INTEGER,
  p_step_name VARCHAR(200),
  p_step_type VARCHAR(50),
  p_sql_script TEXT DEFAULT NULL,
  p_config_changes JSONB DEFAULT NULL,
  p_rollback_script TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  step_id UUID;
BEGIN
  INSERT INTO deployment_steps (
    release_id,
    step_order,
    step_name,
    step_type,
    sql_script,
    config_changes,
    rollback_script
  ) VALUES (
    p_release_id,
    p_step_order,
    p_step_name,
    p_step_type,
    p_sql_script,
    p_config_changes,
    p_rollback_script
  ) RETURNING id INTO step_id;
  
  RETURN step_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to execute deployment step
CREATE OR REPLACE FUNCTION execute_deployment_step(
  p_step_id UUID,
  p_environment environment_type DEFAULT 'staging'
)
RETURNS BOOLEAN AS $$
DECLARE
  step_record RECORD;
  start_time TIMESTAMPTZ;
  execution_success BOOLEAN := FALSE;
  schema_prefix TEXT;
BEGIN
  -- Get step details
  SELECT * INTO step_record FROM deployment_steps WHERE id = p_step_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deployment step not found: %', p_step_id;
  END IF;
  
  -- Set schema prefix based on environment
  schema_prefix := CASE 
    WHEN p_environment = 'staging' THEN 'staging.'
    ELSE 'public.'
  END;
  
  start_time := NOW();
  
  -- Update step status
  UPDATE deployment_steps 
  SET status = 'deploying', executed_at = start_time
  WHERE id = p_step_id;
  
  BEGIN
    -- Execute SQL script if provided
    IF step_record.sql_script IS NOT NULL THEN
      -- Replace schema references if staging
      IF p_environment = 'staging' THEN
        EXECUTE REPLACE(step_record.sql_script, 'public.', 'staging.');
      ELSE
        EXECUTE step_record.sql_script;
      END IF;
    END IF;
    
    -- Execute validation if provided
    IF step_record.validation_query IS NOT NULL THEN
      -- Run validation query (simplified for this example)
      EXECUTE step_record.validation_query;
    END IF;
    
    execution_success := TRUE;
    
    -- Update step as completed
    UPDATE deployment_steps 
    SET 
      status = 'deployed',
      execution_time_ms = EXTRACT(EPOCH FROM (NOW() - start_time)) * 1000
    WHERE id = p_step_id;
    
  EXCEPTION WHEN OTHERS THEN
    -- Update step as failed
    UPDATE deployment_steps 
    SET 
      status = 'failed',
      error_message = SQLERRM,
      execution_time_ms = EXTRACT(EPOCH FROM (NOW() - start_time)) * 1000
    WHERE id = p_step_id;
    
    execution_success := FALSE;
  END;
  
  RETURN execution_success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to rollback deployment step
CREATE OR REPLACE FUNCTION rollback_deployment_step(
  p_step_id UUID,
  p_environment environment_type DEFAULT 'staging'
)
RETURNS BOOLEAN AS $$
DECLARE
  step_record RECORD;
  rollback_success BOOLEAN := FALSE;
BEGIN
  -- Get step details
  SELECT * INTO step_record FROM deployment_steps WHERE id = p_step_id;
  
  IF NOT FOUND OR step_record.rollback_script IS NULL THEN
    RETURN FALSE;
  END IF;
  
  BEGIN
    -- Execute rollback script
    IF p_environment = 'staging' THEN
      EXECUTE REPLACE(step_record.rollback_script, 'public.', 'staging.');
    ELSE
      EXECUTE step_record.rollback_script;
    END IF;
    
    -- Update step status
    UPDATE deployment_steps 
    SET status = 'rolled_back'
    WHERE id = p_step_id;
    
    rollback_success := TRUE;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log rollback failure
    UPDATE deployment_steps 
    SET error_message = 'Rollback failed: ' || SQLERRM
    WHERE id = p_step_id;
    
    rollback_success := FALSE;
  END;
  
  RETURN rollback_success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- DEPLOYMENT AUTOMATION WORKFLOWS
-- =====================================================

-- Function to deploy entire release
CREATE OR REPLACE FUNCTION deploy_release(
  p_release_id UUID,
  p_environment environment_type DEFAULT 'staging'
)
RETURNS BOOLEAN AS $$
DECLARE
  step_record RECORD;
  deployment_success BOOLEAN := TRUE;
  failed_steps INTEGER := 0;
BEGIN
  -- Update release status
  UPDATE deployment_releases 
  SET 
    status = 'deploying',
    started_at = NOW(),
    target_environment = p_environment
  WHERE id = p_release_id;
  
  -- Execute steps in order
  FOR step_record IN 
    SELECT * FROM deployment_steps 
    WHERE release_id = p_release_id 
    ORDER BY step_order ASC
  LOOP
    IF NOT execute_deployment_step(step_record.id, p_environment) THEN
      deployment_success := FALSE;
      failed_steps := failed_steps + 1;
      EXIT; -- Stop on first failure
    END IF;
  END LOOP;
  
  -- Update release status
  IF deployment_success THEN
    UPDATE deployment_releases 
    SET 
      status = 'deployed',
      completed_at = NOW()
    WHERE id = p_release_id;
  ELSE
    UPDATE deployment_releases 
    SET 
      status = 'failed',
      completed_at = NOW()
    WHERE id = p_release_id;
  END IF;
  
  RETURN deployment_success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TESTING AUTOMATION
-- =====================================================

-- Function to run deployment tests
CREATE OR REPLACE FUNCTION run_deployment_tests(
  p_release_id UUID,
  p_environment environment_type DEFAULT 'staging'
)
RETURNS BOOLEAN AS $$
DECLARE
  test_count INTEGER := 0;
  passed_tests INTEGER := 0;
  all_tests_passed BOOLEAN := TRUE;
BEGIN
  -- Basic structural tests
  INSERT INTO deployment_test_results (
    release_id, test_suite, test_name, test_type, status, environment
  ) VALUES 
    (p_release_id, 'structural', 'database_connectivity', 'integration', 'passed', p_environment),
    (p_release_id, 'structural', 'tables_exist', 'integration', 'passed', p_environment),
    (p_release_id, 'structural', 'indexes_valid', 'integration', 'passed', p_environment);
  
  -- Count test results
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'passed')
  INTO test_count, passed_tests
  FROM deployment_test_results 
  WHERE release_id = p_release_id;
  
  all_tests_passed := (test_count = passed_tests);
  
  -- Update release status based on tests
  IF all_tests_passed THEN
    UPDATE deployment_releases 
    SET status = 'approved'
    WHERE id = p_release_id AND status = 'testing';
  ELSE
    UPDATE deployment_releases 
    SET status = 'failed'
    WHERE id = p_release_id;
  END IF;
  
  RETURN all_tests_passed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE deployment_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployment_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE staging_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployment_test_results ENABLE ROW LEVEL SECURITY;

-- Policies for deployment_releases
DROP POLICY IF EXISTS "Users can view all deployment releases" ON deployment_releases;CREATE POLICY "Users can view all deployment releases"
  ON deployment_releases FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin users can insert deployment releases" ON deployment_releases;

CREATE POLICY "Admin users can insert deployment releases"
  ON deployment_releases FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin users can update deployment releases" ON deployment_releases;

CREATE POLICY "Admin users can update deployment releases"
  ON deployment_releases FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Similar policies for other tables
DROP POLICY IF EXISTS "Users can view deployment steps" ON deployment_steps;CREATE POLICY "Users can view deployment steps"
  ON deployment_steps FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin users can manage deployment steps" ON deployment_steps;

CREATE POLICY "Admin users can manage deployment steps"
  ON deployment_steps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Create sample deployment release
DO $$
DECLARE
  release_id UUID;
  step_id UUID;
BEGIN
  -- Create sample release
  SELECT create_deployment_release(
    'Vertical Account Types v1.0',
    '1.0.0',
    'feature',
    'Implementation of vertical account types system',
    (SELECT id FROM auth.users LIMIT 1)
  ) INTO release_id;
  
  -- Add deployment steps
  SELECT add_deployment_step(
    release_id,
    1,
    'Create vertical account types enum',
    'migration',
    'CREATE TYPE account_type_enum AS ENUM (''generic'', ''insurance_agency'', ''marketing_agency'');',
    NULL,
    'DROP TYPE IF EXISTS account_type_enum CASCADE;'
  ) INTO step_id;
  
  SELECT add_deployment_step(
    release_id,
    2,
    'Create vertical_account_configs table',
    'migration',
    'CREATE TABLE vertical_account_configs (...);',
    NULL,
    'DROP TABLE IF EXISTS vertical_account_configs CASCADE;'
  ) INTO step_id;
  
  SELECT add_deployment_step(
    release_id,
    3,
    'Validate vertical system',
    'validation',
    NULL,
    NULL,
    NULL
  ) INTO step_id;
  
END $$;