/**
 * Workflow Simulation Engine
 * 
 * Provides real-time step-by-step simulation of workflows with visual feedback.
 * Supports all 35+ node types from the workflow library.
 * 
 * @module workflowSimulator
 */

import { Edge, Node } from '@xyflow/react';

/**
 * Simulation step status
 */
export type SimulationStatus = 'pending' | 'running' | 'success' | 'error' | 'skipped';

/**
 * Represents a single step in workflow execution
 */
export interface SimulationStep {
    /** Unique step identifier */
    stepId: number;
    /** Node ID being executed */
    nodeId: string;
    /** Human-readable node name */
    nodeName: string;
    /** Node type (form_submit, ai_score, etc.) */
    nodeType: string;
    /** Current execution status */
    status: SimulationStatus;
    /** Input data passed to this node */
    input: Record<string, unknown>;
    /** Output data produced by this node */
    output: Record<string, unknown> | null;
    /** Execution duration in milliseconds */
    duration: number;
    /** Error message if status is 'error' */
    error?: string;
    /** Timestamp when step started */
    startTime: number;
    /** Timestamp when step completed */
    endTime?: number;
}

/**
 * Simulation result summary
 */
export interface SimulationResult {
    /** Whether simulation completed successfully */
    success: boolean;
    /** All execution steps */
    steps: SimulationStep[];
    /** Total execution time in milliseconds */
    totalDuration: number;
    /** Number of successful steps */
    successCount: number;
    /** Number of failed steps */
    errorCount: number;
    /** Number of skipped steps */
    skippedCount: number;
    /** Final error message if simulation failed */
    error?: string;
}

/**
 * Callback function called after each simulation step
 */
export type StepCallback = (step: SimulationStep) => void | Promise<void>;

/**
 * Workflow Simulator
 * 
 * Simulates workflow execution step-by-step with realistic timing and output generation.
 * Supports all trigger, action, condition, and delay node types.
 */
export class WorkflowSimulator {
    private nodes: Node[];
    private edges: Edge[];
    private steps: SimulationStep[] = [];
    private stepCounter = 0;
    private visitedNodes = new Set<string>();

    /** Maximum number of steps to prevent infinite loops */
    private readonly MAX_STEPS = 50;

    /** Base delay between steps (ms) for visual effect */
    private readonly STEP_DELAY = 500;

    /**
     * Create a new workflow simulator
     * 
     * @param nodes - React Flow nodes array
     * @param edges - React Flow edges array
     */
    constructor(nodes: Node[], edges: Edge[]) {
        this.nodes = nodes;
        this.edges = edges;
    }

