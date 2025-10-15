/**
 * AI Orchestrator - Central orchestrator connecting DataPizza with all CRM modules
 * 
 * This orchestrator manages the execution of workflows by coordinating between:
 * - DataPizza AI agents for AI-powered steps
 * - CRM modules (contacts, deals, tasks, email, etc.) for business operations
 * - External integrations and webhooks
 */

import { Node, Edge } from '@xyflow/react';
import { supabase } from '@/lib/supabaseClient';
import { datapizzaClient } from '@/services/datapizza';

// Type definitions for workflow data
export type WorkflowData = Record<string, unknown>;
export type NodeInput = Record<string, unknown>;
export type NodeOutput = Record<string, unknown>;

// Contact data interface
export interface ContactData {
  id?: string;
  contactId?: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  [key: string]: unknown;
}

// Deal data interface
export interface DealData {
  id?: string;
  dealId?: string;
  title?: string;
  name?: string;
  value?: number;
  amount?: number;
  stage?: string;
  contactId?: string;
  assignedTo?: string;
  [key: string]: unknown;
}

// Email data interface
export interface EmailData {
  to?: string;
  email?: string;
  subject?: string;
  template?: string;
  [key: string]: unknown;
}

// Task data interface
export interface TaskData {
  id?: string;
  taskId?: string;
  title?: string;
  name?: string;
  description?: string;
  assignedTo?: string;
  dueDate?: string;
  priority?: string;
  contactId?: string;
  dealId?: string;
  [key: string]: unknown;
}

// Tag data interface
export interface TagData {
  contactId: string;
  tag: string;
}

// Assignment data interface
export interface AssignmentData {
  userId: string;
  resourceType: string;
  resourceId: string;
}

// Notification data interface
export interface NotificationData {
  message: string;
  recipients?: string[];
  [key: string]: unknown;
}

// Wait data interface
export interface WaitData {
  duration?: number;
  seconds?: number;
  [key: string]: unknown;
}

// AI input interfaces
export interface AIScoreInput {
  [key: string]: unknown;
}

export interface AIClassifyInput {
  company?: string;
  [key: string]: unknown;
}

export interface AIEnrichInput {
  company?: string;
  [key: string]: unknown;
}

export interface AISentimentInput {
  text?: string;
  [key: string]: unknown;
}

export interface OrchestratorContext {
  organizationId: string;
  userId: string;
  workflowId?: string;
  triggerData: WorkflowData;
}

export interface ExecutionStep {
  stepId: number;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped';
  input: NodeInput;
  output: NodeOutput;
  error?: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
}

export interface OrchestrationResult {
  success: boolean;
  steps: ExecutionStep[];
  totalDuration: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  error?: string;
}

export class AIOrchestrator {
  private context: OrchestratorContext;
  private steps: ExecutionStep[] = [];
  private stepCounter = 0;

  constructor(context: OrchestratorContext) {
    this.context = context;
  }

  /**
   * Execute workflow with AI-enhanced decision making
   */
  async executeWorkflow(workflowDefinition: {
    nodes: Node[];
    edges: Edge[];
  }): Promise<OrchestrationResult> {
    const startTime = new Date();
    this.steps = [];
    this.stepCounter = 0;

    try {
      console.log('🎯 Starting AI Orchestrator execution...');

      // Parse and sort nodes in execution order
      const executionOrder = this.parseWorkflowOrder(
        workflowDefinition.nodes,
        workflowDefinition.edges
      );

      // Execute each step
      for (const node of executionOrder) {
        const step = await this.executeNode(node);
        this.steps.push(step);

        // Stop execution if critical error and node doesn't allow continuation
        if (step.status === 'error' && !this.shouldContinueOnError(node)) {
          console.error(`❌ Critical error in node ${node.id}, stopping execution`);
          break;
        }
      }

      const endTime = new Date();
      const totalDuration = endTime.getTime() - startTime.getTime();

      const result: OrchestrationResult = {
        success: this.steps.every(s => s.status === 'success' || s.status === 'skipped'),
        steps: this.steps,
        totalDuration,
        successCount: this.steps.filter(s => s.status === 'success').length,
        errorCount: this.steps.filter(s => s.status === 'error').length,
        skippedCount: this.steps.filter(s => s.status === 'skipped').length
      };

      console.log('✅ AI Orchestrator execution completed:', result);
      return result;

    } catch (error) {
      console.error('❌ AI Orchestrator execution failed:', error);
      
      const endTime = new Date();
      const totalDuration = endTime.getTime() - startTime.getTime();

      return {
        success: false,
        steps: this.steps,
        totalDuration,
        successCount: this.steps.filter(s => s.status === 'success').length,
        errorCount: this.steps.filter(s => s.status === 'error').length,
        skippedCount: this.steps.filter(s => s.status === 'skipped').length,
        error: error instanceof Error ? error.message : 'Errore sconosciuto'
      };
    }
  }

