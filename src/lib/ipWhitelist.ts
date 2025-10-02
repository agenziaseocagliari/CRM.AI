/**
 * Phase 3 - M03: IP Whitelisting & Geo-Restrictions
 * 
 * IP validation and geo-restriction utilities for organization-level security.
 * 
 * Features:
 * - IP whitelist validation (single IP, CIDR, IP ranges)
 * - Geographic restriction checking
 * - IP access logging with geo data
 * - Real-time access statistics
 */

import { supabase } from './supabaseClient';
import { logAuditEvent } from './auditLogger';

export interface IPWhitelist {
  id: string;
  organizationId: string;
  ipAddress: string;
  ipRangeStart?: string;
  ipRangeEnd?: string;
  isRange: boolean;
  label?: string;
  description?: string;
  createdBy?: string;
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeoRestriction {
  id: string;
  organizationId: string;
  countryCode: string;
  restrictionType: 'allow' | 'block';
  label?: string;
  description?: string;
  createdBy?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPAccessLog {
  id: string;
  organizationId: string;
  userId?: string;
  ipAddress: string;
  countryCode?: string;
  city?: string;
  isWhitelisted: boolean;
  isBlocked: boolean;
  blockReason?: string;
  endpoint?: string;
  requestMethod?: string;
  userAgent?: string;
  accessTime: Date;
}

export interface IPValidationResult {
  allowed: boolean;
  isWhitelisted: boolean;
  geoAllowed: boolean;
  reason?: string;
  blockReason?: string;
}

export interface IPAccessStats {
  totalRequests: number;
  blockedRequests: number;
  whitelistedRequests: number;
  uniqueIps: number;
  topCountries?: Array<{ countryCode: string; count: number }>;
  topBlockedIps?: Array<{ ipAddress: string; count: number; reasons: string[] }>;
}

/**
 * Check if an IP address is whitelisted for an organization
 */
export async function checkIPWhitelist(
  organizationId: string,
  ipAddress: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_ip_whitelist', {
      p_organization_id: organizationId,
      p_ip_address: ipAddress,
    });

    if (error) throw error;
    return data || false;
  } catch (error) {
    console.error('Error checking IP whitelist:', error);
    // Fail open for availability (can be changed to fail closed for security)
    return false;
  }
}

/**
 * Check if access from a country is allowed for an organization
 */
export async function checkGeoRestriction(
  organizationId: string,
  countryCode: string
): Promise<{ allowed: boolean; reason: string }> {
  try {
    const { data, error } = await supabase.rpc('check_geo_restriction', {
      p_organization_id: organizationId,
      p_country_code: countryCode,
    });

    if (error) throw error;
    return data || { allowed: true, reason: 'No geo-restrictions configured' };
  } catch (error) {
    console.error('Error checking geo-restriction:', error);
    // Fail open for availability
    return { allowed: true, reason: 'Error checking geo-restrictions' };
  }
}

/**
 * Validate IP address and geo-location for access
 */
export async function validateIPAccess(
  organizationId: string,
  ipAddress: string,
  countryCode?: string
): Promise<IPValidationResult> {
  const result: IPValidationResult = {
    allowed: true,
    isWhitelisted: false,
    geoAllowed: true,
  };

  try {
    // Check IP whitelist
    result.isWhitelisted = await checkIPWhitelist(organizationId, ipAddress);

    // Check geo-restrictions if country code is provided
    if (countryCode) {
      const geoCheck = await checkGeoRestriction(organizationId, countryCode);
      result.geoAllowed = geoCheck.allowed;
      if (!geoCheck.allowed) {
        result.allowed = false;
        result.blockReason = geoCheck.reason;
      }
    }

    // If IP is whitelisted, always allow (whitelist overrides geo-restrictions)
    if (result.isWhitelisted) {
      result.allowed = true;
      result.geoAllowed = true;
      result.reason = 'IP whitelisted';
      result.blockReason = undefined;
    }

    return result;
  } catch (error) {
    console.error('Error validating IP access:', error);
    // Fail open for availability
    return {
      allowed: true,
      isWhitelisted: false,
      geoAllowed: true,
      reason: 'Error validating IP access',
    };
  }
}

/**
 * Log an IP access attempt
 */
