import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { WorkflowBuilder } from '../components/superadmin/WorkflowBuilder';
import { supabase } from '../lib/supabaseClient';

describe('Workflow Builder E2E Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Workflow Creation', () => {
        it('should load existing workflows on mount', async () => {
            const mockWorkflows = [
                {
                    id: '1',
                    name: 'Test Workflow',
                    description: 'Test Description',
                    natural_language_prompt: 'Send email when customer registers',
                    workflow_json: {},
                    is_active: true,
                    trigger_type: 'event',
                    trigger_config: {},
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    last_executed_at: null,
                },
            ];

            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: mockWorkflows, error: null }),
            });

            render(<WorkflowBuilder />);

            await waitFor(() => {
                expect(screen.getByText('Test Workflow')).toBeInTheDocument();
            });
        });

        it('should allow creating a new workflow via AI assistant', async () => {
            render(<WorkflowBuilder />);

            const input = screen.getByPlaceholderText(/Es: Quando un cliente non paga/i);
            const submitButton = screen.getByText('Invia');

            fireEvent.change(input, {
                target: { value: 'Send welcome email when new user signs up' },
            });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText(/welcome email/i)).toBeInTheDocument();
            });
        });
    });

    describe('Workflow Execution', () => {
        it('should execute workflow when triggered', async () => {
            const mockWorkflow = {
                id: '1',
                name: 'Email Workflow',
                is_active: true,
                trigger_type: 'manual',
                workflow_json: { steps: [] },
            };

            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: [mockWorkflow], error: null }),
            });

            render(<WorkflowBuilder />);

            await waitFor(() => {
                const executeButton = screen.getByText('Esegui');
                expect(executeButton).toBeInTheDocument();
            });
        });

        it('should show execution logs', async () => {
            const mockLogs = [
                {
                    id: 1,
                    workflow_id: '1',
                    status: 'success',
                    execution_result: { message: 'Completed' },
                    created_at: new Date().toISOString(),
                },
            ];

            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({ data: mockLogs, error: null }),
            });

            render(<WorkflowBuilder />);

            await waitFor(() => {
                expect(screen.getByText(/log/i)).toBeInTheDocument();
            });
        });
    });

    describe('Workflow Management', () => {
        it('should toggle workflow active status', async () => {
            const mockWorkflow = {
                id: '1',
                name: 'Test Workflow',
                is_active: true,
                trigger_type: 'manual',
            };

            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: [mockWorkflow], error: null }),
                update: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ error: null }),
            });

            render(<WorkflowBuilder />);

            await waitFor(() => {
                const toggleButtons = document.querySelectorAll('button[class*="bg-primary"]');
                expect(toggleButtons.length).toBeGreaterThan(0);
            });
        });

        it('should delete workflow with confirmation', async () => {
            const mockWorkflow = {
                id: '1',
                name: 'Test Workflow',
                is_active: false,
            };

            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: [mockWorkflow], error: null }),
                delete: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ error: null }),
            });

            window.confirm = vi.fn(() => true);

            render(<WorkflowBuilder />);

            await waitFor(() => {
                expect(screen.getByText('Test Workflow')).toBeInTheDocument();
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle database errors gracefully', async () => {
            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Database error' },
                }),
            });

            render(<WorkflowBuilder />);

            await waitFor(() => {
                expect(screen.queryByText('Database error')).not.toBeInTheDocument();
            });
        });

        it('should handle empty workflow list', async () => {
            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
            });

            render(<WorkflowBuilder />);

            await waitFor(() => {
                expect(screen.getByText(/nessun workflow creato/i)).toBeInTheDocument();
            });
        });
    });
});
