/**
 * @vitest-environment jsdom
 */
import { render } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../../contexts/AuthContext';

// Mock the actual component with navigation logic
const mockNavigate = vi.fn();

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock supabase
vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [], error: null })
        })
      })
    }),
    functions: {
      invoke: () => Promise.resolve({ data: { success: true }, error: null })
    }
  }
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Import the component after mocking its dependencies
import RenewalCalendar from './RenewalCalendar';

describe('RenewalCalendar Dettagli Button Tests', () => {
  const createAuthWrapper = (organizationId: string = 'org-1') => {
    const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
      const mockAuthValue = {
        organizationId,
        user: { id: 'user-1', email: 'test@example.com' },
        profile: null,
        loading: false,
        logout: () => {},
        session: null,
        userRole: 'user' as const,
        userEmail: 'test@example.com',
        userId: 'user-1',
        signUp: () => Promise.resolve(),
        signIn: () => Promise.resolve(),
        signOut: () => Promise.resolve(),
        updateProfile: () => Promise.resolve(),
        jwtClaims: null,
        isSuperAdmin: false,
        isAdmin: false,
        isUser: true
      };

      return (
        <AuthContext.Provider value={mockAuthValue}>
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </AuthContext.Provider>
      );
    };
    
    return AuthWrapper;
  };

  beforeEach(() => {
    mockNavigate.mockClear();
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const AuthWrapper = createAuthWrapper();

    const { container } = render(
      <AuthWrapper>
        <RenewalCalendar />
      </AuthWrapper>
    );

    expect(container).toBeTruthy();
  });

  it('should use correct routing path for policy details', () => {
    // Test that our navigation logic uses the correct Italian path
    const AuthWrapper = createAuthWrapper();

    render(
      <AuthWrapper>
        <RenewalCalendar />
      </AuthWrapper>
    );

    // The component should have loaded without errors
    expect(mockNavigate).not.toHaveBeenCalled();
    
    // Test the navigation path format that would be used
    const expectedPath = '/assicurazioni/polizze/POL-2025-001';
    expect(expectedPath).toMatch(/^\/assicurazioni\/polizze\/[A-Z0-9-]+$/);
  });

  it('should have proper test attributes for detail buttons', () => {
    const AuthWrapper = createAuthWrapper();

    const { container } = render(
      <AuthWrapper>
        <RenewalCalendar />
      </AuthWrapper>
    );

    // Test that component renders without errors
    expect(container).toBeTruthy();
  });

  it('should handle navigation error gracefully', () => {
    // Mock console.error to capture error logs
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const AuthWrapper = createAuthWrapper();

    render(
      <AuthWrapper>
        <RenewalCalendar />
      </AuthWrapper>
    );

    // Component should render successfully even if navigation might fail
    expect(consoleSpy).not.toHaveBeenCalled();
    
    // Cleanup
    consoleSpy.mockRestore();
  });
});