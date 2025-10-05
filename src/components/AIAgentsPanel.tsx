// AI Agents Panel Component - Guardian AI CRM Enterprise
// Panel intelligente che fornisce accesso agli AI Agents in base al contesto

import React, { useState } from 'react';
import { Bot, Sparkles, Zap, Brain, Target, Calendar } from 'lucide-react';
import { useAIOrchestrator } from '../lib/ai/useAIOrchestrator';
import { AI_AGENTS } from '../lib/ai/aiOrchestrator';

interface AIAgentsPanelProps {
  context: 'dashboard' | 'opportunities' | 'contacts' | 'forms' | 'automations' | 'calendar';
  contextData?: Record<string, unknown>;
  className?: string;
}

export default function AIAgentsPanel({ context, contextData, className = '' }: AIAgentsPanelProps) {
  const { isProcessing, processRequest, getAgentsByCategory } = useAIOrchestrator();
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');

  // Get relevant agents based on context
  const getRelevantAgents = () => {
    switch (context) {
      case 'dashboard':
        return AI_AGENTS.filter(agent => 
          ['analytics_oracle', 'lead_scorer'].includes(agent.id)
        );
      case 'opportunities':
        return AI_AGENTS.filter(agent => 
          ['lead_scorer', 'analytics_oracle', 'email_genius'].includes(agent.id)
        );
      case 'contacts':
        return AI_AGENTS.filter(agent => 
          ['email_genius', 'whatsapp_butler', 'lead_scorer'].includes(agent.id)
        );
      case 'forms':
        return AI_AGENTS.filter(agent => 
          ['form_master'].includes(agent.id)
        );
      case 'automations':
        return AI_AGENTS.filter(agent => 
          ['whatsapp_butler', 'email_genius', 'analytics_oracle'].includes(agent.id)
        );
      case 'calendar':
        return AI_AGENTS.filter(agent => 
          ['calendar_wizard', 'email_genius'].includes(agent.id)
        );
      default:
        return AI_AGENTS;
    }
  };

  const getAgentIcon = (agentId: string) => {
    switch (agentId) {
      case 'form_master': return '📋';
      case 'email_genius': return '📧';
      case 'whatsapp_butler': return '💬';
      case 'calendar_wizard': return '🗓️';
      case 'analytics_oracle': return '🔮';
      case 'lead_scorer': return '🎯';
      default: return '🤖';
    }
  };

  const getAgentIconComponent = (agentId: string) => {
    switch (agentId) {
      case 'form_master': return Bot;
      case 'email_genius': return Sparkles;
      case 'whatsapp_butler': return Zap;
      case 'calendar_wizard': return Calendar;
      case 'analytics_oracle': return Brain;
      case 'lead_scorer': return Target;
      default: return Bot;
    }
  };

  const handleAgentClick = async (agentId: string) => {
    if (activeAgent === agentId) {
      setActiveAgent(null);
      return;
    }
    
    setActiveAgent(agentId);
    
    // Auto-generate context-specific prompts
    const contextPrompts = {
      dashboard: 'Analyze current performance and provide insights',
      opportunities: 'Score and prioritize these leads',
      contacts: 'Suggest personalized outreach strategies',
      forms: 'Generate an optimized form for lead capture',
      automations: 'Create automated workflow recommendations',
      calendar: 'Optimize scheduling and availability'
    };
    
    setPrompt(contextPrompts[context] || '');
  };

  const handleProcessRequest = async () => {
    if (!activeAgent || !prompt.trim()) return;
    
    await processRequest({
      agentId: activeAgent,
      organizationId: 'current_org', // This would come from auth context
      userId: 'current_user', // This would come from auth context
      prompt: prompt.trim(),
      context: contextData,
      metadata: {
        source: context,
        actionType: 'manual_request'
      }
    });
    
    // Reset form
    setActiveAgent(null);
    setPrompt('');
  };

  const relevantAgents = getRelevantAgents();

  if (relevantAgents.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Agents</h3>
            <p className="text-sm text-gray-600">
              Powered by Guardian AI • Context: {context.charAt(0).toUpperCase() + context.slice(1)}
            </p>
          </div>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {relevantAgents.map((agent) => {
            const IconComponent = getAgentIconComponent(agent.id);
            const isActive = activeAgent === agent.id;
            
            return (
              <button
                key={agent.id}
                onClick={() => handleAgentClick(agent.id)}
                disabled={agent.status === 'coming_soon'}
                className={`relative p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                  isActive
                    ? 'border-purple-500 bg-purple-50'
                    : agent.status === 'coming_soon'
                    ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    isActive ? 'bg-purple-500 text-white' : 'bg-gray-100'
                  }`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {agent.name}
                      </span>
                      {agent.status === 'beta' && (
                        <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">
                          β
                        </span>
                      )}
                      {agent.status === 'coming_soon' && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                          Soon
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {agent.description}
                    </p>
                  </div>
                </div>
                
                {/* Pricing Tier Badge */}
                <div className="absolute top-2 right-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    agent.pricingTier === 'freelancer' ? 'bg-green-100 text-green-600' :
                    agent.pricingTier === 'startup' ? 'bg-blue-100 text-blue-600' :
                    agent.pricingTier === 'business' ? 'bg-purple-100 text-purple-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    {agent.pricingTier}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Agent Interface */}
        {activeAgent && (
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">
                  {AI_AGENTS.find(a => a.id === activeAgent)?.name}
                </h4>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want this AI agent to do..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleProcessRequest}
                disabled={isProcessing || !prompt.trim()}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-200"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  'Run Agent'
                )}
              </button>
              <button
                onClick={() => setActiveAgent(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-3 bg-gray-50 rounded-b-xl">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>🚀 {relevantAgents.length} agents available</span>
          <span>✨ Enterprise AI powered</span>
        </div>
      </div>
    </div>
  );
}