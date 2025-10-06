import { createClient } from '@supabase/supabase-js';

// 🛡️ GUARDIAN AI CRM - ENTERPRISE SECURITY MIDDLEWARE
// ====================================================

interface SecurityConfig {
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
    skipFailedRequests: boolean;
  };
  ipWhitelist: {
    enabled: boolean;
    strictMode: boolean;
  };
  geoBlocking: {
    enabled: boolean;
    allowedCountries: string[];
  };
  bruteForceProtection: {
    enabled: boolean;
    maxAttempts: number;
    lockoutMinutes: number;
  };
}

interface RequestLike {
  headers: { get: (name: string) => string | null };
  ip?: string;
}

interface User {
  id: string;
  email?: string;
  profile?: {
    is_active: boolean;
    role: string;
  };
}

interface GeoLocation {
  country: string;
  region: string;
  city: string;
}

interface SecurityEventDetails {
  [key: string]: string | number | boolean | null | undefined;
}



const SECURITY_CONFIG: SecurityConfig = {
  rateLimiting: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 min
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    skipFailedRequests: process.env.RATE_LIMIT_SKIP_FAILED_REQUESTS === 'true'
  },
  ipWhitelist: {
    enabled: process.env.IP_WHITELIST_ENABLED === 'true',
    strictMode: process.env.IP_WHITELIST_STRICT_MODE === 'true'
  },
  geoBlocking: {
    enabled: process.env.GEO_BLOCKING_ENABLED === 'true',
    allowedCountries: process.env.GEO_ALLOWED_COUNTRIES?.split(',') || ['IT', 'US']
  },
  bruteForceProtection: {
    enabled: process.env.BRUTE_FORCE_PROTECTION === 'true',
    maxAttempts: parseInt(process.env.FAILED_LOGIN_THRESHOLD || '5'),
    lockoutMinutes: parseInt(process.env.FAILED_LOGIN_LOCKOUT_MINUTES || '30')
  }
};

// Initialize Supabase client with service role
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 🔐 SECURITY LAYER 1: IP VALIDATION
export async function validateIP(request: RequestLike, organizationId?: string): Promise<{
  isValid: boolean;
  reason?: string;
  shouldBlock?: boolean;
}> {
  const clientIP = getClientIP(request);
  
  if (!clientIP) {
    return { isValid: false, reason: 'IP_NOT_DETECTED', shouldBlock: true };
  }

  // Check IP whitelist if enabled
  if (SECURITY_CONFIG.ipWhitelist.enabled && organizationId) {
    const { data: isWhitelisted } = await supabase
      .rpc('check_ip_whitelist', { 
        p_organization_id: organizationId, 
        p_ip_address: clientIP 
      });

    if (!isWhitelisted && SECURITY_CONFIG.ipWhitelist.strictMode) {
      await logSecurityEvent('IP_BLOCKED', null, organizationId, 'IP_VALIDATION', clientIP, 'IP_WHITELIST_CHECK', clientIP, getUserAgent(request), false, {
        reason: 'IP_NOT_WHITELISTED',
        strict_mode: true
      });
      return { isValid: false, reason: 'IP_NOT_WHITELISTED', shouldBlock: true };
    }
  }

  // Geo-blocking check
  if (SECURITY_CONFIG.geoBlocking.enabled) {
    const geoInfo = await getGeoLocation(clientIP);
    if (geoInfo && !SECURITY_CONFIG.geoBlocking.allowedCountries.includes(geoInfo.country)) {
      await logSecurityEvent('GEO_BLOCKED', null, organizationId, 'GEO_VALIDATION', clientIP, 'GEO_CHECK', clientIP, getUserAgent(request), false, {
        country: geoInfo.country,
        region: geoInfo.region,
        city: geoInfo.city
      });
      return { isValid: false, reason: 'GEO_BLOCKED', shouldBlock: true };
    }
  }

  return { isValid: true };
}

