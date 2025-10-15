/**
 * Workflow Generation Service
 * Integrates with DataPizza AI agents for natural language workflow generation
 */

import { Edge, Node } from '@xyflow/react';

// ✅ CORRECT - Production-first approach
const getDataPizzaURL = (): string => {
  // Priority 1: Vite environment variable (set in Vercel)
  if (import.meta.env.VITE_DATAPIZZA_API_URL) {
    console.log('🔗 Using Vite env var');
    return import.meta.env.VITE_DATAPIZZA_API_URL;
  }

  // Priority 2: Production default (Railway)
  if (import.meta.env.PROD) {
    console.log('🔗 Using production default');
    return 'https://datapizza-production.railway.app';
  }

  // Priority 3: Local development
  console.log('🔗 Using localhost for development');
  return 'http://localhost:8001';
};

const DATAPIZZA_BASE_URL = getDataPizzaURL();

// Log for debugging
console.log('🚀 DataPizza URL configured:', DATAPIZZA_BASE_URL);
console.log('🌍 Environment:', import.meta.env.MODE);
console.log('📦 Is production:', import.meta.env.PROD);

export interface WorkflowGenerationRequest {
  description: string;
  organization_id?: string;
}

export interface WorkflowGenerationResponse {
  success: boolean;
  elements: Node[];
  edges: Edge[];
  agent_used: string;
  method: 'ai' | 'fallback'; // Generation method indicator
  validation: {
    valid: boolean;
    errors?: string[];
    warnings?: string[];
  };
  suggestions: string[];
  processing_time_ms: number;
  error?: string;
  confidence?: number; // Confidence score (0-1)
  fallback_data?: {
    elements: Node[];
    edges: Edge[];
  };
}

// Keyword mappings for fallback generator
const TRIGGER_KEYWORDS = {
  form: ['modulo', 'form', 'submit', 'invio', 'invia', 'compilato'],
  deal: ['affare', 'deal', 'opportunit', 'vinto', 'won', 'chiuso', 'closed'],
  contact: ['contatto', 'contact', 'lead', 'persona', 'cliente', 'customer', 'creato', 'created'],
  schedule: ['orario', 'schedule', 'ogni', 'every', 'giorno', 'day', 'ora', 'hour', 'programmato'],
  webhook: ['webhook', 'api', 'integrazione', 'integration', 'chiamata', 'call'],
  update: ['aggiornato', 'updated', 'modificato', 'changed', 'modifica']
};

const ACTION_KEYWORDS = {
  email: ['email', 'mail', 'invia', 'send', 'messaggio', 'message'],
  score: ['punteggio', 'score', 'valuta', 'evaluate', 'scoring', 'ai'],
  wait: ['attendi', 'wait', 'pausa', 'delay', 'aspetta', 'dopo', 'after'],
  deal: ['crea affare', 'create deal', 'nuovo deal', 'new deal', 'opportunità'],
  notify: ['notifica', 'notify', 'avvisa', 'alert', 'informa', 'team'],
  tag: ['tag', 'etichetta', 'segna', 'mark', 'aggiungi tag', 'add tag'],
  update: ['aggiorna', 'update', 'modifica', 'modify', 'cambia'],
  assign: ['assegna', 'assign', 'delega', 'delegate']
};

/**
 * Helper: Check if description matches keywords
 */
function matchesKeywords(description: string, keywords: string[]): boolean {
  const lowerDesc = description.toLowerCase();
  return keywords.some(keyword => lowerDesc.includes(keyword.toLowerCase()));
}

/**
 * Helper: Create workflow node
 */
function createWorkflowNode(
  id: string,
  type: 'input' | 'default',
  nodeType: string,
  label: string,
  position: { x: number; y: number }
): Node {
  return {
    id,
    type,
    position,
    data: {
      label,
      nodeType,
      description: label
    },
    className: type === 'input' ? 'border-blue-500' : 'border-green-500'
  };
}

/**
 * Helper: Create workflow edge
 */
function createWorkflowEdge(id: string, source: string, target: string): Edge {
  return {
    id,
    source,
    target,
    animated: true,
    style: { stroke: '#3b82f6' }
  };
}

/**
 * Intelligent Fallback Workflow Generator
 * Generates workflow from keywords when AI is unavailable
 */