export async function logIPAccess(
  organizationId: string,
  ipAddress: string,
  options: {
    userId?: string;
    countryCode?: string;
    city?: string;
    isWhitelisted?: boolean;
    isBlocked?: boolean;
    blockReason?: string;
    endpoint?: string;
    requestMethod?: string;
    userAgent?: string;
  } = {}
): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('log_ip_access', {
      p_organization_id: organizationId,
      p_user_id: options.userId || null,
      p_ip_address: ipAddress,
      p_country_code: options.countryCode || null,
      p_city: options.city || null,
      p_is_whitelisted: options.isWhitelisted || false,
      p_is_blocked: options.isBlocked || false,
      p_block_reason: options.blockReason || null,
      p_endpoint: options.endpoint || null,
      p_request_method: options.requestMethod || null,
      p_user_agent: options.userAgent || null,
    });

    if (error) throw error;

    // Also log to audit system if blocked
    if (options.isBlocked) {
      await logAuditEvent({
        organizationId,
        userId: options.userId,
        eventType: 'ip_access_blocked',
        eventCategory: 'security',
        severity: 'SECURITY',
        description: `IP access blocked: ${ipAddress}`,
        details: {
          ipAddress,
          countryCode: options.countryCode,
          blockReason: options.blockReason,
          endpoint: options.endpoint,
          userAgent: options.userAgent,
        },
        success: false,
      });
    }

    return data || null;
  } catch (error) {
    console.error('Error logging IP access:', error);
    return null;
  }
}

/**
 * Add an IP address to the whitelist
 */