// 🔐 SECURITY LAYER 2: RATE LIMITING
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export async function checkRateLimit(identifier: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
}> {
  const now = Date.now();
  
  // Clean expired entries
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }

  const current = rateLimitStore.get(identifier);
  
  if (!current || current.resetTime < now) {
    // First request in window
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + SECURITY_CONFIG.rateLimiting.windowMs
    });
    return {
      allowed: true,
      remaining: SECURITY_CONFIG.rateLimiting.maxRequests - 1,
      resetTime: now + SECURITY_CONFIG.rateLimiting.windowMs
    };
  }

  if (current.count >= SECURITY_CONFIG.rateLimiting.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime
    };
  }

  // Increment counter
  current.count++;
  return {
    allowed: true,
    remaining: SECURITY_CONFIG.rateLimiting.maxRequests - current.count,
    resetTime: current.resetTime
  };
}

// 🔐 SECURITY LAYER 3: BRUTE FORCE PROTECTION
export async function checkBruteForceProtection(
  userId?: string, 
  ipAddress?: string
): Promise<{
  isBlocked: boolean;
  reason?: string;
  remainingLockoutTime?: number;
}> {
  if (!SECURITY_CONFIG.bruteForceProtection.enabled) {
    return { isBlocked: false };
  }

  const { data: isBlocked } = await supabase
    .rpc('check_failed_login_attempts', {
      p_user_id: userId,
      p_ip_address: ipAddress,
      p_threshold: SECURITY_CONFIG.bruteForceProtection.maxAttempts,
      p_window_minutes: SECURITY_CONFIG.bruteForceProtection.lockoutMinutes
    });

  if (isBlocked) {
    // Calculate remaining lockout time
    const { data: lastFailedAttempt } = await supabase
      .from('security_failed_logins')
      .select('attempted_at')
      .or(`user_id.eq.${userId},ip_address.eq.${ipAddress}`)
      .order('attempted_at', { ascending: false })
      .limit(1)
      .single();

    if (lastFailedAttempt) {
      const lockoutEndTime = new Date(lastFailedAttempt.attempted_at).getTime() + 
        (SECURITY_CONFIG.bruteForceProtection.lockoutMinutes * 60 * 1000);
      const remainingTime = Math.max(0, lockoutEndTime - Date.now());
      
      return {
        isBlocked: true,
        reason: 'BRUTE_FORCE_PROTECTION',
        remainingLockoutTime: remainingTime
      };
    }
  }

  return { isBlocked: false };
}

// 🔐 SECURITY LAYER 4: JWT VALIDATION
export async function validateJWT(token: string): Promise<{
  isValid: boolean;
  user?: User;
  error?: string;
}> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { isValid: false, error: error?.message || 'Invalid token' };
    }

    // Check if user account is still active
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_active, role')
      .eq('user_id', user.id)
      .single();

    if (!profile?.is_active) {
      return { isValid: false, error: 'Account deactivated' };
    }

    return { isValid: true, user: { ...user, profile } };
  } catch (validationError) {
    console.error('JWT validation error:', validationError);
    return { isValid: false, error: 'Token validation failed' };
  }
}

