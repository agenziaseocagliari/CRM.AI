// Enterprise Visual Workflow Builder - Like Zapier/N8N
// Drag-and-drop interface for creating complex automation workflows

export interface WorkflowCanvas {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  isActive: boolean;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables: WorkflowVariable[];
  metadata: WorkflowMetadata;
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData;
  config: NodeConfig;
}

export type NodeType = 
  | 'trigger'
  | 'action' 
  | 'condition'
  | 'delay'
  | 'ai_process'
  | 'webhook'
  | 'email'
  | 'whatsapp'
  | 'database'
  | 'api_call'
  | 'form_submission'
  | 'calendar'
  | 'filter'
  | 'transformer'
  | 'loop'
  | 'branch'
  | 'merge';

export interface TriggerNodeConfig {
  triggerType: 'webhook' | 'schedule' | 'database_change' | 'form_submission' | 'email_received' | 'whatsapp_message';
  config: {
    // Webhook trigger
    webhookUrl?: string;
    webhookSecret?: string;
    
    // Schedule trigger  
    cronExpression?: string;
    timezone?: string;
    
    // Database trigger
    table?: string;
    operation?: 'insert' | 'update' | 'delete';
    conditions?: FilterCondition[];
    
    // Form trigger
    formId?: string;
    formName?: string;
    
    // Communication triggers
    phoneNumber?: string;
    emailAddress?: string;
  };
}

export interface ActionNodeConfig {
  actionType: 'send_email' | 'send_whatsapp' | 'create_contact' | 'update_contact' | 'create_opportunity' | 'api_call' | 'ai_generate' | 'schedule_task';
  config: {
    // Email action
    template?: string;
    to?: string[];
    cc?: string[];
    subject?: string;
    body?: string;
    
    // WhatsApp action
    phoneNumber?: string;
    messageTemplate?: string;
    
    // Database actions
    table?: string;
    data?: Record<string, any>;
    
    // API call
    url?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: any;
    
    // AI action
    aiAgent?: 'FormMaster' | 'EmailGenius' | 'WhatsAppButler' | 'CalendarWizard' | 'AnalyticsOracle' | 'LeadScorer';
    prompt?: string;
    context?: Record<string, any>;
  };
}

export interface ConditionNodeConfig {
  conditions: FilterCondition[];
  logicalOperator: 'AND' | 'OR';
  truePath: string; // Node ID for true condition
  falsePath: string; // Node ID for false condition
}

export interface FilterCondition {
  field: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty';
  value: any;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'array';
}

export interface WorkflowEdge {
  id: string;
  source: string; // Source node ID
  target: string; // Target node ID
  sourceHandle?: string; // For nodes with multiple outputs
  targetHandle?: string; // For nodes with multiple inputs
  label?: string;
  style?: EdgeStyle;
}

export interface NodeData {
  label: string;
  description?: string;
  icon: string;
  inputs: NodeInput[];
  outputs: NodeOutput[];
  settings: Record<string, any>;
}

export interface NodeInput {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  defaultValue?: any;
  validation?: ValidationRule[];
}

export interface NodeOutput {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
}

export interface WorkflowVariable {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  value: any;
  description?: string;
  scope: 'global' | 'local';
}

export interface WorkflowMetadata {
  version: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags: string[];
  category: string;
  isTemplate: boolean;
  executionCount: number;
  averageExecutionTime: number;
  successRate: number;
  lastExecution?: WorkflowExecution;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  error?: string;
  steps: ExecutionStep[];
  totalDuration: number;
  triggeredBy: string;
  executionData: Record<string, any>;
}

export interface ExecutionStep {
  nodeId: string;
  nodeName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt: string;
  completedAt?: string;
  duration: number;
  input: any;
  output: any;
  error?: string;
  retryCount: number;
}

