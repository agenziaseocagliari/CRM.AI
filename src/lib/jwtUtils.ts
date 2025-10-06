/**
 * JWT Utility Functions for Debugging and Diagnostics
 * 
 * This module provides utilities to decode, inspect, and diagnose JWT tokens
 * specifically for debugging user_role claim issues.
 */

export interface JWTClaims {
  sub?: string;
  email?: string;
  user_role?: string;
  organization_id?: string;
  aud?: string;
  exp?: number;
  iat?: number;
  iss?: string;
  role?: string;
  [key: string]: unknown;
}

export interface JWTDiagnostics {
  isValid: boolean;
  hasUserRole: boolean;
  claims: JWTClaims | null;
  rawToken: string;
  errors: string[];
  warnings: string[];
  timestamp?: string;
  tokenAge?: number; // seconds since token was issued
  timeUntilExpiry?: number; // seconds until expiry
}

/**
 * Decodes a JWT token without verification (client-side only)
 * @param token The JWT token string
 * @returns Decoded claims or null if invalid
 */
export function decodeJWT(token: string): JWTClaims | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      // diagnosticLogger.error('[JWT Utils] Invalid JWT format: expected 3 parts');
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    // Replace URL-safe characters
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // Decode base64
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch {
    // diagnosticLogger.error('[JWT Utils] Error decoding JWT:', error);
    return null;
  }
}

/**
 * Performs comprehensive JWT diagnostics
 * @param token The JWT token string
 * @returns Diagnostic information about the token
 */
export function diagnoseJWT(token: string): JWTDiagnostics {
  const diagnostics: JWTDiagnostics = {
    isValid: false,
    hasUserRole: false,
    claims: null,
    rawToken: token,
    errors: [],
    warnings: [],
    timestamp: new Date().toISOString(),
  };

  // Check token format
  if (!token || typeof token !== 'string') {
    diagnostics.errors.push('Token is empty or not a string');
    return diagnostics;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    diagnostics.errors.push(`Invalid JWT format: expected 3 parts, got ${parts.length}`);
    return diagnostics;
  }

  // Decode claims
  const claims = decodeJWT(token);
  if (!claims) {
    diagnostics.errors.push('Failed to decode JWT payload');
    return diagnostics;
  }

  diagnostics.claims = claims;
  diagnostics.isValid = true;

  // Calculate token age and expiry time
  const now = Math.floor(Date.now() / 1000);
  if (claims.iat) {
    diagnostics.tokenAge = now - claims.iat;
  }
  if (claims.exp) {
    diagnostics.timeUntilExpiry = claims.exp - now;
  }

  // Check for user_role claim
  if (!claims.user_role) {
    diagnostics.errors.push('CRITICAL: user_role claim is missing from JWT');
    diagnostics.warnings.push('This token was generated before custom_access_token_hook was configured');
    diagnostics.warnings.push('User must re-login to get a new token with user_role claim');
  } else {
    diagnostics.hasUserRole = true;
  }

  // Check token expiration
  if (claims.exp) {
    if (claims.exp < now) {
      diagnostics.errors.push('Token is expired');
    } else {
      const timeRemaining = claims.exp - now;
      if (timeRemaining < 300) { // Less than 5 minutes
        diagnostics.warnings.push(`Token expires in ${Math.floor(timeRemaining / 60)} minutes`);
      }
    }
  }

  // Check for organization_id if user_role is not super_admin
  if (claims.user_role && claims.user_role !== 'super_admin' && !claims.organization_id) {
    diagnostics.warnings.push('organization_id claim is missing (may be expected for super_admin)');
  }

  return diagnostics;
}

/**
 * Formats JWT diagnostics into a human-readable string
 * @param diagnostics JWT diagnostics object
 * @returns Formatted diagnostic report
 */
export function formatJWTDiagnostics(diagnostics: JWTDiagnostics): string {
  let report = '==== JWT Diagnostics Report ====\n\n';
  
  report += `Timestamp: ${new Date().toISOString()}\n`;
  report += `Valid JWT: ${diagnostics.isValid ? 'âœ… Yes' : 'âŒ No'}\n`;
  report += `Has user_role: ${diagnostics.hasUserRole ? 'âœ… Yes' : 'âŒ No'}\n\n`;

  if (diagnostics.errors.length > 0) {
    report += 'ðŸš¨ ERRORS:\n';
    diagnostics.errors.forEach(err => {
      report += `  - ${err}\n`;
    });
    report += '\n';
  }

  if (diagnostics.warnings.length > 0) {
    report += 'âš ï¸  WARNINGS:\n';
    diagnostics.warnings.forEach(warn => {
      report += `  - ${warn}\n`;
    });
    report += '\n';
  }

  if (diagnostics.claims) {
    report += 'ðŸ“‹ CLAIMS:\n';
    report += JSON.stringify(diagnostics.claims, null, 2);
    report += '\n\n';
  }

  report += 'ðŸ”‘ RAW TOKEN (first 50 chars):\n';
  report += diagnostics.rawToken.substring(0, 50) + '...\n\n';

  report += '================================\n';
  
  return report;
}

/**
 * Checks if the current session has a valid JWT with user_role claim
 * @param session Supabase session object
 * @returns Diagnostics object
 */
export function checkSessionJWT(session: { access_token?: string } | null): JWTDiagnostics {
  if (!session || !session.access_token) {
    return {
      isValid: false,
      hasUserRole: false,
      claims: null,
      rawToken: '',
      errors: ['No session or access_token found'],
      warnings: [],
      timestamp: new Date().toISOString(),
    };
  }

  return diagnoseJWT(session.access_token);
}

