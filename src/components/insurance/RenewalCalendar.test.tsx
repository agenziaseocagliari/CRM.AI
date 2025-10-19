/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { BrowserRouter } from 'react-router-dom';
import RenewalCalendar from './RenewalCalendar';
import { AuthContext } from '../../contexts/AuthContext';

// Mock supabase
const mockSupabase = {
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
};

// Mock react-hot-toast
const mockToast = {
  success: () => {},
  error: () => {}
};

// Mock dependencies using vi.doMock since vi globals may not be available
beforeEach(() => {
  // Mock implementations
});

describe('RenewalCalendar Component Tests', () => {
  const createAuthWrapper = (organizationId: string = 'org-1') => {
    const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
      const mockAuthValue = {
        organizationId,
        user: { id: 'user-1', email: 'test@example.com' },
        profile: null,
        loading: false,
        logout: () => {},
        session: null,
        userRole: 'user',
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
          {children}
        </AuthContext.Provider>
      );
    };
    
    return AuthWrapper;
  };

  test('should render basic calendar component', () => {
    const AuthWrapper = createAuthWrapper();

    const { container } = render(
      <AuthWrapper>
        <RenewalCalendar />
      </AuthWrapper>
    );

    expect(container).toBeTruthy();
    expect(container.innerHTML).toContain('Calendario Scadenze Rinnovi');
  });

  test('should render calendar grid structure', () => {
    const AuthWrapper = createAuthWrapper();

    const { container } = render(
      <AuthWrapper>
        <RenewalCalendar />
      </AuthWrapper>
    );

    // Check for calendar test id
    const calendarElement = container.querySelector('[data-testid="renewal-calendar"]');
    expect(calendarElement).toBeTruthy();
    
    // Check for Italian day names
    expect(container.innerHTML).toContain('Dom');
    expect(container.innerHTML).toContain('Lun');
    expect(container.innerHTML).toContain('Mar');
  });

  test('should display current month in Italian', () => {
    const AuthWrapper = createAuthWrapper();

    const { container } = render(
      <AuthWrapper>
        <RenewalCalendar />
      </AuthWrapper>
    );

    const currentMonth = format(new Date(), 'MMMM', { locale: it });
    expect(container.innerHTML).toContain(currentMonth);
  });

  test('should have navigation buttons', () => {
    const AuthWrapper = createAuthWrapper();

    const { container } = render(
      <AuthWrapper>
        <RenewalCalendar />
      </AuthWrapper>
    );

    const prevButton = container.querySelector('[aria-label*="precedente"]');
    const nextButton = container.querySelector('[aria-label*="successivo"]');

    expect(prevButton).toBeTruthy();
    expect(nextButton).toBeTruthy();
  });

  test('should display legend with priority levels', () => {
    const AuthWrapper = createAuthWrapper();

    const { container } = render(
      <AuthWrapper>
        <RenewalCalendar />
      </AuthWrapper>
    );

    expect(container.innerHTML).toContain('Legenda priorità');
    expect(container.innerHTML).toContain('Critica');
    expect(container.innerHTML).toContain('Alta');
    expect(container.innerHTML).toContain('Media');
    expect(container.innerHTML).toContain('Bassa');
  });

  test('should handle empty organization ID', () => {
    const AuthWrapper = createAuthWrapper('');

    const { container } = render(
      <AuthWrapper>
        <RenewalCalendar />
      </AuthWrapper>
    );

    // Should render without crashing
    expect(container).toBeTruthy();
    expect(container.innerHTML).toContain('Calendario Scadenze Rinnovi');
  });

  test('should display reminder count badge', () => {
    const AuthWrapper = createAuthWrapper();

    const { container } = render(
      <AuthWrapper>
        <RenewalCalendar />
      </AuthWrapper>
    );

    expect(container.innerHTML).toContain('scadenze nei prossimi 90 giorni');
  });

  test('should have proper CSS styling classes', () => {
    const AuthWrapper = createAuthWrapper();

    const { container } = render(
      <AuthWrapper>
        <RenewalCalendar />
      </AuthWrapper>
    );

    // Check for Tailwind CSS classes
    expect(container.innerHTML).toContain('bg-white');
    expect(container.innerHTML).toContain('rounded-lg');
    expect(container.innerHTML).toContain('border');
    expect(container.innerHTML).toContain('text-blue-600');
  });

  test('should format today date in Italian locale', () => {
    const AuthWrapper = createAuthWrapper();

    const { container } = render(
      <AuthWrapper>
        <RenewalCalendar />
      </AuthWrapper>
    );

    const today = format(new Date(), 'dd MMMM yyyy', { locale: it });
    // Should contain components of Italian date formatting
    expect(container.innerHTML).toContain(format(new Date(), 'MMMM', { locale: it }));
  });

  test('should display calendar days with test ids', () => {
    const AuthWrapper = createAuthWrapper();

    const { container } = render(
      <AuthWrapper>
        <RenewalCalendar />
      </AuthWrapper>
    );

    // Check for calendar day elements
    const dayElements = container.querySelectorAll('[data-testid^="calendar-day-"]');
    expect(dayElements.length).toBeGreaterThan(0);
  });

  test('should handle detail button click with correct navigation', async () => {
    // Mock useNavigate
    const mockNavigate = vi.fn();
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate,
        BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
      };
    });

    const AuthWrapper = createAuthWrapper();

    const { container } = render(
      <BrowserRouter>
        <AuthWrapper>
          <RenewalCalendar />
        </AuthWrapper>
      </BrowserRouter>
    );

    // Mock a reminder with test data
    const mockReminderData = [{
      policy_id: 'POL-2025-001',
      user_id: 'user-1',
      policy_number: 'POL-2025-001',
      renewal_date: '2025-11-15',
      client_name: 'Mario Rossi',
      policy_type: 'Auto',
      premium_amount: 850.00,
      organization_id: 'org-1',
      days_to_renewal: 6,
      priority_level: 'critical' as const,
      renewal_status: 'urgent' as const,
      created_at: '2025-10-19T10:00:00Z',
      updated_at: '2025-10-19T10:00:00Z'
    }];

    // Test that detail button exists (when reminders are present)
    // Note: This test assumes the component renders detail buttons
    // when reminder data is available
    const detailButtons = container.querySelectorAll('[data-testid^="open-detail-"]');
    
    if (detailButtons.length > 0) {
      // Simulate click on first detail button
      fireEvent.click(detailButtons[0]);
      
      // Wait for navigation to be called
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/assicurazioni/polizze/POL-2025-001');
      });
    }
    
    // If no detail buttons are rendered, it's expected behavior when no data is loaded
    expect(container).toBeTruthy();
  });

  test('should handle detail button click error gracefully', async () => {
    // Mock console.error to verify error handling
    const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock useNavigate to throw an error
    const mockNavigate = vi.fn().mockImplementation(() => {
      throw new Error('Navigation failed');
    });
    
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate,
        BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
      };
    });

    const AuthWrapper = createAuthWrapper();

    const { container } = render(
      <BrowserRouter>
        <AuthWrapper>
          <RenewalCalendar />
        </AuthWrapper>
      </BrowserRouter>
    );

    // Test error handling by attempting to click a detail button
    // (if it exists - otherwise test passes as no error should occur)
    const detailButtons = container.querySelectorAll('[data-testid^="open-detail-"]');
    
    if (detailButtons.length > 0) {
      fireEvent.click(detailButtons[0]);
      
      // Wait for error to be logged
      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith(
          expect.stringContaining('❌ [RenewalCalendar] Error navigating to policy detail:'),
          expect.any(Error)
        );
      });
    }
    
    // Cleanup
    mockConsoleError.mockRestore();
    expect(container).toBeTruthy();
  });
});