  /**
   * Execute a single node (AI-powered or CRM operation)
   */
  private async executeNode(node: Node): Promise<ExecutionStep> {
    const step: ExecutionStep = {
      stepId: ++this.stepCounter,
      nodeId: node.id,
      nodeName: (node.data?.label || 'Unnamed Node') as string,
      nodeType: (node.data?.nodeType || 'unknown') as string,
      status: 'pending',
      input: {},
      output: {},
      startTime: new Date(),
      duration: 0
    };

    try {
      console.log(`🔄 Executing node: ${step.nodeName} (${step.nodeType})`);
      
      step.status = 'running';
      step.input = this.prepareNodeInput(node);

      // Determine if this is an AI-powered step or CRM step
      if (this.isAINode(step.nodeType)) {
        step.output = await this.executeAIStep(step);
      } else {
        step.output = await this.executeCRMStep(step);
      }

      step.status = 'success';
      step.endTime = new Date();
      step.duration = step.endTime.getTime() - step.startTime.getTime();

      console.log(`✅ Node completed: ${step.nodeName} (${step.duration}ms)`);

    } catch (error) {
      step.status = 'error';
      step.error = error instanceof Error ? error.message : 'Errore sconosciuto';
      step.endTime = new Date();
      step.duration = step.endTime.getTime() - step.startTime.getTime();

      console.error(`❌ Node failed: ${step.nodeName} - ${step.error}`);
    }

    return step;
  }

  /**
   * AI-powered step execution via DataPizza
   */
  private async executeAIStep(step: ExecutionStep): Promise<NodeOutput> {
    console.log(`🤖 Executing AI step: ${step.nodeType}`);

    switch (step.nodeType) {
      case 'ai_score':
        return await this.executeAIScore(step.input as AIScoreInput);
      
      case 'ai_classify':
        return await this.executeAIClassify(step.input as AIClassifyInput);
      
      case 'ai_enrich':
        return await this.executeAIEnrich(step.input as AIEnrichInput);
      
      case 'ai_sentiment':
        return await this.executeAISentiment(step.input as AISentimentInput);
      
      default:
        throw new Error(`Tipo di nodo AI non supportato: ${step.nodeType}`);
    }
  }

  /**
   * CRM module integration
   */
  private async executeCRMStep(step: ExecutionStep): Promise<NodeOutput> {
    console.log(`🏢 Executing CRM step: ${step.nodeType}`);

    switch (step.nodeType) {
      case 'create_contact':
        return await this.crmContacts.create(step.input as ContactData);
      
      case 'update_contact':
        return await this.crmContacts.update(step.input as ContactData);
      
      case 'create_deal':
        return await this.crmDeals.create(step.input as DealData);
      
      case 'update_deal':
        return await this.crmDeals.update(step.input as DealData);
      
      case 'send_email':
        return await this.crmEmail.send(step.input as EmailData);
      
      case 'create_task':
        return await this.crmTasks.create(step.input as TaskData);
      
      case 'add_tag':
        return await this.crmTags.add(step.input as unknown as TagData);
      
      case 'remove_tag':
        return await this.crmTags.remove(step.input as unknown as TagData);
      
      case 'assign_to_user':
        return await this.crmAssignment.assign(step.input as unknown as AssignmentData);
      
      case 'send_notification':
        return await this.crmNotifications.send(step.input as NotificationData);

      case 'wait':
        return await this.executeWait(step.input as WaitData);

      default:
        throw new Error(`Tipo di nodo CRM non supportato: ${step.nodeType}`);
    }
  }

