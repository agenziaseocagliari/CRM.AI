/**
 * GUARDIAN AI CRM - ACCOUNT SETUP HOOK
 * Hook React per gestire setup automatico account verticali
 * Data: 2025-10-05
 */

import { useState, useCallback } from 'react';
import { AccountType } from './types';

// Placeholder per il servizio di duplicazione (sarà implementato dopo aver risolto i path)
interface AccountDuplicationOptions {
  organizationId: string;
  accountType: AccountType;
  templateId?: string;
  customizations?: Record<string, unknown>;
  userId: string;
}

interface DuplicationResult {
  success: boolean;
  organizationId: string;
  templatesApplied: string[];
  customFieldsCreated: number;
  error?: string;
}

interface UseAccountSetupReturn {
  setupAccount: (options: AccountDuplicationOptions) => Promise<DuplicationResult>;
  isSettingUp: boolean;
  setupResult: DuplicationResult | null;
  error: string | null;
  resetSetup: () => void;
}

export const useAccountSetup = (): UseAccountSetupReturn => {
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupResult, setSetupResult] = useState<DuplicationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setupAccount = useCallback(async (options: AccountDuplicationOptions): Promise<DuplicationResult> => {
    setIsSettingUp(true);
    setError(null);
    setSetupResult(null);

    try {
      // Simula il setup (sarà sostituito con il vero servizio)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result: DuplicationResult = {
        success: true,
        organizationId: options.organizationId,
        templatesApplied: [`${options.accountType}_template`],
        customFieldsCreated: 5
      };

      setSetupResult(result);
      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Setup failed';
      setError(errorMessage);
      
      const failedResult: DuplicationResult = {
        success: false,
        organizationId: options.organizationId,
        templatesApplied: [],
        customFieldsCreated: 0,
        error: errorMessage
      };

      setSetupResult(failedResult);
      return failedResult;

    } finally {
      setIsSettingUp(false);
    }
  }, []);

  const resetSetup = useCallback(() => {
    setSetupResult(null);
    setError(null);
    setIsSettingUp(false);
  }, []);

  return {
    setupAccount,
    isSettingUp,
    setupResult,
    error,
    resetSetup
  };
};

/**
 * Hook per verificare se un account è già configurato
 */
export const useAccountSetupStatus = (organizationId: string | null) => {
  const [status, setStatus] = useState<{
    isConfigured: boolean;
    accountType?: AccountType;
    templatesApplied: number;
    customFieldsCount: number;
    isLoading: boolean;
  }>({
    isConfigured: false,
    templatesApplied: 0,
    customFieldsCount: 0,
    isLoading: true
  });

  const checkStatus = useCallback(async () => {
    if (!organizationId) return;

    setStatus(prev => ({ ...prev, isLoading: true }));

    try {
      // Simula controllo status (sarà sostituito con il vero servizio)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStatus({
        isConfigured: true,
        accountType: 'insurance_agency',
        templatesApplied: 1,
        customFieldsCount: 5,
        isLoading: false
      });

    } catch (error) {
      console.error('Error checking setup status:', error);
      setStatus(prev => ({ ...prev, isLoading: false }));
    }
  }, [organizationId]);

  return {
    ...status,
    checkStatus
  };
};

export default useAccountSetup;