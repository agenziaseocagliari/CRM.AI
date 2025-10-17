// AI Agents Orchestrator - Guardian AI CRM Enterprise Architecture
// This file defines the AI Agent system that transforms Guardian AI into an enterprise platform

import { invokeSupabaseFunction } from '../api';
import { getEffectiveUserTier, isDevelopmentEnterpriseUser } from '../enterpriseOverride';
import type { Contact } from '../../types';

export interface AIAgent {
  id: string;
  name: string;
  description: string;
  category: 'generation' | 'analysis' | 'automation' | 'communication' | 'scheduling';
  capabilities: string[];
  pricingTier: 'freelancer' | 'startup' | 'business' | 'enterprise';
  quotaLimits: {
    daily: number;
    monthly: number;
  };
  icon: string;
  status: 'active' | 'coming_soon' | 'beta';
}

export interface AIAgentRequest {
  agentId: string;
  organizationId: string;
  userId: string;
  prompt: string;
  context?: Record<string, unknown>;
  metadata?: {
    source: 'dashboard' | 'opportunities' | 'contacts' | 'forms' | 'automations' | 'calendar';
    actionType: string;
  };
}

export interface AIAgentResponse {
  success: boolean;
  data: unknown;
  agentUsed: string;
  creditsUsed: number;
  processingTime: number;
  suggestions?: string[];
  error?: string;
}

interface FormGenerationResponse {
  fields?: Array<{
    name: string;
    type: string;
    label: string;
    required?: boolean;
    options?: string[];
  }>;
  conditionalLogic?: Array<{
    condition: string;
    action: string;
  }>;
}

interface EmailGenerationResponse {
  subject?: string;
  body?: string;
  cta?: string;
}

interface WhatsAppGenerationResponse {
  message?: string;
}

// LeadScoringResponse moved to utils/leadScoring.ts

interface AnalyticsInsightsResponse {
  predictions?: Array<{
    metric: string;
    current_value: string;
    predicted_value: string;
    timeframe: string;
    confidence: string;
  }>;
  insights?: Array<{
    category: string;
    description: string;
    impact: string;
    data_points: string[];
  }>;
  recommendations?: Array<{
    action: string;
    priority: string;
    expected_impact: string;
    implementation_time: string;
  }>;
  opportunities?: Array<{
    title: string;
    description: string;
    potential_value: string;
    required_actions: string[];
  }>;
  risks?: Array<{
    risk: string;
    probability: string;
    impact: string;
    mitigation: string;
  }>;
}

interface CalendarOptimizationResponse {
  optimized_schedule?: Array<{
    time_slot: string;
    availability: string;
    reason: string;
    booking_type: string;
  }>;
  booking_page_config?: {
    recommended_duration: string;
    buffer_time: string;
    advance_booking: string;
    cancellation_policy: string;
    custom_questions: string[];
  };
  availability_insights?: Array<{
    pattern: string;
    description: string;
    optimization: string;
  }>;
  no_show_prevention?: Array<{
    strategy: string;
    implementation: string;
    expected_reduction: string;
  }>;
  time_blocking_suggestions?: Array<{
    block_type: string;
    recommended_time: string;
    duration: string;
    frequency: string;
  }>;
}

