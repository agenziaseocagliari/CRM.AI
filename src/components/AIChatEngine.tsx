// AI Chat Engine - Conversational AI Interface for CRM Modules
// Advanced chat system with specialized agents and real-time actions

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader, MessageSquare, Zap } from 'lucide-react';
import { useEmailGeniusAI } from '../lib/ai/useAIOrchestrator';

export interface ChatMessage {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  agentId?: string;
  actions?: ChatAction[];
  preview?: {
    type: 'email' | 'template' | 'campaign';
    data: unknown;
  };
}

export interface ChatAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary';
  action: () => void;
}

interface AIChatEngineProps {
  module: 'email' | 'whatsapp' | 'opportunities' | 'forms';
  agentId: string;
  agentName: string;
  contextData?: Record<string, unknown>;
  onActionComplete?: (action: string, result: unknown) => void;
  className?: string;
}

export default function AIChatEngine({
  module,
  agentId,
  agentName,
  contextData,
  onActionComplete,
  className = ''
}: AIChatEngineProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { generateEmailCampaign, isProcessing } = useEmailGeniusAI();

  // Quick action templates based on module
  const quickActions = {
    email: [
      { label: '📧 Crea campagna email', prompt: 'Crea una nuova campagna email per i nostri clienti' },
      { label: '📝 Scrivi template', prompt: 'Crea un template email professionale' },
      { label: '📊 Analizza performance', prompt: 'Analizza le performance delle email inviate' },
      { label: '🎯 Segmenta audience', prompt: 'Aiutami a segmentare la mia audience per email marketing' }
    ],
    whatsapp: [
      { label: '💬 Crea template WhatsApp', prompt: 'Crea un template WhatsApp per i clienti' },
      { label: '🚀 Campagna broadcast', prompt: 'Pianifica una campagna broadcast WhatsApp' },
      { label: '🤖 Automazione risposta', prompt: 'Crea un flusso di automazione per le risposte' }
    ],
    opportunities: [
      { label: '🎯 Analizza lead', prompt: 'Analizza i miei lead e assegna punteggi' },
      { label: '📈 Predici conversioni', prompt: 'Predici le probabilità di conversione' },
      { label: '🔥 Identifica hot leads', prompt: 'Identifica i lead più promettenti' }
    ],
    forms: [
      { label: '📋 Crea form ottimizzato', prompt: 'Crea un form ottimizzato per lead generation' },
      { label: '🔀 Logica condizionale', prompt: 'Aggiungi logica condizionale al form' },
      { label: '🧪 A/B test setup', prompt: 'Imposta un A/B test per il form' }
    ]
  };

  useEffect(() => {
    // Welcome message when chat opens
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'agent',
        content: `Ciao! Sono ${agentName}, il tuo assistente AI per il modulo ${module}. Come posso aiutarti oggi?`,
        timestamp: new Date(),
        agentId
      };
      setMessages([welcomeMessage]);
    }
  }, [messages.length, agentName, module, agentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isProcessing) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Process with appropriate AI agent
      let response;
      if (module === 'email') {
        response = await generateEmailCampaign(content, {
          ...contextData,
          conversational: true
        });
      }
      // Add other modules here

      // Simulate typing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Add agent response
      const agentMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: response?.success 
          ? generateResponseText(content, response.data)
          : 'Mi dispiace, ho avuto un problema nel processare la tua richiesta. Puoi riprovare?',
        timestamp: new Date(),
        agentId,
        actions: response?.success ? generateActions(response.data) : undefined,
        preview: response?.success ? {
          type: 'email',
          data: response.data
        } : undefined
      };

      setMessages(prev => [...prev, agentMessage]);

      if (response?.success && onActionComplete) {
        onActionComplete('chat_response', response.data);
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: 'Si è verificato un errore. Riprova più tardi.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateResponseText = (_userInput: string, _responseData: unknown): string => {
    // AI-generated conversational responses based on context
    const responses = [
      `Perfetto! Ho creato quello che hai richiesto. Dai un'occhiata al risultato qui sotto.`,
      `Ecco fatto! Ho generato tutto basandomi sulla tua richiesta. Cosa ne pensi?`,
      `Ho preparato qualcosa di speciale per te. Controlla il risultato e dimmi se va bene.`,
      `Fantastico! Ho elaborato la tua richiesta. Il risultato è pronto per essere utilizzato.`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const generateActions = (responseData: unknown): ChatAction[] => {
    return [
      {
        id: 'use',
        label: 'Usa questo risultato',
        type: 'primary',
        action: () => onActionComplete?.('use_result', responseData)
      },
      {
        id: 'modify',
        label: 'Modifica',
        type: 'secondary',
        action: () => {
          const modifyPrompt = 'Perfetto! Dimmi cosa vorresti modificare e lo adatterò per te.';
          const modifyMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'agent',
            content: modifyPrompt,
            timestamp: new Date(),
            agentId
          };
          setMessages(prev => [...prev, modifyMessage]);
        }
      }
    ];
  };

  const handleQuickAction = (prompt: string) => {
    handleSendMessage(prompt);
  };

  return (
    <div className={`flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{agentName}</h3>
            <p className="text-sm text-gray-600">AI Assistant • {module.charAt(0).toUpperCase() + module.slice(1)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Online</span>
        </div>
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="p-4 border-b border-gray-100">
          <p className="text-sm text-gray-600 mb-3">Quick actions:</p>
          <div className="grid grid-cols-1 gap-2">
            {quickActions[module]?.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action.prompt)}
                className="flex items-center space-x-2 p-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Zap className="w-4 h-4 text-purple-500" />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex space-x-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.type === 'user' 
                  ? 'bg-blue-500' 
                  : message.type === 'system'
                  ? 'bg-gray-500'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500'
              }`}>
                {message.type === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : message.type === 'system' ? (
                  <MessageSquare className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>

              {/* Message Content */}
              <div className={`rounded-2xl px-4 py-2 ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : message.type === 'system'
                  ? 'bg-gray-100 text-gray-700'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {/* Actions */}
                {message.actions && (
                  <div className="flex space-x-2 mt-3 pt-2 border-t border-gray-200">
                    {message.actions.map((action) => (
                      <button
                        key={action.id}
                        onClick={action.action}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          action.type === 'primary'
                            ? 'bg-purple-500 text-white hover:bg-purple-600'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Preview */}
                {message.preview && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span className="text-xs font-medium text-gray-700">Generated Preview</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      <pre className="whitespace-pre-wrap font-mono">
                        {JSON.stringify(message.preview.data, null, 2).slice(0, 200)}...
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
            placeholder={`Scrivi a ${agentName}...`}
            disabled={isProcessing || isTyping}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim() || isProcessing || isTyping}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isProcessing || isTyping ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}