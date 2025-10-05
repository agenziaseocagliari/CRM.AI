// Security Utilities for Guardian AI CRM
// Secret masking, input validation, and security hardening

import { diagnosticLogger } from '../mockDiagnosticLogger';

// Sensitive patterns to mask in logs and errors
const SENSITIVE_PATTERNS = [
  // API Keys and tokens
  /(?:api[_-]?key|token|secret|password|auth|credential)["\s]*[:=]["\s]*([a-zA-Z0-9+/=_-]{8,})/gi,
  // JWT tokens
  /eyJ[a-zA-Z0-9+/=_-]+\.eyJ[a-zA-Z0-9+/=_-]+\.[a-zA-Z0-9+/=_-]+/g,
  // Service role keys (Supabase pattern)
  /eyJ[a-zA-Z0-9+/=_-]{20,}/g,
  // Email addresses (partial masking)
  /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
  // Phone numbers
  /(?:\+?[1-9]\d{1,14}|\(\d{3}\)\s?\d{3}-?\d{4})/g,
  // Credit card numbers
  /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  // UUIDs (commonly used as secrets)
  /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g
];

// Fields that should be completely redacted
const SENSITIVE_FIELDS = [
  'password', 'secret', 'token', 'key', 'credential', 'auth',
  'twilio_auth_token', 'brevo_api_key', 'twilio_account_sid',
  'jwt_secret', 'encryption_key', 'api_key', 'access_token',
  'refresh_token', 'session_token', 'private_key', 'passphrase'
];

export interface SecurityMaskingConfig {
  maskEmails: boolean;
  maskPhones: boolean;
  completeRedaction: boolean;
  preserveLength: boolean;
}

/**
 * Mask sensitive information in strings
 */
export function maskSensitiveData(
  data: string | object | unknown,
  config: Partial<SecurityMaskingConfig> = {}
): string | object | unknown {
  
  const defaultConfig: SecurityMaskingConfig = {
    maskEmails: true,
    maskPhones: true,
    completeRedaction: false,
    preserveLength: true,
    ...config
  };

  if (typeof data === 'string') {
    return maskString(data, defaultConfig);
  }
  
  if (typeof data === 'object' && data !== null) {
    return maskObject(data as Record<string, unknown>, defaultConfig);
  }
  
  return data;
}

/**
 * Mask sensitive information in strings
 */
function maskString(str: string, config: SecurityMaskingConfig): string {
  let maskedStr = str;
  
  // Mask based on patterns
  SENSITIVE_PATTERNS.forEach(pattern => {
    maskedStr = maskedStr.replace(pattern, (match, ...groups) => {
      if (pattern.source.includes('email') && !config.maskEmails) {
        return match;
      }
      if (pattern.source.includes('phone') && !config.maskPhones) {
        return match;
      }
      
      // For email pattern, partially mask
      if (groups.length === 2) { // Email pattern
        const [user, domain] = groups;
        return `${user.slice(0, 2)}***@${domain}`;
      }
      
      // For other patterns, mask based on config
      if (config.completeRedaction) {
        return '[REDACTED]';
      }
      
      if (config.preserveLength) {
        const visibleChars = Math.min(4, Math.floor(match.length * 0.2));
        const maskedChars = '*'.repeat(Math.max(0, match.length - visibleChars * 2));
        return match.slice(0, visibleChars) + maskedChars + match.slice(-visibleChars);
      }
      
      return '[MASKED]';
    });
  });
  
  return maskedStr;
}

/**
 * Mask sensitive information in objects
 */
function maskObject(obj: Record<string, unknown> | unknown[], config: SecurityMaskingConfig): Record<string, unknown> | unknown[] {
  if (obj === null || obj === undefined) return obj;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => maskSensitiveData(item, config));
  }
  
  // Handle objects
  if (typeof obj === 'object') {
    const masked: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const keyLower = key.toLowerCase();
      
      // Check if field should be completely redacted
      if (SENSITIVE_FIELDS.some(field => keyLower.includes(field))) {
        if (config.completeRedaction) {
          masked[key] = '[REDACTED]';
        } else {
          masked[key] = typeof value === 'string' && value.length > 0 
            ? `${value.slice(0, 3)}***${value.slice(-2)}`
            : '[MASKED]';
        }
      } else {
        // Recursively mask nested objects
        masked[key] = maskSensitiveData(value, config);
      }
    }
    
    return masked;
  }
  
  return obj;
}

/**
 * Secure logger wrapper that automatically masks sensitive data
 */
export class SecureLogger {
  
  /**
   * Log with automatic sensitive data masking
   */
  static log(level: 'info' | 'warn' | 'error' | 'debug', category: string, message: string, context?: unknown): void {
    // Mask message
    const maskedMessage = maskSensitiveData(message, { completeRedaction: false });
    
    // Mask context
    const maskedContext = context ? maskSensitiveData(context, { 
      completeRedaction: false,
      preserveLength: true,
      maskEmails: true,
      maskPhones: true
    }) : undefined;
    
    // Use existing diagnostic logger with masked data
    switch (level) {
      case 'info':
        diagnosticLogger.info(category, maskedMessage, maskedContext);
        break;
      case 'warn':
        diagnosticLogger.warn(category, maskedMessage, maskedContext);
        break;
      case 'error':
        diagnosticLogger.error(category, maskedMessage, maskedContext);
        break;
      case 'debug':
        diagnosticLogger.debug(category, maskedMessage, maskedContext);
        break;
    }
  }