// 🎯 GUARDIAN AI ENTERPRISE AGENTS
export const AI_AGENTS: AIAgent[] = [
  {
    id: 'form_master',
    name: 'FormMaster AI',
    description: 'Genera form intelligenti ottimizzati per conversione con logica condizionale avanzata',
    category: 'generation',
    capabilities: [
      'Multi-step form generation',
      'Conditional logic & branching',
      'A/B testing optimization',
      'GDPR compliance templates',
      'Integration field mapping',
      'Conversion rate optimization'
    ],
    pricingTier: 'startup',
    quotaLimits: { daily: 10, monthly: 100 },
    icon: '📋',
    status: 'active'
  },

  {
    id: 'email_genius',
    name: 'EmailGenius AI',
    description: 'Copywriting email avanzato con personalizzazione dinamica e ottimizzazione delle campagne',
    category: 'communication',
    capabilities: [
      'Personalized email campaigns',
      'Subject line optimization',
      'Behavioral trigger emails',
      'Deliverability optimization',
      'Multi-language templates',
      'Sentiment analysis integration'
    ],
    pricingTier: 'freelancer',
    quotaLimits: { daily: 25, monthly: 500 },
    icon: '📧',
    status: 'active'
  },

  {
    id: 'whatsapp_butler',
    name: 'WhatsAppButler AI',
    description: 'Automazione WhatsApp Business con template dinamici e gestione conversazioni',
    category: 'automation',
    capabilities: [
      'Template message optimization',
      'Conversation flow automation',
      'Broadcast campaign management',
      'Media content generation',
      'Compliance monitoring',
      'Response time optimization'
    ],
    pricingTier: 'startup',
    quotaLimits: { daily: 50, monthly: 1000 },
    icon: '💬',
    status: 'beta'
  },

  {
    id: 'calendar_wizard',
    name: 'CalendarWizard AI',
    description: 'Scheduling intelligente con ottimizzazione automatica e link di prenotazione pubblici',
    category: 'scheduling',
    capabilities: [
      'Smart scheduling optimization',
      'Public booking pages (Calendly-like)',
      'Meeting preparation automation',
      'Availability intelligence',
      'Time zone optimization',
      'Follow-up automation'
    ],
    pricingTier: 'business',
    quotaLimits: { daily: 20, monthly: 300 },
    icon: '🗓️',
    status: 'coming_soon'
  },

  {
    id: 'analytics_oracle',
    name: 'AnalyticsOracle AI',
    description: 'Insights predittivi avanzati con forecasting e raccomandazioni strategiche',
    category: 'analysis',
    capabilities: [
      'Predictive lead scoring',
      'Revenue forecasting',
      'Customer churn prediction',
      'Market trend analysis',
      'Performance optimization',
      'Strategic recommendations'
    ],
    pricingTier: 'business',
    quotaLimits: { daily: 15, monthly: 200 },
    icon: '🔮',
    status: 'coming_soon'
  },

  {
    id: 'lead_scorer',
    name: 'LeadScorer AI',
    description: 'Valutazione lead automatica con machine learning e behavioral analysis',
    category: 'analysis',
    capabilities: [
      'Real-time lead scoring',
      'Behavioral analysis',
      'Purchase intent prediction',
      'Lead qualification automation',
      'Pipeline prioritization',
      'Conversion probability'
    ],
    pricingTier: 'startup',
    quotaLimits: { daily: 100, monthly: 2000 },
    icon: '🎯',
    status: 'active'
  }
];

// 🎛️ AI ORCHESTRATOR SYSTEM
export class AIOrchestrator {
  private agents: Map<string, AIAgent> = new Map();

  constructor() {
    AI_AGENTS.forEach(agent => {
      this.agents.set(agent.id, agent);
    });
  }

  async processRequest(request: AIAgentRequest): Promise<AIAgentResponse> {
    const agent = this.agents.get(request.agentId);

    if (!agent) {
      return {
        success: false,
        data: null,
        agentUsed: 'unknown',
        creditsUsed: 0,
        processingTime: 0,
        error: 'Agent not found'
      };
    }

    // Route to appropriate processing function
    switch (agent.id) {
      case 'form_master':
        return this.processFormMaster(request, agent);
      case 'email_genius':
        return this.processEmailGenius(request, agent);
      case 'whatsapp_butler':
        return this.processWhatsAppButler(request, agent);
      case 'calendar_wizard':
        return this.processCalendarWizard(request, agent);
      case 'analytics_oracle':
        return this.processAnalyticsOracle(request, agent);
      case 'lead_scorer':
        return this.processLeadScorer(request, agent);
      default:
        return {
          success: false,
          data: null,
          agentUsed: agent.id,
          creditsUsed: 0,
          processingTime: 0,
          error: 'Agent processing not implemented'
        };
    }
  }

  private async processFormMaster(request: AIAgentRequest, agent: AIAgent): Promise<AIAgentResponse> {
    // FormMaster AI processing logic - REAL GEMINI INTEGRATION
    const startTime = Date.now();

    try {
      // TEMPORARY FIX: Use direct fetch instead of invokeSupabaseFunction
      // to bypass retry logic and session refresh issues (same fix as Forms.tsx)
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        (import.meta as unknown as { env: Record<string, string> }).env.VITE_SUPABASE_URL,
        (import.meta as unknown as { env: Record<string, string> }).env.VITE_SUPABASE_ANON_KEY
      );

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Sessione non trovata. Ricarica la pagina.');
      }