// 🔐 SECURITY UTILITIES
export function getClientIP(request: RequestLike): string | null {
  // Check various headers for client IP
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  
  if (xRealIP) {
    return xRealIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback to connection remote address
  return request.ip || null;
}

export function getUserAgent(request: RequestLike): string {
  return request.headers.get('user-agent') || 'Unknown';
}

export async function getGeoLocation(ip: string): Promise<GeoLocation | null> {
  try {
    // Use a geo-location service (example with ipapi.co)
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();
    
    return {
      country: data.country_code,
      region: data.region,
      city: data.city
    };
  } catch (error) {
    console.error('Geo-location lookup failed:', error);
    return null;
  }
}

// 🔐 SECURITY LOGGING
export async function logSecurityEvent(
  eventType: string,
  userId?: string | null,
  organizationId?: string | null,
  resourceType?: string,
  resourceId?: string,
  actionPerformed?: string,
  ipAddress?: string,
  userAgent?: string,
  success: boolean = true,
  errorDetails?: SecurityEventDetails,
  metadata?: SecurityEventDetails
): Promise<void> {
  try {
    await supabase.rpc('log_security_event', {
      p_event_type: eventType,
      p_user_id: userId,
      p_organization_id: organizationId,
      p_resource_type: resourceType || 'UNKNOWN',
      p_resource_id: resourceId,
      p_action_performed: actionPerformed || 'UNKNOWN',
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
      p_success: success,
      p_error_details: errorDetails ? JSON.stringify(errorDetails) : null,
      p_metadata: metadata ? JSON.stringify(metadata) : null
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

// 🔐 RECORD FAILED LOGIN
export async function recordFailedLogin(
  userId: string | null,
  ipAddress: string,
  userAgent: string,
  failureReason: string,
  geoLocation?: GeoLocation
): Promise<void> {
  try {
    await supabase.rpc('record_failed_login', {
      p_user_id: userId,
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
      p_failure_reason: failureReason,
      p_geo_location: geoLocation ? JSON.stringify(geoLocation) : null
    });
  } catch (error) {
    console.error('Failed to record failed login:', error);
  }
}

// 🔐 SECURITY HEADERS
export function getSecurityHeaders(): Headers {
  const headers = new Headers();
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.openai.com wss://realtime.supabase.co",
    "font-src 'self' https://fonts.gstatic.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join('; ');
  
  headers.set('Content-Security-Policy', csp);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  return headers;
}

// 🔐 MAIN SECURITY MIDDLEWARE
export async function securityMiddleware(
  request: RequestLike,
  userId?: string,
  organizationId?: string
): Promise<{
  allowed: boolean;
  error?: string;
  headers?: Headers;
  statusCode?: number;
}> {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);
  
  try {
    // 1. IP Validation
    const ipValidation = await validateIP(request, organizationId);
    if (!ipValidation.isValid) {
      return {
        allowed: false,
        error: `Access denied: ${ipValidation.reason}`,
        statusCode: 403
      };
    }

    // 2. Rate Limiting
    const rateLimitCheck = await checkRateLimit(clientIP || 'unknown');
    if (!rateLimitCheck.allowed) {
      const headers = new Headers();
      headers.set('X-RateLimit-Limit', SECURITY_CONFIG.rateLimiting.maxRequests.toString());
      headers.set('X-RateLimit-Remaining', '0');
      headers.set('X-RateLimit-Reset', rateLimitCheck.resetTime.toString());
      
      return {
        allowed: false,
        error: 'Rate limit exceeded',
        headers,
        statusCode: 429
      };
    }

    // 3. Brute Force Protection
    const bruteForceCheck = await checkBruteForceProtection(userId, clientIP || undefined);
    if (bruteForceCheck.isBlocked) {
      return {
        allowed: false,
        error: `Account temporarily locked due to multiple failed attempts. Try again in ${Math.ceil((bruteForceCheck.remainingLockoutTime || 0) / 60000)} minutes.`,
        statusCode: 423
      };
    }

    // Add security headers
    const securityHeaders = getSecurityHeaders();
    
    return {
      allowed: true,
      headers: securityHeaders
    };
    
  } catch (error) {
    console.error('Security middleware error:', error);
    
    // Log security error
    await logSecurityEvent(
      'MIDDLEWARE_ERROR',
      userId,
      organizationId,
      'SECURITY_MIDDLEWARE',
      'middleware',
      'SECURITY_CHECK',
      clientIP || undefined,
      userAgent,
      false,
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );
    
    return {
      allowed: false,
      error: 'Security validation failed',
      statusCode: 500
    };
  }
}