/**
 * Login Method Tracker
 * 
 * This module tracks different login methods (password, magic link, password reset)
 * to help diagnose JWT issues that may be specific to certain authentication flows.
 */

export type LoginMethod = 'password' | 'magic_link' | 'password_reset' | 'oauth' | 'unknown';

export interface LoginAttempt {
  method: LoginMethod;
  timestamp: string;
  email?: string; // Note: Email is hashed before storage for privacy
  success: boolean;
  jwtHasUserRole?: boolean;
  error?: string;
}

const LOGIN_HISTORY_KEY = 'guardian_login_history';
const MAX_HISTORY_SIZE = 10;

/**
 * Hashes an email address for privacy-safe storage
 * Uses a simple hash to prevent storing clear text emails
 */
function hashEmail(email: string): string {
  // Simple hash - just take first 2 chars + @ + domain
  const parts = email.split('@');
  if (parts.length === 2) {
    return parts[0].substring(0, 2) + '***@' + parts[1];
  }
  return '***';
}

/**
 * Records a login attempt with its method and outcome
 */
export function recordLoginAttempt(attempt: LoginAttempt): void {
  try {
    const history = getLoginHistory();
    
    // Hash email before storing for privacy
    const safeAttempt = {
      ...attempt,
      email: attempt.email ? hashEmail(attempt.email) : undefined,
    };
    
    history.unshift(safeAttempt);
    
    // Keep only the most recent attempts
    if (history.length > MAX_HISTORY_SIZE) {
      history.splice(MAX_HISTORY_SIZE);
    }
    
    localStorage.setItem(LOGIN_HISTORY_KEY, JSON.stringify(history));
    // diagnosticLogger.info('[Login Tracker] Recorded login attempt:', safeAttempt);
  } catch (error) {
    // diagnosticLogger.error('[Login Tracker] Failed to record login attempt:', error);
  }
}

/**
 * Gets the login history
 */
export function getLoginHistory(): LoginAttempt[] {
  try {
    const stored = localStorage.getItem(LOGIN_HISTORY_KEY);
    if (!stored) {return [];}
    return JSON.parse(stored);
  } catch (error) {
    // diagnosticLogger.error('[Login Tracker] Failed to get login history:', error);
    return [];
  }
}

/**
 * Clears the login history
 */
export function clearLoginHistory(): void {
  localStorage.removeItem(LOGIN_HISTORY_KEY);
}

/**
 * Detects the login method from URL parameters
 * This is called during authentication callbacks
 */
export function detectLoginMethodFromUrl(): LoginMethod {
  const urlParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash;
  
  // Check for magic link tokens
  if (hash.includes('access_token') || hash.includes('type=magiclink')) {
    return 'magic_link';
  }
  
  // Check for password reset tokens
  if (hash.includes('type=recovery') || urlParams.get('type') === 'recovery') {
    return 'password_reset';
  }
  
  // Check for OAuth
  if (urlParams.get('code') || hash.includes('provider_token')) {
    return 'oauth';
  }
  
  // Default to password if no special tokens
  return 'password';
}

/**
 * Analyzes login history for patterns
 */
export function analyzeLoginHistory(): {
  totalAttempts: number;
  successfulLogins: number;
  failedLogins: number;
  methodBreakdown: Record<LoginMethod, number>;
  jwtDefectsByMethod: Record<LoginMethod, number>;
  lastSuccessful?: LoginAttempt;
  lastFailed?: LoginAttempt;
} {
  const history = getLoginHistory();
  
  const analysis = {
    totalAttempts: history.length,
    successfulLogins: 0,
    failedLogins: 0,
    methodBreakdown: {
      password: 0,
      magic_link: 0,
      password_reset: 0,
      oauth: 0,
      unknown: 0,
    } as Record<LoginMethod, number>,
    jwtDefectsByMethod: {
      password: 0,
      magic_link: 0,
      password_reset: 0,
      oauth: 0,
      unknown: 0,
    } as Record<LoginMethod, number>,
    lastSuccessful: undefined as LoginAttempt | undefined,
    lastFailed: undefined as LoginAttempt | undefined,
  };
  
  for (const attempt of history) {
    // Count success/failure
    if (attempt.success) {
      analysis.successfulLogins++;
      if (!analysis.lastSuccessful) {
        analysis.lastSuccessful = attempt;
      }
    } else {
      analysis.failedLogins++;
      if (!analysis.lastFailed) {
        analysis.lastFailed = attempt;
      }
    }
    
    // Count by method
    analysis.methodBreakdown[attempt.method]++;
    
    // Track JWT defects by method
    if (attempt.success && attempt.jwtHasUserRole === false) {
      analysis.jwtDefectsByMethod[attempt.method]++;
    }
  }
  
  return analysis;
}

/**
 * Generates a human-readable report of login history
 */
export function generateLoginHistoryReport(): string {
  const history = getLoginHistory();
  const analysis = analyzeLoginHistory();
  
  let report = '==== Login History Report ====\n\n';
  report += `Total Login Attempts: ${analysis.totalAttempts}\n`;
  report += `Successful: ${analysis.successfulLogins}\n`;
  report += `Failed: ${analysis.failedLogins}\n\n`;
  
  report += 'Method Breakdown:\n';
  Object.entries(analysis.methodBreakdown).forEach(([method, count]) => {
    if (count > 0) {
      const defects = analysis.jwtDefectsByMethod[method as LoginMethod];
      report += `  - ${method}: ${count} attempts`;
      if (defects > 0) {
        report += ` ("š ï¸ ${defects} JWT defects)`;
      }
      report += '\n';
    }
  });
  
  report += '\nRecent Attempts:\n';
  history.slice(0, 5).forEach((attempt, idx) => {
    report += `${idx + 1}. [${attempt.timestamp}]\n`;
    report += `   Method: ${attempt.method}\n`;
    report += `   Success: ${attempt.success ? '"…' : '"Œ'}\n`;
    if (attempt.email) {
      report += `   Email: ${attempt.email}\n`;
    }
    if (attempt.jwtHasUserRole !== undefined) {
      report += `   JWT user_role: ${attempt.jwtHasUserRole ? '"… Present' : '"Œ Missing'}\n`;
    }
    if (attempt.error) {
      report += `   Error: ${attempt.error}\n`;
    }
    report += '\n';
  });
  
  report += '==============================\n';
  
  return report;
}



