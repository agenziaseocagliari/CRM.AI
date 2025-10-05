import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Loader2, MessageCircle } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  module?: string;
  agentId?: string;
}

interface ModuleChatProps {
  moduleName: string;
  agentId: 'FormMaster' | 'EmailGenius' | 'WhatsAppButler' | 'CalendarWizard' | 'LeadScorer' | 'AnalyticsOracle';
  agentName: string;
  agentColor: string;
  placeholder?: string;
  welcomeMessage?: string;
  systemContext?: string;
  onMessageSent?: (message: string) => void;
  onAIResponse?: (response: string) => void;
}

const AGENT_CONFIGS = {
  FormMaster: {
    name: 'FormMaster',
    color: 'from-blue-500 to-cyan-500',
    avatar: '📝',
    description: 'Specialista nella creazione e ottimizzazione di form conversazionali'
  },
  EmailGenius: {
    name: 'EmailGenius', 
    color: 'from-purple-500 to-pink-500',
    avatar: '📧',
    description: 'Esperto in email marketing e automazione delle comunicazioni'
  },
  WhatsAppButler: {
    name: 'WhatsAppButler',
    color: 'from-green-500 to-emerald-500', 
    avatar: '💬',
    description: 'Assistente per gestione messaggi WhatsApp e comunicazione clienti'
  },
  CalendarWizard: {
    name: 'CalendarWizard',
    color: 'from-orange-500 to-red-500',
    avatar: '📅',
    description: 'Ottimizzatore di calendari e gestione appuntamenti intelligente'
  },
  LeadScorer: {
    name: 'LeadScorer',
    color: 'from-indigo-500 to-purple-500',
    avatar: '🎯',
    description: 'Analizzatore di opportunità e scoring automatico dei lead'
  },
  AnalyticsOracle: {
    name: 'AnalyticsOracle',
    color: 'from-teal-500 to-blue-500',
    avatar: '📊',
    description: 'Analisi predittiva e insights dai dati aziendali'
  }
};

export function ModuleChat({ 
  moduleName, 
  agentId, 
  agentColor,
  placeholder,
  welcomeMessage,
  systemContext,
  onMessageSent,
  onAIResponse 
}: ModuleChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const agentConfig = AGENT_CONFIGS[agentId];

  useEffect(() => {
    // Add welcome message when component mounts
    if (welcomeMessage && messages.length === 0) {
      const welcomeMsg: ChatMessage = {
        id: 'welcome-' + Date.now(),
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date(),
        module: moduleName,
        agentId
      };
      setMessages([welcomeMsg]);
    }
  }, [welcomeMessage, messages.length, moduleName, agentId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
      module: moduleName,
      agentId
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    onMessageSent?.(userMessage.content);

    setIsLoading(true);

    try {
      // Simulate AI response (replace with actual AI service call)
      const aiResponse = await simulateAIResponse(userMessage.content, agentId, systemContext);
      
      const assistantMessage: ChatMessage = {
        id: 'assistant-' + Date.now(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        module: moduleName,
        agentId
      };

      setMessages(prev => [...prev, assistantMessage]);
      onAIResponse?.(aiResponse);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: ChatMessage = {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: 'Mi dispiace, ho riscontrato un errore. Riprova tra poco.',
        timestamp: new Date(),
        module: moduleName,
        agentId
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateAIResponse = async (userMessage: string, agentId: string, _context?: string): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Agent-specific responses based on message content and context
    const responses = {
      FormMaster: [
        'Ti aiuto a creare un form perfetto per le tue esigenze. Che tipo di informazioni vuoi raccogliere?',
        'Posso suggerire campi ottimizzati per aumentare il tasso di conversione. Dimmi di più sul tuo obiettivo.',
        'Per questo form consiglio di usare campi progressivi per non scoraggiare gli utenti. Vuoi che ti mostri come?'
      ],
      EmailGenius: [
        'Perfetto! Creo una strategia email personalizzata per il tuo target. Che risultato vuoi ottenere?',
        'Per migliorare l\'engagement, suggerisco di segmentare la lista in base al comportamento. Ti mostro come?',
        'Posso analizzare le tue email precedenti e ottimizzare il tasso di apertura. Condividi i dati?'
      ],
      WhatsAppButler: [
        'Gestisco i tuoi messaggi WhatsApp in modo intelligente. Vuoi automatizzare le risposte o migliorare il customer service?',
        'Posso creare template personalizzati per diverse situazioni. Che tipo di conversazioni gestisci di più?',
        'Ti aiuto ad organizzare i contatti e automatizzare i follow-up. Iniziamo dalle priorità?'
      ],
      CalendarWizard: [
        'Ottimizziamo il tuo calendario per massimizzare la produttività. Che problemi di scheduling stai affrontando?',
        'Posso creare link di prenotazione personalizzati e gestire automaticamente i conflitti. Ti interessa?',
        'Analizziamo i tuoi pattern di appuntamenti per trovare i momenti più produttivi. Vuoi che inizi?'
      ],
      LeadScorer: [
        'Analizzo questa opportunità e le assegno un punteggio basato sui dati storici. Condividi i dettagli?',
        'Posso identificare i lead più promettenti e suggerire le azioni migliori. Che metriche sono più importanti per te?',
        'Ti mostro come aumentare il conversion rate focalizzandoti sui lead giusti. Partiamo dai dati?'
      ],
      AnalyticsOracle: [
        'Analizzo i tuoi dati per trovare pattern nascosti e opportunità di crescita. Su cosa vuoi focalizzarti?',
        'Posso creare dashboard personalizzate e alert automatici per i KPI critici. Che metriche monitori?',
        'I dati mostrano trends interessanti. Vuoi che ti mostri le previsioni per il prossimo periodo?'
      ]
    };

    const agentResponses = responses[agentId as keyof typeof responses] || responses.FormMaster;
    return agentResponses[Math.floor(Math.random() * agentResponses.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Floating Chat Button */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className={`w-14 h-14 rounded-full bg-gradient-to-r ${agentColor} text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group`}
        >
          <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <div className="absolute -top-12 right-0 bg-black text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Chatta con {agentConfig.name}
          </div>
        </button>
      )}

      {/* Expanded Chat Window */}
      {isExpanded && (
        <div className="w-80 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className={`bg-gradient-to-r ${agentColor} text-white p-4 flex items-center justify-between`}>
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{agentConfig.avatar}</div>
              <div>
                <h3 className="font-semibold">{agentConfig.name}</h3>
                <p className="text-xs opacity-90">{agentConfig.description}</p>
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
                <div className={`flex items-start space-x-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    message.role === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : `bg-gradient-to-r ${agentColor} text-white`
                  }`}>
                    {message.role === 'user' ? <User className="w-4 h-4" /> : agentConfig.avatar}
                  </div>
                  <div className={`p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white ml-2'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${agentColor} text-white flex items-center justify-center text-sm`}>
                    {agentConfig.avatar}
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                      <span className="text-sm text-gray-500">Sto pensando...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={placeholder || `Scrivi a ${agentConfig.name}...`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className={`p-2 rounded-lg bg-gradient-to-r ${agentColor} text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity`}
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