// Predefined workflow templates
export const WORKFLOW_TEMPLATES = {
  LEAD_NURTURING: {
    name: 'Lead Nurturing Sequence',
    description: 'Automatic follow-up sequence for new leads',
    category: 'Sales',
    nodes: [
      {
        type: 'trigger',
        config: { triggerType: 'form_submission' }
      },
      {
        type: 'delay',
        config: { duration: '1 hour' }
      },
      {
        type: 'ai_process',
        config: { aiAgent: 'LeadScorer', prompt: 'Score this lead' }
      },
      {
        type: 'condition',
        config: { 
          conditions: [{ field: 'lead_score', operator: '>', value: 70 }],
          truePath: 'high_value_sequence',
          falsePath: 'standard_sequence'
        }
      },
      {
        type: 'whatsapp',
        config: { messageTemplate: 'high_value_lead_template' }
      }
    ]
  },
  
  CUSTOMER_ONBOARDING: {
    name: 'Customer Onboarding Flow',
    description: 'Welcome sequence for new customers',
    category: 'Customer Success',
    nodes: [
      {
        type: 'trigger',
        config: { triggerType: 'database_change', table: 'customers', operation: 'insert' }
      },
      {
        type: 'email',
        config: { template: 'welcome_email' }
      },
      {
        type: 'delay',
        config: { duration: '1 day' }
      },
      {
        type: 'whatsapp',
        config: { messageTemplate: 'onboarding_checklist' }
      },
      {
        type: 'schedule_task',
        config: { taskType: 'follow_up_call', assignee: 'sales_team', dueDate: '+3 days' }
      }
    ]
  },

  APPOINTMENT_BOOKING: {
    name: 'Smart Appointment Booking',
    description: 'AI-powered appointment scheduling with WhatsApp integration',
    category: 'Scheduling',
    nodes: [
      {
        type: 'trigger',
        config: { triggerType: 'whatsapp_message' }
      },
      {
        type: 'ai_process',
        config: { 
          aiAgent: 'CalendarWizard', 
          prompt: 'Analyze message for appointment booking intent' 
        }
      },
      {
        type: 'condition',
        config: {
          conditions: [{ field: 'booking_intent', operator: '>', value: 0.8 }],
          truePath: 'booking_flow',
          falsePath: 'general_response'
        }
      },
      {
        type: 'calendar',
        config: { action: 'find_availability', duration: '30min' }
      },
      {
        type: 'whatsapp',
        config: { messageTemplate: 'availability_options' }
      }
    ]
  }
};

export class EnterpriseWorkflowBuilder {
  
  async createWorkflow(organizationId: string, template?: string): Promise<WorkflowCanvas> {
    const workflow: WorkflowCanvas = {
      id: this.generateWorkflowId(),
      organizationId,
      name: template ? WORKFLOW_TEMPLATES[template as keyof typeof WORKFLOW_TEMPLATES].name : 'New Workflow',
      description: '',
      isActive: false,
      nodes: template ? this.generateNodesFromTemplate(template) : [],
      edges: [],
      variables: [],
      metadata: {
        version: '1.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'current_user',
        tags: [],
        category: 'Custom',
        isTemplate: false,
        executionCount: 0,
        averageExecutionTime: 0,
        successRate: 0
      }
    };
    
    return workflow;
  }

  async executeWorkflow(workflowId: string, triggerData: any): Promise<WorkflowExecution> {
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow.isActive) {
      throw new Error('Workflow is not active');
    }
    
    const execution: WorkflowExecution = {
      id: this.generateExecutionId(),
      workflowId,
      status: 'running',
      startedAt: new Date().toISOString(),
      steps: [],
      totalDuration: 0,
      triggeredBy: 'system',
      executionData: triggerData
    };
    
    try {
      // Execute workflow nodes in order
      await this.executeWorkflowNodes(workflow, execution);
      
      execution.status = 'completed';
      execution.completedAt = new Date().toISOString();
      execution.totalDuration = Date.now() - new Date(execution.startedAt).getTime();
      
    } catch (error) {
      execution.status = 'failed';
      execution.error = (error as Error).message;
      execution.completedAt = new Date().toISOString();
    }
    
    // Save execution log
    await this.saveExecutionLog(execution);
    