      const supabaseUrl = (import.meta as unknown as { env: Record<string, string> }).env.VITE_SUPABASE_URL;
      const supabaseAnonKey = (import.meta as unknown as { env: Record<string, string> }).env.VITE_SUPABASE_ANON_KEY;

      console.log('🔍 AI ORCHESTRATOR - FormMaster Request:', {
        prompt: request.prompt,
        organization_id: request.organizationId,
        timestamp: new Date().toISOString()
      });

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-form-fields`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({
          prompt: request.prompt,
          organization_id: request.organizationId,
          context: request.context
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 AI ORCHESTRATOR - FormMaster Error:', {
          status: response.status,
          errorText,
          timestamp: new Date().toISOString()
        });

        let errorMessage = `Server error (${response.status})`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json() as FormGenerationResponse;

      return {
        success: true,
        data: {
          formFields: data?.fields || [],
          conversionOptimizations: [
            'Form ottimizzato per mobile',
            'Validazione real-time implementata',
            'Campi condizionali configurati'
          ],
          conditionalLogic: data?.conditionalLogic || []
        },
        agentUsed: agent.id,
        creditsUsed: 1,
        processingTime: Date.now() - startTime,
        suggestions: [
          'Aggiungi progress bar per UX migliore',
          'Usa campi condizionali per ridurre abbandono form'
        ]
      };
    } catch (error) {
      console.error('FormMaster AI Error:', error);
      return {
        success: false,
        data: null,
        agentUsed: agent.id,
        creditsUsed: 0,
        processingTime: Date.now() - startTime,
        error: `Errore FormMaster: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async processEmailGenius(request: AIAgentRequest, agent: AIAgent): Promise<AIAgentResponse> {
    // EmailGenius AI processing logic - REAL GEMINI INTEGRATION
    const startTime = Date.now();

    try {
      // Call the existing generate-email-content edge function with Gemini
      const data = await invokeSupabaseFunction('generate-email-content', {
        prompt: request.prompt,
        contact: request.context?.contact || {},
        organization_id: request.organizationId
      }) as EmailGenerationResponse;

      return {
        success: true,
        data: {
          emailContent: {
            subject: data?.subject || 'Email generata da AI',
            body: data?.body || 'Contenuto email personalizzato generato da AI',
            cta: data?.cta || 'Contattaci oggi!'
          },
          optimizations: [
            'Subject line ottimizzato per apertura',
            'Personalizzazione basata su dati contatto',
            'Call-to-action posizionato strategicamente'
          ],
          personalizations: [
            'Nome personalizzato nel saluto',
            'Riferimenti al settore del contatto',
            'Timing ottimizzato per invio'
          ]
        },
        agentUsed: agent.id,
        creditsUsed: 1,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('EmailGenius AI Error:', error);
      return {
        success: false,
        data: null,
        agentUsed: agent.id,
        creditsUsed: 0,
        processingTime: Date.now() - startTime,
        error: `Errore EmailGenius: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async processWhatsAppButler(request: AIAgentRequest, agent: AIAgent): Promise<AIAgentResponse> {
    // WhatsAppButler AI processing logic - REAL GEMINI INTEGRATION
    const startTime = Date.now();

    try {
      // Call the existing generate-whatsapp-message edge function with Gemini
      const data = await invokeSupabaseFunction('generate-whatsapp-message', {
        prompt: request.prompt,
        contact: request.context?.contact || {},
        organization_id: request.organizationId
      }) as WhatsAppGenerationResponse;

      return {
        success: true,
        data: {
          messageTemplate: data?.message || 'Messaggio WhatsApp generato da AI',
          automationFlow: [
            'Messaggio di benvenuto personalizzato',
            'Follow-up automatico dopo 24h',
            'Routing automatico per tipo richiesta'
          ],
          complianceChecks: [
            'Verifica opt-in obbligatorio',
            'Rispetto orari di invio',
            'Controllo frequenza messaggi'
          ]
        },
        agentUsed: agent.id,
        creditsUsed: 1,
        processingTime: Date.now() - startTime,
        suggestions: [
          'Personalizza il messaggio con il nome del contatto',
          'Aggiungi call-to-action chiara',
          'Rispetta i limiti di caratteri WhatsApp'
        ]
      };
    } catch (error) {
      console.error('WhatsAppButler AI Error:', error);
      return {
        success: false,
        data: null,
        agentUsed: agent.id,
        creditsUsed: 0,
        processingTime: Date.now() - startTime,
        error: `Errore WhatsAppButler: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async processCalendarWizard(request: AIAgentRequest, agent: AIAgent): Promise<AIAgentResponse> {
    // CalendarWizard AI processing logic - REAL GEMINI INTEGRATION
    const startTime = Date.now();

    try {
      // Call the new generate-calendar-optimization edge function with Gemini
      const data = await invokeSupabaseFunction('generate-calendar-optimization', {
        prompt: request.prompt,
        calendar_data: request.context || {},
        organization_id: request.organizationId
      }) as CalendarOptimizationResponse;

      return {
        success: true,
        data: {
          optimizedSchedule: data?.optimized_schedule || [],
          bookingPageConfig: data?.booking_page_config || {},
          availabilityInsights: data?.availability_insights || [],
          noShowPrevention: data?.no_show_prevention || [],
          timeBlockingSuggestions: data?.time_blocking_suggestions || []
        },
        agentUsed: agent.id,
        creditsUsed: 1,
        processingTime: Date.now() - startTime,
        suggestions: [
          'Implementa le ottimizzazioni di scheduling suggerite',
          'Configura reminder automatici per ridurre no-shows',
          'Utilizza time blocking per aumentare produttività'
        ]
      };
    } catch (error) {
      console.error('CalendarWizard AI Error:', error);
      return {
        success: false,
        data: null,
        agentUsed: agent.id,
        creditsUsed: 0,
        processingTime: Date.now() - startTime,
        error: `Errore CalendarWizard: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async processAnalyticsOracle(request: AIAgentRequest, agent: AIAgent): Promise<AIAgentResponse> {
    // AnalyticsOracle AI processing logic - REAL GEMINI INTEGRATION
    const startTime = Date.now();

    try {
      // Call the new generate-analytics-insights edge function with Gemini
      const data = await invokeSupabaseFunction('generate-analytics-insights', {
        prompt: request.prompt,
        data_context: request.context || {},
        organization_id: request.organizationId
      }) as AnalyticsInsightsResponse;

      return {
        success: true,
        data: {
          predictions: data?.predictions || [],
          insights: data?.insights || [],
          recommendations: data?.recommendations || [],
          opportunities: data?.opportunities || [],
          risks: data?.risks || []
        },
        agentUsed: agent.id,
        creditsUsed: 2,
        processingTime: Date.now() - startTime,
        suggestions: [
          'Monitora le metriche chiave identificate',
          'Implementa le raccomandazioni ad alta priorità',
          'Rivedi l\'analisi mensilmente per trend updates'
        ]
      };
    } catch (error) {
      console.error('AnalyticsOracle AI Error:', error);
      return {
        success: false,
        data: null,
        agentUsed: agent.id,
        creditsUsed: 0,
        processingTime: Date.now() - startTime,
        error: `Errore AnalyticsOracle: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async processLeadScorer(request: AIAgentRequest, agent: AIAgent): Promise<AIAgentResponse> {
    // LeadScorer AI processing logic - ENHANCED WITH DATAPIZZA
    const startTime = Date.now();

    try {
      // Import the enhanced lead scoring service
      const { calculateLeadScore } = await import('../../utils/leadScoring');

      // Use DataPizza AI agent with fallback to existing system  
      const defaultContact: Contact = {
        id: '', // Fixed: Changed from number to string (UUID will be assigned by database)
        organization_id: request.organizationId || '',
        name: '', 
        email: '', 
        company: '', 
        phone: '', 
        created_at: new Date().toISOString(),
        lead_score: null,
        lead_category: null,
        lead_score_reasoning: null
      };
      
      // Type guard to check if context.contact is a valid Contact
      const isContact = (obj: unknown): obj is Contact => {
        return obj !== null && typeof obj === 'object' && 
               'id' in obj && 'organization_id' in obj && 'name' in obj && 'email' in obj;
      };
      
      const contact: Contact = (request.context?.contact && isContact(request.context.contact)) 
        ? request.context.contact 
        : defaultContact;
      const scoringResult = await calculateLeadScore(
        contact,
        {
          useDataPizza: true,
          fallbackToEdgeFunction: true,
          organizationId: request.organizationId,
          prompt: request.prompt || 'Score this lead based on quality and conversion potential'
        }
      );

      // Generate recommendations based on score category
      const recommendations = this.generateScoringRecommendations(scoringResult.category, scoringResult.score);

      return {
        success: true,
        data: {
          leadScore: scoringResult.score,
          category: scoringResult.category.charAt(0).toUpperCase() + scoringResult.category.slice(1),
          reasoning: scoringResult.reasoning,
          confidence: scoringResult.confidence || 0.8,
          breakdown: scoringResult.breakdown,
          agentUsed: scoringResult.agent_used,
          recommendations
        },
        agentUsed: agent.id,
        creditsUsed: 1,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('LeadScorer AI Error:', error);
      return {
        success: false,
        data: null,
        agentUsed: agent.id,
        creditsUsed: 0,
        processingTime: Date.now() - startTime,
        error: `Errore LeadScorer: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private generateScoringRecommendations(category: 'hot' | 'warm' | 'cold', score: number): string[] {
    if (category === 'hot' || score >= 80) {
      return [
        '🔥 Contatto prioritario - Follow-up immediato entro 2 ore',
        '📞 Chiamata telefonica raccomandata come primo contatto',
        '🎯 Personalizza il messaggio basato sui punti di forza identificati',
        '⏰ Programma demo o meeting entro 48 ore'
      ];
    } else if (category === 'warm' || score >= 50) {
      return [
        '📧 Invia email personalizzata entro 24 ore',
        '📚 Condividi contenuti rilevanti per il loro settore',
        '🔄 Programma follow-up in 3-5 giorni',
        '📊 Monitora engagement per upgrade a lead "hot"'
      ];
    } else {
      return [
        '📝 Aggiungi a campagna di nurturing a lungo termine',
        '📱 Considera outreach sui social media',
        '🎯 Raccogli più informazioni prima del contatto diretto',
        '📅 Re-valuta in 2-4 settimane'
      ];
    }
  }

  getAvailableAgents(_pricingTier: string, userEmail?: string): AIAgent[] {
    // 🚀 ENTERPRISE OVERRIDE: Force all agents for enterprise development user
    if (isDevelopmentEnterpriseUser(userEmail)) {
      return AI_AGENTS; // All agents including coming_soon for enterprise test user
    }

    // 🚀 NEW STRATEGY: All agents available from base tier
    // Monetization through credits/quota system instead of tier restrictions
    return AI_AGENTS.filter(agent => agent.status === 'active' || agent.status === 'beta');
  }

  private tierHasAccess(_userTier: string, _agentTier: string): boolean {
    // All tiers now have access to all agents - quota-based monetization
    return true;
  }

  getAgentQuotaLimits(pricingTier: string, agentId: string, userEmail?: string): { daily: number; monthly: number } {
    // 🚀 ENTERPRISE OVERRIDE: Unlimited quotas for enterprise development user
    if (isDevelopmentEnterpriseUser(userEmail)) {
      return { daily: 1000, monthly: 30000 };
    }

    const effectiveTier = getEffectiveUserTier(userEmail, pricingTier);

    const quotaMultipliers = {
      'freelancer': 1,
      'startup': 3,
      'business': 10,
      'enterprise': 50
    };

    const baseQuota = AI_AGENTS.find(a => a.id === agentId)?.quotaLimits || { daily: 10, monthly: 100 };
    const multiplier = quotaMultipliers[effectiveTier as keyof typeof quotaMultipliers] || 1;

    return {
      daily: baseQuota.daily * multiplier,
      monthly: baseQuota.monthly * multiplier
    };
  }
}

// Export singleton instance
export const aiOrchestrator = new AIOrchestrator();