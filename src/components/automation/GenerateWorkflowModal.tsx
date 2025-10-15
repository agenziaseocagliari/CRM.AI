import { Brain, Lightbulb, Loader2, Sparkles, X } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Node, Edge } from '@xyflow/react';

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

  // Example workflow descriptions
  const exampleWorkflows = [
    "Send welcome email when form is submitted, then score the lead with AI",
    "When a deal is won, wait 2 days then send follow-up email and notify sales team", 
    "Score new contacts and create deal if score is high, otherwise add to nurture campaign",
    "Send reminder email 1 week after contact update, then create task for sales rep"
  ];

  const handleGenerateWorkflow = async () => {
    if (!description.trim()) {
      toast.error('Please enter a workflow description');
      return;
    }

    setIsGenerating(true);
    setSuggestions([]);
    
    // Initialize generation steps
    const steps: GenerationStep[] = [
      {
        id: 'connection',
        label: 'Connect to AI Agent',
        description: 'Testing DataPizza agent connection...',
        completed: false,
        loading: true
      },
      {
        id: 'analysis',
        label: 'Analyze Description', 
        description: 'AI is analyzing your workflow requirements...',
        completed: false,
        loading: false
      },
      {
        id: 'generation',
        label: 'Generate Workflow',
        description: 'Creating workflow elements and connections...',
        completed: false,
        loading: false
      },
      {
        id: 'validation',
        label: 'Validate Structure',
        description: 'Checking workflow logic and connections...',
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
        throw new Error('DataPizza AI agent is not available. Please ensure the agent server is running.');
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

      setGenerationSteps(prev => prev.map(step => 
        step.id === 'generation'
          ? { ...step, completed: result.success, loading: false }
          : step.id === 'validation'
          ? { ...step, loading: result.success }
          : step
      ));

      if (!result.success) {
        throw new Error(result.error || 'Workflow generation failed');
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
      
      toast.success(
        `🎉 Generated workflow with ${result.elements.length} elements in ${result.processing_time_ms}ms!`,
        { duration: 4000 }
      );

      // Auto-close after short delay to show completion
      setTimeout(() => {
        onClose();
        setDescription('');
        setGenerationSteps([]);
        setSuggestions([]);
      }, 2000);

    } catch (error) {
      console.error('Workflow generation error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Generation failed: ${errorMessage}`);
      
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
                Generate Workflow with AI
              </h2>
              <p className="text-sm text-gray-600">
                Describe your automation in natural language
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
              Workflow Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your workflow in plain English. For example: 'Send welcome email when form is submitted, then score the lead with AI'"
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              disabled={isGenerating}
            />
          </div>

          {/* Example Workflows */}
          {!isGenerating && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lightbulb className="w-4 h-4 inline mr-1" />
                Example Workflows
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
                Generation Progress
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

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                💡 AI Suggestions for Improvement
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
                : 'bg-red-50 border border-red-200 text-red-800'
              }
            `}>
              {agentConnected 
                ? '✅ Connected to DataPizza AI Agent'
                : '❌ AI Agent unavailable - ensure server is running at localhost:8001'
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
            Cancel
          </button>
          <button
            onClick={handleGenerateWorkflow}
            disabled={isGenerating || !description.trim()}
            className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                Generate Workflow
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}