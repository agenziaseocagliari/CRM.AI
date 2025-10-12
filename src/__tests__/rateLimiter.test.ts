/**
 * Phase 3 - M01: API Rate Limiting Tests
 * 
 * Comprehensive test suite for rate limiting functionality
 * Target: >85% coverage
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    checkRateLimit,
    getQuotaUsage,
    getRateLimitConfig,
    getRateLimitStatus,
    trackRequest,
    updateRateLimitConfig,
    withRateLimit,
} from '../lib/rateLimiter';
import { supabase } from '../lib/supabaseClient';

// Mock supabase client
vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

describe('Rate Limiter - checkRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return allowed when rate limit is not exceeded', async () => {
    const mockResponse = {
      data: [
        {
          is_allowed: true,
          current_usage: 50,
          limit_value: 1000,
          window_seconds: 3600,
          reset_at: new Date(Date.now() + 3600000).toISOString(),
        },
      ],
      error: null,
      count: null,
      status: 200,
      statusText: 'OK',
    };

    vi.mocked(supabase.rpc).mockResolvedValue(mockResponse);

    const result = await checkRateLimit('org-123', 'api_call', '/api/contacts');

    expect(result.isAllowed).toBe(true);
    expect(result.currentUsage).toBe(50);
    expect(result.limitValue).toBe(1000);
    expect(result.windowSeconds).toBe(3600);
    expect(supabase.rpc).toHaveBeenCalledWith('check_rate_limit', {
      p_organization_id: 'org-123',
      p_resource_type: 'api_call',
      p_endpoint: '/api/contacts',
    });
  });

  it('should return not allowed when rate limit is exceeded', async () => {
    const mockResponse = {
      data: [
        {
          is_allowed: false,
          current_usage: 1000,
          limit_value: 1000,
          window_seconds: 3600,
          reset_at: new Date(Date.now() + 3600000).toISOString(),
        },
      ],
      error: null,
      count: null,
      status: 200,
      statusText: 'OK',
    };

    vi.mocked(supabase.rpc).mockResolvedValue(mockResponse);

    const result = await checkRateLimit('org-123', 'api_call');

    expect(result.isAllowed).toBe(false);
    expect(result.currentUsage).toBe(1000);
    expect(result.limitValue).toBe(1000);
  });

  it('should gracefully degrade when RPC call fails', async () => {
    const mockError = new Error('Database connection failed') as Error & { 
      details?: string; 
      hint?: string; 
      code?: string; 
    };
    mockError.details = 'Connection timeout';
    mockError.hint = 'Check database availability';
    mockError.code = 'PGRST500';
    
    const mockResponse = {
      data: null,
      error: mockError,
      count: null,
      status: 500,
      statusText: 'Internal Server Error',
    } as const;

    vi.mocked(supabase.rpc).mockResolvedValue(mockResponse as never);

    const result = await checkRateLimit('org-123', 'api_call');

    expect(result.isAllowed).toBe(true); // Graceful degradation
    expect(result.currentUsage).toBe(0);
    expect(result.limitValue).toBe(999999);
  });

  it('should handle empty data response', async () => {
    const mockResponse = {
      data: [],
      error: null,
      count: null,
      status: 200,
      statusText: 'OK',
    };

    vi.mocked(supabase.rpc).mockResolvedValue(mockResponse);

    const result = await checkRateLimit('org-123', 'api_call');

    expect(result.isAllowed).toBe(true);
    expect(result.limitValue).toBe(999999);
  });

  it('should handle exceptions gracefully', async () => {
    vi.mocked(supabase.rpc).mockRejectedValue(new Error('Network error'));

    const result = await checkRateLimit('org-123', 'api_call');

    expect(result.isAllowed).toBe(true); // Graceful degradation
    expect(result.currentUsage).toBe(0);
  });
});

describe('Rate Limiter - trackRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully track a request', async () => {
    const mockFrom = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockFrom as never);

    const result = await trackRequest({
      organizationId: 'org-123',
      userId: 'user-456',
      resourceType: 'api_call',
      endpoint: '/api/contacts',
      responseStatus: 200,
      rateLimited: false,
      metadata: { test: true },
    });

    expect(result).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith('rate_limit_tracking');
    expect(mockFrom.insert).toHaveBeenCalledWith({
      organization_id: 'org-123',
      user_id: 'user-456',
      resource_type: 'api_call',
      endpoint: '/api/contacts',
      response_status: 200,
      rate_limited: false,
      metadata: { test: true },
    });
  });

  it('should handle tracking errors gracefully', async () => {
    const mockFrom = {
      insert: vi.fn().mockResolvedValue({ error: new Error('Insert failed') }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockFrom as never);

    const result = await trackRequest({
      organizationId: 'org-123',
      resourceType: 'api_call',
      endpoint: '/api/test',
      rateLimited: false,
    });

    expect(result).toBe(false);
  });

  it('should track rate-limited requests', async () => {
    const mockFrom = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockFrom as never);

    const result = await trackRequest({
      organizationId: 'org-123',
      resourceType: 'api_call',
      endpoint: '/api/test',
      rateLimited: true,
      responseStatus: 429,
    });

    expect(result).toBe(true);
    expect(mockFrom.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        rate_limited: true,
        response_status: 429,
      })
    );
  });
});

describe('Rate Limiter - getRateLimitConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should retrieve rate limit configurations', async () => {
    const mockQuery = {
      eq: vi.fn().mockReturnThis(),
      data: [
        {
          organization_id: 'org-123',
          resource_type: 'api_call',
          endpoint_pattern: null,
          max_requests: 1000,
          window_seconds: 3600,
          quota_monthly: 100000,
          enabled: true,
        },
      ],
      error: null,
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue(mockQuery),
    } as never);

    const result = await getRateLimitConfig('org-123');

    expect(result).toHaveLength(1);
    expect(result[0].organizationId).toBe('org-123');
    expect(result[0].maxRequests).toBe(1000);
    expect(result[0].enabled).toBe(true);
  });

  it('should filter by resource type', async () => {
    const mockQuery = {
      eq: vi.fn().mockReturnThis(),
      data: [],
      error: null,
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue(mockQuery),
    } as never);

    await getRateLimitConfig('org-123', 'ai_request');

    expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-123');
    expect(mockQuery.eq).toHaveBeenCalledWith('resource_type', 'ai_request');
  });

  it('should return empty array on error', async () => {
    const mockQuery = {
      eq: vi.fn().mockReturnThis(),
      data: null,
      error: new Error('Query failed'),
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue(mockQuery),
    } as never);

    const result = await getRateLimitConfig('org-123');

    expect(result).toEqual([]);
  });
});

describe('Rate Limiter - updateRateLimitConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update rate limit configuration', async () => {
    const mockQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      error: null,
    };

    vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

    const result = await updateRateLimitConfig('org-123', 'api_call', {
      maxRequests: 2000,
      windowSeconds: 7200,
      enabled: false,
    });

    expect(result).toBe(true);
    expect(mockQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        max_requests: 2000,
        window_seconds: 7200,
        enabled: false,
      })
    );
    expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-123');
    expect(mockQuery.eq).toHaveBeenCalledWith('resource_type', 'api_call');
  });

  it('should return false on update error', async () => {
    const mockQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      error: new Error('Update failed'),
    };

    vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

    const result = await updateRateLimitConfig('org-123', 'api_call', {
      maxRequests: 2000,
    });

    expect(result).toBe(false);
  });
});

describe('Rate Limiter - getQuotaUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should retrieve quota usage', async () => {
    const mockQuery = {
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      data: [
        {
          organization_id: 'org-123',
          resource_type: 'api_call',
          year: 2025,
          month: 10,
          request_count: 5000,
          rate_limited_count: 10,
          last_updated: new Date().toISOString(),
        },
      ],
      error: null,
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue(mockQuery),
    } as never);

    const result = await getQuotaUsage('org-123', 'api_call', 2025, 10);

    expect(result).toHaveLength(1);
    expect(result[0].requestCount).toBe(5000);
    expect(result[0].rateLimitedCount).toBe(10);
  });
});

describe('Rate Limiter - withRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute function when rate limit allows', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [
        {
          is_allowed: true,
          current_usage: 50,
          limit_value: 1000,
          window_seconds: 3600,
          reset_at: new Date(Date.now() + 3600000).toISOString(),
        },
      ],
      error: null,
      count: null,
      status: 200,
      statusText: 'OK',
    });

    const mockFrom = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(mockFrom as never);

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as never);

    const mockFn = vi.fn().mockResolvedValue({ success: true });

    const result = await withRateLimit('org-123', 'api_call', '/api/test', mockFn);

    expect(result).toEqual({ success: true });
    expect(mockFn).toHaveBeenCalled();
    expect(mockFrom.insert).toHaveBeenCalled();
  });

  it('should throw error when rate limit exceeded', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [
        {
          is_allowed: false,
          current_usage: 1000,
          limit_value: 1000,
          window_seconds: 3600,
          reset_at: new Date(Date.now() + 3600000).toISOString(),
        },
      ],
      error: null,
      count: null,
      status: 200,
      statusText: 'OK',
    });

    const mockFrom = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(mockFrom as never);

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as never);

    const mockFn = vi.fn();

    await expect(
      withRateLimit('org-123', 'api_call', '/api/test', mockFn)
    ).rejects.toThrow('Rate limit exceeded');

    expect(mockFn).not.toHaveBeenCalled();
  });

  it('should track failed requests', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [
        {
          is_allowed: true,
          current_usage: 50,
          limit_value: 1000,
          window_seconds: 3600,
          reset_at: new Date(Date.now() + 3600000).toISOString(),
        },
      ],
      error: null,
      count: null,
      status: 200,
      statusText: 'OK',
    });

    const mockFrom = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(mockFrom as never);

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as never);

    const mockFn = vi.fn().mockRejectedValue(new Error('Function failed'));

    await expect(
      withRateLimit('org-123', 'api_call', '/api/test', mockFn)
    ).rejects.toThrow('Function failed');

    expect(mockFrom.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        response_status: 500,
      })
    );
  });
});

describe('Rate Limiter - getRateLimitStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return formatted rate limit status', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [
        {
          is_allowed: true,
          current_usage: 250,
          limit_value: 1000,
          window_seconds: 3600,
          reset_at: new Date(Date.now() + 3600000).toISOString(),
        },
      ],
      error: null,
      count: null,
      status: 200,
      statusText: 'OK',
    });

    const result = await getRateLimitStatus('org-123', 'api_call');

    expect(result.allowed).toBe(true);
    expect(result.usage).toBe(250);
    expect(result.limit).toBe(1000);
    expect(result.percentage).toBe(25);
    expect(result.windowSeconds).toBe(3600);
  });

  it('should calculate percentage correctly at limit', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [
        {
          is_allowed: false,
          current_usage: 1000,
          limit_value: 1000,
          window_seconds: 3600,
          reset_at: new Date(Date.now() + 3600000).toISOString(),
        },
      ],
      error: null,
      count: null,
      status: 200,
      statusText: 'OK',
    });

    const result = await getRateLimitStatus('org-123', 'api_call');

    expect(result.percentage).toBe(100);
    expect(result.allowed).toBe(false);
  });
});
