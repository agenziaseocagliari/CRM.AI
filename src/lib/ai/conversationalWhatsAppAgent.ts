// Conversational WhatsApp Agent - Bidirectional AI Assistant
// Handles customer support and sales conversations with appointment booking goal

import { knowledgeBaseManager } from './knowledgeBaseSystem';
import { supabase } from '../supabaseClient';

export interface WhatsAppConversation {
  id: string;
  organizationId: string;
  customerPhone: string;
  customerName?: string;
  conversationStage: 'initial' | 'qualifying' | 'presenting' | 'booking' | 'following_up' | 'closed';
  leadScore: number;
  lastActivity: string;
  appointmentBooked: boolean;
  messages: WhatsAppMessage[];
  context: ConversationContext;
}

interface WhatsAppMessage {
  id: string;
  timestamp: string;
  direction: 'inbound' | 'outbound';
  content: string;
  messageType: 'text' | 'image' | 'document' | 'audio';
  aiGenerated: boolean;
  agentResponse?: {
    intent: string;
    confidence: number;
    suggestedActions: string[];
    escalationFlag: boolean;
  };
}

interface ConversationContext {
  customerInterests: string[];
  budgetRange?: string;
  timeline?: string;
  previousInteractions: string[];
  painPoints: string[];
  objections: string[];
  preferredContactTime?: string;
}

export class ConversationalWhatsAppAgent {
  private organizationId: string;
  private knowledgeBase: any;

  constructor(organizationId: string) {
    this.organizationId = organizationId;
  }

  async initializeAgent(): Promise<void> {
    // Load organization-specific knowledge base
    this.knowledgeBase = await knowledgeBaseManager.getKnowledgeForAgent(
      this.organizationId, 
      'WhatsAppButler'
    );
  }

  async processIncomingMessage(
    customerPhone: string, 
    messageContent: string,
    messageType: 'text' | 'image' | 'document' | 'audio' = 'text'
  ): Promise<{
    response: string;
    actions: string[];
    updateConversation: Partial<WhatsAppConversation>;
  }> {
    
    try {
      // Get or create conversation
      let conversation = await this.getConversation(customerPhone);
      if (!conversation) {
        conversation = await this.createNewConversation(customerPhone);
      }

      // Analyze message intent and sentiment
      const messageAnalysis = await this.analyzeMessage(messageContent, conversation);
      
      // Generate contextual response
      const response = await this.generateResponse(messageAnalysis, conversation);
      
      // Determine next actions
      const actions = this.determineNextActions(messageAnalysis, conversation);
      
      // Update conversation context
      const conversationUpdate = this.updateConversationContext(
        messageAnalysis, 
        conversation,
        response
      );

      // Save conversation update
      await this.saveConversationUpdate(conversation.id, {
        messages: [...conversation.messages, {
          id: this.generateMessageId(),
          timestamp: new Date().toISOString(),
          direction: 'inbound',
          content: messageContent,
          messageType,
          aiGenerated: false
        }, {
          id: this.generateMessageId(),
          timestamp: new Date().toISOString(),
          direction: 'outbound',
          content: response,
          messageType: 'text',
          aiGenerated: true,
          agentResponse: messageAnalysis
        }],
        ...conversationUpdate
      });

      return { response, actions, updateConversation: conversationUpdate };

    } catch (error) {
      console.error('WhatsApp Agent Error:', error);
      return {
        response: "Mi dispiace, ho avuto un problema tecnico. Un operatore ti ricontatterà presto!",
        actions: ['escalate_to_human'],
        updateConversation: {}
      };
    }
  }

  private async analyzeMessage(
    message: string, 
    conversation: WhatsAppConversation
  ): Promise<any> {
    
    const analysisPrompt = `
Analizza questo messaggio WhatsApp nel contesto della conversazione.

MESSAGGIO: "${message}"

CONVERSAZIONE PRECEDENTE:
${conversation.messages.slice(-5).map(m => `${m.direction}: ${m.content}`).join('\n')}

STAGE ATTUALE: ${conversation.conversationStage}
LEAD SCORE: ${conversation.leadScore}

KNOWLEDGE BASE AZIENDALE:
${this.knowledgeBase}

ANALIZZA:
1. Intent (domanda, interesse, obiezione, prenotazione, lamentela)
2. Sentiment (positivo, neutro, negativo)
3. Urgency (alta, media, bassa)
4. Buying intent (alto, medio, basso)
5. Information needed (cosa vuole sapere)
6. Pain points identificati
7. Budget/timeline hints

RISPOSTA JSON:
{
  "intent": "question|interest|objection|booking|complaint",
  "sentiment": "positive|neutral|negative",
  "urgency": "high|medium|low",
  "buyingIntent": "high|medium|low",
  "informationNeeded": ["cosa vuole sapere"],
  "painPoints": ["problemi identificati"],
  "budgetHints": "indicazioni budget se presenti",
  "timelineHints": "indicazioni tempistiche",
  "confidence": 0.85,
  "suggestedActions": ["azioni consigliate"],
  "escalationFlag": false
}
`;

    // Call AI API for analysis
    // This would use Gemini/Claude to analyze the message
    // For now, return mock analysis
    return {
      intent: "interest",
      sentiment: "positive",
      urgency: "medium",
      buyingIntent: "medium",
      informationNeeded: ["pricing", "timeline"],
      painPoints: ["current solution not working"],
      confidence: 0.85,
      suggestedActions: ["provide_pricing", "schedule_call"],
      escalationFlag: false
    };
  }