    /**
     * Simulate workflow execution from start to finish
     * 
     * @param initialData - Initial trigger data
     * @param onStepComplete - Callback invoked after each step
     * @returns Simulation result with all steps and summary
     */
    async simulate(
        initialData: Record<string, unknown> = {},
        onStepComplete?: StepCallback
    ): Promise<SimulationResult> {
        const startTime = Date.now();
        this.steps = [];
        this.stepCounter = 0;
        this.visitedNodes.clear();

        try {
            // Find trigger node (starting point)
            const triggerNode = this.findTriggerNode();
            if (!triggerNode) {
                throw new Error('No trigger node found in workflow');
            }

            // Execute workflow starting from trigger
            let currentData = { ...initialData };
            let currentNodeId: string | null = triggerNode.id;

            while (currentNodeId && this.stepCounter < this.MAX_STEPS) {
                // Find the node
                const node = this.nodes.find(n => n.id === currentNodeId);
                if (!node) {
                    throw new Error(`Node not found: ${currentNodeId}`);
                }

                // Check for circular loops
                if (this.visitedNodes.has(currentNodeId) && this.visitedNodes.size > 1) {
                    const skipStep = this.createStep(node, 'skipped', currentData, null);
                    skipStep.error = 'Circular loop detected - skipping node';
                    this.steps.push(skipStep);
                    if (onStepComplete) {
                        await onStepComplete(skipStep);
                    }
                    break;
                }

                this.visitedNodes.add(currentNodeId);

                // Execute the node
                const step = await this.executeNode(node, currentData);
                this.steps.push(step);

                // Invoke callback
                if (onStepComplete) {
                    await onStepComplete(step);
                }

                // Add visual delay for simulation effect
                await this.delay(this.STEP_DELAY);

                // If step failed, stop execution
                if (step.status === 'error') {
                    break;
                }

                // Update data with step output
                if (step.output) {
                    currentData = { ...currentData, ...step.output };
                }

                // Find next node
                currentNodeId = this.findNextNode(currentNodeId);
            }

            // Check if we hit max steps limit
            if (this.stepCounter >= this.MAX_STEPS) {
                throw new Error(`Workflow exceeded maximum steps limit (${this.MAX_STEPS})`);
            }

            // Calculate summary
            const totalDuration = Date.now() - startTime;
            const successCount = this.steps.filter(s => s.status === 'success').length;
            const errorCount = this.steps.filter(s => s.status === 'error').length;
            const skippedCount = this.steps.filter(s => s.status === 'skipped').length;

            return {
                success: errorCount === 0,
                steps: this.steps,
                totalDuration,
                successCount,
                errorCount,
                skippedCount,
            };

        } catch (error) {
            const totalDuration = Date.now() - startTime;
            return {
                success: false,
                steps: this.steps,
                totalDuration,
                successCount: this.steps.filter(s => s.status === 'success').length,
                errorCount: this.steps.filter(s => s.status === 'error').length + 1,
                skippedCount: this.steps.filter(s => s.status === 'skipped').length,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Execute a single node and generate a simulation step
     */
    private async executeNode(node: Node, input: Record<string, unknown>): Promise<SimulationStep> {
        const startTime = Date.now();
        const nodeType = (node.data?.nodeType || node.data?.type || 'unknown') as string;
        const nodeName = (node.data?.label || `Node ${node.id}`) as string;

        this.stepCounter++;

        const step: SimulationStep = {
            stepId: this.stepCounter,
            nodeId: node.id,
            nodeName,
            nodeType,
            status: 'running',
            input,
            output: null,
            duration: 0,
            startTime,
        };

        try {
            // Simulate node execution based on type
            const output = await this.simulateNodeExecution(nodeType, input, node.data || {});

            step.status = 'success';
            step.output = output;
            step.endTime = Date.now();
            step.duration = step.endTime - startTime;

            return step;

        } catch (error) {
            step.status = 'error';
            step.error = error instanceof Error ? error.message : 'Execution failed';
            step.endTime = Date.now();
            step.duration = step.endTime - startTime;

            return step;
        }
    }

    /**
     * Simulate execution of specific node types with realistic output
     */
    private async simulateNodeExecution(
        nodeType: string,
        input: Record<string, unknown>,
        nodeData: Record<string, unknown>
    ): Promise<Record<string, unknown>> {

        // Simulate processing time (100-800ms depending on node type)
        const processingTime = this.getProcessingTime(nodeType);
        await this.delay(processingTime);

        // Generate output based on node type
        switch (nodeType) {
            // TRIGGERS
            case 'form_submit':
                return {
                    formId: nodeData.formId || 'form_001',
                    submissionId: this.generateId('sub'),
                    submittedData: input.formData || {
                        name: 'Mario Rossi',
                        email: 'mario.rossi@example.it',
                        phone: '+39 333 1234567',
                        company: 'Acme Italia SRL',
                    },
                    timestamp: new Date().toISOString(),
                };

            case 'contact_created':
                return {
                    contactId: this.generateId('contact'),
                    name: input.name || 'Nuovo Contatto',
                    email: input.email || 'nuovo@example.it',
                    createdAt: new Date().toISOString(),
                };

            case 'contact_update':
                return {
                    contactId: input.contactId || this.generateId('contact'),
                    previousData: { leadScore: 0 },
                    newData: { leadScore: 75 },
                    updatedAt: new Date().toISOString(),
                };

            case 'deal_created':
                return {
                    dealId: this.generateId('deal'),
                    title: input.dealTitle || 'Nuova Opportunità',
                    value: input.value || 5000,
                    stage: 'qualification',
                    createdAt: new Date().toISOString(),
                };

            case 'deal_won':
                return {
                    dealId: input.dealId || this.generateId('deal'),
                    contactId: input.contactId || this.generateId('contact'),
                    value: input.value || 10000,
                    wonAt: new Date().toISOString(),
                };

            case 'deal_stage_change':
                return {
                    dealId: input.dealId || this.generateId('deal'),
                    previousStage: 'qualification',
                    newStage: 'proposal',
                    changedAt: new Date().toISOString(),
                };

            case 'scheduled_time':
                return {
                    scheduledTime: new Date().toISOString(),
                    triggerName: nodeData.name || 'Esecuzione Programmata',
                    executionId: this.generateId('exec'),
                };

            case 'webhook_received':
                return {
                    webhookId: this.generateId('webhook'),
                    payload: input,
                    receivedAt: new Date().toISOString(),
                    source: nodeData.webhookUrl || 'https://api.example.com/webhook',
                };

            // AI ACTIONS
            case 'ai_score': {
                const contactData = {
                    name: input.name || input.contactName || 'Unknown',
                    email: input.email || input.contactEmail || 'unknown@example.it',
                    company: input.company || input.contactCompany || 'N/A',
                    phone: input.phone || input.contactPhone || '',
                };

                // Simulate AI scoring
                const score = this.calculateLeadScore(contactData);

                return {
                    contactId: input.contactId || this.generateId('contact'),
                    contactData,
                    leadScore: score,
                    scoringReason: this.getScoreReason(score),
                    scoredAt: new Date().toISOString(),
                    scoringMethod: 'DataPizza AI Agent',
                };
            }

            case 'ai_classify':
                return {
                    classification: this.classifyLead(input),
                    confidence: Math.floor(Math.random() * 20) + 80, // 80-100%
                    categories: ['Hot Lead', 'Enterprise', 'Decision Maker'],
                    classifiedAt: new Date().toISOString(),
                };

            case 'ai_enrich':
                return {
                    enrichedData: {
                        ...input,
                        industry: 'Technology',
                        companySize: '50-200 employees',
                        revenue: '€5M-€10M',
                        linkedInUrl: 'https://linkedin.com/company/example',
                    },
                    enrichedAt: new Date().toISOString(),
                    source: 'DataPizza Enrichment API',
                };

            // EMAIL ACTIONS
            case 'send_email':
                return {
                    messageId: this.generateId('msg'),
                    to: input.to || nodeData.recipient || 'recipient@example.it',
                    subject: input.subject || nodeData.subject || 'Email Automatica',
                    status: 'sent',
                    sentAt: new Date().toISOString(),
                };

            case 'send_email_template':
                return {
                    messageId: this.generateId('msg'),
                    templateId: nodeData.templateId || 'welcome_001',
                    to: input.email || 'recipient@example.it',
                    status: 'sent',
                    sentAt: new Date().toISOString(),
                };

            // CRM ACTIONS
            case 'create_deal':
                return {
                    dealId: this.generateId('deal'),
                    title: input.dealTitle || nodeData.title || 'Nuova Opportunità',
                    contactId: input.contactId || this.generateId('contact'),
                    value: input.value || nodeData.value || 5000,
                    stage: input.stage || nodeData.stage || 'new',
                    createdAt: new Date().toISOString(),
                };

            case 'update_contact':
                return {
                    contactId: input.contactId || this.generateId('contact'),
                    updatedFields: nodeData.fields || {
                        leadScore: input.leadScore || 75,
                        status: 'qualified',
                    },
                    updatedAt: new Date().toISOString(),
                };

            case 'add_tag':
                return {
                    contactId: input.contactId || this.generateId('contact'),
                    tags: [...(input.existingTags as string[] || []), nodeData.tag || 'qualified-lead'],
                    addedAt: new Date().toISOString(),
                };

            case 'remove_tag':
                return {
                    contactId: input.contactId || this.generateId('contact'),
                    removedTag: nodeData.tag || 'unqualified',
                    removedAt: new Date().toISOString(),
                };

            case 'assign_to_user':
                return {
                    contactId: input.contactId || this.generateId('contact'),
                    assignedTo: nodeData.userId || this.generateId('user'),
                    assignedAt: new Date().toISOString(),
                };

            // NOTIFICATION ACTIONS
            case 'send_notification':
                return {
                    notificationId: this.generateId('notif'),
                    userId: nodeData.userId || this.generateId('user'),
                    title: nodeData.title || 'Notifica Workflow',
                    message: nodeData.message || 'Notifica generata dal workflow',
                    type: nodeData.type || 'info',
                    sentAt: new Date().toISOString(),
                };

            case 'send_slack_message':
                return {
                    messageId: this.generateId('slack'),
                    channel: nodeData.channel || '#general',
                    message: nodeData.message || 'Messaggio dal workflow',
                    sentAt: new Date().toISOString(),
                };

            case 'send_sms':
                return {
                    messageId: this.generateId('sms'),
                    to: input.phone || nodeData.phoneNumber || '+39 333 1234567',
                    message: nodeData.message || 'SMS dal workflow',
                    status: 'sent',
                    sentAt: new Date().toISOString(),
                };

            // INTEGRATION ACTIONS
            case 'webhook_call':
                return {
                    webhookUrl: nodeData.url || 'https://api.example.com/webhook',
                    method: nodeData.method || 'POST',
                    statusCode: 200,
                    response: { success: true, message: 'Webhook received' },
                    calledAt: new Date().toISOString(),
                };

            case 'api_request':
                return {
                    endpoint: nodeData.endpoint || '/api/external',
                    method: nodeData.method || 'GET',
                    statusCode: 200,
                    response: { data: { id: this.generateId('api'), status: 'success' } },
                    requestedAt: new Date().toISOString(),
                };

            // CONDITIONAL ACTIONS
            case 'condition': {
                const conditionMet = this.evaluateCondition(input, nodeData);
                return {
                    conditionMet,
                    condition: nodeData.condition || 'default',
                    input,
                    evaluatedAt: new Date().toISOString(),
                };
            }

            case 'split':
                return {
                    path: this.selectPath(input, nodeData),
                    input,
                    selectedAt: new Date().toISOString(),
                };

            // DELAY ACTIONS
            case 'wait': {
                const waitTime = (nodeData.duration as number) || 60; // seconds
                return {
                    waitedFor: `${waitTime} seconds`,
                    waitUntil: new Date(Date.now() + (waitTime * 1000)).toISOString(),
                    completedAt: new Date().toISOString(),
                };
            }

            case 'wait_until':
                return {
                    targetTime: nodeData.targetTime || new Date(Date.now() + 3600000).toISOString(),
                    completedAt: new Date().toISOString(),
                };

            // DATA TRANSFORMATION
            case 'transform_data':
                return {
                    originalData: input,
                    transformedData: this.transformData(input, nodeData),
                    transformedAt: new Date().toISOString(),
                };

            case 'filter_data':
                return {
                    originalCount: Array.isArray(input.items) ? input.items.length : 1,
                    filteredData: this.filterData(input, nodeData),
                    filteredAt: new Date().toISOString(),
                };

            // DEFAULT
            default:
                return {
                    nodeType,
                    input,
                    status: 'executed',
                    executedAt: new Date().toISOString(),
                    message: `Eseguito nodo ${nodeType}`,
                };
        }
    }

    /**
     * Get realistic processing time based on node type
     */
    private getProcessingTime(nodeType: string): number {
        const timings: Record<string, number> = {
            // Fast operations (100-200ms)
            'condition': 100,
            'split': 100,
            'add_tag': 150,
            'remove_tag': 150,

            // Medium operations (200-400ms)
            'form_submit': 200,
            'update_contact': 300,
            'assign_to_user': 250,
            'transform_data': 300,

            // Slow operations (400-800ms)
            'ai_score': 800,
            'ai_classify': 700,
            'ai_enrich': 750,
            'send_email': 500,
            'create_deal': 400,
            'webhook_call': 600,
            'api_request': 550,
        };

        return timings[nodeType] || 300; // Default 300ms
    }

    /**
     * Calculate lead score (0-100) based on contact data
     */
    private calculateLeadScore(contactData: Record<string, unknown>): number {
        let score = 50; // Base score

        // Email quality
        if (contactData.email && typeof contactData.email === 'string') {
            if (contactData.email.includes('@gmail.com') || contactData.email.includes('@yahoo.com')) {
                score += 5;
            } else {
                score += 15; // Corporate email
            }
        }

        // Company presence
        if (contactData.company && contactData.company !== 'N/A') {
            score += 20;
        }

        // Phone presence
        if (contactData.phone && typeof contactData.phone === 'string' && contactData.phone.length > 0) {
            score += 10;
        }

        // Name quality
        if (contactData.name && typeof contactData.name === 'string' && contactData.name !== 'Unknown') {
            score += 5;
        }

        return Math.min(100, Math.max(0, score));
    }

    /**
     * Get human-readable reason for lead score
     */
    private getScoreReason(score: number): string {
        if (score >= 80) return 'Lead qualificato - Email aziendale, azienda identificata, contatti completi';
        if (score >= 60) return 'Lead promettente - Dati parzialmente completi';
        if (score >= 40) return 'Lead da verificare - Informazioni limitate';
        return 'Lead non qualificato - Dati insufficienti';
    }

    /**
     * Classify lead based on input data
     */
    private classifyLead(input: Record<string, unknown>): string {
        const score = input.leadScore as number || 0;

        if (score >= 80) return 'Hot Lead';
        if (score >= 60) return 'Warm Lead';
        if (score >= 40) return 'Cold Lead';
        return 'Unqualified';
    }

    /**
     * Evaluate condition based on node configuration
     */
    private evaluateCondition(input: Record<string, unknown>, nodeData: Record<string, unknown>): boolean {
        // Simple condition evaluation
        const field = nodeData.field as string;
        const operator = nodeData.operator as string || 'equals';
        const value = nodeData.value;

        if (!field || !(field in input)) {
            return false;
        }

        const fieldValue = input[field];

        switch (operator) {
            case 'equals':
                return fieldValue === value;
            case 'not_equals':
                return fieldValue !== value;
            case 'greater_than':
                return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue > value;
            case 'less_than':
                return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue < value;
            case 'contains':
                return typeof fieldValue === 'string' && typeof value === 'string' && fieldValue.includes(value);
            default:
                // Default to random for simulation
                return Math.random() > 0.5;
        }
    }

    /**
     * Select path in split node
     */
    private selectPath(input: Record<string, unknown>, nodeData: Record<string, unknown>): string {
        const paths = nodeData.paths as string[] || ['path_a', 'path_b'];
        const score = input.leadScore as number || 0;

        // Simple path selection based on score
        if (score >= 70) return paths[0] || 'high_score';
        return paths[1] || 'low_score';
    }

    /**
     * Transform data based on node configuration
     */
    private transformData(input: Record<string, unknown>, nodeData: Record<string, unknown>): Record<string, unknown> {
        const mapping = nodeData.mapping as Record<string, string> || {};
        const transformed: Record<string, unknown> = {};

        for (const [targetField, sourceField] of Object.entries(mapping)) {
            if (sourceField in input) {
                transformed[targetField] = input[sourceField];
            }
        }

        return Object.keys(transformed).length > 0 ? transformed : input;
    }

    /**
     * Filter data based on node configuration
     */
    private filterData(input: Record<string, unknown>, nodeData: Record<string, unknown>): unknown[] {
        const items = input.items as unknown[] || [input];
        const filterField = nodeData.filterField as string;
        const filterValue = nodeData.filterValue;

        if (!filterField) {
            return items;
        }

        return items.filter(item => {
            if (typeof item === 'object' && item !== null && filterField in item) {
                return (item as Record<string, unknown>)[filterField] === filterValue;
            }
            return false;
        });
    }

    /**
     * Find the trigger node (entry point) in the workflow
     */
    private findTriggerNode(): Node | undefined {
        // Look for nodes with type 'input' or trigger node types
        const triggerTypes = [
            'form_submit',
            'contact_created',
            'contact_update',
            'deal_created',
            'deal_won',
            'deal_stage_change',
            'scheduled_time',
            'webhook_received',
        ];

        return this.nodes.find(node =>
            node.type === 'input' ||
            triggerTypes.includes(node.data?.nodeType as string) ||
            triggerTypes.includes(node.data?.type as string)
        );
    }

    /**
     * Find the next node to execute based on edges
     */
    private findNextNode(currentNodeId: string): string | null {
        const outgoingEdge = this.edges.find(edge => edge.source === currentNodeId);
        return outgoingEdge ? outgoingEdge.target : null;
    }

    /**
     * Create a simulation step object
     */
    private createStep(
        node: Node,
        status: SimulationStatus,
        input: Record<string, unknown>,
        output: Record<string, unknown> | null
    ): SimulationStep {
        this.stepCounter++;
        return {
            stepId: this.stepCounter,
            nodeId: node.id,
            nodeName: ((node.data?.label as string) || `Node ${node.id}`),
            nodeType: ((node.data?.nodeType as string) || (node.data?.type as string) || 'unknown'),
            status,
            input,
            output,
            duration: 0,
            startTime: Date.now(),
        };
    }

    /**
     * Generate a unique ID with prefix
     */
    private generateId(prefix: string): string {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Delay execution for specified milliseconds
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Quick simulation helper function
 * 
 * @example
 * ```typescript
 * const result = await simulateWorkflow(nodes, edges, { name: 'Test' });
 * console.log(`Completed ${result.successCount} steps in ${result.totalDuration}ms`);
 * ```
 */
export async function simulateWorkflow(
    nodes: Node[],
    edges: Edge[],
    initialData: Record<string, unknown> = {},
    onStepComplete?: StepCallback
): Promise<SimulationResult> {
    const simulator = new WorkflowSimulator(nodes, edges);
    return simulator.simulate(initialData, onStepComplete);
}
