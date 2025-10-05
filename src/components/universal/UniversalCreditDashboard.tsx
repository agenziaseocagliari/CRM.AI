import React, { useState, useEffect, useCallback } from 'react';
import { UniversalAccessManager, TIER_DISPLAY_CONFIG } from '../../lib/universalAccess';
import { 
  Zap, 
  Mail, 
  MessageCircle, 
  FileText, 
  Calendar, 
  Target,
  Users,
  Sparkles,
  Infinity,
  TrendingUp,
  CheckCircle
} from 'lucide-react';

interface CreditStats {
  used: number;
  limit: number;
  percentage: number;
  resetDate: string;
}

interface UserCreditData {
  userId: string;
  tier: 'freelancer' | 'startup' | 'business' | 'enterprise';
  credits: {
    [key: string]: CreditStats;
  };
}

const CREDIT_ICONS = {
  ai_requests: Sparkles,
  email_campaigns: Mail,
  whatsapp_messages: MessageCircle,
  form_submissions: FileText,
  calendar_bookings: Calendar,
  opportunities: Target,
  contacts: Users
};

export function UniversalCreditDashboard() {
  const [creditData, setCreditData] = useState<UserCreditData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCreditData = useCallback(async () => {
    try {
      // Simulate loading user credit data
      const mockData: UserCreditData = {
        userId: 'webproseoid@gmail.com',
        tier: 'enterprise',
        credits: {
          ai_requests: { used: 847, limit: -1, percentage: 0, resetDate: '2024-02-01' },
          email_campaigns: { used: 23, limit: -1, percentage: 0, resetDate: '2024-02-01' },
          whatsapp_messages: { used: 156, limit: -1, percentage: 0, resetDate: '2024-02-01' },
          form_submissions: { used: 89, limit: -1, percentage: 0, resetDate: '2024-02-01' },
          calendar_bookings: { used: 34, limit: -1, percentage: 0, resetDate: '2024-02-01' },
          opportunities: { used: 278, limit: -1, percentage: 0, resetDate: '2024-02-01' },
          contacts: { used: 1456, limit: -1, percentage: 0, resetDate: '2024-02-01' }
        }
      };

      setCreditData(mockData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading credit data:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCreditData();
  }, [loadCreditData]);

  const handleUpgrade = () => {
    alert("🚀 SuperAdmin AI processerà automaticamente l'upgrade del tuo account");
  };

  const formatCreditDisplay = (credit: CreditStats) => {
    if (credit.limit === -1) {
      return {
        display: `${credit.used.toLocaleString()} / ∞`,
        isUnlimited: true
      };
    }
    return {
      display: `${credit.used.toLocaleString()} / ${credit.limit.toLocaleString()}`,
      isUnlimited: false
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 animate-pulse text-purple-600" />
          <span>Caricamento crediti universali...</span>
        </div>
      </div>
    );
  }

  if (!creditData) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Impossibile caricare i dati dei crediti</p>
      </div>
    );
  }

  const tierConfig = TIER_DISPLAY_CONFIG[creditData.tier];

  return (
    <div className="space-y-6 p-6">
      {/* Header with Tier Info */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <Infinity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">🌍 Sistema Credits Universale</h2>
              <p className="text-gray-600">
                Tutti i moduli disponibili per tutti i tier - Solo i crediti variano
              </p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full ${tierConfig.color}`}>
            {tierConfig.badge}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">{tierConfig.description}</p>
          {creditData.tier !== 'enterprise' && (
            <button 
              onClick={handleUpgrade}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white 
                         rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors
                         flex items-center space-x-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Upgrade Automatico</span>
            </button>
          )}
        </div>
      </div>

      {/* Universal Access Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-500 rounded-full">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-green-800">✅ Accesso Universale Attivo</h3>
            <p className="text-sm text-green-700">
              Tutti i moduli e AI Agents sono disponibili per il tuo tier. Solo i limiti di utilizzo variano.
            </p>
          </div>
        </div>
      </div>

      {/* Credit Usage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(creditData.credits).map(([creditType, credit]) => {
          const IconComponent = CREDIT_ICONS[creditType as keyof typeof CREDIT_ICONS] || Zap;
          const creditDisplay = formatCreditDisplay(credit);
          
          return (
            <div key={creditType} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-3">
                <IconComponent className="w-5 h-5 text-purple-600" />
                <h4 className="text-sm font-medium capitalize">
                  {creditType.replace('_', ' ')}
                </h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {creditDisplay.display}
                  </span>
                  {creditDisplay.isUnlimited && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                      Unlimited
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {creditDisplay.isUnlimited ? 
                    'Utilizzo illimitato con il tuo tier' : 
                    `Reset: ${new Date(credit.resetDate).toLocaleDateString()}`
                  }
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Available Modules */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Moduli Disponibili (Accesso Universale)</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {UniversalAccessManager.getAvailableModules(creditData.tier).map((module) => (
            <div key={module} className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg border border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium capitalize text-green-800">
                {module.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Available AI Agents */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">AI Agents Disponibili (Accesso Universale)</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {UniversalAccessManager.getAvailableAIAgents(creditData.tier).map((agent) => (
            <div key={agent} className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-800">
                {agent}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}