export function generateFallbackWorkflow(description: string): {
  elements: Node[];
  edges: Edge[];
  confidence: number;
} {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let nodeCounter = 1;
  let edgeCounter = 1;

  console.log('🔄 Using fallback workflow generator with keyword matching...');

  // Step 1: Detect and create trigger node
  const triggerId = `trigger-${nodeCounter++}`;
  let triggerCreated = false;

  if (matchesKeywords(description, TRIGGER_KEYWORDS.form)) {
    nodes.push(createWorkflowNode(
      triggerId,
      'input',
      'form_submit',
      'Form Submission Trigger',
      { x: 100, y: 100 }
    ));
    triggerCreated = true;
  } else if (matchesKeywords(description, TRIGGER_KEYWORDS.deal)) {
    nodes.push(createWorkflowNode(
      triggerId,
      'input',
      'deal_won',
      'Deal Won Trigger',
      { x: 100, y: 100 }
    ));
    triggerCreated = true;
  } else if (matchesKeywords(description, TRIGGER_KEYWORDS.contact)) {
    nodes.push(createWorkflowNode(
      triggerId,
      'input',
      'contact_created',
      'Contact Created Trigger',
      { x: 100, y: 100 }
    ));
    triggerCreated = true;
  } else if (matchesKeywords(description, TRIGGER_KEYWORDS.schedule)) {
    nodes.push(createWorkflowNode(
      triggerId,
      'input',
      'scheduled_time',
      'Scheduled Trigger',
      { x: 100, y: 100 }
    ));
    triggerCreated = true;
  } else if (matchesKeywords(description, TRIGGER_KEYWORDS.webhook)) {
    nodes.push(createWorkflowNode(
      triggerId,
      'input',
      'webhook_received',
      'Webhook Trigger',
      { x: 100, y: 100 }
    ));
    triggerCreated = true;
  } else if (matchesKeywords(description, TRIGGER_KEYWORDS.update)) {
    nodes.push(createWorkflowNode(
      triggerId,
      'input',
      'contact_updated',
      'Contact Updated Trigger',
      { x: 100, y: 100 }
    ));
    triggerCreated = true;
  }

  // Default trigger if none detected
  if (!triggerCreated) {
    nodes.push(createWorkflowNode(
      triggerId,
      'input',
      'form_submit',
      'Form Submission Trigger',
      { x: 100, y: 100 }
    ));
  }

  // Step 2: Detect and create action nodes (multi-match)
  let actionY = 100;
  let prevNodeId = triggerId;

  // Email action
  if (matchesKeywords(description, ACTION_KEYWORDS.email)) {
    const actionId = `action-${nodeCounter++}`;
    nodes.push(createWorkflowNode(
      actionId,
      'default',
      'send_email',
      'Send Email',
      { x: 400, y: actionY }
    ));
    edges.push(createWorkflowEdge(`e-${edgeCounter++}`, prevNodeId, actionId));
    prevNodeId = actionId;
    actionY += 120;
  }

  // AI Score action
  if (matchesKeywords(description, ACTION_KEYWORDS.score)) {
    const actionId = `action-${nodeCounter++}`;
    nodes.push(createWorkflowNode(
      actionId,
      'default',
      'ai_score',
      'AI Score Contact',
      { x: 400, y: actionY }
    ));
    edges.push(createWorkflowEdge(`e-${edgeCounter++}`, prevNodeId, actionId));
    prevNodeId = actionId;
    actionY += 120;
  }

  // Wait/Delay action
  if (matchesKeywords(description, ACTION_KEYWORDS.wait)) {
    const actionId = `action-${nodeCounter++}`;
    nodes.push(createWorkflowNode(
      actionId,
      'default',
      'wait',
      'Wait Delay',
      { x: 400, y: actionY }
    ));
    edges.push(createWorkflowEdge(`e-${edgeCounter++}`, prevNodeId, actionId));
    prevNodeId = actionId;
    actionY += 120;
  }

  // Create Deal action
  if (matchesKeywords(description, ACTION_KEYWORDS.deal)) {
    const actionId = `action-${nodeCounter++}`;
    nodes.push(createWorkflowNode(
      actionId,
      'default',
      'create_deal',
      'Create Deal',
      { x: 400, y: actionY }
    ));
    edges.push(createWorkflowEdge(`e-${edgeCounter++}`, prevNodeId, actionId));
    prevNodeId = actionId;
    actionY += 120;
  }

  // Notification action
  if (matchesKeywords(description, ACTION_KEYWORDS.notify)) {
    const actionId = `action-${nodeCounter++}`;
    nodes.push(createWorkflowNode(
      actionId,
      'default',
      'send_notification',
      'Send Notification',
      { x: 400, y: actionY }
    ));
    edges.push(createWorkflowEdge(`e-${edgeCounter++}`, prevNodeId, actionId));
    prevNodeId = actionId;
    actionY += 120;
  }

  // Tag action
  if (matchesKeywords(description, ACTION_KEYWORDS.tag)) {
    const actionId = `action-${nodeCounter++}`;
    nodes.push(createWorkflowNode(
      actionId,
      'default',
      'add_tag',
      'Add Tag',
      { x: 400, y: actionY }
    ));
    edges.push(createWorkflowEdge(`e-${edgeCounter++}`, prevNodeId, actionId));
    prevNodeId = actionId;
    actionY += 120;
  }

  // Update Contact action
  if (matchesKeywords(description, ACTION_KEYWORDS.update)) {
    const actionId = `action-${nodeCounter++}`;
    nodes.push(createWorkflowNode(
      actionId,
      'default',
      'update_contact',
      'Update Contact',
      { x: 400, y: actionY }
    ));
    edges.push(createWorkflowEdge(`e-${edgeCounter++}`, prevNodeId, actionId));
    prevNodeId = actionId;
    actionY += 120;
  }

  // Assign action
  if (matchesKeywords(description, ACTION_KEYWORDS.assign)) {
    const actionId = `action-${nodeCounter++}`;
    nodes.push(createWorkflowNode(
      actionId,
      'default',
      'assign_to_user',
      'Assign to User',
      { x: 400, y: actionY }
    ));
    edges.push(createWorkflowEdge(`e-${edgeCounter++}`, prevNodeId, actionId));
    prevNodeId = actionId;
    actionY += 120;
  }

  // If no actions detected, add default email action
  if (nodes.length === 1) {
    const actionId = `action-${nodeCounter++}`;
    nodes.push(createWorkflowNode(
      actionId,
      'default',
      'send_email',
      'Send Email',
      { x: 400, y: 100 }
    ));
    edges.push(createWorkflowEdge(`e-${edgeCounter++}`, triggerId, actionId));
  }

  const confidence = nodes.length > 2 ? 0.7 : 0.5; // Higher confidence if multiple actions detected

  console.log(`✅ Fallback workflow generated: ${nodes.length} nodes, ${edges.length} edges, confidence: ${confidence}`);

  return {
    elements: nodes,
    edges,
    confidence
  };
}