    return execution;
  }

  private async executeWorkflowNodes(workflow: WorkflowCanvas, execution: WorkflowExecution): Promise<void> {
    // Find trigger node
    const triggerNode = workflow.nodes.find(node => node.type === 'trigger');
    if (!triggerNode) {
      throw new Error('No trigger node found');
    }
    
    // Execute nodes following the edges
    await this.executeNodeAndFollowers(triggerNode, workflow, execution, execution.executionData);
  }

  private async executeNodeAndFollowers(
    node: WorkflowNode, 
    workflow: WorkflowCanvas, 
    execution: WorkflowExecution,
    data: any
  ): Promise<any> {
    
    const step: ExecutionStep = {
      nodeId: node.id,
      nodeName: node.data.label,
      status: 'running',
      startedAt: new Date().toISOString(),
      duration: 0,
      input: data,
      output: null,
      retryCount: 0
    };
    
    execution.steps.push(step);
    
    try {
      // Execute the node based on its type
      const result = await this.executeNode(node, data);
      
      step.status = 'completed';
      step.completedAt = new Date().toISOString();
      step.duration = Date.now() - new Date(step.startedAt).getTime();
      step.output = result;
      
      // Find and execute connected nodes
      const outgoingEdges = workflow.edges.filter(edge => edge.source === node.id);
      
      for (const edge of outgoingEdges) {
        const nextNode = workflow.nodes.find(n => n.id === edge.target);
        if (nextNode) {
          await this.executeNodeAndFollowers(nextNode, workflow, execution, result);
        }
      }
      
      return result;
      
    } catch (error) {
      step.status = 'failed';
      step.error = (error as Error).message;
      step.completedAt = new Date().toISOString();
      throw error;
    }
  }

  private async executeNode(node: WorkflowNode, data: any): Promise<any> {
    console.log(`Executing node: ${node.type}`, { nodeId: node.id, data });
    
    switch (node.type) {
      case 'trigger':
        return data; // Trigger just passes data through
        
      case 'delay':
        const delayMs = this.parseDuration(node.config.duration as string);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return data;
        
      case 'condition':
        const conditionResult = this.evaluateConditions(
          (node.config as ConditionNodeConfig).conditions,
          data
        );
        return { ...data, conditionResult };
        
      case 'ai_process':
        return await this.executeAINode(node, data);
        
      case 'email':
        return await this.executeEmailNode(node, data);
        
      case 'whatsapp':
        return await this.executeWhatsAppNode(node, data);
        
      case 'api_call':
        return await this.executeAPICallNode(node, data);
        
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  private async executeAINode(node: WorkflowNode, data: any): Promise<any> {
    // Execute AI agent processing
    const config = node.config as ActionNodeConfig;
    
    // This would call the appropriate AI agent
    // For now, return mock result
    return {
      ...data,
      aiResult: {
        agent: config.config.aiAgent,
        output: 'AI processing completed',
        confidence: 0.85
      }
    };
  }

  private async executeEmailNode(node: WorkflowNode, data: any): Promise<any> {
    // Send email using the email service
    const config = node.config as ActionNodeConfig;
    
    console.log('Sending email:', {
      to: config.config.to,
      subject: config.config.subject,
      template: config.config.template
    });
    
    return { ...data, emailSent: true };
  }

  private async executeWhatsAppNode(node: WorkflowNode, data: any): Promise<any> {
    // Send WhatsApp message
    const config = node.config as ActionNodeConfig;
    
    console.log('Sending WhatsApp:', {
      phone: config.config.phoneNumber,
      template: config.config.messageTemplate
    });
    
    return { ...data, whatsappSent: true };
  }

  private async executeAPICallNode(node: WorkflowNode, data: any): Promise<any> {
    // Make API call
    const config = node.config as ActionNodeConfig;
    
    console.log('Making API call:', {
      url: config.config.url,
      method: config.config.method
    });
    
    return { ...data, apiResponse: { status: 'success' } };
  }

  private evaluateConditions(conditions: FilterCondition[], data: any): boolean {
    return conditions.every(condition => {
      const fieldValue = this.getNestedValue(data, condition.field);
      return this.evaluateCondition(fieldValue, condition.operator, condition.value);
    });
  }

  private evaluateCondition(fieldValue: any, operator: string, expectedValue: any): boolean {
    switch (operator) {
      case '=': return fieldValue === expectedValue;
      case '!=': return fieldValue !== expectedValue;
      case '>': return fieldValue > expectedValue;
      case '<': return fieldValue < expectedValue;
      case '>=': return fieldValue >= expectedValue;
      case '<=': return fieldValue <= expectedValue;
      case 'contains': return String(fieldValue).includes(String(expectedValue));
      case 'starts_with': return String(fieldValue).startsWith(String(expectedValue));
      case 'ends_with': return String(fieldValue).endsWith(String(expectedValue));
      case 'is_empty': return !fieldValue || fieldValue === '';
      case 'is_not_empty': return fieldValue && fieldValue !== '';
      default: return false;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/(\d+)\s*(second|minute|hour|day)s?/i);
    if (!match) return 0;
    
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    switch (unit) {
      case 'second': return value * 1000;
      case 'minute': return value * 60 * 1000;
      case 'hour': return value * 60 * 60 * 1000;
      case 'day': return value * 24 * 60 * 60 * 1000;
      default: return 0;
    }
  }

  private generateWorkflowId(): string {
    return `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateNodesFromTemplate(template: string): WorkflowNode[] {
    // Generate nodes from predefined template
    // This would create the actual node structure
    return [];
  }

  private async getWorkflow(workflowId: string): Promise<WorkflowCanvas> {
    // Get workflow from database
    // For now, return mock workflow
    return {} as WorkflowCanvas;
  }

  private async saveExecutionLog(execution: WorkflowExecution): Promise<void> {
    // Save execution log to database
    console.log('Saving execution log:', execution.id);
  }
}

export const enterpriseWorkflowBuilder = new EnterpriseWorkflowBuilder();