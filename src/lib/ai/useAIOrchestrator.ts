// AI Orchestrator React Hook - Guardian AI CRM
// Custom hook per utilizzare l'AI Orchestrator nei componenti React

import { useState, useCallback } from 'react';
import { aiOrchestrator, AIAgentRequest, AIAgentResponse, AI_AGENTS } from './aiOrchestrator';
import toast from 'react-hot-toast';

export interface UseAIOrchestrator {
  // State
  isProcessing: boolean;
  lastResponse: AIAgentResponse | null;
  availableAgents: typeof AI_AGENTS;
  
  // Actions
  processRequest: (request: AIAgentRequest) => Promise<AIAgentResponse>;
  getAgentsByCategory: (category: string) => typeof AI_AGENTS;
  getAgentsByTier: (tier: string) => typeof AI_AGENTS;
  resetState: () => void;
}

export function useAIOrchestrator(): UseAIOrchestrator {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<AIAgentResponse | null>(null);
  
  const processRequest = useCallback(async (request: AIAgentRequest): Promise<AIAgentResponse> => {
    setIsProcessing(true);
    
    try {
      // Show processing toast
      const loadingToast = toast.loading(`🤖 Processing with ${request.agentId}...`);
      
      const response = await aiOrchestrator.processRequest(request);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      if (response.success) {
        toast.success(`✅ ${request.agentId} completed successfully!\nProcessing time: ${response.processingTime}ms | Credits used: ${response.creditsUsed}`);
      } else {
        toast.error(`❌ ${request.agentId} failed: ${response.error || 'Unknown error occurred'}`);
      }
      
      setLastResponse(response);
      return response;
      
    } catch (error) {
      const errorResponse: AIAgentResponse = {
        success: false,
        data: null,
        agentUsed: request.agentId,
        creditsUsed: 0,
        processingTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      toast.error('🚨 AI Agent Error: Failed to process request');
      
      setLastResponse(errorResponse);
      return errorResponse;
      
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  const getAgentsByCategory = useCallback((category: string) => {
    return AI_AGENTS.filter(agent => agent.category === category);
  }, []);
  
  const getAgentsByTier = useCallback((tier: string) => {
    return aiOrchestrator.getAvailableAgents(tier);
  }, []);
  
  const resetState = useCallback(() => {
    setIsProcessing(false);
    setLastResponse(null);
  }, []);
  
  return {
    isProcessing,
    lastResponse,
    availableAgents: AI_AGENTS,
    processRequest,
    getAgentsByCategory,
    getAgentsByTier,
    resetState
  };
}

// Specialized hooks for common use cases

export function useFormMasterAI() {
  const orchestrator = useAIOrchestrator();
  
  const generateForm = useCallback(async (prompt: string, context?: Record<string, unknown>) => {
    return orchestrator.processRequest({
      agentId: 'form_master',
      organizationId: '', // Will be populated from context
      userId: '', // Will be populated from context
      prompt,
      context,
      metadata: {
        source: 'forms',
        actionType: 'generate_form'
      }
    });
  }, [orchestrator]);
  
  return {
    ...orchestrator,
    generateForm
  };
}

export function useEmailGeniusAI() {
  const orchestrator = useAIOrchestrator();
  
  const generateEmailCampaign = useCallback(async (prompt: string, context?: Record<string, unknown>) => {
    return orchestrator.processRequest({
      agentId: 'email_genius',
      organizationId: '',
      userId: '',
      prompt,
      context,
      metadata: {
        source: 'contacts',
        actionType: 'generate_email'
      }
    });
  }, [orchestrator]);
  
  return {
    ...orchestrator,
    generateEmailCampaign
  };
}

export function useWhatsAppButlerAI() {
  const orchestrator = useAIOrchestrator();
  
  const generateWhatsAppTemplate = useCallback(async (prompt: string, context?: Record<string, unknown>) => {
    return orchestrator.processRequest({
      agentId: 'whatsapp_butler',
      organizationId: '',
      userId: '',
      prompt,
      context,
      metadata: {
        source: 'contacts',
        actionType: 'generate_whatsapp'
      }
    });
  }, [orchestrator]);
  
  return {
    ...orchestrator,
    generateWhatsAppTemplate
  };
}

export function useLeadScorerAI() {
  const orchestrator = useAIOrchestrator();
  
  const scoreLeads = useCallback(async (leadsData: Record<string, unknown>[]) => {
    return orchestrator.processRequest({
      agentId: 'lead_scorer',
      organizationId: '',
      userId: '',
      prompt: 'Score these leads based on their profile data and behavior',
      context: { leads: leadsData },
      metadata: {
        source: 'opportunities',
        actionType: 'score_leads'
      }
    });
  }, [orchestrator]);
  
  return {
    ...orchestrator,
    scoreLeads
  };
}

export function useAnalyticsOracleAI() {
  const orchestrator = useAIOrchestrator();
  
  const generateInsights = useCallback(async (dataType: string, context?: Record<string, unknown>) => {
    return orchestrator.processRequest({
      agentId: 'analytics_oracle',
      organizationId: '',
      userId: '',
      prompt: `Generate predictive insights for ${dataType}`,
      context,
      metadata: {
        source: 'dashboard',
        actionType: 'generate_insights'
      }
    });
  }, [orchestrator]);
  
  return {
    ...orchestrator,
    generateInsights
  };
}

export function useCalendarWizardAI() {
  const orchestrator = useAIOrchestrator();
  
  const optimizeScheduling = useCallback(async (scheduleData: Record<string, unknown>) => {
    return orchestrator.processRequest({
      agentId: 'calendar_wizard',
      organizationId: '',
      userId: '',
      prompt: 'Optimize scheduling and availability based on patterns',
      context: { schedule: scheduleData },
      metadata: {
        source: 'calendar',
        actionType: 'optimize_schedule'
      }
    });
  }, [orchestrator]);
  
  return {
    ...orchestrator,
    optimizeScheduling
  };
}