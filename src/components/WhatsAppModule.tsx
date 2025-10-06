// WhatsApp Business Module - Guardian AI CRM Enterprise
// Modulo avanzato per automazione WhatsApp con AI Butler

import { Clock, MessageCircle, Plus, Send, Settings, TrendingUp, Users, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useCrmData } from '../hooks/useCrmData';
import { useWhatsAppButlerAI } from '../lib/ai/useAIOrchestrator';
import { UniversalAIChat } from './ai/UniversalAIChat';

interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'marketing' | 'utility' | 'authentication';
  status: 'approved' | 'pending' | 'rejected';
  language: string;
  components: {
    type: 'header' | 'body' | 'footer' | 'buttons';
    text?: string;
    format?: 'text' | 'media' | 'location';
    buttons?: Array<{
      type: 'quick_reply' | 'url' | 'phone_number';
      text: string;
      url?: string;
      phone_number?: string;
    }>;
  }[];
  createdAt: string;
  aiGenerated: boolean;
}

interface WhatsAppCampaign {
  id: string;
  name: string;
  templateId: string;
  targetContacts: string[];
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'paused';
  scheduledAt?: string;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  repliedCount: number;
  createdAt: string;
}

interface WhatsAppMetrics {
  totalSent: number;
  deliveryRate: number;
  readRate: number;
  replyRate: number;
  activeContacts: number;
  templatesCount: number;
  campaignsActive: number;
}

