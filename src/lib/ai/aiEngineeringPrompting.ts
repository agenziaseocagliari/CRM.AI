// AI Engineering Prompting Layer - Guardian AI CRM
// Sistema di prompting centralizzato per l'instradamento intelligente delle richieste

interface PromptEngineering {
  // Analisi dell'intento utente
  analyzeIntent(userPrompt: string, context: ModuleContext): PromptAnalysis;
  
  // Routing intelligente dell'agente
  routeToAgent(analysis: PromptAnalysis): AgentRoute;
  
  // Enhancement del prompt per l'agente specifico
  enhancePrompt(originalPrompt: string, agentType: string, context: ModuleContext): string;
  
  // Integration con Knowledge Base
  enrichWithKnowledge(prompt: string, organizationId: string): Promise<EnrichedPrompt>;
}

interface ModuleContext {
  currentModule: string;
  userRole: string;
  organizationId: string;
  recentActions: string[];
  availableData: Record<string, unknown>;
}

interface PromptAnalysis {
  intent: 'create' | 'analyze' | 'optimize' | 'automate' | 'report' | 'help';
  confidence: number;
  entities: string[];
  suggestedAgent: string;
  requiredContext: string[];
  actionType: string;
}

interface AgentRoute {
  agentId: string;
  priority: number;
  fallbackAgents: string[];
  estimatedProcessingTime: number;
}

interface EnrichedPrompt {
  originalPrompt: string;
  enhancedPrompt: string;
  contextData: Record<string, unknown>;
  knowledgeBaseMatches: KnowledgeMatch[];
  suggestions: string[];
}

interface KnowledgeMatch {
  id: string;
  title: string;
  content: string;
  relevanceScore: number;
  category: string;
}

export class AIEngineeringPrompting implements PromptEngineering {
  
  analyzeIntent(userPrompt: string, context: ModuleContext): PromptAnalysis {
    const promptLower = userPrompt.toLowerCase();
    
    // Intent Analysis con NLP patterns
    let intent: PromptAnalysis['intent'] = 'help';
    let confidence = 0.5;
    const entities: string[] = [];
    let suggestedAgent = 'form_master';
    
    // Pattern Analysis
    const createPatterns = ['crea', 'genera', 'costruisci', 'fai', 'sviluppa', 'nuovo'];
    const analyzePatterns = ['analizza', 'studia', 'esamina', 'valuta', 'report'];
    const optimizePatterns = ['ottimizza', 'migliora', 'perfeziona', 'potenzia'];
    const automatePatterns = ['automatizza', 'workflow', 'trigger', 'sequenza'];
    
    if (createPatterns.some(p => promptLower.includes(p))) {
      intent = 'create';
      confidence = 0.8;
    } else if (analyzePatterns.some(p => promptLower.includes(p))) {
      intent = 'analyze';
      confidence = 0.8;
    } else if (optimizePatterns.some(p => promptLower.includes(p))) {
      intent = 'optimize';
      confidence = 0.7;
    } else if (automatePatterns.some(p => promptLower.includes(p))) {
      intent = 'automate';
      confidence = 0.7;
    }
    
    // Entity Extraction
    const formEntities = ['form', 'modulo', 'campo', 'wordpress', 'kadence'];
    const emailEntities = ['email', 'newsletter', 'campagna', 'subject'];
    const whatsappEntities = ['whatsapp', 'messaggio', 'chat', 'template'];
    const leadEntities = ['lead', 'opportunità', 'scoring', 'qualifica'];
    const calendarEntities = ['calendario', 'appuntamento', 'booking', 'meeting'];
    const analyticsEntities = ['analisi', 'dati', 'report', 'insight', 'kpi'];
    
    if (formEntities.some(e => promptLower.includes(e))) {
      entities.push('forms');
      suggestedAgent = 'form_master';
    }
    if (emailEntities.some(e => promptLower.includes(e))) {
      entities.push('email');
      suggestedAgent = 'email_genius';
    }
    if (whatsappEntities.some(e => promptLower.includes(e))) {
      entities.push('whatsapp');
      suggestedAgent = 'whatsapp_butler';
    }
    if (leadEntities.some(e => promptLower.includes(e))) {
      entities.push('leads');
      suggestedAgent = 'lead_scorer';
    }
    if (calendarEntities.some(e => promptLower.includes(e))) {
      entities.push('calendar');
      suggestedAgent = 'calendar_wizard';
    }
    if (analyticsEntities.some(e => promptLower.includes(e))) {
      entities.push('analytics');
      suggestedAgent = 'analytics_oracle';
    }
    
    // Context-based routing se non ci sono entity specifiche
    if (entities.length === 0) {
      const moduleAgentMap: Record<string, string> = {
        'Forms': 'form_master',
        'Contacts': 'analytics_oracle',
        'Opportunities': 'lead_scorer',
        'WhatsApp': 'whatsapp_butler',
        'Email': 'email_genius',
        'Calendar': 'calendar_wizard',
        'Dashboard': 'analytics_oracle'
      };
      suggestedAgent = moduleAgentMap[context.currentModule] || 'form_master';
      entities.push(context.currentModule.toLowerCase());
    }
    
    return {
      intent,
      confidence,
      entities,
      suggestedAgent,
      requiredContext: this.determineRequiredContext(intent, entities),
      actionType: `${intent}_${entities[0] || 'generic'}`
    };
  }
  
