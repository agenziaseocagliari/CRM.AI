import { Edge, Node } from '@xyflow/react';
import { AlertTriangle, Brain, Lightbulb, Loader2, Sparkles, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import { generateWorkflow, testAgentConnection } from '../../services/workflowGenerationService';

interface GenerateWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (elements: Node[], edges: Edge[]) => void;
  organizationId?: string;
}

interface GenerationStep {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  loading: boolean;
}

export default function GenerateWorkflowModal({ 
  isOpen, 
  onClose, 
  onGenerate,
  organizationId 
}: GenerateWorkflowModalProps) {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [agentConnected, setAgentConnected] = useState<boolean | null>(null);
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [generationMethod, setGenerationMethod] = useState<'ai' | 'fallback' | null>(null);

  // Example workflow descriptions
  const exampleWorkflows = [
    "Invia email di benvenuto quando il modulo viene inviato, poi valuta il lead con AI",
    "Quando un affare viene vinto, aspetta 2 giorni poi invia email di follow-up e notifica il team vendite", 
    "Valuta nuovi contatti e crea affare se il punteggio è alto, altrimenti aggiungi alla campagna di nurturing",
    "Invia email di promemoria 1 settimana dopo l'aggiornamento del contatto, poi crea task per il commerciale"
  ];

  // Check agent availability when modal opens
  const checkAgentHealth = async () => {
    try {
      // Use same URL logic as workflow service
      const envVar = import.meta.env.VITE_DATAPIZZA_API_URL;
      const isProduction = import.meta.env.PROD;
      
      let url: string;
      if (envVar && envVar.trim()) {
        url = envVar.trim();
        console.log('🔍 Checking agent via env var:', url);
      } else if (isProduction) {
        url = 'https://datapizza-production.railway.app';
        console.log('🔍 Checking agent via Railway (prod):', url);
      } else {
        url = 'http://localhost:8001';
        console.log('🔍 Checking agent via localhost (dev):', url);
      }
      
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // Increased timeout
      });
      
      if (response.ok) {
        const responseText = await response.text();
        console.log('✅ Agent available - Response:', responseText);
        setAgentConnected(true);
      } else {
        console.warn('⚠️ Agent returned non-OK status');
        setAgentConnected(false);
      }
    } catch (error) {
      console.warn('⚠️ Agent check failed:', error instanceof Error ? error.message : String(error));
      setAgentConnected(false);
    }
  };

  // Check health when modal opens
  useEffect(() => {
    if (isOpen) {
      checkAgentHealth();
    }
  }, [isOpen]);

  const handleGenerateWorkflow = async () => {
    if (!description.trim()) {
      toast.error('Inserisci una descrizione del workflow');
      return;
    }

    setIsGenerating(true);
    setSuggestions([]);
    
    // Initialize generation steps
    const steps: GenerationStep[] = [
      {
        id: 'connection',
        label: 'Connessione Agente AI',
        description: 'Test connessione agente DataPizza...',
        completed: false,
        loading: true
      },
      {
        id: 'analysis',
        label: 'Analisi Descrizione', 
        description: 'AI sta analizzando i requisiti del workflow...',
        completed: false,
        loading: false
      },
      {
        id: 'generation',
        label: 'Generazione Workflow',
        description: 'Creazione elementi e connessioni del workflow...',
        completed: false,
        loading: false
      },
      {
        id: 'validation',
        label: 'Validazione Struttura',
        description: 'Controllo logica e connessioni del workflow...',
        completed: false,
        loading: false
      }
    ];
    
    setGenerationSteps(steps);

    try {
      // Step 1: Test agent connection
      const connectionTest = await testAgentConnection();
      
      setGenerationSteps(prev => prev.map(step => 
        step.id === 'connection' 
          ? { ...step, completed: connectionTest.connected, loading: false }
          : step.id === 'analysis'
          ? { ...step, loading: connectionTest.connected }
          : step
      ));
      
      if (!connectionTest.connected) {
        throw new Error('Agente DataPizza AI non disponibile. Assicurati che il server agente sia in esecuzione.');
      }

      setAgentConnected(true);

      // Step 2: Generate workflow
      setGenerationSteps(prev => prev.map(step => 
        step.id === 'analysis' 
          ? { ...step, completed: true, loading: false }
          : step.id === 'generation'
          ? { ...step, loading: true }
          : step
      ));

      const result = await generateWorkflow(description, organizationId);

      // Track generation method
      setGenerationMethod(result.method);

      setGenerationSteps(prev => prev.map(step => 
        step.id === 'generation'
          ? { ...step, completed: result.success, loading: false }
          : step.id === 'validation'
          ? { ...step, loading: result.success }
          : step
      ));

      if (!result.success) {
        throw new Error(result.error || 'Generazione workflow fallita');
      }

      // Step 3: Validation complete
      setGenerationSteps(prev => prev.map(step => 
        step.id === 'validation'
          ? { ...step, completed: result.validation.valid, loading: false }
          : step
      ));

      // Show suggestions if available
      if (result.suggestions && result.suggestions.length > 0) {
        setSuggestions(result.suggestions);
      }

      // Success - populate canvas
      onGenerate(result.elements, result.edges);
      
      // Show appropriate success message based on method
      if (result.method === 'ai') {
        toast.success(
          `🤖 Workflow generato con AI! ${result.elements.length} elementi in ${result.processing_time_ms}ms`,
          { duration: 4000 }
        );
      } else {
        toast(
          `📋 Workflow generato con template (${result.elements.length} elementi). AI non disponibile.`,
          { 
            duration: 5000,
            icon: '⚠️',
            style: {
              background: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fbbf24'
            }
          }
        );
      }

      // Auto-close after short delay to show completion
      setTimeout(() => {
        onClose();
        setDescription('');
        setGenerationSteps([]);
        setSuggestions([]);
      }, 2000);

    } catch (error) {
      console.error('Workflow generation error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      toast.error(`Generazione fallita: ${errorMessage}`);
      
      setAgentConnected(false);
      
      // Mark current step as failed
      setGenerationSteps(prev => prev.map(step => 
        step.loading ? { ...step, loading: false, completed: false } : step
      ));
      
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setDescription(example);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Genera Workflow con AI
              </h2>
              <p className="text-sm text-gray-600">
                Descrivi la tua automazione in linguaggio naturale
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrizione Workflow
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrivi il tuo workflow in italiano semplice. Ad esempio: 'Invia email di benvenuto quando il modulo viene inviato, poi valuta il lead con AI'"
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              disabled={isGenerating}
            />
          </div>

          {/* Example Workflows */}
          {!isGenerating && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lightbulb className="w-4 h-4 inline mr-1" />
                Esempi di Workflow
              </label>
              <div className="space-y-2">
                {exampleWorkflows.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(example)}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-md text-sm text-gray-700 transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Generation Progress */}
          {isGenerating && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Progresso Generazione
              </label>
              <div className="space-y-3">
                {generationSteps.map((step) => (
                  <div key={step.id} className="flex items-center gap-3">
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center
                      ${step.completed 
                        ? 'bg-green-100 text-green-600' 
                        : step.loading 
                        ? 'bg-purple-100 text-purple-600'
                        : 'bg-gray-100 text-gray-400'
                      }
                    `}>
                      {step.loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : step.completed ? (
                        <Sparkles className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-medium">{generationSteps.indexOf(step) + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{step.label}</div>
                      <div className="text-xs text-gray-500">{step.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fallback Warning Box */}
          {generationMethod === 'fallback' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Generazione Template Base
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    L'agente AI non è disponibile. Il workflow è stato generato
                    usando template basati su parole chiave. Per risultati più
                    accurati, assicurati che DataPizza AI sia disponibile.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                💡 Suggerimenti AI per Miglioramento
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Agent Connection Status */}
          {agentConnected !== null && (
            <div className={`
              p-3 rounded-md text-sm
              ${agentConnected 
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
              }
            `}>
              {agentConnected 
                ? '✅ Agente DataPizza AI disponibile'
                : '⚠️ Agente AI non disponibile. Verrà utilizzato il generatore intelligente basato su parole chiave.'
              }
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            onClick={handleGenerateWorkflow}
            disabled={isGenerating || !description.trim()}
            className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generazione...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                Genera Workflow
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}