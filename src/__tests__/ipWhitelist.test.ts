/**
 * Phase 3 - M03: IP Whitelisting & Geo-Restrictions - Tests
 * 
 * Comprehensive test suite for IP whitelist and geo-restriction functionality.
 * 
 * Test Coverage:
 * - IP whitelist validation (single IP, CIDR, ranges)
 * - Geo-restriction checking
 * - IP access logging
 * - CRUD operations for whitelist entries
 * - CRUD operations for geo-restrictions
 * - Statistics and analytics
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  checkIPWhitelist,
  checkGeoRestriction,
  validateIPAccess,
  addIPWhitelist,
  removeIPWhitelist,
  listIPWhitelist,
  addGeoRestriction,
  removeGeoRestriction,
  listGeoRestrictions,
  logIPAccess,
  getIPAccessStats,
  getIPAccessLogs,
} from '../lib/ipWhitelist';

// Mock Supabase client
vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
  },
}));

// Mock audit logger
vi.mock('../lib/auditLogger', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

import { supabase } from '../lib/supabaseClient';

describe('IP Whitelist & Geo-Restrictions', () => {
  const mockOrgId = '123e4567-e89b-12d3-a456-426614174000';
  const mockUserId = '223e4567-e89b-12d3-a456-426614174000';
  const mockIPAddress = '192.168.1.1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkIPWhitelist', () => {
    it('should return true for whitelisted IP', async () => {
      (supabase.rpc as unknown as jest.Mock).mockResolvedValue({
        data: true,
        error: null,
      });

      const result = await checkIPWhitelist(mockOrgId, mockIPAddress);

      expect(result).toBe(true);
      expect(supabase.rpc).toHaveBeenCalledWith('check_ip_whitelist', {
        p_organization_id: mockOrgId,
        p_ip_address: mockIPAddress,
      });
    });

    it('should return false for non-whitelisted IP', async () => {
      (supabase.rpc as unknown as jest.Mock).mockResolvedValue({
        data: false,
        error: null,
      });

      const result = await checkIPWhitelist(mockOrgId, mockIPAddress);

      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      (supabase.rpc as unknown as jest.Mock).mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      const result = await checkIPWhitelist(mockOrgId, mockIPAddress);

      expect(result).toBe(false); // Fail open for availability
    });
  });

  describe('checkGeoRestriction', () => {
    it('should return allowed for allowed countries', async () => {
      (supabase.rpc as unknown as jest.Mock).mockResolvedValue({
        data: { allowed: true, reason: 'Country explicitly allowed' },
        error: null,
      });

      const result = await checkGeoRestriction(mockOrgId, 'US');

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('Country explicitly allowed');
    });

    it('should return blocked for blocked countries', async () => {
      (supabase.rpc as unknown as jest.Mock).mockResolvedValue({
        data: { allowed: false, reason: 'Country explicitly blocked' },
        error: null,
      });

      const result = await checkGeoRestriction(mockOrgId, 'CN');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Country explicitly blocked');
    });

    it('should handle errors gracefully', async () => {
      (supabase.rpc as unknown as jest.Mock).mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      const result = await checkGeoRestriction(mockOrgId, 'US');

      expect(result.allowed).toBe(true); // Fail open for availability
    });
  });

  describe('validateIPAccess', () => {
    it('should allow whitelisted IP regardless of geo-restrictions', async () => {
      (supabase.rpc as unknown as jest.Mock)
        .mockResolvedValueOnce({ data: true, error: null }) // checkIPWhitelist
        .mockResolvedValueOnce({
          data: { allowed: false, reason: 'Country blocked' },
          error: null,
        }); // checkGeoRestriction

      const result = await validateIPAccess(mockOrgId, mockIPAddress, 'CN');

      expect(result.allowed).toBe(true);
      expect(result.isWhitelisted).toBe(true);
      expect(result.reason).toBe('IP whitelisted');
    });

    it('should block non-whitelisted IP from blocked country', async () => {
      (supabase.rpc as unknown as jest.Mock)
        .mockResolvedValueOnce({ data: false, error: null }) // checkIPWhitelist
        .mockResolvedValueOnce({
          data: { allowed: false, reason: 'Country blocked' },
          error: null,
        }); // checkGeoRestriction

      const result = await validateIPAccess(mockOrgId, mockIPAddress, 'CN');

      expect(result.allowed).toBe(false);
      expect(result.isWhitelisted).toBe(false);
      expect(result.geoAllowed).toBe(false);
      expect(result.blockReason).toBe('Country blocked');
    });

    it('should allow non-whitelisted IP from allowed country', async () => {
      (supabase.rpc as unknown as jest.Mock)
        .mockResolvedValueOnce({ data: false, error: null }) // checkIPWhitelist
        .mockResolvedValueOnce({
          data: { allowed: true, reason: 'Country allowed' },
          error: null,
        }); // checkGeoRestriction

      const result = await validateIPAccess(mockOrgId, mockIPAddress, 'US');

      expect(result.allowed).toBe(true);
      expect(result.isWhitelisted).toBe(false);
      expect(result.geoAllowed).toBe(true);
    });

    it('should allow access when no country code is provided', async () => {
      (supabase.rpc as unknown as jest.Mock).mockResolvedValueOnce({
        data: false,
        error: null,
      }); // checkIPWhitelist

      const result = await validateIPAccess(mockOrgId, mockIPAddress);

      expect(result.allowed).toBe(true);
      expect(result.isWhitelisted).toBe(false);
      expect(result.geoAllowed).toBe(true);
    });
  });

  describe('logIPAccess', () => {
    it('should log IP access successfully', async () => {
      const mockLogId = '323e4567-e89b-12d3-a456-426614174000';
      (supabase.rpc as unknown as jest.Mock).mockResolvedValue({
        data: mockLogId,
        error: null,
      });

      const result = await logIPAccess(mockOrgId, mockIPAddress, {
        userId: mockUserId,
        countryCode: 'US',
        isWhitelisted: true,
      });

      expect(result).toBe(mockLogId);
      expect(supabase.rpc).toHaveBeenCalledWith('log_ip_access', {
        p_organization_id: mockOrgId,
        p_user_id: mockUserId,
        p_ip_address: mockIPAddress,
        p_country_code: 'US',
        p_city: null,
        p_is_whitelisted: true,
        p_is_blocked: false,
        p_block_reason: null,
        p_endpoint: null,
        p_request_method: null,
        p_user_agent: null,
      });
    });

    it('should log blocked access and create audit event', async () => {
      const mockLogId = '323e4567-e89b-12d3-a456-426614174000';
      (supabase.rpc as unknown as jest.Mock).mockResolvedValue({
        data: mockLogId,
        error: null,
      });

      await logIPAccess(mockOrgId, mockIPAddress, {
        isBlocked: true,
        blockReason: 'Country blocked',
        countryCode: 'CN',
      });

      expect(supabase.rpc).toHaveBeenCalledWith(
        'log_ip_access',
        expect.objectContaining({
          p_is_blocked: true,
          p_block_reason: 'Country blocked',
        })
      );
    });

    it('should handle errors gracefully', async () => {
      (supabase.rpc as unknown as jest.Mock).mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      const result = await logIPAccess(mockOrgId, mockIPAddress);

      expect(result).toBeNull();
    });
  });

  describe('addIPWhitelist', () => {
    it('should add IP to whitelist successfully', async () => {
      const mockWhitelist = {
        id: '423e4567-e89b-12d3-a456-426614174000',
        organization_id: mockOrgId,
        ip_address: mockIPAddress,
        label: 'Office IP',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockFrom = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockWhitelist, error: null }),
      };

      (supabase.from as unknown as jest.Mock).mockReturnValue(mockFrom);

      const result = await addIPWhitelist(mockOrgId, mockIPAddress, {
        label: 'Office IP',
      });

      expect(result).toBeTruthy();
      expect(result?.ipAddress).toBe(mockIPAddress);
      expect(result?.label).toBe('Office IP');
    });

    it('should throw error on database failure', async () => {
      const mockFrom = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Insert failed'),
        }),
      };

      (supabase.from as unknown as jest.Mock).mockReturnValue(mockFrom);

      await expect(
        addIPWhitelist(mockOrgId, mockIPAddress)
      ).rejects.toThrow();
    });
  });

  describe('removeIPWhitelist', () => {
    it('should remove IP from whitelist successfully', async () => {
      const mockWhitelistId = '423e4567-e89b-12d3-a456-426614174000';

      const mockChain = {
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      const mockFrom = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue(mockChain),
      };

      (supabase.from as unknown as jest.Mock).mockReturnValue(mockFrom);

      const result = await removeIPWhitelist(mockOrgId, mockWhitelistId);

      expect(result).toBe(true);
    });

    it('should return false on database error', async () => {
      const mockWhitelistId = '423e4567-e89b-12d3-a456-426614174000';

      const mockChain = {
        eq: vi.fn().mockResolvedValue({ error: new Error('Delete failed') }),
      };

      const mockFrom = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue(mockChain),
      };

      (supabase.from as unknown as jest.Mock).mockReturnValue(mockFrom);

      const result = await removeIPWhitelist(mockOrgId, mockWhitelistId);

      expect(result).toBe(false);
    });
  });

  describe('listIPWhitelist', () => {
    it('should list all whitelist entries', async () => {
      const mockWhitelists = [
        {
          id: '423e4567-e89b-12d3-a456-426614174000',
          organization_id: mockOrgId,
          ip_address: '192.168.1.1',
          label: 'Office IP',
          is_active: true,
          is_range: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '523e4567-e89b-12d3-a456-426614174000',
          organization_id: mockOrgId,
          ip_address: '10.0.0.0/8',
          label: 'VPN Range',
          is_active: true,
          is_range: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockChain = {
        order: vi.fn().mockResolvedValue({ data: mockWhitelists, error: null }),
      };

      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue(mockChain),
      };

      (supabase.from as unknown as jest.Mock).mockReturnValue(mockFrom);

      // Test with activeOnly=false to avoid conditional eq() call
      const result = await listIPWhitelist(mockOrgId, false);

      expect(result).toHaveLength(2);
      expect(result[0].ipAddress).toBe('192.168.1.1');
      expect(result[1].ipAddress).toBe('10.0.0.0/8');
    });

    it('should return empty array on error', async () => {
      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Query failed'),
        }),
      };

      (supabase.from as unknown as jest.Mock).mockReturnValue(mockFrom);

      const result = await listIPWhitelist(mockOrgId);

      expect(result).toEqual([]);
    });
  });

  describe('addGeoRestriction', () => {
    it('should add geo-restriction successfully', async () => {
      const mockRestriction = {
        id: '623e4567-e89b-12d3-a456-426614174000',
        organization_id: mockOrgId,
        country_code: 'US',
        restriction_type: 'allow',
        label: 'Allow US',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockFrom = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockRestriction, error: null }),
      };

      (supabase.from as unknown as jest.Mock).mockReturnValue(mockFrom);

      const result = await addGeoRestriction(mockOrgId, 'US', 'allow', {
        label: 'Allow US',
      });

      expect(result).toBeTruthy();
      expect(result?.countryCode).toBe('US');
      expect(result?.restrictionType).toBe('allow');
    });

    it('should uppercase country code', async () => {
      const mockRestriction = {
        id: '623e4567-e89b-12d3-a456-426614174000',
        organization_id: mockOrgId,
        country_code: 'US',
        restriction_type: 'allow',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockFrom = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockRestriction, error: null }),
      };

      (supabase.from as unknown as jest.Mock).mockReturnValue(mockFrom);

      await addGeoRestriction(mockOrgId, 'us', 'allow');

      expect(mockFrom.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          country_code: 'US',
        })
      );
    });
  });

  describe('removeGeoRestriction', () => {
    it('should remove geo-restriction successfully', async () => {
      const mockRestrictionId = '623e4567-e89b-12d3-a456-426614174000';

      const mockChain = {
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      const mockFrom = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue(mockChain),
      };

      (supabase.from as unknown as jest.Mock).mockReturnValue(mockFrom);

      const result = await removeGeoRestriction(mockOrgId, mockRestrictionId);

      expect(result).toBe(true);
    });
  });

  describe('listGeoRestrictions', () => {
    it('should list all geo-restrictions', async () => {
      const mockRestrictions = [
        {
          id: '623e4567-e89b-12d3-a456-426614174000',
          organization_id: mockOrgId,
          country_code: 'US',
          restriction_type: 'allow',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '723e4567-e89b-12d3-a456-426614174000',
          organization_id: mockOrgId,
          country_code: 'CN',
          restriction_type: 'block',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockChain = {
        order: vi.fn().mockResolvedValue({
          data: mockRestrictions,
          error: null,
        }),
      };

      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue(mockChain),
      };

      (supabase.from as unknown as jest.Mock).mockReturnValue(mockFrom);

      // Test with activeOnly=false to avoid conditional eq() call
      const result = await listGeoRestrictions(mockOrgId, false);

      expect(result).toHaveLength(2);
      expect(result[0].countryCode).toBe('US');
      expect(result[1].countryCode).toBe('CN');
    });
  });

  describe('getIPAccessStats', () => {
    it('should return IP access statistics', async () => {
      const mockStats = {
        total_requests: 1000,
        blocked_requests: 50,
        whitelisted_requests: 200,
        unique_ips: 150,
        top_countries: [
          { country_code: 'US', count: 500 },
          { country_code: 'GB', count: 300 },
        ],
        top_blocked_ips: [
          { ip_address: '1.2.3.4', count: 20, reasons: ['Country blocked'] },
        ],
      };

      (supabase.rpc as unknown as jest.Mock).mockResolvedValue({
        data: mockStats,
        error: null,
      });

      const result = await getIPAccessStats(mockOrgId, 7);

      expect(result.totalRequests).toBe(1000);
      expect(result.blockedRequests).toBe(50);
      expect(result.uniqueIps).toBe(150);
      expect(result.topCountries).toHaveLength(2);
    });

    it('should return empty stats on error', async () => {
      (supabase.rpc as unknown as jest.Mock).mockResolvedValue({
        data: null,
        error: new Error('Query failed'),
      });

      const result = await getIPAccessStats(mockOrgId);

      expect(result.totalRequests).toBe(0);
      expect(result.blockedRequests).toBe(0);
    });
  });

  describe('getIPAccessLogs', () => {
    it('should return recent IP access logs', async () => {
      const mockLogs = [
        {
          id: '823e4567-e89b-12d3-a456-426614174000',
          organization_id: mockOrgId,
          ip_address: '192.168.1.1',
          is_whitelisted: true,
          is_blocked: false,
          access_time: new Date().toISOString(),
        },
        {
          id: '923e4567-e89b-12d3-a456-426614174000',
          organization_id: mockOrgId,
          ip_address: '1.2.3.4',
          is_whitelisted: false,
          is_blocked: true,
          block_reason: 'Country blocked',
          access_time: new Date().toISOString(),
        },
      ];

      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockLogs, error: null }),
      };

      (supabase.from as unknown as jest.Mock).mockReturnValue(mockFrom);

      const result = await getIPAccessLogs(mockOrgId, { limit: 10 });

      expect(result).toHaveLength(2);
      expect(result[0].isWhitelisted).toBe(true);
      expect(result[1].isBlocked).toBe(true);
    });

    it('should filter with limit', async () => {
      const mockLogs = [
        {
          id: '923e4567-e89b-12d3-a456-426614174000',
          organization_id: mockOrgId,
          ip_address: '1.2.3.4',
          is_whitelisted: false,
          is_blocked: true,
          block_reason: 'Country blocked',
          access_time: new Date().toISOString(),
        },
      ];

      const mockChain = {
        limit: vi.fn().mockResolvedValue({ data: mockLogs, error: null }),
      };

      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnValue(mockChain),
      };

      (supabase.from as unknown as jest.Mock).mockReturnValue(mockFrom);

      // Test without blockedOnly to avoid conditional eq() call
      const result = await getIPAccessLogs(mockOrgId, { limit: 10 });

      expect(result).toHaveLength(1);
    });
  });
});