  routeToAgent(analysis: PromptAnalysis): AgentRoute {
    const agentPriorities: Record<string, number> = {
      'form_master': analysis.entities.includes('forms') ? 10 : 3,
      'email_genius': analysis.entities.includes('email') ? 10 : 3,
      'whatsapp_butler': analysis.entities.includes('whatsapp') ? 10 : 3,
      'lead_scorer': analysis.entities.includes('leads') ? 10 : 3,
      'calendar_wizard': analysis.entities.includes('calendar') ? 10 : 3,
      'analytics_oracle': analysis.entities.includes('analytics') ? 10 : 5
    };
    
    const priority = agentPriorities[analysis.suggestedAgent] || 1;
    
    const fallbackAgents = Object.entries(agentPriorities)
      .filter(([agent]) => agent !== analysis.suggestedAgent)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([agent]) => agent);
    
    return {
      agentId: analysis.suggestedAgent,
      priority,
      fallbackAgents,
      estimatedProcessingTime: this.estimateProcessingTime(analysis)
    };
  }
  
  enhancePrompt(originalPrompt: string, agentType: string, context: ModuleContext): string {
    const baseContext = `
CONTESTO OPERATIVO:
- Modulo attivo: ${context.currentModule}
- Organizzazione: ${context.organizationId}
- Ruolo utente: ${context.userRole}
- Azioni recenti: ${context.recentActions.join(', ')}

RICHIESTA UTENTE: ${originalPrompt}
    `.trim();
    
    const agentSpecificEnhancements: Record<string, string> = {
      'form_master': `
${baseContext}

ISTRUZIONI SPECIALIZZATE PER FORMMASTER:
- Crea form ottimizzati per conversione
- Considera l'integrazione WordPress/Kadence
- Applica principi UX per massima usabilità
- Includi validazioni appropriate
- Suggerisci ottimizzazioni A/B testing

FORMATO RISPOSTA: JSON con campi, validazioni, e suggerimenti di ottimizzazione.`,

      'email_genius': `
${baseContext}

ISTRUZIONI SPECIALIZZATE PER EMAILGENIUS:
- Crea contenuti email personalizzati e coinvolgenti
- Ottimizza subject line per deliverability
- Considera segmentazione audience
- Applica best practice anti-spam
- Includi CTA efficaci

FORMATO RISPOSTA: Email completa con subject, corpo, personalizzazioni, e metriche previste.`,

      'whatsapp_butler': `
${baseContext}

ISTRUZIONI SPECIALIZZATE PER WHATSAPPBUTLER:
- Genera messaggi conformi alle policy WhatsApp Business
- Mantieni tono conversazionale e professionale
- Includi emojis appropriate per engagement
- Rispetta limiti caratteri e template format
- Considera fuso orario per invio

FORMATO RISPOSTA: Template WhatsApp con messaggi, timing, e compliance check.`,

      'lead_scorer': `
${baseContext}

ISTRUZIONI SPECIALIZZATE PER LEADSCORER:
- Analizza qualità lead con scoring dettagliato
- Identifica pattern di conversione
- Classifica priorità follow-up
- Suggerisci azioni specifiche per nurturing
- Considera stage del funnel di vendita

FORMATO RISPOSTA: Score numerico, categoria, reasoning, e action plan.`,

      'calendar_wizard': `
${baseContext}

ISTRUZIONI SPECIALIZZATE PER CALENDARWIZARD:
- Ottimizza gestione appuntamenti e disponibilità
- Considera fusi orari e preferenze orarie
- Automatizza conferme e reminder
- Integra con sistemi di meeting esterni
- Massimizza efficienza scheduling

FORMATO RISPOSTA: Configurazione calendario con regole, automazioni, e integrazioni.`,

      'analytics_oracle': `
${baseContext}

ISTRUZIONI SPECIALIZZATE PER ANALYTICSORACLE:
- Fornisci analisi dati actionable e insights predittivi
- Identifica trend e pattern significativi
- Crea visualizzazioni comprensibili
- Suggerisci azioni basate sui dati
- Considera KPI business specifici

FORMATO RISPOSTA: Report analitico con metriche, trend, insights, e raccomandazioni strategiche.`
    };
    
    return agentSpecificEnhancements[agentType] || baseContext;
  }
  
  async enrichWithKnowledge(prompt: string, organizationId: string): Promise<EnrichedPrompt> {
    try {
      // Import Enhanced Knowledge Base System
      const { enhancedKnowledgeBaseSystem } = await import('./enhancedKnowledgeBaseSystem');
      
      // Search for relevant knowledge
      const knowledgeMatches = await enhancedKnowledgeBaseSystem.searchKnowledge(prompt, organizationId);
      
      // Enhance prompt with knowledge context
      let enhancedPrompt = prompt;
      
      if (knowledgeMatches.length > 0) {
        const contextData = knowledgeMatches
          .slice(0, 3) // Top 3 matches
          .map((match: KnowledgeMatch) => `📚 **${match.title}**: ${match.content.substring(0, 200)}...`)
          .join('\n\n');
        
        enhancedPrompt = `${prompt}\n\n--- KNOWLEDGE BASE CONTEXT ---\n${contextData}\n\nUtilizza questo contesto per fornire una risposta più precisa e personalizzata.`;
      }
      
      return {
        originalPrompt: prompt,
        enhancedPrompt,
        contextData: { organizationId, matchCount: knowledgeMatches.length },
        knowledgeBaseMatches: knowledgeMatches,
        suggestions: this.generateSuggestions(knowledgeMatches)
      };
      
    } catch (error) {
      console.error('Knowledge enrichment failed:', error);
      return {
        originalPrompt: prompt,
        enhancedPrompt: prompt,
        contextData: {},
        knowledgeBaseMatches: [],
        suggestions: []
      };
    }
  }
  
  private determineRequiredContext(intent: PromptAnalysis['intent'], _entities: string[]): string[] {
    const contextMap: Record<string, string[]> = {
      'create': ['templates', 'user_preferences', 'recent_similar'],
      'analyze': ['historical_data', 'benchmarks', 'kpis'],
      'optimize': ['current_performance', 'best_practices', 'a_b_tests'],
      'automate': ['workflows', 'triggers', 'integrations'],
      'report': ['metrics', 'time_range', 'stakeholders'],
      'help': ['documentation', 'tutorials', 'examples']
    };
    
    return contextMap[intent] || [];
  }
  
  private estimateProcessingTime(analysis: PromptAnalysis): number {
    const baseTime = 2000; // 2 seconds base
    const complexityMultiplier = analysis.entities.length * 0.5;
    const confidenceMultiplier = analysis.confidence > 0.8 ? 1 : 1.5;
    
    return baseTime * (1 + complexityMultiplier) * confidenceMultiplier;
  }
  
  private generateSuggestions(knowledgeMatches: KnowledgeMatch[]): string[] {
    if (knowledgeMatches.length === 0) {
      return [
        'Aggiungi più dettagli per una risposta più precisa',
        'Specifica il contesto del tuo business',
        'Indica obiettivi specifici che vuoi raggiungere'
      ];
    }
    
    return [
      'Ho trovato informazioni rilevanti nella Knowledge Base',
      'Considera anche questi aspetti correlati',
      'Posso approfondire qualsiasi punto specifico'
    ];
  }
}

export const aiEngineeringPrompting = new AIEngineeringPrompting();