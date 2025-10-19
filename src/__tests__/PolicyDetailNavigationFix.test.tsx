/**
 * Test Integration per PolicyDetail Navigation Fix
 * Verifica che la navigazione dal calendario rinnovi funzioni correttamente
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RenewalCalendar from '../../components/insurance/RenewalCalendar';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock Supabase
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({
          data: [
            {
              policy_id: 'ae157a18-3fd9-436b-86d0-5e6ecd8c9e8f',
              policy_number: 'POL-2025-001',
              client_name: 'Mario Rossi',
              renewal_date: '2025-01-15',
              policy_type: 'Auto',
              premium_amount: 1200.00,
              organization_id: 'dcfbec5c-6049-4d4d-ba80-a1c412a5861d',
              days_to_renewal: 15,
              priority_level: 'medium',
              renewal_status: 'upcoming'
            }
          ],
          error: null
        }))
      }))
    }))
  }))
};

vi.mock('../../lib/supabaseClient', () => ({
  supabase: mockSupabase
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock AuthContext
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    organizationId: 'dcfbec5c-6049-4d4d-ba80-a1c412a5861d'
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children
}));

describe('PolicyDetail Navigation Fix Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should navigate to correct policy detail URL when clicking Dettagli', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <RenewalCalendar />
        </AuthProvider>
      </BrowserRouter>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('POL-2025-001')).toBeInTheDocument();
    });

    // Find and click the "Dettagli" button
    const detailButton = screen.getByTestId('open-detail-ae157a18-3fd9-436b-86d0-5e6ecd8c9e8f');
    fireEvent.click(detailButton);

    // Verify correct navigation call
    expect(mockNavigate).toHaveBeenCalledWith('/assicurazioni/polizze/ae157a18-3fd9-436b-86d0-5e6ecd8c9e8f');
  });

  it('should use the correct policy_id from renewal reminders data', async () => {
    const expectedPolicyId = 'ae157a18-3fd9-436b-86d0-5e6ecd8c9e8f';
    const expectedUrl = `/assicurazioni/polizze/${expectedPolicyId}`;

    render(
      <BrowserRouter>
        <AuthProvider>
          <RenewalCalendar />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Mario Rossi')).toBeInTheDocument();
    });

    const detailButton = screen.getByTestId(`open-detail-${expectedPolicyId}`);
    expect(detailButton).toBeInTheDocument();

    fireEvent.click(detailButton);

    expect(mockNavigate).toHaveBeenCalledWith(expectedUrl);
  });

  it('should handle navigation with correct route structure', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <RenewalCalendar />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('POL-2025-001')).toBeInTheDocument();
    });

    const detailButton = screen.getByTestId('open-detail-ae157a18-3fd9-436b-86d0-5e6ecd8c9e8f');
    fireEvent.click(detailButton);

    const navigationCall = mockNavigate.mock.calls[0][0];
    
    // Verify URL structure
    expect(navigationCall).toMatch(/^\/assicurazioni\/polizze\/[a-f0-9-]{36}$/);
    expect(navigationCall).toContain('/assicurazioni/polizze/');
    expect(navigationCall).toContain('ae157a18-3fd9-436b-86d0-5e6ecd8c9e8f');
  });

  it('should pass complete policy ID without truncation', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <RenewalCalendar />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Mario Rossi')).toBeInTheDocument();
    });

    const detailButton = screen.getByTestId('open-detail-ae157a18-3fd9-436b-86d0-5e6ecd8c9e8f');
    fireEvent.click(detailButton);

    const navigationCall = mockNavigate.mock.calls[0][0];
    const policyIdFromUrl = navigationCall.split('/').pop();
    
    // Verify complete UUID format
    expect(policyIdFromUrl).toBe('ae157a18-3fd9-436b-86d0-5e6ecd8c9e8f');
    expect(policyIdFromUrl).toHaveLength(36); // Standard UUID length
  });
});

describe('PolicyDetail Navigation Fix - Edge Cases', () => {
  it('should handle missing policy_id gracefully', async () => {
    const mockSupabaseWithMissingId = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({
              data: [
                {
                  policy_id: null, // Missing policy_id
                  policy_number: 'POL-2025-002',
                  client_name: 'Luigi Bianchi'
                }
              ],
              error: null
            }))
          }))
        }))
      }))
    };

    vi.mocked(mockSupabase.from).mockImplementation(mockSupabaseWithMissingId.from);

    render(
      <BrowserRouter>
        <AuthProvider>
          <RenewalCalendar />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('POL-2025-002')).toBeInTheDocument();
    });

    // Should not render detail button if policy_id is missing
    const detailButtons = screen.queryAllByText('Dettagli');
    expect(detailButtons).toHaveLength(0);
  });
});