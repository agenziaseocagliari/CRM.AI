// Email Marketing Module - Guardian AI CRM Enterprise
// Modulo avanzato per email marketing con AI Genius

import React, { useState, useEffect } from 'react';
import { Mail, Send, Users, BarChart3, Clock, TrendingUp, Settings, Plus, Target, Zap } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { useCrmData } from '../hooks/useCrmData';
import { useEmailGeniusAI } from '../lib/ai/useAIOrchestrator';
import AIAgentsPanel from './AIAgentsPanel';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  category: 'marketing' | 'transactional' | 'newsletter' | 'follow_up';
  content: {
    html: string;
    text: string;
  };
  variables: string[];
  status: 'draft' | 'active' | 'archived';
  createdAt: string;
  aiGenerated: boolean;
  openRate?: number;
  clickRate?: number;
}

interface EmailCampaign {
  id: string;
  name: string;
  templateId: string;
  subject: string;
  targetSegments: string[];
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused';
  scheduledAt?: string;
  sentCount: number;
  openCount: number;
  clickCount: number;
  bounceCount: number;
  unsubscribeCount: number;
  createdAt: string;
}

interface EmailMetrics {
  totalSent: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  activeSubscribers: number;
  templatesCount: number;
  campaignsActive: number;
}

const EmailMarketingModule: React.FC = () => {
  const contextData = useOutletContext<ReturnType<typeof useCrmData>>();
  const { contacts } = contextData || {};
  const { generateEmailCampaign, isProcessing } = useEmailGeniusAI();
  
  // States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'templates' | 'campaigns' | 'segments' | 'settings'>('dashboard');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [metrics, setMetrics] = useState<EmailMetrics>({
    totalSent: 15420,
    openRate: 24.3,
    clickRate: 3.7,
    bounceRate: 1.2,
    unsubscribeRate: 0.8,
    activeSubscribers: 2847,
    templatesCount: 18,
    campaignsActive: 5
  });
  
  // Template creation modal
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    category: 'marketing' as const,
    targetAudience: '',
    goal: '',
    prompt: ''
  });

  // Load mock data
  useEffect(() => {
    setTemplates([
      {
        id: '1',
        name: 'Benvenuto Nuovo Cliente',
        subject: 'Benvenuto in Guardian AI - Il tuo CRM intelligente ti aspetta!',
        category: 'transactional',
        content: {
          html: '<h1>Benvenuto {{firstName}}!</h1><p>Grazie per esserti unito a Guardian AI...</p>',
          text: 'Benvenuto {{firstName}}! Grazie per esserti unito a Guardian AI...'
        },
        variables: ['firstName', 'companyName'],
        status: 'active',
        createdAt: '2024-01-15',
        aiGenerated: false,
        openRate: 68.4,
        clickRate: 12.8
      },
      {
        id: '2',
        name: 'Newsletter Mensile Insights',
        subject: '📊 I tuoi insight CRM di {{month}} - Analisi e Trend',
        category: 'newsletter',
        content: {
          html: '<h2>Ciao {{firstName}},</h2><p>Ecco i tuoi insight mensili...</p>',
          text: 'Ciao {{firstName}}, ecco i tuoi insight mensili...'
        },
        variables: ['firstName', 'month', 'metrics'],
        status: 'active',
        createdAt: '2024-01-20',
        aiGenerated: true,
        openRate: 31.2,
        clickRate: 5.4
      },
      {
        id: '3',
        name: 'Follow-up Opportunità Persa',
        subject: 'Non perdiamo il contatto, {{firstName}} - Nuove opportunità ti aspettano',
        category: 'follow_up',
        content: {
          html: '<p>Ciao {{firstName}}, abbiamo notato che l\'opportunità "{{opportunityName}}" non è andata a buon fine...</p>',
          text: 'Ciao {{firstName}}, abbiamo notato che l\'opportunità "{{opportunityName}}" non è andata a buon fine...'
        },
        variables: ['firstName', 'opportunityName', 'alternativeServices'],
        status: 'active',
        createdAt: '2024-01-18',
        aiGenerated: true,
        openRate: 28.9,
        clickRate: 7.2
      }
    ]);

    setCampaigns([
      {
        id: '1',
        name: 'Welcome Series Q1 2024',
        templateId: '1',
        subject: 'Benvenuto in Guardian AI',
        targetSegments: ['new_users', 'trial_users'],
        status: 'sending',
        sentCount: 234,
        openCount: 160,
        clickCount: 30,
        bounceCount: 3,
        unsubscribeCount: 1,
        createdAt: '2024-01-25'
      },
      {
        id: '2',
        name: 'Monthly Newsletter - January',
        templateId: '2',
        subject: 'I tuoi insight CRM di Gennaio',
        targetSegments: ['active_users', 'premium_users'],
        status: 'sent',
        sentCount: 1456,
        openCount: 454,
        clickCount: 78,
        bounceCount: 12,
        unsubscribeCount: 8,
        createdAt: '2024-01-30'
      }
    ]);
  }, []);

  const handleCreateTemplate = async () => {
    if (!templateForm.prompt.trim()) return;
    
    try {
      const response = await generateEmailCampaign(templateForm.prompt, {
        category: templateForm.category,
        targetAudience: templateForm.targetAudience,
        goal: templateForm.goal,
        name: templateForm.name
      });
      
      if (response.success) {
        const newTemplate: EmailTemplate = {
          id: Date.now().toString(),
          name: templateForm.name,
          subject: response.data.emailContent?.subject || 'AI Generated Subject',
          category: templateForm.category,
          content: {
            html: response.data.emailContent?.body || '',
            text: response.data.emailContent?.body?.replace(/<[^>]*>/g, '') || ''
          },
          variables: response.data.personalizations || [],
          status: 'draft',
          createdAt: new Date().toISOString().split('T')[0],
          aiGenerated: true
        };
        
        setTemplates(prev => [newTemplate, ...prev]);
        setIsTemplateModalOpen(false);
        setTemplateForm({ name: '', category: 'marketing', targetAudience: '', goal: '', prompt: '' });
      }
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const DashboardTab = () => (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Email Inviate</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalSent.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Send className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+18.2%</span>
            <span className="text-gray-500 ml-1">vs mese scorso</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tasso Apertura</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.openRate}%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+3.4%</span>
            <span className="text-gray-500 ml-1">vs mese scorso</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tasso Click</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.clickRate}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+1.8%</span>
            <span className="text-gray-500 ml-1">vs mese scorso</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Iscritti Attivi</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.activeSubscribers.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+12.7%</span>
            <span className="text-gray-500 ml-1">vs mese scorso</span>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Performance Campagne</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {campaigns.map((campaign) => {
              const openRate = campaign.sentCount > 0 ? (campaign.openCount / campaign.sentCount * 100).toFixed(1) : '0';
              const clickRate = campaign.sentCount > 0 ? (campaign.clickCount / campaign.sentCount * 100).toFixed(1) : '0';
              
              return (
                <div key={campaign.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${
                      campaign.status === 'sending' ? 'bg-yellow-100' : 
                      campaign.status === 'sent' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <Mail className={`w-5 h-5 ${
                        campaign.status === 'sending' ? 'text-yellow-600' : 
                        campaign.status === 'sent' ? 'text-green-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{campaign.name}</p>
                      <p className="text-sm text-gray-600">
                        {campaign.sentCount} inviate • {openRate}% aperture • {clickRate}% click
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">ROI</p>
                      <p className="font-semibold text-green-600">+{(parseFloat(clickRate) * 15).toFixed(0)}%</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      campaign.status === 'sending' ? 'bg-yellow-100 text-yellow-700' :
                      campaign.status === 'sent' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {campaign.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const TemplatesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Template Email</h2>
        <button
          onClick={() => setIsTemplateModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nuovo Template</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{template.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  template.status === 'active' ? 'bg-green-100 text-green-700' :
                  template.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {template.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{template.subject}</p>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className={`px-2 py-1 rounded text-xs ${
                  template.category === 'marketing' ? 'bg-purple-100 text-purple-700' :
                  template.category === 'newsletter' ? 'bg-blue-100 text-blue-700' :
                  template.category === 'transactional' ? 'bg-green-100 text-green-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {template.category}
                </span>
                {template.aiGenerated && (
                  <span className="px-2 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded text-xs">
                    🤖 AI Generated
                  </span>
                )}
              </div>
            </div>
            <div className="p-4">
              {template.openRate !== undefined && (
                <div className="flex justify-between items-center text-sm mb-3">
                  <span className="text-gray-600">Performance:</span>
                  <div className="flex space-x-4">
                    <span className="text-green-600">{template.openRate}% open</span>
                    <span className="text-blue-600">{template.clickRate}% click</span>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Variabili:</span> {template.variables.join(', ')}
                </div>
                <div className="text-xs text-gray-400">
                  Creato il {new Date(template.createdAt).toLocaleDateString('it-IT')}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Template Creation Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Crea Nuovo Template Email</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome Template</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Es. Newsletter Mensile"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                <select
                  value={templateForm.category}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value as 'marketing' | 'transactional' | 'newsletter' | 'follow_up' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="marketing">Marketing</option>
                  <option value="newsletter">Newsletter</option>
                  <option value="transactional">Transactional</option>
                  <option value="follow_up">Follow-up</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                <input
                  type="text"
                  value={templateForm.targetAudience}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, targetAudience: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Es. Clienti premium, Nuovi utenti"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Obiettivo</label>
                <input
                  type="text"
                  value={templateForm.goal}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, goal: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Es. Aumentare engagement, Promuovere feature"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prompt per AI EmailGenius</label>
                <textarea
                  value={templateForm.prompt}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, prompt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                  placeholder="Descrivi l'email che vuoi creare, il tono, il contenuto e la call-to-action..."
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={handleCreateTemplate}
                disabled={isProcessing || !templateForm.prompt.trim()}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isProcessing ? 'Creazione...' : 'Crea con AI'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email Marketing</h1>
            <p className="text-gray-600">Campagne intelligenti con AI Genius</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            ✅ SMTP Configurato
          </span>
        </div>
      </div>

      {/* AI Agents Panel */}
      <div className="mb-8">
        <AIAgentsPanel 
          context="contacts" 
          contextData={{ 
            contacts: contacts || [],
            emailMetrics: metrics,
            templates: templates.length
          }} 
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-xl">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { id: 'templates', label: 'Templates', icon: Mail },
          { id: 'campaigns', label: 'Campagne', icon: Send },
          { id: 'segments', label: 'Segmenti', icon: Users },
          { id: 'settings', label: 'Impostazioni', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'dashboard' && <DashboardTab />}
      {activeTab === 'templates' && <TemplatesTab />}
      {activeTab === 'campaigns' && (
        <div className="text-center py-12">
          <Send className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Gestione Campagne</h3>
          <p className="text-gray-500">Sistema di campagne automatizzate in sviluppo</p>
        </div>
      )}
      {activeTab === 'segments' && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Segmentazione Intelligente</h3>
          <p className="text-gray-500">AI-powered audience segmentation coming soon</p>
        </div>
      )}
      {activeTab === 'settings' && (
        <div className="text-center py-12">
          <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Configurazione Email</h3>
          <p className="text-gray-500">SMTP settings e delivery configuration</p>
        </div>
      )}
    </div>
  );
};

export default EmailMarketingModule;