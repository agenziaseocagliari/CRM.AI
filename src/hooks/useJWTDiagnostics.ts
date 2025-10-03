/**
 * JWT Session Diagnostics Hook
 * 
 * Provides comprehensive monitoring and diagnostics for JWT sessions:
 * - Tracks session state changes
 * - Monitors JWT claims validity
 * - Detects mismatches between session, localStorage, and state
 * - Logs diagnostic events for debugging
 * - Provides health check functionality
 */

import { Session } from '@supabase/supabase-js';
import { useState, useEffect, useCallback, useRef } from 'react';

import { diagnoseJWT, JWTDiagnostics } from '../lib/jwtUtils';
import { supabase } from '../lib/supabaseClient';

import { diagnosticLogger } from '../lib/mockDiagnosticLogger';
export interface SessionDiagnosticEvent {
  timestamp: string;
  event: 'login' | 'logout' | 'refresh' | 'claim_mismatch' | 'healthcheck' | 'error';
  sessionId?: string;
  userId?: string;
  userRole?: string | null;
  organizationId?: string | null;
  diagnostics: JWTDiagnostics | null;
  localStorageState: {
    organizationId: string | null;
    hasOtherKeys: boolean;
  };
  sessionStorageState: {
    hasKeys: boolean;
  };
  errorDetails?: string;
}

export interface SessionHealthStatus {
  isHealthy: boolean;
  hasValidSession: boolean;
  hasUserRoleClaim: boolean;
  claimsMatchStorage: boolean;
  issues: string[];
  lastChecked: string;
}

interface UseJWTDiagnosticsReturn {
  currentDiagnostics: JWTDiagnostics | null;
  sessionHistory: SessionDiagnosticEvent[];
  healthStatus: SessionHealthStatus;
  performHealthCheck: () => Promise<SessionHealthStatus>;
  clearHistory: () => void;
  exportDiagnostics: () => string;
  logEvent: (event: SessionDiagnosticEvent) => void;
}

const MAX_HISTORY_LENGTH = 50;

/**
 * Custom hook for JWT session diagnostics and monitoring
 */