export async function addIPWhitelist(
  organizationId: string,
  ipAddress: string,
  options: {
    label?: string;
    description?: string;
    expiresAt?: Date;
    isRange?: boolean;
    ipRangeStart?: string;
    ipRangeEnd?: string;
  } = {}
): Promise<IPWhitelist | null> {
  try {
    const { data, error } = await supabase
      .from('ip_whitelist')
      .insert({
        organization_id: organizationId,
        ip_address: ipAddress,
        label: options.label,
        description: options.description,
        expires_at: options.expiresAt?.toISOString(),
        is_range: options.isRange || false,
        ip_range_start: options.ipRangeStart,
        ip_range_end: options.ipRangeEnd,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    // Log audit event
    await logAuditEvent({
      organizationId,
      eventType: 'ip_whitelist_added',
      eventCategory: 'security',
      severity: 'INFO',
      description: `IP whitelist entry added: ${ipAddress}`,
      details: {
        ipAddress,
        label: options.label,
        expiresAt: options.expiresAt?.toISOString(),
      },
      success: true,
    });

    return data ? mapIPWhitelistFromDB(data) : null;
  } catch (error) {
    console.error('Error adding IP whitelist:', error);
    throw error;
  }
}

/**
 * Remove an IP address from the whitelist
 */
export async function removeIPWhitelist(
  organizationId: string,
  ipWhitelistId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ip_whitelist')
      .delete()
      .eq('id', ipWhitelistId)
      .eq('organization_id', organizationId);

    if (error) throw error;

    // Log audit event
    await logAuditEvent({
      organizationId,
      eventType: 'ip_whitelist_removed',
      eventCategory: 'security',
      severity: 'INFO',
      description: `IP whitelist entry removed: ${ipWhitelistId}`,
      details: { ipWhitelistId },
      success: true,
    });

    return true;
  } catch (error) {
    console.error('Error removing IP whitelist:', error);
    return false;
  }
}

/**
 * List all IP whitelist entries for an organization
 */
export async function listIPWhitelist(
  organizationId: string,
  activeOnly: boolean = true
): Promise<IPWhitelist[]> {
  try {
    let query = supabase
      .from('ip_whitelist')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data ? data.map(mapIPWhitelistFromDB) : [];
  } catch (error) {
    console.error('Error listing IP whitelist:', error);
    return [];
  }
}

/**
 * Add a geo-restriction rule
 */
export async function addGeoRestriction(
  organizationId: string,
  countryCode: string,
  restrictionType: 'allow' | 'block',
  options: {
    label?: string;
    description?: string;
  } = {}
): Promise<GeoRestriction | null> {
  try {
    const { data, error } = await supabase
      .from('geo_restrictions')
      .insert({
        organization_id: organizationId,
        country_code: countryCode.toUpperCase(),
        restriction_type: restrictionType,
        label: options.label,
        description: options.description,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    // Log audit event
    await logAuditEvent({
      organizationId,
      eventType: 'geo_restriction_added',
      eventCategory: 'security',
      severity: 'INFO',
      description: `Geo-restriction added: ${countryCode} (${restrictionType})`,
      details: {
        countryCode,
        restrictionType,
        label: options.label,
      },
      success: true,
    });

    return data ? mapGeoRestrictionFromDB(data) : null;
  } catch (error) {
    console.error('Error adding geo-restriction:', error);
    throw error;
  }
}

/**
 * Remove a geo-restriction rule
 */
export async function removeGeoRestriction(
  organizationId: string,
  geoRestrictionId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('geo_restrictions')
      .delete()
      .eq('id', geoRestrictionId)
      .eq('organization_id', organizationId);

    if (error) throw error;

    // Log audit event
    await logAuditEvent({
      organizationId,
      eventType: 'geo_restriction_removed',
      eventCategory: 'security',
      severity: 'INFO',
      description: `Geo-restriction removed: ${geoRestrictionId}`,
      details: { geoRestrictionId },
      success: true,
    });

    return true;
  } catch (error) {
    console.error('Error removing geo-restriction:', error);
    return false;
  }
}

/**
 * List all geo-restrictions for an organization
 */
export async function listGeoRestrictions(
  organizationId: string,
  activeOnly: boolean = true
): Promise<GeoRestriction[]> {
  try {
    let query = supabase
      .from('geo_restrictions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('country_code', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data ? data.map(mapGeoRestrictionFromDB) : [];
  } catch (error) {
    console.error('Error listing geo-restrictions:', error);
    return [];
  }
}

/**
 * Get IP access statistics for an organization
 */
export async function getIPAccessStats(
  organizationId: string,
  days: number = 7
): Promise<IPAccessStats> {
  try {
    const { data, error } = await supabase.rpc('get_ip_access_stats', {
      p_organization_id: organizationId,
      p_days: days,
    });

    if (error) throw error;

    return {
      totalRequests: data?.total_requests || 0,
      blockedRequests: data?.blocked_requests || 0,
      whitelistedRequests: data?.whitelisted_requests || 0,
      uniqueIps: data?.unique_ips || 0,
      topCountries: data?.top_countries || [],
      topBlockedIps: data?.top_blocked_ips || [],
    };
  } catch (error) {
    console.error('Error getting IP access stats:', error);
    return {
      totalRequests: 0,
      blockedRequests: 0,
      whitelistedRequests: 0,
      uniqueIps: 0,
    };
  }
}

/**
 * Get recent IP access logs for an organization
 */
export async function getIPAccessLogs(
  organizationId: string,
  options: {
    limit?: number;
    offset?: number;
    blockedOnly?: boolean;
  } = {}
): Promise<IPAccessLog[]> {
  try {
    let query = supabase
      .from('ip_access_log')
      .select('*')
      .eq('organization_id', organizationId)
      .order('access_time', { ascending: false });

    if (options.blockedOnly) {
      query = query.eq('is_blocked', true);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data ? data.map(mapIPAccessLogFromDB) : [];
  } catch (error) {
    console.error('Error getting IP access logs:', error);
    return [];
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapIPWhitelistFromDB(data: any): IPWhitelist {
  return {
    id: data.id,
    organizationId: data.organization_id,
    ipAddress: data.ip_address,
    ipRangeStart: data.ip_range_start,
    ipRangeEnd: data.ip_range_end,
    isRange: data.is_range,
    label: data.label,
    description: data.description,
    createdBy: data.created_by,
    isActive: data.is_active,
    expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

function mapGeoRestrictionFromDB(data: any): GeoRestriction {
  return {
    id: data.id,
    organizationId: data.organization_id,
    countryCode: data.country_code,
    restrictionType: data.restriction_type,
    label: data.label,
    description: data.description,
    createdBy: data.created_by,
    isActive: data.is_active,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

function mapIPAccessLogFromDB(data: any): IPAccessLog {
  return {
    id: data.id,
    organizationId: data.organization_id,
    userId: data.user_id,
    ipAddress: data.ip_address,
    countryCode: data.country_code,
    city: data.city,
    isWhitelisted: data.is_whitelisted,
    isBlocked: data.is_blocked,
    blockReason: data.block_reason,
    endpoint: data.endpoint,
    requestMethod: data.request_method,
    userAgent: data.user_agent,
    accessTime: new Date(data.access_time),
  };
}