  private async generateResponse(
    analysis: any, 
    conversation: WhatsAppConversation
  ): Promise<string> {
    
    const responsePrompt = `
Sei il WhatsApp Assistant di ${this.knowledgeBase.companyName}.

ANALISI MESSAGGIO:
${JSON.stringify(analysis, null, 2)}

STAGE CONVERSAZIONE: ${conversation.conversationStage}
OBIETTIVO: Guidare verso prenotazione appuntamento

KNOWLEDGE BASE:
${this.knowledgeBase}

LINEE GUIDA RISPOSTA:
- Stile: professionale ma amichevole
- Lunghezza: 2-3 frasi max per WhatsApp
- Sempre includere una domanda o call-to-action
- Se interesse alto: proporre appuntamento
- Se obiezioni: gestire con empatia e soluzioni
- Se domande tecniche: rispondere con competenza

OBIETTIVO FINALE: Prenotare appuntamento/chiamata

Genera una risposta che:
1. Risponda alla domanda/interesse
2. Aggiunga valore
3. Guidi verso il prossimo step
4. Mantenga l'engagement

RISPOSTA:
`;

    // Call AI API for response generation
    // This would use the knowledge base and conversation context
    // For now, return contextual response based on analysis
    
    if (analysis.intent === 'interest' && analysis.buyingIntent === 'high') {
      return `Perfetto! Sono specializzato proprio in quello che cerchi. Ti posso proporre una chiamata di 15 minuti per capire meglio le tue esigenze e vedere come possiamo aiutarti. Quando saresti disponibile? 📞`;
    }
    
    if (analysis.intent === 'question') {
      return `Ottima domanda! ${this.getAnswerFromKnowledgeBase(analysis.informationNeeded[0])} \n\nVuoi che ti spieghi meglio in una breve chiamata? Così posso darti informazioni più precise per la tua situazione specifica.`;
    }
    
    return `Grazie per il messaggio! Ti risponderò nel dettaglio appena possibile. Nel frattempo, se vuoi possiamo fissare una chiamata per discutere meglio delle tue esigenze. 😊`;
  }

  private determineNextActions(analysis: any, conversation: WhatsAppConversation): string[] {
    const actions: string[] = [];
    
    if (analysis.buyingIntent === 'high' && !conversation.appointmentBooked) {
      actions.push('offer_appointment');
    }
    
    if (analysis.urgency === 'high') {
      actions.push('prioritize_response');
    }
    
    if (analysis.escalationFlag) {
      actions.push('escalate_to_human');
    }
    
    if (conversation.conversationStage === 'initial') {
      actions.push('update_stage_to_qualifying');
    }
    
    return actions;
  }

  private updateConversationContext(
    analysis: any,
    conversation: WhatsAppConversation,
    response: string
  ): Partial<WhatsAppConversation> {
    
    const updates: Partial<WhatsAppConversation> = {
      lastActivity: new Date().toISOString(),
      leadScore: this.calculateNewLeadScore(analysis, conversation.leadScore)
    };
    
    // Update conversation stage based on interaction
    if (analysis.intent === 'booking' || response.includes('appuntamento')) {
      updates.conversationStage = 'booking';
    } else if (analysis.buyingIntent === 'high') {
      updates.conversationStage = 'presenting';
    }
    
    // Update context with new information
    if (analysis.painPoints?.length > 0) {
      updates.context = {
        ...conversation.context,
        painPoints: [...(conversation.context.painPoints || []), ...analysis.painPoints]
      };
    }
    
    return updates;
  }

  private calculateNewLeadScore(analysis: any, currentScore: number): number {
    let newScore = currentScore;
    
    if (analysis.buyingIntent === 'high') newScore += 15;
    if (analysis.sentiment === 'positive') newScore += 5;
    if (analysis.urgency === 'high') newScore += 10;
    if (analysis.intent === 'booking') newScore += 20;
    
    return Math.min(newScore, 100);
  }

  private async getConversation(customerPhone: string): Promise<WhatsAppConversation | null> {
    const { data, error } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('organization_id', this.organizationId)
      .eq('customer_phone', customerPhone)
      .order('last_activity', { ascending: false })
      .limit(1)
      .single();
    
    if (error) return null;
    return data;
  }

  private async createNewConversation(customerPhone: string): Promise<WhatsAppConversation> {
    const conversation: WhatsAppConversation = {
      id: this.generateConversationId(),
      organizationId: this.organizationId,
      customerPhone,
      conversationStage: 'initial',
      leadScore: 0,
      lastActivity: new Date().toISOString(),
      appointmentBooked: false,
      messages: [],
      context: {
        customerInterests: [],
        previousInteractions: [],
        painPoints: [],
        objections: []
      }
    };
    
    await supabase.from('whatsapp_conversations').insert(conversation);
    return conversation;
  }

  private async saveConversationUpdate(conversationId: string, updates: any): Promise<void> {
    await supabase
      .from('whatsapp_conversations')
      .update(updates)
      .eq('id', conversationId);
  }

  private getAnswerFromKnowledgeBase(topic: string): string {
    // Extract relevant information from knowledge base
    // This would search through services, FAQ, etc.
    return "Basandomi sulla nostra esperienza...";
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const createWhatsAppAgent = (organizationId: string) => {
  return new ConversationalWhatsAppAgent(organizationId);
};