export function useJWTDiagnostics(): UseJWTDiagnosticsReturn {
  const [currentDiagnostics, setCurrentDiagnostics] = useState<JWTDiagnostics | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionDiagnosticEvent[]>([]);
  const [healthStatus, setHealthStatus] = useState<SessionHealthStatus>({
    isHealthy: false,
    hasValidSession: false,
    hasUserRoleClaim: false,
    claimsMatchStorage: false,
    issues: [],
    lastChecked: new Date().toISOString(),
  });

  const isMonitoringRef = useRef(false);

  /**
   * Captures current localStorage state
   */
  const captureLocalStorageState = useCallback(() => {
    return {
      organizationId: localStorage.getItem('organization_id'),
      hasOtherKeys: localStorage.length > 1,
    };
  }, []);

  /**
   * Captures current sessionStorage state
   */
  const captureSessionStorageState = useCallback(() => {
    return {
      hasKeys: sessionStorage.length > 0,
    };
  }, []);

  /**
   * Logs a diagnostic event to the history
   */
  const logEvent = useCallback((event: SessionDiagnosticEvent) => {
    diagnosticLogger.info('ðŸ” [JWT Diagnostics] Event logged:', event);
    
    setSessionHistory(prev => {
      const newHistory = [event, ...prev].slice(0, MAX_HISTORY_LENGTH);
      
      // Store in localStorage for persistence across sessions
      try {
        localStorage.setItem('jwt_diagnostic_history', JSON.stringify(newHistory.slice(0, 10)));
      } catch (e) {
        diagnosticLogger.error('Failed to persist diagnostic history:', e);
      }
      
      return newHistory;
    });
  }, []);

  /**
   * Creates a diagnostic event from current session
   */
  const createDiagnosticEvent = useCallback(
    (
      eventType: SessionDiagnosticEvent['event'],
      session: Session | null,
      errorDetails?: string
    ): SessionDiagnosticEvent => {
      let diagnostics: JWTDiagnostics | null = null;
      
      if (session?.access_token) {
        diagnostics = diagnoseJWT(session.access_token);
      }

      return {
        timestamp: new Date().toISOString(),
        event: eventType,
        sessionId: session?.user?.id,
        userId: session?.user?.id,
        userRole: diagnostics?.claims?.user_role || null,
        organizationId: diagnostics?.claims?.organization_id || null,
        diagnostics,
        localStorageState: captureLocalStorageState(),
        sessionStorageState: captureSessionStorageState(),
        errorDetails,
      };
    },
    [captureLocalStorageState, captureSessionStorageState]
  );

  /**
   * Performs a comprehensive health check of the current session
   */
  const performHealthCheck = useCallback(async (): Promise<SessionHealthStatus> => {
    diagnosticLogger.info('ðŸ¥ [JWT Diagnostics] Performing health check...');
    
    const issues: string[] = [];
    let hasValidSession = false;
    let hasUserRoleClaim = false;
    let claimsMatchStorage = true;

    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        issues.push(`Session error: ${error.message}`);
      }

      if (!session) {
        issues.push('No active session');
      } else {
        hasValidSession = true;
        
        const diagnostics = diagnoseJWT(session.access_token);
        setCurrentDiagnostics(diagnostics);

        // Check for user_role claim
        if (!diagnostics.hasUserRole) {
          issues.push('CRITICAL: user_role claim is missing from JWT');
          hasUserRoleClaim = false;
        } else {
          hasUserRoleClaim = true;
        }

        // Check for other errors in diagnostics
        if (diagnostics.errors.length > 0) {
          issues.push(...diagnostics.errors);
        }

        // Check localStorage match
        const localOrgId = localStorage.getItem('organization_id');
        const claimOrgId = diagnostics.claims?.organization_id;
        const userRole = diagnostics.claims?.user_role;

        if (userRole === 'super_admin') {
          // Super admin should have 'ALL' in localStorage
          if (localOrgId !== 'ALL') {
            issues.push('Super admin organization_id mismatch: expected "ALL" in localStorage');
            claimsMatchStorage = false;
          }
        } else if (userRole && !claimOrgId) {
          issues.push('Non-super_admin user missing organization_id claim');
          claimsMatchStorage = false;
        } else if (claimOrgId && localOrgId && claimOrgId !== localOrgId) {
          issues.push(`organization_id mismatch: JWT="${claimOrgId}" localStorage="${localOrgId}"`);
          claimsMatchStorage = false;
        }

        // Log health check event
        logEvent(createDiagnosticEvent('healthcheck', session));
      }

      const status: SessionHealthStatus = {
        isHealthy: issues.length === 0,
        hasValidSession,
        hasUserRoleClaim,
        claimsMatchStorage,
        issues,
        lastChecked: new Date().toISOString(),
      };

      setHealthStatus(status);
      
      diagnosticLogger.info('ðŸ¥ [JWT Diagnostics] Health check complete:', status);
      
      return status;
    } catch (error: any) {
      const errorStatus: SessionHealthStatus = {
        isHealthy: false,
        hasValidSession: false,
        hasUserRoleClaim: false,
        claimsMatchStorage: false,
        issues: [`Health check failed: ${error?.message || 'Unknown error'}`],
        lastChecked: new Date().toISOString(),
      };

      setHealthStatus(errorStatus);
      
      return errorStatus;
    }
  }, [createDiagnosticEvent, logEvent]);

  /**
   * Clears diagnostic history
   */
  const clearHistory = useCallback(() => {
    setSessionHistory([]);
    try {
      localStorage.removeItem('jwt_diagnostic_history');
    } catch (e) {
      diagnosticLogger.error('Failed to clear diagnostic history:', e);
    }
  }, []);

  /**
   * Exports all diagnostic data as formatted string
   */
  const exportDiagnostics = useCallback((): string => {
    let report = '==== JWT Session Diagnostics Export ====\n\n';
    report += `Export Time: ${new Date().toISOString()}\n`;
    report += `Total Events: ${sessionHistory.length}\n\n`;

    report += '--- CURRENT HEALTH STATUS ---\n';
    report += `Healthy: ${healthStatus.isHealthy ? 'âœ…' : 'âŒ'}\n`;
    report += `Valid Session: ${healthStatus.hasValidSession ? 'âœ…' : 'âŒ'}\n`;
    report += `Has user_role Claim: ${healthStatus.hasUserRoleClaim ? 'âœ…' : 'âŒ'}\n`;
    report += `Claims Match Storage: ${healthStatus.claimsMatchStorage ? 'âœ…' : 'âŒ'}\n`;
    report += `Last Checked: ${healthStatus.lastChecked}\n`;
    
    if (healthStatus.issues.length > 0) {
      report += '\nIssues:\n';
      healthStatus.issues.forEach(issue => {
        report += `  - ${issue}\n`;
      });
    }
    
    report += '\n--- CURRENT DIAGNOSTICS ---\n';
    if (currentDiagnostics) {
      report += `Valid JWT: ${currentDiagnostics.isValid ? 'âœ…' : 'âŒ'}\n`;
      report += `Has user_role: ${currentDiagnostics.hasUserRole ? 'âœ…' : 'âŒ'}\n`;
      if (currentDiagnostics.claims) {
        report += `User Role: ${currentDiagnostics.claims.user_role || 'N/A'}\n`;
        report += `Organization ID: ${currentDiagnostics.claims.organization_id || 'N/A'}\n`;
        report += `User ID: ${currentDiagnostics.claims.sub || 'N/A'}\n`;
        report += `Email: ${currentDiagnostics.claims.email || 'N/A'}\n`;
      }
    } else {
      report += 'No current diagnostics available\n';
    }

    report += '\n--- SESSION HISTORY (Most Recent First) ---\n';
    sessionHistory.slice(0, 10).forEach((event, idx) => {
      report += `\n[${idx + 1}] ${event.event.toUpperCase()} - ${event.timestamp}\n`;
      if (event.userRole) {report += `  User Role: ${event.userRole}\n`;}
      if (event.organizationId) {report += `  Organization ID: ${event.organizationId}\n`;}
      if (event.errorDetails) {report += `  Error: ${event.errorDetails}\n`;}
      report += `  localStorage org_id: ${event.localStorageState.organizationId || 'N/A'}\n`;
    });

    report += '\n========================================\n';
    
    return report;
  }, [currentDiagnostics, sessionHistory, healthStatus]);

  /**
   * Monitor auth state changes
   */
  useEffect(() => {
    if (isMonitoringRef.current) {return;}
    isMonitoringRef.current = true;

    diagnosticLogger.info('ðŸ” [JWT Diagnostics] Starting session monitoring...');

    // Load persisted history
    try {
      const persistedHistory = localStorage.getItem('jwt_diagnostic_history');
      if (persistedHistory) {
        const parsed = JSON.parse(persistedHistory);
        setSessionHistory(parsed);
      }
    } catch (e) {
      diagnosticLogger.error('Failed to load diagnostic history:', e);
    }

    // Initial health check
    performHealthCheck();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      diagnosticLogger.info('ðŸ” [JWT Diagnostics] Auth state changed:', event);

      let diagnosticEvent: SessionDiagnosticEvent | null = null;

      switch (event) {
        case 'SIGNED_IN':
          diagnosticEvent = createDiagnosticEvent('login', session);
          break;
        case 'SIGNED_OUT':
          diagnosticEvent = createDiagnosticEvent('logout', session);
          break;
        case 'TOKEN_REFRESHED':
          diagnosticEvent = createDiagnosticEvent('refresh', session);
          break;
        case 'USER_UPDATED':
          diagnosticEvent = createDiagnosticEvent('refresh', session);
          break;
      }

      if (diagnosticEvent) {
        logEvent(diagnosticEvent);
      }

      // Perform health check after state change
      await performHealthCheck();
    });

    return () => {
      subscription.unsubscribe();
      isMonitoringRef.current = false;
    };
  }, [createDiagnosticEvent, logEvent, performHealthCheck]);

  return {
    currentDiagnostics,
    sessionHistory,
    healthStatus,
    performHealthCheck,
    clearHistory,
    exportDiagnostics,
    logEvent,
  };
}

