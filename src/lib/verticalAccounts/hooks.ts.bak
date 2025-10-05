/**
 * GUARDIAN AI CRM - VERTICAL ACCOUNTS HOOK
 * React hook per gestione Account Types e configurazioni verticali
 * Data: 2025-10-05
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  AccountType, 
  OrganizationVerticalConfig,
  VerticalTemplate,
  VerticalCustomField,
  VerticalAccountConfig
} from '../verticalAccounts/types';
import { 
  OrganizationVerticalService,
  VerticalAccountService,
  VerticalTemplateService,
  VerticalCustomFieldService
} from '../verticalAccounts/service';

// ===================================================================
// HOOK: useOrganizationVerticalConfig
// ===================================================================

interface UseOrganizationVerticalConfigResult {
  config: OrganizationVerticalConfig | null;
  accountType: AccountType | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setAccountType: (accountType: AccountType, customConfig?: Record<string, unknown>) => Promise<void>;
  duplicateAccountSetup: (sourceAccountType: AccountType, customizations?: Record<string, unknown>) => Promise<void>;
}

export function useOrganizationVerticalConfig(organizationId: string): UseOrganizationVerticalConfigResult {
  const [config, setConfig] = useState<OrganizationVerticalConfig | null>(null);
  const [accountType, setAccountTypeState] = useState<AccountType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    if (!organizationId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Get account type first
      const orgAccountType = await OrganizationVerticalService.getOrganizationAccountType(organizationId);
      setAccountTypeState(orgAccountType);
      
      // Get full vertical configuration
      const verticalConfig = await OrganizationVerticalService.getOrganizationVerticalConfig(organizationId);
      setConfig(verticalConfig);
      
    } catch (err) {
      console.error('Error fetching organization vertical config:', err);
      setError(err instanceof Error ? err.message : 'Errore nel caricamento configurazione');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const setAccountType = useCallback(async (
    newAccountType: AccountType, 
    customConfig?: Record<string, unknown>
  ) => {
    try {
      setError(null);
      await OrganizationVerticalService.setOrganizationAccountType(
        organizationId, 
        newAccountType, 
        customConfig
      );
      
      // Refetch configuration
      await fetchConfig();
    } catch (err) {
      console.error('Error setting account type:', err);
      setError(err instanceof Error ? err.message : 'Errore impostazione tipo account');
      throw err;
    }
  }, [organizationId, fetchConfig]);

  const duplicateAccountSetup = useCallback(async (
    sourceAccountType: AccountType,
    customizations?: Record<string, unknown>
  ) => {
    try {
      setError(null);
      await OrganizationVerticalService.duplicateAccountSetup(
        sourceAccountType,
        organizationId,
        customizations
      );
      
      // Refetch configuration
      await fetchConfig();
    } catch (err) {
      console.error('Error duplicating account setup:', err);
      setError(err instanceof Error ? err.message : 'Errore duplicazione configurazione');
      throw err;
    }
  }, [organizationId, fetchConfig]);

  return {
    config,
    accountType,
    loading,
    error,
    refetch: fetchConfig,
    setAccountType,
    duplicateAccountSetup
  };
}

// ===================================================================
// HOOK: useVerticalTemplates
// ===================================================================

interface UseVerticalTemplatesResult {
  templates: VerticalTemplate[];
  dashboardWidgets: VerticalTemplate[];
  emailTemplates: VerticalTemplate[];
  formTemplates: VerticalTemplate[];
  automationRules: VerticalTemplate[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useVerticalTemplates(accountType: AccountType | null): UseVerticalTemplatesResult {
  const [templates, setTemplates] = useState<VerticalTemplate[]>([]);
  const [dashboardWidgets, setDashboardWidgets] = useState<VerticalTemplate[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<VerticalTemplate[]>([]);
  const [formTemplates, setFormTemplates] = useState<VerticalTemplate[]>([]);
  const [automationRules, setAutomationRules] = useState<VerticalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    if (!accountType) {
      setTemplates([]);
      setDashboardWidgets([]);
      setEmailTemplates([]);
      setFormTemplates([]);
      setAutomationRules([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const [
        allTemplates,
        widgets,
        emails,
        forms,
        automations
      ] = await Promise.all([
        VerticalTemplateService.getTemplatesForAccountType(accountType),
        VerticalTemplateService.getDashboardWidgets(accountType),
        VerticalTemplateService.getEmailTemplates(accountType),
        VerticalTemplateService.getFormTemplates(accountType),
        VerticalTemplateService.getAutomationRules(accountType)
      ]);
      
      setTemplates(allTemplates);
      setDashboardWidgets(widgets);
      setEmailTemplates(emails);
      setFormTemplates(forms);
      setAutomationRules(automations);
      
    } catch (err) {
      console.error('Error fetching vertical templates:', err);
      setError(err instanceof Error ? err.message : 'Errore caricamento template');
    } finally {
      setLoading(false);
    }
  }, [accountType]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    dashboardWidgets,
    emailTemplates,
    formTemplates,
    automationRules,
    loading,
    error,
    refetch: fetchTemplates
  };
}

// ===================================================================
// HOOK: useVerticalCustomFields
// ===================================================================

interface UseVerticalCustomFieldsResult {
  customFields: VerticalCustomField[];
  contactFields: VerticalCustomField[];
  opportunityFields: VerticalCustomField[];
  organizationFields: VerticalCustomField[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useVerticalCustomFields(accountType: AccountType | null): UseVerticalCustomFieldsResult {
  const [customFields, setCustomFields] = useState<VerticalCustomField[]>([]);
  const [contactFields, setContactFields] = useState<VerticalCustomField[]>([]);
  const [opportunityFields, setOpportunityFields] = useState<VerticalCustomField[]>([]);
  const [organizationFields, setOrganizationFields] = useState<VerticalCustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomFields = useCallback(async () => {
    if (!accountType) {
      setCustomFields([]);
      setContactFields([]);
      setOpportunityFields([]);
      setOrganizationFields([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const [
        allFields,
        contacts,
        opportunities,
        organizations
      ] = await Promise.all([
        VerticalCustomFieldService.getCustomFields(accountType),
        VerticalCustomFieldService.getContactCustomFields(accountType),
        VerticalCustomFieldService.getOpportunityCustomFields(accountType),
        VerticalCustomFieldService.getCustomFields(accountType, 'organization')
      ]);
      
      setCustomFields(allFields);
      setContactFields(contacts);
      setOpportunityFields(opportunities);
      setOrganizationFields(organizations);
      
    } catch (err) {
      console.error('Error fetching vertical custom fields:', err);
      setError(err instanceof Error ? err.message : 'Errore caricamento campi personalizzati');
    } finally {
      setLoading(false);
    }
  }, [accountType]);

  useEffect(() => {
    fetchCustomFields();
  }, [fetchCustomFields]);

  return {
    customFields,
    contactFields,
    opportunityFields,
    organizationFields,
    loading,
    error,
    refetch: fetchCustomFields
  };
}

// ===================================================================
// HOOK: useAccountSetupSummary
// ===================================================================

interface UseAccountSetupSummaryResult {
  summary: {
    accountType: AccountType;
    config: Record<string, unknown>;
    templatesCount: number;
    customFieldsCount: number;
    hasEnterpriseCustomizations: boolean;
  } | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAccountSetupSummary(organizationId: string): UseAccountSetupSummaryResult {
  const [summary, setSummary] = useState<{
    accountType: AccountType;
    config: Record<string, unknown>;
    templatesCount: number;
    customFieldsCount: number;
    hasEnterpriseCustomizations: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!organizationId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const accountType = await OrganizationVerticalService.getOrganizationAccountType(organizationId);
      if (accountType) {
        // For now, set a basic summary - this could be enhanced with actual summary service
        setSummary({
          accountType,
          config: {},
          templatesCount: 0,
          customFieldsCount: 0,
          hasEnterpriseCustomizations: false
        });
      } else {
        setSummary(null);
      }
      
    } catch (err) {
      console.error('Error fetching account setup summary:', err);
      setError(err instanceof Error ? err.message : 'Errore caricamento riepilogo account');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary
  };
}

// ===================================================================
// HOOK: useVerticalAccountConfigs
// ===================================================================

interface UseVerticalAccountConfigsResult {
  configs: VerticalAccountConfig[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useVerticalAccountConfigs(): UseVerticalAccountConfigsResult {
  const [configs, setConfigs] = useState<VerticalAccountConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const configsData = await VerticalAccountService.getVerticalConfigs();
      setConfigs(configsData);
      
    } catch (err) {
      console.error('Error fetching vertical account configs:', err);
      setError(err instanceof Error ? err.message : 'Errore caricamento configurazioni');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  return {
    configs,
    loading,
    error,
    refetch: fetchConfigs
  };
}

// ===================================================================
// UTILITY HOOKS
// ===================================================================

/**
 * Hook for initializing vertical configuration on account creation
 */
export function useInitializeVerticalConfig() {
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialize = useCallback(async (
    organizationId: string,
    accountType: AccountType,
    customizations?: Record<string, unknown>
  ) => {
    try {
      setInitializing(true);
      setError(null);
      
      await OrganizationVerticalService.duplicateAccountSetup(
        accountType,
        organizationId,
        customizations
      );
      
    } catch (err) {
      console.error('Error initializing vertical configuration:', err);
      setError(err instanceof Error ? err.message : 'Errore inizializzazione configurazione');
      throw err;
    } finally {
      setInitializing(false);
    }
  }, []);

  return {
    initialize,
    initializing,
    error
  };
}