/**
 * GUARDIAN AI CRM - STAGING DEPLOYMENT SERVICE
 * Servizio per gestione deployment e staging come hosting moderno
 * Data: 2025-10-05
 */

import { supabase } from '../supabase';

export type DeploymentStatus = 
  | 'pending'
  | 'staging' 
  | 'testing'
  | 'approved'
  | 'deploying'
  | 'deployed'
  | 'failed'
  | 'rolled_back';

export type DeploymentType = 
  | 'feature'
  | 'bugfix'
  | 'hotfix'
  | 'migration'
  | 'config'
  | 'vertical_update';

export type EnvironmentType = 
  | 'development'
  | 'staging'
  | 'production';

export interface DeploymentRelease {
  id: string;
  release_name: string;
  release_version: string;
  deployment_type: DeploymentType;
  description?: string;
  changelog?: string;
  created_by: string;
  approved_by?: string;
  status: DeploymentStatus;
  target_environment: EnvironmentType;
  affected_tables?: string[];
  affected_features?: string[];
  rollback_script?: string;
  testing_checklist?: Record<string, unknown>;
  deployment_notes?: string;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  rolled_back_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DeploymentStep {
  id: string;
  release_id: string;
  step_order: number;
  step_name: string;
  step_type: string;
  sql_script?: string;
  config_changes?: Record<string, unknown>;
  validation_query?: string;
  expected_result?: Record<string, unknown>;
  status: DeploymentStatus;
  executed_at?: string;
  execution_time_ms?: number;
  error_message?: string;
  is_reversible: boolean;
  rollback_script?: string;
  dependencies?: string[];
  created_at: string;
}

export interface StagingSyncLog {
  id: string;
  sync_type: 'full' | 'incremental' | 'schema_only';
  source_environment: EnvironmentType;
  target_environment: EnvironmentType;
  tables_synced?: string[];
  records_synced?: number;
  data_anonymized: boolean;
  sync_duration_ms?: number;
  status: string;
  error_message?: string;
  completed_at?: string;
  created_at: string;
}

export interface TestResult {
  id: string;
  release_id: string;
  test_suite: string;
  test_name: string;
  test_type: 'unit' | 'integration' | 'e2e' | 'performance';
  status: 'passed' | 'failed' | 'skipped';
  execution_time_ms?: number;
  error_details?: string;
  test_output?: Record<string, unknown>;
  environment: EnvironmentType;
  tested_by?: string;
  tested_at: string;
  created_at: string;
}

export class StagingDeploymentService {
  /**
   * Crea nuovo deployment release
   */
  static async createRelease(releaseData: {
    release_name: string;
    release_version: string;
    deployment_type: DeploymentType;
    description?: string;
    changelog?: string;
    affected_tables?: string[];
    affected_features?: string[];
  }): Promise<{ success: boolean; release?: DeploymentRelease; error?: string }> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('deployment_releases')
        .insert({
          ...releaseData,
          created_by: userData.user.id,
          status: 'pending' as DeploymentStatus,
          target_environment: 'staging' as EnvironmentType
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, release: data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Aggiunge step al deployment
   */
  static async addDeploymentStep(
    releaseId: string,
    stepData: {
      step_order: number;
      step_name: string;
      step_type: string;
      sql_script?: string;
      config_changes?: Record<string, unknown>;
      validation_query?: string;
      rollback_script?: string;
      dependencies?: string[];
    }
  ): Promise<{ success: boolean; step?: DeploymentStep; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('deployment_steps')
        .insert({
          release_id: releaseId,
          ...stepData,
          status: 'pending' as DeploymentStatus,
          is_reversible: !!stepData.rollback_script
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, step: data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Lista tutti i deployment releases
   */
  static async listReleases(filters?: {
    status?: DeploymentStatus;
    environment?: EnvironmentType;
    limit?: number;
  }): Promise<{ success: boolean; releases?: DeploymentRelease[]; error?: string }> {
    try {
      let query = supabase
        .from('deployment_releases')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.environment) {
        query = query.eq('target_environment', filters.environment);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      return { success: true, releases: data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Ottiene dettagli release con steps
   */
  static async getReleaseDetails(releaseId: string): Promise<{
    success: boolean;
    release?: DeploymentRelease;
    steps?: DeploymentStep[];
    tests?: TestResult[];
    error?: string;
  }> {
    try {
      // Get release
      const { data: release, error: releaseError } = await supabase
        .from('deployment_releases')
        .select('*')
        .eq('id', releaseId)
        .single();

      if (releaseError) throw releaseError;

      // Get steps
      const { data: steps, error: stepsError } = await supabase
        .from('deployment_steps')
        .select('*')
        .eq('release_id', releaseId)
        .order('step_order');

      if (stepsError) throw stepsError;

      // Get test results
      const { data: tests, error: testsError } = await supabase
        .from('deployment_test_results')
        .select('*')
        .eq('release_id', releaseId)
        .order('tested_at', { ascending: false });

      if (testsError) throw testsError;

      return { success: true, release, steps, tests };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Sincronizza dati da produzione a staging
   */
  static async syncToStaging(options: {
    syncType: 'full' | 'incremental' | 'schema_only';
    tables?: string[];
    anonymizeData?: boolean;
  }): Promise<{ success: boolean; syncLog?: StagingSyncLog; error?: string }> {
    try {
      // Call the PostgreSQL function to clone production to staging
      const { data, error } = await supabase.rpc('clone_production_to_staging');
      
      if (error) throw error;

      // Log the sync operation
      const { data: syncLog, error: logError } = await supabase
        .from('staging_sync_log')
        .insert({
          sync_type: options.syncType,
          source_environment: 'production' as EnvironmentType,
          target_environment: 'staging' as EnvironmentType,
          tables_synced: options.tables || [],
          data_anonymized: options.anonymizeData ?? true,
          status: 'completed'
        })
        .select()
        .single();

      if (logError) throw logError;

      return { success: true, syncLog };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Esegue deployment in staging
   */
  static async deployToStaging(releaseId: string): Promise<{
    success: boolean;
    executedSteps?: number;
    failedSteps?: number;
    error?: string;
  }> {
    try {
      // Call the PostgreSQL function to deploy release
      const { data, error } = await supabase.rpc('deploy_release', {
        p_release_id: releaseId,
        p_environment: 'staging'
      });

      if (error) throw error;

      // Get deployment results
      const { data: steps } = await supabase
        .from('deployment_steps')
        .select('status')
        .eq('release_id', releaseId);

      const executedSteps = steps?.filter(s => s.status === 'deployed').length || 0;
      const failedSteps = steps?.filter(s => s.status === 'failed').length || 0;

      return { 
        success: data === true, 
        executedSteps, 
        failedSteps 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Esegue deployment in produzione
   */
  static async deployToProduction(releaseId: string): Promise<{
    success: boolean;
    executedSteps?: number;
    failedSteps?: number;
    error?: string;
  }> {
    try {
      // Verify release is approved
      const { data: release } = await supabase
        .from('deployment_releases')
        .select('status')
        .eq('id', releaseId)
        .single();

      if (release?.status !== 'approved') {
        throw new Error('Release must be approved before production deployment');
      }

      // Deploy to production
      const { data, error } = await supabase.rpc('deploy_release', {
        p_release_id: releaseId,
        p_environment: 'production'
      });

      if (error) throw error;

      // Get deployment results
      const { data: steps } = await supabase
        .from('deployment_steps')
        .select('status')
        .eq('release_id', releaseId);

      const executedSteps = steps?.filter(s => s.status === 'deployed').length || 0;
      const failedSteps = steps?.filter(s => s.status === 'failed').length || 0;

      return { 
        success: data === true, 
        executedSteps, 
        failedSteps 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Rollback deployment
   */
  static async rollbackRelease(releaseId: string): Promise<{
    success: boolean;
    rolledBackSteps?: number;
    error?: string;
  }> {
    try {
      // Get all deployed steps in reverse order
      const { data: steps } = await supabase
        .from('deployment_steps')
        .select('*')
        .eq('release_id', releaseId)
        .eq('status', 'deployed')
        .eq('is_reversible', true)
        .order('step_order', { ascending: false });

      let rolledBackSteps = 0;

      // Rollback each step
      for (const step of steps || []) {
        const { data, error } = await supabase.rpc('rollback_deployment_step', {
          p_step_id: step.id,
          p_environment: 'production'
        });

        if (data === true) {
          rolledBackSteps++;
        }
      }

      // Update release status
      await supabase
        .from('deployment_releases')
        .update({ 
          status: 'rolled_back' as DeploymentStatus,
          rolled_back_at: new Date().toISOString()
        })
        .eq('id', releaseId);

      return { success: true, rolledBackSteps };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Esegue test su deployment
   */
  static async runTests(releaseId: string, environment: EnvironmentType = 'staging'): Promise<{
    success: boolean;
    testResults?: TestResult[];
    passedTests?: number;
    failedTests?: number;
    error?: string;
  }> {
    try {
      // Run tests using PostgreSQL function
      const { data, error } = await supabase.rpc('run_deployment_tests', {
        p_release_id: releaseId,
        p_environment: environment
      });

      if (error) throw error;

      // Get test results
      const { data: testResults } = await supabase
        .from('deployment_test_results')
        .select('*')
        .eq('release_id', releaseId)
        .eq('environment', environment);

      const passedTests = testResults?.filter(t => t.status === 'passed').length || 0;
      const failedTests = testResults?.filter(t => t.status === 'failed').length || 0;

      return { 
        success: data === true, 
        testResults,
        passedTests,
        failedTests
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Approva release per produzione
   */
  static async approveRelease(releaseId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('deployment_releases')
        .update({
          status: 'approved' as DeploymentStatus,
          approved_by: userData.user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', releaseId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Ottiene statistiche deployment
   */
  static async getDeploymentStats(timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<{
    success: boolean;
    stats?: {
      totalReleases: number;
      successfulDeployments: number;
      failedDeployments: number;
      averageDeploymentTime: number;
      pendingApprovals: number;
    };
    error?: string;
  }> {
    try {
      const startDate = new Date();
      switch (timeframe) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
      }

      const { data: releases } = await supabase
        .from('deployment_releases')
        .select('status, started_at, completed_at')
        .gte('created_at', startDate.toISOString());

      const totalReleases = releases?.length || 0;
      const successfulDeployments = releases?.filter(r => r.status === 'deployed').length || 0;
      const failedDeployments = releases?.filter(r => r.status === 'failed').length || 0;
      const pendingApprovals = releases?.filter(r => r.status === 'testing').length || 0;

      // Calculate average deployment time
      const completedReleases = releases?.filter(r => r.started_at && r.completed_at) || [];
      const totalTime = completedReleases.reduce((sum, r) => {
        const start = new Date(r.started_at!).getTime();
        const end = new Date(r.completed_at!).getTime();
        return sum + (end - start);
      }, 0);
      const averageDeploymentTime = completedReleases.length > 0 ? 
        totalTime / completedReleases.length / 1000 / 60 : 0; // in minutes

      return {
        success: true,
        stats: {
          totalReleases,
          successfulDeployments,
          failedDeployments,
          averageDeploymentTime,
          pendingApprovals
        }
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

export default StagingDeploymentService;