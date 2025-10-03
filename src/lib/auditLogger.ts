/**
 * Phase 3 - M02: Enhanced Audit Logging with Search & Filtering
 * 
 * Comprehensive audit logging system with full-text search, filtering, and export capabilities.
 * 
 * Features:
 * - Full-text search on audit logs
 * - Advanced filtering (user, type, category, severity, date range)
 * - Export functionality (CSV, JSON)
 * - Real-time statistics
 * - Event categorization
 */

import { supabase } from './supabaseClient';

import { diagnosticLogger } from '../lib/mockDiagnosticLogger';
export type AuditSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'SECURITY';

export interface AuditLog {
  id: string;
  organizationId: string;
  userId?: string;
  eventType: string;
  eventCategory: string;
  severity: AuditSeverity;
  description: string;
  details?: Record<string, unknown>;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  sessionId?: string;
  durationMs?: number;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface AuditLogFilter {
  searchQuery?: string;
  userId?: string;
  eventTypes?: string[];
  eventCategories?: string[];
  severities?: AuditSeverity[];
  startDate?: Date;
  endDate?: Date;
  success?: boolean;
  resourceType?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogStats {
  totalEvents: number;
  eventsBySeverity: Record<string, number>;
  eventsByCategory: Record<string, number>;
  eventsByUser: Record<string, number>;
  successRate: number;
  avgDurationMs: number;
}

export interface AuditLogExport {
  id: string;
  organizationId: string;
  userId: string;
  filters: AuditLogFilter;
  format: 'csv' | 'json' | 'pdf';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  rowCount?: number;
  fileSizeBytes?: number;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(params: {
  organizationId: string;
  userId?: string;
  eventType: string;
  eventCategory: string;
  description: string;
  severity?: AuditSeverity;
  details?: Record<string, unknown>;
  resourceType?: string;
  resourceId?: string;
  success?: boolean;
  durationMs?: number;
  errorMessage?: string;
}): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('log_audit_event', {
      p_organization_id: params.organizationId,
      p_user_id: params.userId || null,
      p_event_type: params.eventType,
      p_event_category: params.eventCategory,
      p_description: params.description,
      p_severity: params.severity || 'INFO',
      p_details: params.details || {},
      p_resource_type: params.resourceType || null,
      p_resource_id: params.resourceId || null,
      p_success: params.success !== undefined ? params.success : true,
      p_duration_ms: params.durationMs || null,
    });

    if (error) {
      diagnosticLogger.error('Failed to log audit event:', error);
      return null;
    }

    return data as string;
  } catch (error) {
    diagnosticLogger.error('Exception logging audit event:', error);
    return null;
  }
}

/**
 * Search audit logs with advanced filters
 */
export async function searchAuditLogs(
  organizationId: string,
  filters: AuditLogFilter = {}
): Promise<AuditLog[]> {
  try {
    const { data, error } = await supabase.rpc('search_audit_logs', {
      p_organization_id: organizationId,
      p_search_query: filters.searchQuery || null,
      p_user_id: filters.userId || null,
      p_event_types: filters.eventTypes || null,
      p_event_categories: filters.eventCategories || null,
      p_severities: filters.severities || null,
      p_start_date: filters.startDate?.toISOString() || null,
      p_end_date: filters.endDate?.toISOString() || null,
      p_success: filters.success !== undefined ? filters.success : null,
      p_resource_type: filters.resourceType || null,
      p_limit: filters.limit || 100,
      p_offset: filters.offset || 0,
    });

    if (error) {
      diagnosticLogger.error('Failed to search audit logs:', error);
      return [];
    }

    return (data || []).map((row: {
      id: string;
      organization_id: string;
      user_id: string | null;
      event_type: string;
      event_category: string;
      severity: AuditSeverity;
      description: string;
      details: Record<string, unknown> | null;
      resource_type: string | null;
      resource_id: string | null;
      ip_address: string | null;
      user_agent: string | null;
      success: boolean;
      created_at: string;
    }) => ({
      id: row.id,
      organizationId: row.organization_id,
      userId: row.user_id || undefined,
      eventType: row.event_type,
      eventCategory: row.event_category,
      severity: row.severity,
      description: row.description,
      details: row.details || undefined,
      resourceType: row.resource_type || undefined,
      resourceId: row.resource_id || undefined,
      ipAddress: row.ip_address || undefined,
      userAgent: row.user_agent || undefined,
      success: row.success,
      createdAt: new Date(row.created_at),
    }));
  } catch (error) {
    diagnosticLogger.error('Exception searching audit logs:', error);
    return [];
  }
}

/**
 * Get audit log statistics
 */
export async function getAuditLogStats(
  organizationId: string,
  startDate?: Date,
  endDate?: Date
): Promise<AuditLogStats | null> {
  try {
    const { data, error } = await supabase.rpc('get_audit_log_stats', {
      p_organization_id: organizationId,
      p_start_date: startDate?.toISOString() || null,
      p_end_date: endDate?.toISOString() || null,
    });

    if (error || !data || data.length === 0) {
      diagnosticLogger.error('Failed to get audit log stats:', error);
      return null;
    }

    const stats = data[0];
    return {
      totalEvents: parseInt(stats.total_events, 10),
      eventsBySeverity: stats.events_by_severity || {},
      eventsByCategory: stats.events_by_category || {},
      eventsByUser: stats.events_by_user || {},
      successRate: parseFloat(stats.success_rate) || 0,
      avgDurationMs: parseFloat(stats.avg_duration_ms) || 0,
    };
  } catch (error) {
    diagnosticLogger.error('Exception getting audit log stats:', error);
    return null;
  }
}

/**
 * Get recent audit logs for an organization
 */
export async function getRecentAuditLogs(
  organizationId: string,
  limit: number = 50
): Promise<AuditLog[]> {
  return searchAuditLogs(organizationId, { limit });
}

/**
 * Get audit logs for a specific user
 */
export async function getUserAuditLogs(
  organizationId: string,
  userId: string,
  limit: number = 50
): Promise<AuditLog[]> {
  return searchAuditLogs(organizationId, { userId, limit });
}

/**
 * Get audit logs for a specific resource
 */
export async function getResourceAuditLogs(
  organizationId: string,
  resourceType: string,
  resourceId: string,
  limit: number = 50
): Promise<AuditLog[]> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      diagnosticLogger.error('Failed to get resource audit logs:', error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      organizationId: row.organization_id,
      userId: row.user_id || undefined,
      eventType: row.event_type,
      eventCategory: row.event_category,
      severity: row.severity,
      description: row.description,
      details: row.details || undefined,
      resourceType: row.resource_type || undefined,
      resourceId: row.resource_id || undefined,
      ipAddress: row.ip_address || undefined,
      userAgent: row.user_agent || undefined,
      success: row.success,
      createdAt: new Date(row.created_at),
    }));
  } catch (error) {
    diagnosticLogger.error('Exception getting resource audit logs:', error);
    return [];
  }
}

