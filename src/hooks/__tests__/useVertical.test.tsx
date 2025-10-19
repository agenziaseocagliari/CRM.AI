/**
 * @file useVertical.test.ts
 * @description Comprehensive test suite for useVertical hook
 * Tests profile retrieval, vertical configuration, and error handling
 */

import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { supabase } from '@/lib/supabaseClient';
import { useVertical, VerticalProvider } from '../useVertical';

// Mock Supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: vi.fn()
          }
        }
      }))
    },
    from: vi.fn()
  }
}));

describe('useVertical Hook', () => {
  const mockUser = {
    id: 'c623942a-d4b2-4d93-b944-b8e681679704',
    email: 'test@example.com',
    user_metadata: {
      user_role: 'user',
      organization_id: 'dcfbec5c-6049-4d4d-ba80-a1c412a5861d'
    }
  };

  const mockProfile = {
    vertical: 'insurance',
    organization_id: 'dcfbec5c-6049-4d4d-ba80-a1c412a5861d',
    user_role: 'user',
    full_name: 'Test User'
  };

  const mockVerticalConfig = {
    vertical: 'insurance',
    display_name: 'Assicurazioni',
    description: 'Vertical per agenzie assicurative',
    icon: 'Shield',
    sidebar_config: {
      sections: [
        { id: 'dashboard', label: 'Dashboard', icon: 'Home', path: '/' },
        { id: 'policies', label: 'Polizze', icon: 'FileText', path: '/insurance/policies' }
      ]
    },
    dashboard_config: {},
    enabled_modules: ['policies', 'renewals', 'claims'],
    is_active: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Successful Profile Retrieval', () => {
    it('should fetch user profile and load vertical configuration', async () => {
      // Mock authenticated user
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      // Mock profile query
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null
      });

      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: mockSelect,
            eq: mockEq,
            maybeSingle: mockMaybeSingle
          } as any;
        }
        if (table === 'vertical_configurations') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: mockVerticalConfig,
              error: null
            })
          } as any;
        }
        return {} as any;
      });

      const { result } = renderHook(() => useVertical(), {
        wrapper: ({ children }) => <VerticalProvider>{children}</VerticalProvider>
      });

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify correct vertical was set
      expect(result.current.vertical).toBe('insurance');
      expect(result.current.config).toBeDefined();
      expect(result.current.config?.displayName).toBe('Assicurazioni');
      expect(result.current.error).toBeNull();

      // Verify profile query was called correctly
      expect(mockSelect).toHaveBeenCalledWith('vertical, organization_id, user_role, full_name');
      expect(mockEq).toHaveBeenCalledWith('id', mockUser.id);
    });

    it('should handle module checking correctly', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null
            })
          } as any;
        }
        if (table === 'vertical_configurations') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: mockVerticalConfig,
              error: null
            })
          } as any;
        }
        return {} as any;
      });

      const { result } = renderHook(() => useVertical(), {
        wrapper: ({ children }) => <VerticalProvider>{children}</VerticalProvider>
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Test hasModule function
      expect(result.current.hasModule('policies')).toBe(true);
      expect(result.current.hasModule('renewals')).toBe(true);
      expect(result.current.hasModule('claims')).toBe(true);
      expect(result.current.hasModule('non_existent_module')).toBe(false);
    });
  });

  describe('Missing Profile Handling', () => {
    it('should fall back to standard vertical when profile is not found', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      // Mock profile query returning null (no profile found)
      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null
            })
          } as any;
        }
        if (table === 'vertical_configurations') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { ...mockVerticalConfig, vertical: 'standard' },
              error: null
            })
          } as any;
        }
        return {} as any;
      });

      const { result } = renderHook(() => useVertical(), {
        wrapper: ({ children }) => <VerticalProvider>{children}</VerticalProvider>
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should fall back to 'standard' vertical
      expect(result.current.vertical).toBe('standard');
      expect(result.current.error).toBeNull();
    });
  });

  describe('RLS Policy Rejection Scenario', () => {
    it('should handle RLS policy errors gracefully', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      // Mock RLS policy error
      const rlsError = {
        code: 'PGRST116',
        message: 'Row level security policy violation',
        details: 'Policy check failed',
        hint: 'Check your RLS policies'
      };

      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: rlsError
            })
          } as any;
        }
        if (table === 'vertical_configurations') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { ...mockVerticalConfig, vertical: 'standard' },
              error: null
            })
          } as any;
        }
        return {} as any;
      });

      const { result } = renderHook(() => useVertical(), {
        wrapper: ({ children }) => <VerticalProvider>{children}</VerticalProvider>
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should fall back to standard vertical even with RLS error
      expect(result.current.vertical).toBe('standard');
      // Error should be cleared after successful fallback
      expect(result.current.error).toBeNull();
    });

    it('should log detailed error information for RLS failures', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const rlsError = {
        code: 'PGRST116',
        message: 'Row level security policy violation',
        details: 'Policy check failed',
        hint: 'Check your RLS policies'
      };

      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: rlsError
            })
          } as any;
        }
        if (table === 'vertical_configurations') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { ...mockVerticalConfig, vertical: 'standard' },
              error: null
            })
          } as any;
        }
        return {} as any;
      });

      renderHook(() => useVertical(), {
        wrapper: ({ children }) => <VerticalProvider>{children}</VerticalProvider>
      });

      await waitFor(() => {
        // Verify error logging was called
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('RLS POLICY BLOCKED'),
          expect.any(String)
        );
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Fallback a vertical standard')
        );
      });

      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('No Authenticated User', () => {
    it('should use standard vertical when no user is authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null
      });

      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'vertical_configurations') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { ...mockVerticalConfig, vertical: 'standard' },
              error: null
            })
          } as any;
        }
        return {} as any;
      });

      const { result } = renderHook(() => useVertical(), {
        wrapper: ({ children }) => <VerticalProvider>{children}</VerticalProvider>
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.vertical).toBe('standard');
      expect(result.current.error).toBeNull();
    });
  });

  describe('Vertical Switching', () => {
    it('should switch vertical and update profile', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const mockUpdate = vi.fn().mockReturnThis();
      const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null
            }),
            update: mockUpdate.mockReturnValue({
              eq: mockUpdateEq
            })
          } as any;
        }
        if (table === 'vertical_configurations') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: mockVerticalConfig,
              error: null
            })
          } as any;
        }
        return {} as any;
      });

      const { result } = renderHook(() => useVertical(), {
        wrapper: ({ children }) => <VerticalProvider>{children}</VerticalProvider>
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Switch to a different vertical
      await result.current.switchVertical('real-estate');

      // Verify update was called
      expect(mockUpdate).toHaveBeenCalledWith({ vertical: 'real-estate' });
      expect(mockUpdateEq).toHaveBeenCalledWith('id', mockUser.id);
    });
  });
});
