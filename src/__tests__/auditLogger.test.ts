/**
 * Phase 3 - M02: Enhanced Audit Logging Tests
 * 
 * Comprehensive test suite for audit logging functionality
 * Target: >85% coverage
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    AuditLogger,
    getAuditLogStats,
    getExportStatus,
    getRecentAuditLogs,
    getResourceAuditLogs,
    getUserAuditLogs,
    listExports,
    logAuditEvent,
    requestAuditLogExport,
    searchAuditLogs,
} from '../lib/auditLogger';
import { supabase } from '../lib/supabaseClient';

// Mock supabase client
vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
  },
}));

describe('Audit Logger - logAuditEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully log an audit event', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: 'log-id-123',
      error: null,
      count: null,
      status: 200,
      statusText: 'OK',
    });

    const logId = await logAuditEvent({
      organizationId: 'org-123',
      userId: 'user-456',
      eventType: 'user.login',
      eventCategory: 'authentication',
      description: 'User logged in',
      severity: 'INFO',
    });

    expect(logId).toBe('log-id-123');
    expect(supabase.rpc).toHaveBeenCalledWith('log_audit_event', expect.objectContaining({
      p_organization_id: 'org-123',
      p_user_id: 'user-456',
      p_event_type: 'user.login',
      p_event_category: 'authentication',
    }));
  });

  it('should handle logging errors gracefully', async () => {
    const mockError = new Error('Database error') as Error & { details: string; hint: string; code: string };
    mockError.details = 'Database connection failed';
    mockError.hint = 'Check database connectivity';
    mockError.code = 'PGRST500';
    
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: mockError,
      count: null,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const logId = await logAuditEvent({
      organizationId: 'org-123',
      eventType: 'test.event',
      eventCategory: 'test',
      description: 'Test event',
    });

    expect(logId).toBeNull();
  });

  it('should use default values for optional parameters', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: 'log-id-456',
      error: null,
      count: null,
      status: 200,
      statusText: 'OK',
    });

    await logAuditEvent({
      organizationId: 'org-123',
      eventType: 'test.event',
      eventCategory: 'test',
      description: 'Test event',
    });

    expect(supabase.rpc).toHaveBeenCalledWith('log_audit_event', expect.objectContaining({
      p_severity: 'INFO',
      p_success: true,
      p_details: {},
    }));
  });
});

describe('Audit Logger - searchAuditLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should search audit logs with filters', async () => {
    const mockLogs = [
      {
        id: 'log-1',
        organization_id: 'org-123',
        user_id: 'user-456',
        event_type: 'user.login',
        event_category: 'authentication',
        severity: 'INFO',
        description: 'User logged in',
        details: { ip: '127.0.0.1' },
        resource_type: null,
        resource_id: null,
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0',
        success: true,
        created_at: new Date().toISOString(),
      },
    ];

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockLogs,
      error: null,
      count: null,
      status: 200,
      statusText: 'OK',
    });

    const results = await searchAuditLogs('org-123', {
      searchQuery: 'login',
      userId: 'user-456',
      limit: 10,
    });

    expect(results).toHaveLength(1);
    expect(results[0].eventType).toBe('user.login');
    expect(supabase.rpc).toHaveBeenCalledWith('search_audit_logs', expect.objectContaining({
      p_organization_id: 'org-123',
      p_search_query: 'login',
      p_user_id: 'user-456',
    }));
  });

  it('should return empty array on error', async () => {
    const mockError = new Error('Search failed') as Error & { details: string; hint: string; code: string };
    mockError.details = 'Query execution failed';
    mockError.hint = 'Check search parameters';
    mockError.code = 'PGRST400';
    
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: mockError,
      count: null,
      status: 400,
      statusText: 'Bad Request',
    });

    const results = await searchAuditLogs('org-123');

    expect(results).toEqual([]);
  });

  it('should handle advanced filters', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [],
      error: null,
      count: null,
      status: 200,
      statusText: 'OK',
    });

    await searchAuditLogs('org-123', {
      eventTypes: ['user.login', 'user.logout'],
      eventCategories: ['authentication'],
      severities: ['INFO', 'WARNING'],
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      success: true,
      resourceType: 'user',
    });

    expect(supabase.rpc).toHaveBeenCalledWith('search_audit_logs', expect.objectContaining({
      p_event_types: ['user.login', 'user.logout'],
      p_event_categories: ['authentication'],
      p_severities: ['INFO', 'WARNING'],
    }));
  });
});

describe('Audit Logger - getAuditLogStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should retrieve audit log statistics', async () => {
    const mockStats = [
      {
        total_events: '1000',
        events_by_severity: { INFO: 800, WARNING: 150, ERROR: 50 },
        events_by_category: { authentication: 500, data_management: 300 },
        events_by_user: { 'user@example.com': 400 },
        success_rate: '95.5',
        avg_duration_ms: '250.75',
      },
    ];

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockStats,
      error: null,
      count: null,
      status: 200,
      statusText: 'OK',
    });

    const stats = await getAuditLogStats('org-123');

    expect(stats).not.toBeNull();
    expect(stats?.totalEvents).toBe(1000);
    expect(stats?.successRate).toBe(95.5);
    expect(stats?.avgDurationMs).toBe(250.75);
  });

  it('should return null on error', async () => {
    const mockError = new Error('Stats query failed') as Error & { details: string; hint: string; code: string };
    mockError.details = 'Unable to calculate statistics';
    mockError.hint = 'Verify data exists in the specified date range';
    mockError.code = 'PGRST500';
    
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: mockError,
      count: null,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const stats = await getAuditLogStats('org-123');

    expect(stats).toBeNull();
  });

  it('should support date range filtering', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [{ total_events: '100', success_rate: '100', avg_duration_ms: '100' }],
      error: null,
      count: null,
      status: 200,
      statusText: 'OK',
    });

    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-01-31');

    await getAuditLogStats('org-123', startDate, endDate);

    expect(supabase.rpc).toHaveBeenCalledWith('get_audit_log_stats', expect.objectContaining({
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString(),
    }));
  });
});

describe('Audit Logger - getRecentAuditLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should retrieve recent audit logs', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [],
      error: null,
      count: null,
      status: 200,
      statusText: 'OK',
    });

    await getRecentAuditLogs('org-123', 25);

    expect(supabase.rpc).toHaveBeenCalledWith('search_audit_logs', expect.objectContaining({
      p_organization_id: 'org-123',
      p_limit: 25,
    }));
  });
});

describe('Audit Logger - getUserAuditLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should retrieve audit logs for a specific user', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [],
      error: null,
      count: null,
      status: 200,
      statusText: 'OK',
    });

    await getUserAuditLogs('org-123', 'user-456', 30);

    expect(supabase.rpc).toHaveBeenCalledWith('search_audit_logs', expect.objectContaining({
      p_organization_id: 'org-123',
      p_user_id: 'user-456',
      p_limit: 30,
    }));
  });
});

describe('Audit Logger - getResourceAuditLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should retrieve audit logs for a specific resource', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [{
          id: 'log-1',
          organization_id: 'org-123',
          user_id: 'user-456',
          event_type: 'contact.updated',
          event_category: 'data_management',
          severity: 'INFO',
          description: 'Contact updated',
          details: {},
          resource_type: 'contact',
          resource_id: 'contact-789',
          ip_address: null,
          user_agent: null,
          success: true,
          created_at: new Date().toISOString(),
        }],
        error: null,
        count: null,
        status: 200,
        statusText: 'OK',
      }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

    const logs = await getResourceAuditLogs('org-123', 'contact', 'contact-789', 20);

    expect(logs).toHaveLength(1);
    expect(logs[0].resourceType).toBe('contact');
    expect(supabase.from).toHaveBeenCalledWith('audit_logs');
  });

  it('should handle query errors', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: null,
        error: Object.assign(new Error('Query failed'), {
          details: 'Database query error',
          hint: 'Check query parameters',
          code: 'PGRST500',
        }),
        count: null,
        status: 500,
        statusText: 'Internal Server Error',
      }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

    const logs = await getResourceAuditLogs('org-123', 'contact', 'contact-789');

    expect(logs).toEqual([]);
  });
});

describe('Audit Logger - Export Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should request an audit log export', async () => {
    const mockQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'export-123' },
        error: null,
        count: null,
        status: 200,
        statusText: 'OK',
      }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

    const exportId = await requestAuditLogExport(
      'org-123',
      'user-456',
      { searchQuery: 'login' },
      'csv'
    );

    expect(exportId).toBe('export-123');
    expect(mockQuery.insert).toHaveBeenCalledWith(expect.objectContaining({
      organization_id: 'org-123',
      user_id: 'user-456',
      format: 'csv',
      status: 'pending',
    }));
  });

  it('should get export status', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'export-123',
          organization_id: 'org-123',
          user_id: 'user-456',
          filters: {},
          format: 'csv',
          status: 'completed',
          file_url: 'https://example.com/export.csv',
          row_count: 100,
          file_size_bytes: 5000,
          error_message: null,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        },
        error: null,
        count: null,
        status: 200,
        statusText: 'OK',
      }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

    const status = await getExportStatus('export-123');

    expect(status).not.toBeNull();
    expect(status?.status).toBe('completed');
    expect(status?.fileUrl).toBe('https://example.com/export.csv');
  });

  it('should list exports for an organization', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'export-1',
            organization_id: 'org-123',
            user_id: 'user-456',
            filters: {},
            format: 'csv',
            status: 'completed',
            file_url: null,
            row_count: null,
            file_size_bytes: null,
            error_message: null,
            created_at: new Date().toISOString(),
            completed_at: null,
          },
        ],
        error: null,
        count: null,
        status: 200,
        statusText: 'OK',
      }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

    const exports = await listExports('org-123');

    expect(exports).toHaveLength(1);
    expect(exports[0].status).toBe('completed');
  });
});

describe('Audit Logger - Helper Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should log login event', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: 'log-id',
      error: null,
      count: null,
      status: 200,
      statusText: 'OK',
    });

    await AuditLogger.login('org-123', 'user-456', true);

    expect(supabase.rpc).toHaveBeenCalledWith('log_audit_event', expect.objectContaining({
      p_event_type: 'user.login',
      p_event_category: 'authentication',
      p_success: true,
    }));
  });

  it('should log logout event', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: 'log-id',
      error: null,
      count: null,
      status: 200,
      statusText: 'OK',
    });

    await AuditLogger.logout('org-123', 'user-456');

    expect(supabase.rpc).toHaveBeenCalledWith('log_audit_event', expect.objectContaining({
      p_event_type: 'user.logout',
      p_event_category: 'authentication',
    }));
  });

  it('should log resource creation', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: 'log-id',
      error: null,
      count: null,
      status: 200,
      statusText: 'OK',
    });

    await AuditLogger.createResource('org-123', 'user-456', 'contact', 'contact-789');

    expect(supabase.rpc).toHaveBeenCalledWith('log_audit_event', expect.objectContaining({
      p_event_type: 'contact.created',
      p_event_category: 'data_management',
      p_resource_type: 'contact',
      p_resource_id: 'contact-789',
    }));
  });

  it('should log resource deletion', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: 'log-id',
      error: null,
      count: null,
      status: 200,
      statusText: 'OK',
    });

    await AuditLogger.deleteResource('org-123', 'user-456', 'contact', 'contact-789');

    expect(supabase.rpc).toHaveBeenCalledWith('log_audit_event', expect.objectContaining({
      p_event_type: 'contact.deleted',
      p_severity: 'WARNING',
    }));
  });

  it('should log workflow execution', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: 'log-id',
      error: null,
      count: null,
      status: 200,
      statusText: 'OK',
    });

    await AuditLogger.executeWorkflow('org-123', 'user-456', 'workflow-123', 5000, true);

    expect(supabase.rpc).toHaveBeenCalledWith('log_audit_event', expect.objectContaining({
      p_event_type: 'workflow.executed',
      p_event_category: 'workflow',
      p_duration_ms: 5000,
      p_success: true,
    }));
  });

  it('should log security violations', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: 'log-id',
      error: null,
      count: null,
      status: 200,
      statusText: 'OK',
    });

    await AuditLogger.securityViolation('org-123', 'user-456', 'Unauthorized access attempt');

    expect(supabase.rpc).toHaveBeenCalledWith('log_audit_event', expect.objectContaining({
      p_event_type: 'security.violation',
      p_severity: 'SECURITY',
      p_success: false,
    }));
  });

  it('should log system errors', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: 'log-id',
      error: null,
      count: null,
      status: 200,
      statusText: 'OK',
    });

    await AuditLogger.systemError('org-123', 'Database connection lost', 'Connection timeout');

    expect(supabase.rpc).toHaveBeenCalledWith('log_audit_event', expect.objectContaining({
      p_event_type: 'system.error',
      p_severity: 'ERROR',
      p_success: false,
    }));
  });
});