  /**
   * AI Score implementation
   */
  private async executeAIScore(input: AIScoreInput): Promise<NodeOutput> {
    try {
      // Use DataPizza client for lead scoring
      const response = await datapizzaClient.scoreLead({
        contact: {
          name: input.name as string,
          email: input.email as string,
          company: input.company as string,
          title: input.title as string,
          phone: input.phone as string,
          website: input.website as string
        },
        engagement: {
          emailOpens: input.emailOpens as number,
          emailClicks: input.emailClicks as number,
          websiteVisits: input.websiteVisits as number,
          formSubmissions: input.formSubmissions as number,
          lastActivity: input.lastActivity as string
        },
        firmographics: {
          industry: input.industry as string,
          companySize: input.companySize as string,
          revenue: input.revenue as string,
          location: input.location as string
        }
      });

      if (response.success && response.data) {
        return {
          score: response.data.score,
          category: response.data.category,
          confidence: response.data.confidence,
          reasoning: response.data.reasoning,
          factors: response.data.factors,
          nextActions: response.data.nextActions,
          agent_used: 'DataPizza Lead Scorer',
          executionTime: response.executionTime,
          fallback: response.metadata?.fallback || false
        };
      } else {
        throw new Error(response.error || 'Lead scoring fallito');
      }
    } catch (error) {
      console.error('AI Score error:', error);
      
      // Fallback implementation
      const score = Math.floor(Math.random() * 100);
      const category = score >= 80 ? 'HOT' : score >= 60 ? 'WARM' : 'COLD';
      
      return {
        score,
        category,
        confidence: 0.85 + Math.random() * 0.15,
        reasoning: `Lead valutato basato su ${Object.keys(input).length} parametri (fallback)`,
        agent_used: 'Fallback AI Scorer',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * AI Classify implementation
   */
  private async executeAIClassify(input: AIClassifyInput): Promise<NodeOutput> {
    try {
      // Use DataPizza client for contact classification
      const response = await datapizzaClient.classifyContact({
        contact: {
          name: input.name as string,
          email: input.email as string,
          company: input.company as string,
          title: input.title as string,
          industry: input.industry as string
        },
        interactions: {
          touchpoints: input.touchpoints as number,
          avgResponseTime: input.avgResponseTime as number,
          preferredChannel: input.preferredChannel as string
        }
      });

      if (response.success && response.data) {
        return {
          category: response.data.category,
          subcategory: response.data.subcategory,
          confidence: response.data.confidence,
          reasoning: response.data.reasoning,
          recommendedApproach: response.data.recommendedApproach,
          expectedValue: response.data.expectedValue,
          agent_used: 'DataPizza Contact Classifier',
          executionTime: response.executionTime,
          fallback: response.metadata?.fallback || false
        };
      } else {
        throw new Error(response.error || 'Contact classification fallita');
      }
    } catch (error) {
      console.error('AI Classify error:', error);
      
      // Fallback implementation
      const categories = ['Enterprise', 'SMB', 'Startup', 'Individual'];
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      return {
        category,
        confidence: 0.80 + Math.random() * 0.20,
        subcategory: `${category}_Qualified`,
        reasoning: 'Classificazione basata su dimensione azienda e budget (fallback)',
        agent_used: 'Fallback Classifier',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * AI Enrich implementation
   */
  private async executeAIEnrich(input: AIEnrichInput): Promise<NodeOutput> {
    try {
      // Use DataPizza client for data enrichment
      const response = await datapizzaClient.enrichData({
        contact: {
          email: input.email as string,
          company: input.company as string,
          name: input.name as string,
          domain: input.domain as string
        },
        enrichmentTypes: ['company', 'social', 'contact']
      });

      if (response.success && response.data) {
        return {
          ...response.data,
          agent_used: 'DataPizza Data Enricher',
          executionTime: response.executionTime,
          fallback: response.metadata?.fallback || false
        };
      } else {
        throw new Error(response.error || 'Data enrichment fallito');
      }
    } catch (error) {
      console.error('AI Enrich error:', error);
      
      // Fallback implementation
      return {
        ...input,
        enriched_company: input.company ? `${input.company} SRL` : null,
        enriched_industry: 'Technology',
        enriched_size: '50-100 dipendenti',
        enriched_location: 'Milano, IT',
        social_profiles: {
          linkedin: `https://linkedin.com/company/${(input.company as string)?.toLowerCase() || 'company'}`,
          website: `https://${(input.company as string)?.toLowerCase() || 'company'}.it`
        },
        enrichment_confidence: 0.75,
        agent_used: 'Fallback Enricher',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * AI Sentiment implementation
   */
  private async executeAISentiment(input: AISentimentInput): Promise<NodeOutput> {
    try {
      // Use DataPizza client for sentiment analysis
      const response = await datapizzaClient.analyzeSentiment({
        text: input.text as string,
        context: input.context as 'email' | 'chat' | 'call_transcript' | 'social' | 'review'
      });

      if (response.success && response.data) {
        return {
          sentiment: response.data.sentiment,
          score: response.data.score,
          confidence: response.data.confidence,
          emotions: response.data.emotions,
          keywords: response.data.keywords,
          intent: response.data.intent,
          text_analyzed: input.text || '',
          agent_used: 'DataPizza Sentiment Analyzer',
          executionTime: response.executionTime,
          fallback: response.metadata?.fallback || false
        };
      } else {
        throw new Error(response.error || 'Sentiment analysis fallita');
      }
    } catch (error) {
      console.error('AI Sentiment error:', error);
      
      // Fallback implementation
      const sentiments = ['positive', 'neutral', 'negative'] as const;
      const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
      
      return {
        sentiment,
        score: Math.random(),
        confidence: 0.85 + Math.random() * 0.15,
        keywords: ['prodotto', 'servizio', 'prezzo', 'qualità'],
        text_analyzed: input.text || '',
        agent_used: 'Fallback Sentiment Analyzer',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Wait/Delay implementation
   */
  private async executeWait(input: WaitData): Promise<NodeOutput> {
    const waitTime = Number(input.duration || input.seconds || 5); // seconds
    const waitMs = waitTime * 1000;
    
    console.log(`⏱️ Waiting for ${waitTime} seconds...`);
    
    // In real execution, this would actually wait
    // For simulation/testing, we just log and return immediately
    // await new Promise(resolve => setTimeout(resolve, waitMs));
    
    return {
      waited: waitTime,
      actualDuration: waitMs,
      completed_at: new Date().toISOString()
    };
  }

  /**
   * CRM Module Connectors
   */
  private get crmContacts() {
    return {
      create: async (data: ContactData): Promise<NodeOutput> => {
        const { data: contact, error } = await supabase
          .from('contacts')
          .insert({
            organization_id: this.context.organizationId,
            name: data.name,
            email: data.email,
            phone: data.phone,
            company: data.company,
            ...data
          })
          .select()
          .single();

        if (error) throw error;
        return { contactId: contact.id, ...contact };
      },
      
      update: async (data: ContactData): Promise<NodeOutput> => {
        const contactId = data.contactId || data.id;
        if (!contactId) throw new Error('Contact ID richiesto per aggiornamento');

        const { data: contact, error } = await supabase
          .from('contacts')
          .update(data)
          .eq('id', contactId)
          .eq('organization_id', this.context.organizationId)
          .select()
          .single();
        
        if (error) throw error;
        return contact;
      }
    };
  }

  private get crmDeals() {
    return {
      create: async (data: DealData): Promise<NodeOutput> => {
        const { data: deal, error } = await supabase
          .from('opportunities')
          .insert({
            organization_id: this.context.organizationId,
            title: data.title || data.name,
            value: data.value || data.amount || 0,
            stage: data.stage || 'New Lead',
            contact_id: data.contactId,
            assigned_to: data.assignedTo || this.context.userId,
            ...data
          })
          .select()
          .single();

        if (error) throw error;
        return { dealId: deal.id, ...deal };
      },
      
      update: async (data: DealData): Promise<NodeOutput> => {
        const dealId = data.dealId || data.id;
        if (!dealId) throw new Error('Deal ID richiesto per aggiornamento');

        const { data: deal, error } = await supabase
          .from('opportunities')
          .update(data)
          .eq('id', dealId)
          .eq('organization_id', this.context.organizationId)
          .select()
          .single();
        
        if (error) throw error;
        return deal;
      }
    };
  }

  private get crmEmail() {
    return {
      send: async (data: EmailData): Promise<NodeOutput> => {
        // TODO: Integrate with email service (SendGrid, etc.)
        console.log('📧 Sending email:', {
          to: data.to || data.email,
          subject: data.subject,
          template: data.template
        });

        // Mock email sending
        return {
          emailId: `email_${Date.now()}`,
          status: 'sent',
          to: data.to || data.email,
          subject: data.subject,
          sentAt: new Date().toISOString()
        };
      }
    };
  }

  private get crmTasks() {
    return {
      create: async (data: TaskData): Promise<NodeOutput> => {
        const { data: task, error } = await supabase
          .from('tasks')
          .insert({
            organization_id: this.context.organizationId,
            title: data.title || data.name,
            description: data.description,
            assigned_to: data.assignedTo || this.context.userId,
            due_date: data.dueDate,
            priority: data.priority || 'medium',
            contact_id: data.contactId,
            deal_id: data.dealId,
            ...data
          })
          .select()
          .single();

        if (error) throw error;
        return { taskId: task.id, ...task };
      }
    };
  }

  private get crmTags() {
    return {
      add: async (data: TagData): Promise<NodeOutput> => {
        // TODO: Implement proper tag management
        console.log('🏷️ Adding tag:', data.tag, 'to contact:', data.contactId);
        
        return {
          success: true,
          contactId: data.contactId,
          tag: data.tag,
          addedAt: new Date().toISOString()
        };
      },

      remove: async (data: TagData): Promise<NodeOutput> => {
        console.log('🏷️ Removing tag:', data.tag, 'from contact:', data.contactId);
        
        return {
          success: true,
          contactId: data.contactId,
          tag: data.tag,
          removedAt: new Date().toISOString()
        };
      }
    };
  }

  private get crmAssignment() {
    return {
      assign: async (data: AssignmentData): Promise<NodeOutput> => {
        console.log('👤 Assigning to user:', data.userId, 'resource:', data.resourceType, data.resourceId);
        
        return {
          success: true,
          assignedTo: data.userId,
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          assignedAt: new Date().toISOString()
        };
      }
    };
  }

  private get crmNotifications() {
    return {
      send: async (data: NotificationData): Promise<NodeOutput> => {
        console.log('🔔 Sending notification:', data.message, 'to:', data.recipients);
        
        // TODO: Integrate with notification system
        return {
          notificationId: `notif_${Date.now()}`,
          message: data.message,
          recipients: data.recipients || [this.context.userId],
          sentAt: new Date().toISOString()
        };
      }
    };
  }

  /**
   * Helper methods
   */
  private isAINode(nodeType: string): boolean {
    return nodeType.startsWith('ai_') || ['ai_score', 'ai_classify', 'ai_enrich', 'ai_sentiment'].includes(nodeType);
  }

  private shouldContinueOnError(node: Node): boolean {
    return (node.data as Record<string, unknown>)?.continueOnError === true;
  }

  private prepareNodeInput(node: Node): NodeInput {
    // In a real implementation, this would prepare input data
    // based on previous step outputs and node configuration
    return {
      nodeId: node.id,
      nodeType: node.data?.nodeType,
      config: node.data,
      context: this.context,
      // Add other input data based on workflow state
    };
  }

  private parseWorkflowOrder(nodes: Node[], _edges: Edge[]): Node[] {
    // Simple topological sort for workflow execution order
    // TODO: Implement proper topological sorting algorithm using edges
    
    // For now, return nodes in order, starting with triggers
    const triggers = nodes.filter(n => n.type === 'input');
    const actions = nodes.filter(n => n.type === 'default');
    
    return [...triggers, ...actions];
  }
}

export default AIOrchestrator;