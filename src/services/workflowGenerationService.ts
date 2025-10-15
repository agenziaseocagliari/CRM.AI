/**
 * Workflow Generation Service
 * Integrates with DataPizza AI agents for natural language workflow generation
 */

import { Node, Edge } from '@xyflow/react';

// DataPizza API configuration
const DATAPIZZA_BASE_URL = 'http://localhost:8001';

export interface WorkflowGenerationRequest {
  description: string;
  organization_id?: string;
}

export interface WorkflowGenerationResponse {
  success: boolean;
  elements: Node[];
  edges: Edge[];
  agent_used: string;
  validation: {
    valid: boolean;
    errors?: string[];
    warnings?: string[];
  };
  suggestions: string[];
  processing_time_ms: number;
  error?: string;
  fallback_data?: {
    elements: Node[];
    edges: Edge[];
  };
}

/**
 * Generate workflow from natural language description
 */
export async function generateWorkflow(
  description: string,
  organizationId?: string
): Promise<WorkflowGenerationResponse> {
  try {
    console.log('🤖 Calling DataPizza workflow generation agent...');
    
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
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: WorkflowGenerationResponse = await response.json();
    
    console.log('✅ Workflow generation successful:', {
      success: result.success,
      elements: result.elements.length,
      edges: result.edges.length,
      processing_time: result.processing_time_ms
    });

    return result;
    
  } catch (error) {
    console.error('❌ Workflow generation failed:', error);
    
    // Return error response with fallback
    return {
      success: false,
      elements: [],
      edges: [],
      agent_used: 'Error Handler',
      validation: {
        valid: false,
        errors: [error instanceof Error ? error.message : String(error)]
      },
      suggestions: [
        'Try simplifying your workflow description',
        'Ensure the DataPizza agent server is running at localhost:8001',
        'Check your network connection'
      ],
      processing_time_ms: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Test DataPizza agent connectivity
 */
export async function testAgentConnection(): Promise<{ connected: boolean; agents: string[] }> {
  try {
    const response = await fetch(`${DATAPIZZA_BASE_URL}/agents/status`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const status = await response.json();
    
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