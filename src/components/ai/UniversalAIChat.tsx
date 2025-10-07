// Universal AI Chat - Guardian AI CRM
// Chat centralizzata che instrada automaticamente alle AI specializzate

import { Bot, Loader2, Send, Sparkles, User } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  module?: string;
  agentUsed?: string;
  processingTime?: number;
}

interface UniversalChatProps {
  currentModule: string;
  organizationId: string;
  userId: string;
  onActionTriggered?: (action: string, data: unknown) => void;
}

export function UniversalAIChat({ 
  currentModule, 
  organizationId, 
  userId,
  onActionTriggered 
}: UniversalChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Welcome message based on current module
    if (messages.length === 0) {
      const welcomeMsg: ChatMessage = {
        id: 'welcome-' + Date.now(),
        role: 'system',
        content: getModuleWelcomeMessage(currentModule),
        timestamp: new Date(),
        module: currentModule
      };
      setMessages([welcomeMsg]);
    }
  }, [currentModule, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getModuleWelcomeMessage = (module: string): string => {
    const welcomeMessages = {
      'Forms': '🚀 **Guardian AI** è pronto! Sono qui per aiutarti con i form. Dimmi cosa vuoi creare: "Crea un form di contatto per WordPress" o "Ottimizza il mio form esistente".',
      'Contacts': '📊 **Guardian AI** è attivo! Posso analizzare i tuoi contatti, creare segmentazioni intelligenti, o aiutarti con email e WhatsApp personalizzati.',
      'Opportunities': '🎯 **Guardian AI** è online! Posso fare scoring automatico dei lead, analizzare le opportunità, o creare follow-up personalizzati.',
      'WhatsApp': '💬 **Guardian AI** è connesso! Posso creare template WhatsApp, gestire conversazioni automatiche, o ottimizzare le tue campagne.',
      'Email': '📧 **Guardian AI** è pronto! Posso creare email personalizzate, ottimizzare subject line, o pianificare campagne automatiche.',
      'Calendar': '📅 **Guardian AI** è disponibile! Posso ottimizzare il tuo calendario, creare booking intelligenti, o analizzare i pattern di appuntamenti.',
      'Dashboard': '🎛️ **Guardian AI** è operativo! Posso analizzare le performance, creare report predittivi, o suggerirti azioni strategiche.'
    };
    return welcomeMessages[module as keyof typeof welcomeMessages] || '🤖 **Guardian AI** è pronto! Come posso aiutarti?';
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
      module: currentModule
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Call Universal AI Orchestrator
      const response = await processUniversalAIRequest(userMessage.content, currentModule, organizationId, userId);
      
      const assistantMessage: ChatMessage = {
        id: 'assistant-' + Date.now(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        module: currentModule,
        agentUsed: response.agentUsed,
        processingTime: response.processingTime
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Trigger actions if needed
      if (response.action && onActionTriggered) {
        onActionTriggered(response.action, response.actionData);
      }

    } catch (error) {
      console.error('Universal AI Error:', error);
      const errorMessage: ChatMessage = {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: 'Mi dispiace, ho riscontrato un errore. Riprova tra poco o riformula la richiesta.',
        timestamp: new Date(),
        module: currentModule
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Floating Universal AI Button */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group relative"
        >
          <Bot className="w-7 h-7 group-hover:scale-110 transition-transform" />
          <Sparkles className="w-4 h-4 absolute -top-1 -right-1 animate-pulse" />
          <div className="absolute -top-16 right-0 bg-black text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            <div className="font-semibold">Guardian AI</div>
            <div className="text-xs opacity-80">Modulo: {currentModule}</div>
          </div>
        </button>
      )}

      {/* Expanded Universal Chat Window */}
      {isExpanded && (
        <div className="w-96 h-[500px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Bot className="w-8 h-8" />
                <Sparkles className="w-4 h-4 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold">Guardian AI</h3>
                <p className="text-xs opacity-90">Modulo attivo: {currentModule}</p>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start space-x-2 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    message.role === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : message.role === 'system'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'bg-gradient-to-r from-green-500 to-blue-500 text-white'
                  }`}>
                    {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : message.role === 'system'
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}>
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    {message.agentUsed && (
                      <div className="text-xs mt-2 opacity-70 flex items-center space-x-2">
                        <span>🤖 {message.agentUsed}</span>
                        {message.processingTime && <span>⚡ {message.processingTime}ms</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-2 bg-white p-3 rounded-lg border border-gray-200">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  <span className="text-sm text-gray-600">Guardian AI sta pensando...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Chiedi a Guardian AI... (Modulo: ${currentModule})`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="p-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Universal AI Request Processor
async function processUniversalAIRequest(
  userPrompt: string, 
  currentModule: string, 
  organizationId: string, 
  userId: string
): Promise<{
  content: string;
  agentUsed: string;
  processingTime: number;
  action?: string;
  actionData?: unknown;
}> {
  const startTime = Date.now();

  try {
    // 1. AI Engineering Prompting - Analizza la richiesta
    const analysisResult = await analyzeUserIntent(userPrompt, currentModule);
    
    // 2. Route to appropriate AI agent
    const { AIOrchestrator } = await import('../../lib/ai/aiOrchestrator');
    const orchestrator = new AIOrchestrator();
    
    const response = await orchestrator.processRequest({
      agentId: analysisResult.recommendedAgent,
      organizationId,
      userId,
      prompt: analysisResult.enhancedPrompt,
      context: analysisResult.context,
      metadata: {
        source: 'dashboard',
        actionType: 'natural_language_request'
      }
    });

    if (response.success) {
      return {
        content: formatUniversalResponse(response, analysisResult),
        agentUsed: analysisResult.recommendedAgent,
        processingTime: Date.now() - startTime,
        action: analysisResult.suggestedAction,
        actionData: response.data
      };
    } else {
      throw new Error(response.error || 'Unknown error');
    }

  } catch (error) {
    console.error('Universal AI Processing Error:', error);
    return {
      content: 'Mi dispiace, ho riscontrato un errore nel processare la tua richiesta. Puoi provare a riformulare o essere più specifico?',
      agentUsed: 'error_handler',
      processingTime: Date.now() - startTime
    };
  }
}

// AI Engineering Prompting - Analizza intento utente
async function analyzeUserIntent(userPrompt: string, currentModule: string): Promise<{
  recommendedAgent: string;
  enhancedPrompt: string;
  context: Record<string, unknown>;
  suggestedAction?: string;
}> {
  // Smart routing based on keywords and context
  const promptLower = userPrompt.toLowerCase();
  
  // Determine best agent
  let recommendedAgent = 'form_master'; // default
  
  if (promptLower.includes('form') || promptLower.includes('modulo') || promptLower.includes('wordpress') || promptLower.includes('kadence')) {
    recommendedAgent = 'form_master';
  } else if (promptLower.includes('email') || promptLower.includes('campagna') || promptLower.includes('newsletter')) {
    recommendedAgent = 'email_genius';
  } else if (promptLower.includes('whatsapp') || promptLower.includes('messaggio') || promptLower.includes('chat')) {
    recommendedAgent = 'whatsapp_butler';
  } else if (promptLower.includes('calendario') || promptLower.includes('appuntamento') || promptLower.includes('booking')) {
    recommendedAgent = 'calendar_wizard';
  } else if (promptLower.includes('analisi') || promptLower.includes('dati') || promptLower.includes('report') || promptLower.includes('insight')) {
    recommendedAgent = 'analytics_oracle';
  } else if (promptLower.includes('lead') || promptLower.includes('scoring') || promptLower.includes('valuta') || promptLower.includes('opportunità')) {
    recommendedAgent = 'lead_scorer';
  } else {
    // Context-based routing
    const moduleAgentMap: Record<string, string> = {
      'Forms': 'form_master',
      'Contacts': 'analytics_oracle',
      'Opportunities': 'lead_scorer',
      'WhatsApp': 'whatsapp_butler',
      'Email': 'email_genius',
      'Calendar': 'calendar_wizard'
    };
    recommendedAgent = moduleAgentMap[currentModule] || 'form_master';
  }

  // Determine suggested action
  let suggestedAction: string | undefined;
  if (recommendedAgent === 'form_master' && currentModule === 'Forms') {
    suggestedAction = 'form_generated'; // This will trigger the form fields to be passed to Forms.tsx
  }

  return {
    recommendedAgent,
    enhancedPrompt: `MODULO ATTIVO: ${currentModule}\n\nRICHIESTA UTENTE: ${userPrompt}\n\nFornisci una risposta dettagliata e actionable per il modulo ${currentModule}.`,
    context: {
      currentModule,
      userIntent: promptLower,
      timestamp: new Date().toISOString()
    },
    suggestedAction
  };
}

// Formatta risposta universale
function formatUniversalResponse(response: unknown, analysis: { recommendedAgent: string }): string {
  const agentNames: Record<string, string> = {
    'form_master': 'FormMaster 📝',
    'email_genius': 'EmailGenius 📧',
    'whatsapp_butler': 'WhatsAppButler 💬',
    'calendar_wizard': 'CalendarWizard 📅',
    'analytics_oracle': 'AnalyticsOracle 📊',
    'lead_scorer': 'LeadScorer 🎯'
  };
  
  const agentName = agentNames[analysis.recommendedAgent] || 'Guardian AI 🤖';

  // Simple universal response formatter
  const responseObj = response as Record<string, unknown>;
  
  // 🎯 FORMMASTER SPECIFIC FORMATTING
  if (analysis.recommendedAgent === 'form_master' && responseObj?.data) {
    const formData = responseObj.data as { formFields?: Array<{ name: string; label: string; type: string; required: boolean }> };
    if (formData.formFields && Array.isArray(formData.formFields) && formData.formFields.length > 0) {
      let formDescription = `${agentName} ha generato il tuo form con successo! 🎉\n\n📝 **Campi del form generati:**\n\n`;
      
      formData.formFields.forEach((field, index) => {
        const requiredText = field.required ? '(obbligatorio)' : '(opzionale)';
        const fieldIcon = field.type === 'email' ? '📧' : field.type === 'tel' ? '📱' : field.type === 'textarea' ? '📄' : '✏️';
        formDescription += `${index + 1}. ${fieldIcon} ${field.label} ${requiredText}\n`;
      });
      
      formDescription += `\n✨ **Form pronto per l'uso!** I campi sono ora visibili nell'interfaccia sottostante.`;
      return formDescription;
    }
  }
  
  if (responseObj?.result) {
    return `${agentName} risponde:\n\n${responseObj.result}`;
  }

  if (responseObj?.content) {
    return `${agentName}:\n\n${responseObj.content}`;
  }

  if (responseObj?.message) {
    return `${agentName}:\n\n${responseObj.message}`;
  }

  return `${agentName} ha processato la tua richiesta con successo! 🎉\n\nRisposta ricevuta e pronta per l'uso.`;
}