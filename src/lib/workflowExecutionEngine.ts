import { Edge, Node } from '@xyflow/react';
import { supabase } from './supabaseClient';

interface ExecutionContext {
    workflowId: string;
    organizationId: string;
    triggerData: Record<string, string | number>;
}

interface ExecutionLog {
    stepNumber: number;
    nodeId: string;
    nodeType: string;
    nodeLabel: string;
    status: 'pending' | 'running' | 'success' | 'error';
    input: Record<string, string | number>;
    output: Record<string, string | number> | null;
    error?: string;
    timestamp: Date;
    duration: number;
}

export class WorkflowExecutionEngine {
    private context: ExecutionContext;
    private logs: ExecutionLog[] = [];

    constructor(context: ExecutionContext) {
        this.context = context;
    }

    async execute(nodes: Node[], edges: Edge[]) {
        console.log('🚀 Starting workflow execution:', this.context.workflowId);

        // Sort nodes by execution order (topological sort)
        const sortedNodes = this.topologicalSort(nodes, edges);

        for (let i = 0; i < sortedNodes.length; i++) {
            const node = sortedNodes[i];
            const log = await this.executeNode(node, i + 1);
            this.logs.push(log);

            if (log.status === 'error') {
                console.error('❌ Node execution failed:', log);
                break;
            }
        }

        // Save execution to database
        await this.saveExecution();

        return this.logs;
    }

    private async executeNode(node: Node, stepNumber: number): Promise<ExecutionLog> {
        const startTime = Date.now();
        const log: ExecutionLog = {
            stepNumber,
            nodeId: node.id,
            nodeType: node.data.nodeType as string,
            nodeLabel: node.data.label as string,
            status: 'running',
            input: (node.data.config as Record<string, string | number>) || {},
            output: null,
            timestamp: new Date(),
            duration: 0,
        };

        try {
            console.log(`▶️ Executing node ${stepNumber}:`, node.data.label);

            // Execute based on node type
            switch (node.data.nodeType) {
                case 'action-send-email':
                    log.output = await this.executeSendEmail(node.data.config as Record<string, string>);
                    break;

                case 'action-sms':
                    log.output = await this.executeSendSMS(node.data.config as Record<string, string>);
                    break;

                case 'action-whatsapp':
                    log.output = await this.executeSendWhatsApp(node.data.config as Record<string, string>);
                    break;

                case 'action-ai-score':
                    log.output = await this.executeAIScore(node.data.config as Record<string, string>);
                    break;

                case 'action-create-deal':
                    log.output = await this.executeCreateDeal(node.data.config as Record<string, string | number>);
                    break;

                case 'action-add-tag':
                    log.output = await this.executeAddTag(node.data.config as Record<string, string>);
                    break;

                case 'action-wait':
                    log.output = await this.executeWait(node.data.config as Record<string, number>);
                    break;

                default:
                    log.output = { message: 'Node type not yet implemented', nodeType: node.data.nodeType as string };
            }

            log.status = 'success';
            log.duration = Date.now() - startTime;
            console.log(`✅ Node ${stepNumber} completed in ${log.duration}ms`);

        } catch (error: unknown) {
            log.status = 'error';
            log.error = error instanceof Error ? error.message : 'Unknown error';
            log.duration = Date.now() - startTime;
            console.error(`❌ Node ${stepNumber} failed:`, error);
        }

        return log;
    }

    private async executeSendEmail(config: Record<string, string>) {
        // Call Vercel API route for email sending
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: config.to,
                subject: config.subject,
                body: config.body,
                // Replace variables with actual data
                variables: this.context.triggerData,
            }),
        });

        if (!response.ok) throw new Error('Email send failed');

        return await response.json();
    }

    private async executeSendSMS(config: Record<string, string>) {
        const response = await fetch('/api/send-sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: config.to || this.context.triggerData.phone,
                body: config.body,
            }),
        });

        if (!response.ok) throw new Error('SMS send failed');
        return await response.json();
    }

    private async executeSendWhatsApp(config: Record<string, string>) {
        const response = await fetch('/api/send-whatsapp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: config.to || this.context.triggerData.phone,
                body: config.body,
            }),
        });

        if (!response.ok) throw new Error('WhatsApp send failed');
        return await response.json();
    }

    private async executeAIScore(config: Record<string, string>) {
        // Call Vercel API for AI scoring
        const response = await fetch('/api/ai-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contactId: this.context.triggerData.contactId,
                field: config.field,
            }),
        });

        return await response.json();
    }

    private async executeCreateDeal(config: Record<string, string | number>) {
        const { data, error } = await supabase
            .from('opportunities')
            .insert({
                organization_id: this.context.organizationId,
                name: config.dealName as string,
                value: config.value as number,
                stage: (config.stage as string) || 'prospecting',
                contact_id: this.context.triggerData.contactId,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    private async executeAddTag(config: Record<string, string>) {
        // Simulate tag addition - in real app this would call supabase
        console.log('Adding tag:', config.tag, 'to contact:', this.context.triggerData.contactId);
        return { status: 'success', tag: config.tag };
    }

    private async executeWait(config: Record<string, number>) {
        // Simulate wait (in real execution, this would schedule for later)
        const duration = config.duration || 60; // minutes
        console.log(`⏸️ Waiting ${duration} minutes (simulated)`);
        return { waited: duration, unit: 'minutes' };
    }

    private topologicalSort(nodes: Node[], edges: Edge[]): Node[] {
        // Simple topological sort based on edges
        const sorted: Node[] = [];
        const visited = new Set<string>();

        const visit = (nodeId: string) => {
            if (visited.has(nodeId)) return;
            visited.add(nodeId);

            const outgoingEdges = edges.filter(e => e.source === nodeId);
            outgoingEdges.forEach(edge => visit(edge.target));

            const node = nodes.find(n => n.id === nodeId);
            if (node) sorted.unshift(node);
        };

        // Start from triggers (nodes with no incoming edges)
        const triggers = nodes.filter(node =>
            !edges.some(edge => edge.target === node.id)
        );

        triggers.forEach(trigger => visit(trigger.id));

        return sorted;
    }

    private async saveExecution() {
        try {
            const payload = {
                workflow_id: this.context.workflowId,
                organization_id: this.context.organizationId,
                status: this.logs.some(l => l.status === 'error') ? 'failed' : 'completed',
                execution_log: this.logs,
                started_at: this.logs[0]?.timestamp || new Date(),
                completed_at: new Date(),
            };

            console.log('💾 Saving execution to Supabase:', payload);
            console.log('🔍 Organization ID:', this.context.organizationId);
            console.log('🔍 Workflow ID:', this.context.workflowId);

            const { data, error } = await supabase
                .from('workflow_executions')
                .insert(payload)
                .select();

            if (error) {
                console.error('❌ Supabase insert failed:', error);
                console.error('Error details:', error.message, error.details, error.hint);
                console.error('Error code:', error.code);
            } else {
                console.log('✅ Execution saved successfully:', data);
            }
        } catch (error) {
            console.error('❌ Failed to save execution (catch block):', error);
            console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        }
    }
}