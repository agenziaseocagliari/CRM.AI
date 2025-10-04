// ===================================================================
// GUARDIAN AI CRM - PRICING PAGE COMPONENT (SIMPLIFIED)
// File: src/components/pricing/PricingPage.tsx
// Componente semplificato per visualizzare i 5 tier e store crediti extra
// ===================================================================

import React, { useState } from 'react';
import { 
  CheckCircleIcon,
  SparklesIcon,
  MessageBotIcon
} from '../ui/icons';

// Types per i tier
interface SubscriptionTier {
  id: string;
  name: string;
  display_name: string;
  price_cents: number;
  ai_requests_limit: number;
  whatsapp_messages_limit: number;
  email_marketing_limit: number;
  contacts_limit: number;
  storage_limit_gb: number;
  description: string;
  popular?: boolean;
  enterprise?: boolean;
  features: string[];
}

interface ExtraCreditsPackage {
  id: string;
  display_name: string;
  credit_type: 'ai' | 'whatsapp' | 'email';
  credits_amount: number;
  price_cents: number;
  margin_percentage: number;
}

// Mock data per i 5 tier ottimizzati
const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'starter',
    name: 'starter',
    display_name: 'Starter',
    price_cents: 1900, // €19
    ai_requests_limit: 200,
    whatsapp_messages_limit: 150,
    email_marketing_limit: 1000,
    contacts_limit: 500,
    storage_limit_gb: 2,
    description: 'Perfetto per freelancer e piccole attività',
    features: ['200 AI richieste', '150 WhatsApp', '1k Email', '500 Contatti', '2GB Storage']
  },
  {
    id: 'professional',
    name: 'professional',
    display_name: 'Professional',
    price_cents: 3900, // €39
    ai_requests_limit: 400,
    whatsapp_messages_limit: 300,
    email_marketing_limit: 3000,
    contacts_limit: 2000,
    storage_limit_gb: 10,
    description: 'Ideale per PMI che vogliono automatizzare',
    popular: true,
    features: ['400 AI richieste', '300 WhatsApp', '3k Email', '2k Contatti', '10GB Storage', 'AI Avanzato']
  },
  {
    id: 'business',
    name: 'business',
    display_name: 'Business',
    price_cents: 7900, // €79
    ai_requests_limit: 800,
    whatsapp_messages_limit: 600,
    email_marketing_limit: 8000,
    contacts_limit: 10000,
    storage_limit_gb: 50,
    description: 'Per aziende in crescita con team strutturati',
    features: ['800 AI richieste', '600 WhatsApp', '8k Email', '10k Contatti', '50GB Storage', 'Supporto Prioritario', 'Integrazioni Custom']
  },
  {
    id: 'premium',
    name: 'premium',
    display_name: 'Premium',
    price_cents: 14900, // €149
    ai_requests_limit: 1500,
    whatsapp_messages_limit: 1200,
    email_marketing_limit: 20000,
    contacts_limit: 50000,
    storage_limit_gb: 200,
    description: 'Per aziende enterprise con esigenze avanzate',
    features: ['1.5k AI richieste', '1.2k WhatsApp', '20k Email', '50k Contatti', '200GB Storage', 'Super Admin', 'API Complete']
  },
  {
    id: 'enterprise',
    name: 'enterprise',
    display_name: 'Enterprise',
    price_cents: -1, // Custom
    ai_requests_limit: -1, // Unlimited
    whatsapp_messages_limit: -1,
    email_marketing_limit: -1,
    contacts_limit: -1,
    storage_limit_gb: -1,
    description: 'Soluzione personalizzata per grandi organizzazioni',
    enterprise: true,
    features: ['Crediti Illimitati', 'Account Manager Dedicato', 'SLA Personalizzato', 'Integrazione On-Premise', 'Supporto 24/7']
  }
];

// Mock data per crediti extra
const EXTRA_CREDITS_PACKAGES: ExtraCreditsPackage[] = [
  // AI Credits
  { id: 'ai_100', display_name: '100 AI Credits', credit_type: 'ai', credits_amount: 100, price_cents: 800, margin_percentage: 85 },
  { id: 'ai_500', display_name: '500 AI Credits', credit_type: 'ai', credits_amount: 500, price_cents: 3500, margin_percentage: 83 },
  { id: 'ai_1000', display_name: '1000 AI Credits', credit_type: 'ai', credits_amount: 1000, price_cents: 6500, margin_percentage: 82 },
  
  // WhatsApp Credits
  { id: 'whatsapp_100', display_name: '100 WhatsApp Credits', credit_type: 'whatsapp', credits_amount: 100, price_cents: 500, margin_percentage: 86 },
  { id: 'whatsapp_500', display_name: '500 WhatsApp Credits', credit_type: 'whatsapp', credits_amount: 500, price_cents: 2000, margin_percentage: 83 },
  { id: 'whatsapp_1000', display_name: '1000 WhatsApp Credits', credit_type: 'whatsapp', credits_amount: 1000, price_cents: 3500, margin_percentage: 80 },
  
  // Email Credits
  { id: 'email_5000', display_name: '5,000 Email Credits', credit_type: 'email', credits_amount: 5000, price_cents: 1000, margin_percentage: 80 },
  { id: 'email_10000', display_name: '10,000 Email Credits', credit_type: 'email', credits_amount: 10000, price_cents: 1800, margin_percentage: 78 },
  { id: 'email_25000', display_name: '25,000 Email Credits', credit_type: 'email', credits_amount: 25000, price_cents: 4000, margin_percentage: 75 }
];

const PricingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'credits'>('subscriptions');
  const [isAnnual, setIsAnnual] = useState(false);

  // Helper functions
  const formatPrice = (cents: number): string => {
    if (cents === -1) return 'Custom';
    return `€${(cents / 100).toFixed(0)}`;
  };

  const getTierIcon = (tierName: string) => {
    switch (tierName) {
      case 'starter': return <SparklesIcon className="h-8 w-8 text-blue-500" />;
      case 'professional': return <CheckCircleIcon className="h-8 w-8 text-green-500" />;
      case 'business': return <MessageBotIcon className="h-8 w-8 text-purple-500" />;
      case 'premium': return <SparklesIcon className="h-8 w-8 text-orange-500" />;
      case 'enterprise': return <SparklesIcon className="h-8 w-8 text-red-500" />;
      default: return <SparklesIcon className="h-8 w-8 text-blue-500" />;
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Scegli il Piano Perfetto per la Tua Azienda
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Automatizza marketing e vendite con margini del 80%+ per la crescita sostenibile
          </p>
          
          {/* Annual/Monthly Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm ${!isAnnual ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
              Mensile
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isAnnual ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAnnual ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm ${isAnnual ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
              Annuale
            </span>
            {isAnnual && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                -20%
              </span>
            )}
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'subscriptions'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Piani Abbonamento
            </button>
            <button
              onClick={() => setActiveTab('credits')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'credits'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Crediti Extra
            </button>
          </div>
        </div>

        {/* Subscription Tiers */}
        {activeTab === 'subscriptions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
            {SUBSCRIPTION_TIERS.map((tier) => (
              <div 
                key={tier.id} 
                className={`relative bg-white rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl ${
                  tier.popular 
                    ? 'ring-2 ring-blue-500 scale-105' 
                    : tier.enterprise 
                      ? 'ring-2 ring-purple-500' 
                      : 'hover:ring-1 hover:ring-gray-300'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Più Popolare
                  </div>
                )}
                {tier.enterprise && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Enterprise
                  </div>
                )}
                
                <div className="p-6">
                  {/* Header */}
                  <div className="text-center mb-6">
                    <div className="flex justify-center mb-3">
                      {getTierIcon(tier.name)}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{tier.display_name}</h3>
                    <div className="mb-3">
                      <span className="text-3xl font-bold text-gray-900">
                        {formatPrice(isAnnual && tier.price_cents > 0 ? Math.round(tier.price_cents * 0.8) : tier.price_cents)}
                      </span>
                      {tier.price_cents > 0 && (
                        <span className="text-gray-500 text-sm">/mese</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{tier.description}</p>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    {tier.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <button 
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                      tier.popular 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : tier.enterprise 
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300'
                    }`}
                  >
                    {tier.enterprise ? 'Contattaci' : 'Inizia Ora'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Extra Credits Store */}
        {activeTab === 'credits' && (
          <div>
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Crediti Extra - Margini Ottimizzati 80%+
              </h2>
              <p className="text-gray-600">
                Acquista crediti aggiuntivi quando ne hai bisogno. Scadenza 12 mesi.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* AI Credits */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <SparklesIcon className="h-5 w-5 text-purple-500" />
                  AI Credits
                </h3>
                <div className="space-y-4">
                  {EXTRA_CREDITS_PACKAGES.filter(pkg => pkg.credit_type === 'ai').map((pkg) => (
                    <div key={pkg.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{pkg.display_name}</h4>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {pkg.margin_percentage}% margine
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-purple-600 mb-3">
                        {formatPrice(pkg.price_cents)}
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        {pkg.credits_amount.toLocaleString()} crediti AI
                      </p>
                      <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors">
                        Acquista
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* WhatsApp Credits */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MessageBotIcon className="h-5 w-5 text-green-500" />
                  WhatsApp Credits
                </h3>
                <div className="space-y-4">
                  {EXTRA_CREDITS_PACKAGES.filter(pkg => pkg.credit_type === 'whatsapp').map((pkg) => (
                    <div key={pkg.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{pkg.display_name}</h4>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {pkg.margin_percentage}% margine
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-green-600 mb-3">
                        {formatPrice(pkg.price_cents)}
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        {pkg.credits_amount.toLocaleString()} messaggi WhatsApp
                      </p>
                      <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors">
                        Acquista
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Email Credits */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-blue-500" />
                  Email Credits
                </h3>
                <div className="space-y-4">
                  {EXTRA_CREDITS_PACKAGES.filter(pkg => pkg.credit_type === 'email').map((pkg) => (
                    <div key={pkg.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{pkg.display_name}</h4>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {pkg.margin_percentage}% margine
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-blue-600 mb-3">
                        {formatPrice(pkg.price_cents)}
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        {pkg.credits_amount.toLocaleString()} email marketing
                      </p>
                      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors">
                        Acquista
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="text-center mt-16 p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Pronto per Iniziare?
          </h2>
          <p className="text-gray-600 mb-6">
            Unisciti a migliaia di aziende che hanno automatizzato marketing e vendite con Guardian AI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-8 rounded-lg font-medium transition-colors">
              Prova Gratuita 14 Giorni
            </button>
            <button className="bg-white hover:bg-gray-50 text-gray-900 py-3 px-8 rounded-lg font-medium border border-gray-300 transition-colors flex items-center gap-2 justify-center">
              📞 Prenota Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;