/**
 * Request an audit log export
 */
export async function requestAuditLogExport(
  organizationId: string,
  userId: string,
  filters: AuditLogFilter,
  format: 'csv' | 'json' = 'csv'
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('audit_log_exports')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        filters,
        format,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      diagnosticLogger.error('Failed to request audit log export:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    diagnosticLogger.error('Exception requesting audit log export:', error);
    return null;
  }
}

/**
 * Get export status
 */
export async function getExportStatus(exportId: string): Promise<AuditLogExport | null> {
  try {
    const { data, error } = await supabase
      .from('audit_log_exports')
      .select('*')
      .eq('id', exportId)
      .single();

    if (error) {
      diagnosticLogger.error('Failed to get export status:', error);
      return null;
    }

    return {
      id: data.id,
      organizationId: data.organization_id,
      userId: data.user_id,
      filters: data.filters,
      format: data.format,
      status: data.status,
      fileUrl: data.file_url || undefined,
      rowCount: data.row_count || undefined,
      fileSizeBytes: data.file_size_bytes || undefined,
      errorMessage: data.error_message || undefined,
      createdAt: new Date(data.created_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
    };
  } catch (error) {
    diagnosticLogger.error('Exception getting export status:', error);
    return null;
  }
}

/**
 * List exports for a user
 */
export async function listExports(
  organizationId: string,
  userId?: string
): Promise<AuditLogExport[]> {
  try {
    let query = supabase
      .from('audit_log_exports')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      diagnosticLogger.error('Failed to list exports:', error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      organizationId: row.organization_id,
      userId: row.user_id,
      filters: row.filters,
      format: row.format,
      status: row.status,
      fileUrl: row.file_url || undefined,
      rowCount: row.row_count || undefined,
      fileSizeBytes: row.file_size_bytes || undefined,
      errorMessage: row.error_message || undefined,
      createdAt: new Date(row.created_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    }));
  } catch (error) {
    diagnosticLogger.error('Exception listing exports:', error);
    return [];
  }
}