/**
 * Check if DataPizza service is healthy and available
 */
export async function checkAgentHealth(): Promise<{ status: 'healthy' | 'unavailable'; error?: string }> {
  try {
    const response = await fetch(`${DATAPIZZA_BASE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000) // Quick health check
    });
    return response.ok ? { status: 'healthy' } : { status: 'unavailable', error: `HTTP ${response.status}` };
  } catch (error) {
    return {
      status: 'unavailable',
      error: error instanceof Error ? error.message : 'Connection failed'
    };
  }
}

/**
 * Generate workflow from natural language description
 * Primary: DataPizza AI Agent (10s timeout)
 * Fallback: Keyword-based generation
 */
export async function generateWorkflow(
  description: string,
  organizationId?: string
): Promise<WorkflowGenerationResponse> {
  console.log('🚀 Starting workflow generation');
  console.log('📍 Target URL:', DATAPIZZA_BASE_URL);
  console.log('📝 Description:', description);

  // Check agent availability first
  console.log(`🔍 Checking DataPizza health at: ${DATAPIZZA_BASE_URL}`);
  const healthCheck = await checkAgentHealth();
  const isAgentAvailable = healthCheck.status === 'healthy';

  if (isAgentAvailable) {
    console.log('✅ DataPizza agent is healthy and available');
  } else {
    console.warn('❌ DataPizza agent unavailable:', healthCheck.error);
  }

  if (!isAgentAvailable) {
    console.warn('❌ DataPizza agent unavailable, using fallback');
    const fallbackResult = generateFallbackWorkflow(description);

    return {
      success: true,
      method: 'fallback' as const,
      confidence: fallbackResult.confidence,
      elements: fallbackResult.elements,
      edges: fallbackResult.edges,
      agent_used: 'Intelligent Fallback Generator',
      validation: {
        valid: true,
        errors: []
      },
      suggestions: [
        'Workflow generated using keyword-based templates',
        'DataPizza AI agent is not available - consider checking the service',
        'For better results, ensure DataPizza AI service is running'
      ],
      processing_time_ms: 0
    };
  }

  // Try DataPizza AI with 10s timeout
  try {
    console.log('🤖 Attempting AI workflow generation with DataPizza...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.warn('⏱️ AI request timeout (10s exceeded)');
    }, 10000);

    const requestBody: WorkflowGenerationRequest = {
      description,
      organization_id: organizationId
    };

    const response = await fetch(`${DATAPIZZA_BASE_URL}/generate-workflow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: WorkflowGenerationResponse = await response.json();

    console.log('✅ AI workflow generation successful:', {
      success: result.success,
      elements: result.elements.length,
      edges: result.edges.length,
      processing_time: result.processing_time_ms,
      agent: result.agent_used
    });

    // Return with AI method indicator
    return {
      ...result,
      method: 'ai' as const,
      confidence: 0.9
    };

  } catch (error) {
    const errorName = error instanceof Error ? error.name : 'Unknown';
    const isTimeout = errorName === 'AbortError';

    if (isTimeout) {
      console.error('⏱️ AI generation timeout (10s)');
    } else {
      console.error('❌ AI generation error:', error instanceof Error ? error.message : error);
    }

    console.warn(
      isTimeout
        ? '⏱️ AI timeout - using intelligent fallback...'
        : '❌ AI unavailable - using intelligent fallback...',
      error
    );
  }

  // Use intelligent fallback generator
  console.log('🔄 Using intelligent fallback generator');
  const fallbackResult = generateFallbackWorkflow(description);
  console.log('✅ Fallback generation successful');

  return {
    success: true,
    method: 'fallback' as const,
    confidence: fallbackResult.confidence,
    elements: fallbackResult.elements,
    edges: fallbackResult.edges,
    agent_used: 'Keyword Fallback Generator',
    validation: {
      valid: true,
      errors: []
    },
    suggestions: [
      'Workflow generated using keyword-based templates',
      'For better results, ensure DataPizza AI is available',
      'Consider simplifying your description for more accurate keyword matching'
    ],
    processing_time_ms: 0
  };
}

/**
 * Test DataPizza agent connectivity
 */
export async function testAgentConnection(): Promise<{ connected: boolean; agents: string[] }> {
  try {
    // First check health endpoint
    console.log(`🔍 Testing connection to: ${DATAPIZZA_BASE_URL}`);
    const healthStatus = await checkAgentHealth();
    const healthCheck = healthStatus.status === 'healthy';

    if (!healthCheck) {
      throw new Error('Health check failed');
    }

    // Then get agent status
    const response = await fetch(`${DATAPIZZA_BASE_URL}/agents/status`, {
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const status = await response.json();

    console.log('✅ DataPizza agent connection successful');
    return {
      connected: true,
      agents: status.agents || []
    };

  } catch (error) {
    console.warn('⚠️ DataPizza agent connection failed:', error);

    return {
      connected: false,
      agents: []
    };
  }
}

/**
 * Get available workflow node types from agent
 */
export async function getAvailableNodeTypes(): Promise<{
  triggers: Record<string, string>;
  actions: Record<string, string>;
}> {
  // For now, return hardcoded types that match the agent library
  // In the future, this could call a dedicated endpoint
  return {
    triggers: {
      form_submit: "When a form is submitted",
      contact_update: "When a contact is updated",
      deal_won: "When a deal is won/closed",
      deal_lost: "When a deal is lost/failed",
      time_trigger: "Scheduled/recurring automation"
    },
    actions: {
      send_email: "Send automated email",
      ai_score: "Score lead with DataPizza AI",
      create_deal: "Create new deal/opportunity",
      update_contact: "Modify contact information",
      send_notification: "Internal team notification",
      wait_delay: "Add time delay between actions"
    }
  };
}

/**
 * Validate workflow elements before saving
 */
export function validateWorkflowElements(
  elements: Node[],
  edges: Edge[]
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for at least one trigger
  const triggers = elements.filter(el => el.type === 'input');
  if (triggers.length === 0) {
    errors.push('Workflow must have at least one trigger');
  }

  // Check for disconnected nodes
  const connectedNodes = new Set<string>();
  edges.forEach(edge => {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  });

  const disconnectedNodes = elements.filter(el => !connectedNodes.has(el.id));
  if (disconnectedNodes.length > 1) {
    warnings.push(`${disconnectedNodes.length} nodes are not connected to the workflow`);
  }

  // Check for valid edge connections
  edges.forEach((edge, index) => {
    const sourceNode = elements.find(el => el.id === edge.source);
    const targetNode = elements.find(el => el.id === edge.target);

    if (!sourceNode) {
      errors.push(`Edge ${index + 1}: Source node '${edge.source}' not found`);
    }

    if (!targetNode) {
      errors.push(`Edge ${index + 1}: Target node '${edge.target}' not found`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Format workflow for display/debugging
 */
export function formatWorkflowSummary(elements: Node[], edges: Edge[]): string {
  const triggers = elements.filter(el => el.type === 'input');
  const actions = elements.filter(el => el.type === 'default');

  let summary = `📊 Workflow Summary:\n`;
  summary += `• ${triggers.length} trigger(s)\n`;
  summary += `• ${actions.length} action(s)\n`;
  summary += `• ${edges.length} connection(s)\n\n`;

  if (triggers.length > 0) {
    summary += `🎯 Triggers:\n`;
    triggers.forEach((trigger, index) => {
      summary += `  ${index + 1}. ${trigger.data?.label || 'Unnamed'}\n`;
    });
    summary += '\n';
  }

  if (actions.length > 0) {
    summary += `⚡ Actions:\n`;
    actions.forEach((action, index) => {
      summary += `  ${index + 1}. ${action.data?.label || 'Unnamed'}\n`;
    });
  }

  return summary;
}