const WhatsAppModule: React.FC = () => {
  const contextData = useOutletContext<ReturnType<typeof useCrmData>>();

  const { generateWhatsAppTemplate, isProcessing } = useWhatsAppButlerAI();
  
  // States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'templates' | 'campaigns' | 'contacts' | 'settings'>('dashboard');
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<WhatsAppCampaign[]>([]);
  const [metrics] = useState<WhatsAppMetrics>({
    totalSent: 1247,
    deliveryRate: 98.5,
    readRate: 76.8,
    replyRate: 23.4,
    activeContacts: 856,
    templatesCount: 12,
    campaignsActive: 3
  });
  
  // Template creation modal
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState<{
    name: string;
    category: 'marketing' | 'utility' | 'authentication';
    language: string;
    prompt: string;
  }>({
    name: '',
    category: 'marketing',
    language: 'it',
    prompt: ''
  });

  // Load mock data
  useEffect(() => {
    setTemplates([
      {
        id: '1',
        name: 'Benvenuto Nuovo Cliente',
        category: 'utility',
        status: 'approved',
        language: 'it',
        components: [
          {
            type: 'header',
            text: 'Benvenuto in Guardian AI!'
          },
          {
            type: 'body',
            text: 'Ciao {{1}}, grazie per esserti registrato. Il tuo account è pronto e puoi iniziare subito ad utilizzare il nostro CRM.'
          },
          {
            type: 'footer',
            text: 'Guardian AI - Il tuo CRM intelligente'
          },
          {
            type: 'buttons',
            buttons: [
              { type: 'url', text: 'Accedi alla Dashboard', url: 'https://guardian-ai.com/dashboard' },
              { type: 'quick_reply', text: 'Supporto' }
            ]
          }
        ],
        createdAt: '2024-01-15',
        aiGenerated: false
      },
      {
        id: '2',
        name: 'Follow-up Opportunità',
        category: 'marketing',
        status: 'approved',
        language: 'it',
        components: [
          {
            type: 'body',
            text: 'Ciao {{1}}, volevo fare il punto sulla tua opportunità "{{2}}". Hai avuto modo di valutare la nostra proposta? Sono disponibile per qualsiasi chiarimento.'
          },
          {
            type: 'buttons',
            buttons: [
              { type: 'quick_reply', text: 'Sì, parliamone' },
              { type: 'quick_reply', text: 'Ho bisogno di più tempo' },
              { type: 'quick_reply', text: 'Non interessato' }
            ]
          }
        ],
        createdAt: '2024-01-10',
        aiGenerated: true
      }
    ]);

    setCampaigns([
      {
        id: '1',
        name: 'Welcome Campaign Q1',
        templateId: '1',
        targetContacts: ['contact1', 'contact2'],
        status: 'running',
        sentCount: 156,
        deliveredCount: 154,
        readCount: 89,
        repliedCount: 23,
        createdAt: '2024-01-20'
      }
    ]);
  }, []);

  const handleCreateTemplate = async () => {
    if (!templateForm.prompt.trim()) return;
    
    try {
      const response = await generateWhatsAppTemplate(templateForm.prompt, {
        category: templateForm.category,
        language: templateForm.language,
        name: templateForm.name
      });
      
      if (response.success) {
        // Add new template to list
        const responseData = response.data as {
          components?: unknown[];
          messageTemplate?: string;
          automationFlow?: unknown[];
          complianceChecks?: unknown[];
        };
        const newTemplate: WhatsAppTemplate = {
          id: Date.now().toString(),
          name: templateForm.name,
          category: templateForm.category,
          status: 'pending',
          language: templateForm.language,
          components: (responseData?.components as WhatsAppTemplate['components']) || [],
          createdAt: new Date().toISOString().split('T')[0],
          aiGenerated: true
        };
        
        setTemplates(prev => [newTemplate, ...prev]);
        setIsTemplateModalOpen(false);
        setTemplateForm({ name: '', category: 'marketing', language: 'it', prompt: '' });
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
              <p className="text-sm text-gray-600">Messaggi Inviati</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalSent.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Send className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+12.5%</span>
            <span className="text-gray-500 ml-1">vs mese scorso</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tasso Consegna</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.deliveryRate}%</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+2.1%</span>
            <span className="text-gray-500 ml-1">vs mese scorso</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tasso Lettura</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.readRate}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+5.8%</span>
            <span className="text-gray-500 ml-1">vs mese scorso</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Contatti Attivi</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.activeContacts}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+8.3%</span>
            <span className="text-gray-500 ml-1">vs mese scorso</span>
          </div>
        </div>
      </div>

      {/* Recent Campaigns */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Campagne Recenti</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${
                    campaign.status === 'running' ? 'bg-green-100' : 
                    campaign.status === 'completed' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <MessageCircle className={`w-5 h-5 ${
                      campaign.status === 'running' ? 'text-green-600' : 
                      campaign.status === 'completed' ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{campaign.name}</p>
                    <p className="text-sm text-gray-600">
                      {campaign.sentCount} inviati • {campaign.readCount} letti
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  campaign.status === 'running' ? 'bg-green-100 text-green-700' :
                  campaign.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {campaign.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const TemplatesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Template WhatsApp</h2>
        <button
          onClick={() => setIsTemplateModalOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
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
                  template.status === 'approved' ? 'bg-green-100 text-green-700' :
                  template.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {template.status}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className={`px-2 py-1 rounded text-xs ${
                  template.category === 'marketing' ? 'bg-purple-100 text-purple-700' :
                  template.category === 'utility' ? 'bg-blue-100 text-blue-700' :
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
              <div className="space-y-2 text-sm">
                {template.components.map((component, index) => (
                  <div key={index} className={`p-2 rounded ${
                    component.type === 'header' ? 'bg-blue-50' :
                    component.type === 'body' ? 'bg-gray-50' :
                    component.type === 'footer' ? 'bg-gray-100' :
                    'bg-green-50'
                  }`}>
                    <span className="font-medium text-xs text-gray-600 uppercase">
                      {component.type}
                    </span>
                    <p className="text-gray-800 mt-1">{component.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Template Creation Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Crea Nuovo Template</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome Template</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Es. Benvenuto cliente"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                <select
                  value={templateForm.category}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value as 'marketing' | 'utility' | 'authentication' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="marketing">Marketing</option>
                  <option value="utility">Utility</option>
                  <option value="authentication">Authentication</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prompt per AI</label>
                <textarea
                  value={templateForm.prompt}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, prompt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows={4}
                  placeholder="Descrivi il template che vuoi creare..."
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
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
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
          <div className="p-3 bg-green-100 rounded-xl">
            <MessageCircle className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">WhatsApp Business</h1>
            <p className="text-gray-600">Automazione messaggi con AI Butler</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            ✅ API Connessa
          </span>
        </div>
      </div>

      {/* AI Agents Panel - REMOVED: Too cluttered, replaced with integrated WhatsAppButler chat */}

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-xl">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
          { id: 'templates', label: 'Templates', icon: MessageCircle },
          { id: 'campaigns', label: 'Campagne', icon: Send },
          { id: 'contacts', label: 'Contatti', icon: Users },
          { id: 'settings', label: 'Impostazioni', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-green-600 shadow-sm'
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
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Campagne in sviluppo</h3>
          <p className="text-gray-500">Funzionalità in arrivo nella prossima versione</p>
        </div>
      )}
      {activeTab === 'contacts' && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Gestione contatti WhatsApp</h3>
          <p className="text-gray-500">Integrazione con il modulo Contatti esistente</p>
        </div>
      )}
      {activeTab === 'settings' && (
        <div className="text-center py-12">
          <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Impostazioni WhatsApp</h3>
          <p className="text-gray-500">Configurazione API e webhook</p>
        </div>
      )}

      {/* Universal AI Chat - WhatsApp Butler */}
      <UniversalAIChat
        currentModule="WhatsApp"
        organizationId={contextData?.organization?.id || 'demo-org'}
        userId="demo-user"
        onActionTriggered={(action, data) => {
          console.log('WhatsApp AI Action:', action, data);
          // Handle AI actions (template creation, campaign setup, etc.)
        }}
      />
    </div>
  );
};

export default WhatsAppModule;