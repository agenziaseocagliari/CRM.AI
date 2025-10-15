/**
 * Workflow Actions Mapping
 * Maps node types to their corresponding API endpoints and configurations
 */

export interface WorkflowAction {
    id: string;
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    requiresAuth: boolean;
    description: string;
    inputSchema?: {
        [key: string]: {
            type: string;
            required: boolean;
            description: string;
        };
    };
}

export const actionMap: Record<string, WorkflowAction> = {
    // Email Actions
    'send_email': {
        id: 'send_email',
        endpoint: '/api/email/send',
        method: 'POST',
        requiresAuth: true,
        description: 'Send automated email to contact',
        inputSchema: {
            to: { type: 'string', required: true, description: 'Recipient email address' },
            subject: { type: 'string', required: true, description: 'Email subject' },
            body: { type: 'string', required: true, description: 'Email body content' },
            template: { type: 'string', required: false, description: 'Email template ID' },
        }
    },

    // DataPizza AI Actions
    'ai_score': {
        id: 'ai_score',
        endpoint: '/api/datapizza/score-lead',
        method: 'POST',
        requiresAuth: true,
        description: 'Score lead using DataPizza AI agent',
        inputSchema: {
            contactId: { type: 'string', required: true, description: 'Contact ID to score' },
            name: { type: 'string', required: false, description: 'Contact name' },
            email: { type: 'string', required: false, description: 'Contact email' },
            company: { type: 'string', required: false, description: 'Contact company' },
            phone: { type: 'string', required: false, description: 'Contact phone' },
        }
    },

    // CRM Actions
    'create_deal': {
        id: 'create_deal',
        endpoint: '/api/deals/create',
        method: 'POST',
        requiresAuth: true,
        description: 'Create new deal/opportunity',
        inputSchema: {
            contactId: { type: 'string', required: true, description: 'Associated contact ID' },
            title: { type: 'string', required: true, description: 'Deal title' },
            value: { type: 'number', required: false, description: 'Deal value in euros' },
            stage: { type: 'string', required: false, description: 'Deal stage' },
            description: { type: 'string', required: false, description: 'Deal description' },
        }
    },

    'update_contact': {
        id: 'update_contact',
        endpoint: '/api/contacts/update',
        method: 'PUT',
        requiresAuth: true,
        description: 'Update contact information',
        inputSchema: {
            contactId: { type: 'string', required: true, description: 'Contact ID to update' },
            name: { type: 'string', required: false, description: 'Contact name' },
            email: { type: 'string', required: false, description: 'Contact email' },
            phone: { type: 'string', required: false, description: 'Contact phone' },
            company: { type: 'string', required: false, description: 'Contact company' },
            tags: { type: 'array', required: false, description: 'Contact tags' },
            leadScore: { type: 'number', required: false, description: 'Lead score (0-100)' },
        }
    },

    // Notification Actions
    'send_notification': {
        id: 'send_notification',
        endpoint: '/api/notifications/send',
        method: 'POST',
        requiresAuth: true,
        description: 'Send internal notification',
        inputSchema: {
            userId: { type: 'string', required: true, description: 'User ID to notify' },
            title: { type: 'string', required: true, description: 'Notification title' },
            message: { type: 'string', required: true, description: 'Notification message' },
            type: { type: 'string', required: false, description: 'Notification type (info, warning, error)' },
        }
    },

    // Integration Actions
    'webhook_call': {
        id: 'webhook_call',
        endpoint: '/api/webhooks/call',
        method: 'POST',
        requiresAuth: true,
        description: 'Call external webhook',
        inputSchema: {
            url: { type: 'string', required: true, description: 'Webhook URL to call' },
            method: { type: 'string', required: false, description: 'HTTP method (GET, POST, PUT, DELETE)' },
            headers: { type: 'object', required: false, description: 'HTTP headers' },
            payload: { type: 'object', required: false, description: 'Request payload' },
        }
    },
};

export const triggerMap: Record<string, WorkflowAction> = {
    'form_submit': {
        id: 'form_submit',
        endpoint: '/api/triggers/form-submit',
        method: 'POST',
        requiresAuth: true,
        description: 'Triggered when a form is submitted',
        inputSchema: {
            formId: { type: 'string', required: true, description: 'Form ID that was submitted' },
            submissionData: { type: 'object', required: true, description: 'Form submission data' },
        }
    },

    'contact_update': {
        id: 'contact_update',
        endpoint: '/api/triggers/contact-update',
        method: 'POST',
        requiresAuth: true,
        description: 'Triggered when a contact is updated',
        inputSchema: {
            contactId: { type: 'string', required: true, description: 'Updated contact ID' },
            previousData: { type: 'object', required: false, description: 'Previous contact data' },
            newData: { type: 'object', required: true, description: 'New contact data' },
        }
    },

    'deal_won': {
        id: 'deal_won',
        endpoint: '/api/triggers/deal-won',
        method: 'POST',
        requiresAuth: true,
        description: 'Triggered when a deal is won',
        inputSchema: {
            dealId: { type: 'string', required: true, description: 'Won deal ID' },
            contactId: { type: 'string', required: true, description: 'Associated contact ID' },
            value: { type: 'number', required: true, description: 'Deal value' },
        }
    },
};

/**
 * Get action configuration by node type
 */
export function getActionConfig(nodeType: string): WorkflowAction | undefined {
    return actionMap[nodeType] || triggerMap[nodeType];
}

/**
 * Validate workflow node configuration
 */
export function validateNodeData(nodeType: string, data: Record<string, unknown>): { valid: boolean; errors: string[] } {
    const config = getActionConfig(nodeType);
    if (!config) {
        return { valid: false, errors: [`Unknown node type: ${nodeType}`] };
    }

    const errors: string[] = [];

    if (config.inputSchema) {
        for (const [fieldName, fieldConfig] of Object.entries(config.inputSchema)) {
            if (fieldConfig.required && (!data || !data[fieldName])) {
                errors.push(`Required field missing: ${fieldName}`);
            }
        }
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Execute workflow action
 */
export async function executeAction(nodeType: string, data: Record<string, unknown>, authToken?: string): Promise<Record<string, unknown>> {
    const config = getActionConfig(nodeType);
    if (!config) {
        throw new Error(`Unknown action type: ${nodeType}`);
    }

    // Validate input data
    const validation = validateNodeData(nodeType, data);
    if (!validation.valid) {
        throw new Error(`Invalid input data: ${validation.errors.join(', ')}`);
    }

    // Prepare request headers
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (config.requiresAuth && authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Make API call
    const response = await fetch(config.endpoint, {
        method: config.method,
        headers,
        body: config.method !== 'GET' ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Action failed (${response.status}): ${errorText}`);
    }

    return response.json();
}