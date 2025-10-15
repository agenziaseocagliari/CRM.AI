/**
 * Workflow Management Hooks and API Simulation
 * Provides workflow CRUD operations and execution for the Visual Automation Builder
 */

import { Edge, Node } from '@xyflow/react';
import { useCallback, useState } from 'react';
// import { executeAction } from './workflowActions'; // For future real API integration

export interface Workflow {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    nodes: Node[];
    edges: Edge[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface WorkflowExecution {
    id: string;
    workflow_id: string;
    executed_at: string;
    results: Array<{
        nodeId: string;
        success: boolean;
        result?: unknown;
        error?: string;
    }>;
    success: boolean;
    error_count: number;
}

// Local storage keys
const WORKFLOWS_KEY = 'crm_workflows';
const EXECUTIONS_KEY = 'crm_workflow_executions';

/**
 * Hook for managing workflows
 */
export function useWorkflows() {
    const [workflows, setWorkflows] = useState<Workflow[]>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(WORKFLOWS_KEY);
            return stored ? JSON.parse(stored) : [];
        }
        return [];
    });

    const saveToStorage = useCallback((updatedWorkflows: Workflow[]) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(updatedWorkflows));
        }
        setWorkflows(updatedWorkflows);
    }, []);

    const createWorkflow = useCallback(async (
        name: string,
        description: string = '',
        nodes: Node[] = [],
        edges: Edge[] = []
    ): Promise<Workflow> => {
        const newWorkflow: Workflow = {
            id: `workflow_${Date.now()}`,
            user_id: 'current_user', // In real app, get from auth context
            name,
            description,
            nodes,
            edges,
            is_active: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const updatedWorkflows = [...workflows, newWorkflow];
        saveToStorage(updatedWorkflows);

        return newWorkflow;
    }, [workflows, saveToStorage]);

    const updateWorkflow = useCallback(async (
        id: string,
        updates: Partial<Pick<Workflow, 'name' | 'description' | 'nodes' | 'edges' | 'is_active'>>
    ): Promise<Workflow | null> => {
        const workflowIndex = workflows.findIndex(w => w.id === id);
        if (workflowIndex === -1) return null;

        const updatedWorkflow = {
            ...workflows[workflowIndex],
            ...updates,
            updated_at: new Date().toISOString(),
        };

        const updatedWorkflows = [...workflows];
        updatedWorkflows[workflowIndex] = updatedWorkflow;
        saveToStorage(updatedWorkflows);

        return updatedWorkflow;
    }, [workflows, saveToStorage]);

    const deleteWorkflow = useCallback(async (id: string): Promise<boolean> => {
        const updatedWorkflows = workflows.filter(w => w.id !== id);
        saveToStorage(updatedWorkflows);
        return true;
    }, [workflows, saveToStorage]);

    const getWorkflow = useCallback((id: string): Workflow | undefined => {
        return workflows.find(w => w.id === id);
    }, [workflows]);

    return {
        workflows,
        createWorkflow,
        updateWorkflow,
        deleteWorkflow,
        getWorkflow,
    };
}

/**
 * Hook for executing workflows
 */
export function useWorkflowExecution() {
    const [executions, setExecutions] = useState<WorkflowExecution[]>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(EXECUTIONS_KEY);
            return stored ? JSON.parse(stored) : [];
        }
        return [];
    });

    const saveExecutionToStorage = useCallback((execution: WorkflowExecution) => {
        const updatedExecutions = [execution, ...executions];
        if (typeof window !== 'undefined') {
            localStorage.setItem(EXECUTIONS_KEY, JSON.stringify(updatedExecutions));
        }
        setExecutions(updatedExecutions);
    }, [executions]);

    const executeWorkflow = useCallback(async (
        workflow: Workflow,
        triggerData: Record<string, unknown> = {}
    ): Promise<WorkflowExecution> => {
        const executionId = `exec_${Date.now()}`;
        const startTime = Date.now();

        // Find trigger node (node without incoming edges)
        const triggerNode = workflow.nodes.find(node =>
            !workflow.edges.some(edge => edge.target === node.id)
        );

        if (!triggerNode) {
            throw new Error('No trigger node found in workflow');
        }

        // Execute workflow nodes in sequence
        const results = await executeWorkflowNodes(
            triggerNode,
            workflow.nodes,
            workflow.edges,
            triggerData
        );

        const execution: WorkflowExecution = {
            id: executionId,
            workflow_id: workflow.id,
            executed_at: new Date().toISOString(),
            results,
            success: results.every(r => r.success),
            error_count: results.filter(r => !r.success).length,
        };

        saveExecutionToStorage(execution);

        console.log(`Workflow execution completed in ${Date.now() - startTime}ms:`, execution);

        return execution;
    }, [saveExecutionToStorage]);

    return {
        executions,
        executeWorkflow,
    };
}

/**
 * Execute workflow nodes in sequence
 */
async function executeWorkflowNodes(
    currentNode: Node,
    allNodes: Node[],
    edges: Edge[],
    contextData: Record<string, unknown>
): Promise<Array<{ nodeId: string; success: boolean; result?: unknown; error?: string }>> {
    const results: Array<{ nodeId: string; success: boolean; result?: unknown; error?: string }> = [];
    const visited = new Set<string>();
    const queue = [{ node: currentNode, data: contextData }];

    while (queue.length > 0) {
        const { node, data } = queue.shift()!;

        if (visited.has(node.id)) {
            continue;
        }

        visited.add(node.id);

        try {
            // Get node type from node data
            const nodeType = node.data?.nodeType || node.data?.type || 'unknown';

            // Simulate action execution
            let result;
            if (nodeType === 'form_submit') {
                result = { message: 'Form submission trigger activated', data };
            } else if (nodeType === 'ai_score') {
                result = {
                    leadScore: Math.floor(Math.random() * 100),
                    category: 'hot',
                    reasoning: 'High engagement metrics detected'
                };
            } else if (nodeType === 'send_email') {
                result = {
                    emailId: `email_${Date.now()}`,
                    status: 'sent',
                    recipient: data.email || 'test@example.com'
                };
            } else if (nodeType === 'create_deal') {
                result = {
                    dealId: `deal_${Date.now()}`,
                    value: data.value || 5000,
                    stage: 'qualified'
                };
            } else {
                // For real implementation, call executeAction from workflowActions.ts
                result = { message: `Executed ${nodeType} action`, nodeData: node.data };
            }

            results.push({
                nodeId: node.id,
                success: true,
                result
            });

            // Find next nodes to execute
            const nextEdges = edges.filter(edge => edge.source === node.id);
            for (const edge of nextEdges) {
                const nextNode = allNodes.find(n => n.id === edge.target);
                if (nextNode && !visited.has(nextNode.id)) {
                    // Pass result data to next node
                    const nextData = { ...data, ...result };
                    queue.push({ node: nextNode, data: nextData });
                }
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            results.push({
                nodeId: node.id,
                success: false,
                error: errorMessage
            });

            console.error(`Node ${node.id} failed:`, errorMessage);
        }
    }

    return results;
}