/**
 * Helper function to log common events
 */
export const AuditLogger = {
  // Authentication events
  login: (orgId: string, userId: string, success: boolean) =>
    logAuditEvent({
      organizationId: orgId,
      userId,
      eventType: 'user.login',
      eventCategory: 'authentication',
      description: success ? 'User logged in successfully' : 'Login attempt failed',
      severity: success ? 'INFO' : 'WARNING',
      success,
    }),

  logout: (orgId: string, userId: string) =>
    logAuditEvent({
      organizationId: orgId,
      userId,
      eventType: 'user.logout',
      eventCategory: 'authentication',
      description: 'User logged out',
      severity: 'INFO',
    }),

  // Data management events
  createResource: (orgId: string, userId: string, resourceType: string, resourceId: string) =>
    logAuditEvent({
      organizationId: orgId,
      userId,
      eventType: `${resourceType}.created`,
      eventCategory: 'data_management',
      description: `Created ${resourceType}`,
      severity: 'INFO',
      resourceType,
      resourceId,
    }),

  updateResource: (orgId: string, userId: string, resourceType: string, resourceId: string, details?: Record<string, unknown>) =>
    logAuditEvent({
      organizationId: orgId,
      userId,
      eventType: `${resourceType}.updated`,
      eventCategory: 'data_management',
      description: `Updated ${resourceType}`,
      severity: 'INFO',
      resourceType,
      resourceId,
      details,
    }),

  deleteResource: (orgId: string, userId: string, resourceType: string, resourceId: string) =>
    logAuditEvent({
      organizationId: orgId,
      userId,
      eventType: `${resourceType}.deleted`,
      eventCategory: 'data_management',
      description: `Deleted ${resourceType}`,
      severity: 'WARNING',
      resourceType,
      resourceId,
    }),

  // Workflow events
  executeWorkflow: (orgId: string, userId: string, workflowId: string, durationMs: number, success: boolean) =>
    logAuditEvent({
      organizationId: orgId,
      userId,
      eventType: 'workflow.executed',
      eventCategory: 'workflow',
      description: success ? 'Workflow executed successfully' : 'Workflow execution failed',
      severity: success ? 'INFO' : 'ERROR',
      resourceType: 'workflow',
      resourceId: workflowId,
      durationMs,
      success,
    }),

  // Security events
  securityViolation: (orgId: string, userId: string | undefined, description: string, details?: Record<string, unknown>) =>
    logAuditEvent({
      organizationId: orgId,
      userId,
      eventType: 'security.violation',
      eventCategory: 'security',
      description,
      severity: 'SECURITY',
      success: false,
      details,
    }),

  // System events
  systemError: (orgId: string, description: string, errorMessage: string, details?: Record<string, unknown>) =>
    logAuditEvent({
      organizationId: orgId,
      eventType: 'system.error',
      eventCategory: 'system',
      description,
      severity: 'ERROR',
      success: false,
      errorMessage,
      details,
    }),
};

export default {
  logAuditEvent,
  searchAuditLogs,
  getAuditLogStats,
  getRecentAuditLogs,
  getUserAuditLogs,
  getResourceAuditLogs,
  requestAuditLogExport,
  getExportStatus,
  listExports,
  AuditLogger,
};