  static info(category: string, message: string, context?: unknown): void {
    this.log('info', category, message, context);
  }

  static warn(category: string, message: string, context?: unknown): void {
    this.log('warn', category, message, context);
  }

  static error(category: string, message: string, context?: unknown): void {
    this.log('error', category, message, context);
  }

  static debug(category: string, message: string, context?: unknown): void {
    this.log('debug', category, message, context);
  }
}

/**
 * Input validation utilities
 */
export class InputValidator {
  
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 320; // RFC 5321 limit
  }
  
  /**
   * Validate phone number format
   */
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^(\+?[1-9]\d{1,14}|\(\d{3}\)\s?\d{3}-?\d{4})$/;
    return phoneRegex.test(phone) && phone.length <= 20;
  }
  
  /**
   * Sanitize string input (XSS prevention)
   */
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: schemes
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
      .slice(0, 10000); // Limit length
  }
  
  /**
   * Validate UUID format
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(uuid);
  }
  
  /**
   * Validate and sanitize JSON input
   */
  static sanitizeJSON(input: string): object | null {
    try {
      const parsed = JSON.parse(input);
      
      // Basic size limit (1MB)
      if (JSON.stringify(parsed).length > 1024 * 1024) {
        throw new Error('JSON too large');
      }
      
      return this.sanitizeObject(parsed);
    } catch (error) {
      SecureLogger.warn('security', 'Invalid JSON input detected', { input: input.slice(0, 100) });
      return null;
    }
  }
  
  /**
   * Recursively sanitize object properties
   */
  private static sanitizeObject(obj: Record<string, unknown> | unknown[]): Record<string, unknown> | unknown[] {
    if (obj === null || obj === undefined) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item as Record<string, unknown>));
    }
    
    if (typeof obj === 'object') {
      const sanitized: Record<string, unknown> = {};
      
      for (const [key, value] of Object.entries(obj)) {
        // Sanitize key name
        const sanitizedKey = this.sanitizeString(key);
        
        if (typeof value === 'string') {
          sanitized[sanitizedKey] = this.sanitizeString(value);
        } else {
          sanitized[sanitizedKey] = this.sanitizeObject(value as Record<string, unknown>);
        }
      }
      
      return sanitized;
    }
    
    return obj;
  }
  
  /**
   * Rate limiting check (simple in-memory implementation)
   */
  private static rateLimits: Map<string, { count: number; resetTime: number }> = new Map();
  
  static checkRateLimit(identifier: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
    const now = Date.now();
    const limit = this.rateLimits.get(identifier);
    
    if (!limit || now > limit.resetTime) {
      this.rateLimits.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (limit.count >= maxRequests) {
      SecureLogger.warn('security', 'Rate limit exceeded', { identifier, count: limit.count });
      return false;
    }
    
    limit.count++;
    return true;
  }
}

/**
 * Security headers utility
 */
export class SecurityHeaders {
  
  /**
   * Generate secure CSP header
   */
  static generateCSP(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.supabase.co https://*.supabase.co wss://*.supabase.co",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
  }
  
  /**
   * Get all security headers
   */
  static getAllHeaders(): Record<string, string> {
    return {
      'Content-Security-Policy': this.generateCSP(),
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'X-XSS-Protection': '1; mode=block'
    };
  }
}

/**
 * Secure error handling
 */
export class SecureErrorHandler {
  
  /**
   * Create user-safe error message (no sensitive info leak)
   */
  static createSafeErrorMessage(error: any, context?: string): string {
    // Log full error internally (masked)
    SecureLogger.error('security', `Error in ${context || 'unknown context'}`, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Return generic message to user
    if (error instanceof Error) {
      // Check if it's a known safe error
      const safePatterns = [
        /invalid email/i,
        /invalid phone/i,
        /validation failed/i,
        /not found/i,
        /access denied/i
      ];
      
      if (safePatterns.some(pattern => pattern.test(error.message))) {
        return error.message;
      }
    }
    
    return 'Si è verificato un errore. Se il problema persiste, contatta il supporto.';
  }
  
  /**
   * Handle API errors securely
   */
  static handleAPIError(error: any, endpoint: string): never {
    const safeMessage = this.createSafeErrorMessage(error, `API ${endpoint}`);
    
    // Create error object without sensitive information
    const apiError = new Error(safeMessage);
    apiError.name = 'APIError';
    
    throw apiError;
  }
}

// Export default utilities
export default {
  maskSensitiveData,
  SecureLogger,
  InputValidator,
  SecurityHeaders,
  SecureErrorHandler
};