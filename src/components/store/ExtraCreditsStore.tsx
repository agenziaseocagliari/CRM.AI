// ===================================================================
// GUARDIAN AI CRM - EXTRA CREDITS STORE COMPONENT
// File: src/components/store/ExtraCreditsStore.tsx
// Componente per acquisto crediti extra con Stripe integration
// ===================================================================

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from '../../contexts/AuthContext';
import extraCreditsStoreService, { 
  type ExtraCreditsPackage as ExtraCreditsPackageType 
} from '../../lib/services/extraCreditsStoreService';
import { 
  SparklesIcon,
  MessageBotIcon,
  CheckCircleIcon,
  CreditCardIcon
} from '../ui/icons';

// Types per i crediti extra
interface ExtraCreditsPackage {
  id: string;
  name: string;
  display_name: string;
  credit_type: 'ai' | 'whatsapp' | 'email';
  credits_amount: number;
  price_cents: number;
  currency: string;
  cost_cents: number;
  margin_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Mock Stripe integration (in produzione usare Stripe Elements)
const processPayment = async (_packageInfo: ExtraCreditsPackage, _organizationId: string): Promise<boolean> => {
  // Simula chiamata Stripe
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // In produzione qui ci sarebbe:
  // 1. Stripe.confirmPayment()
  // 2. Webhook per conferma pagamento
  // 3. Aggiornamento database via server
  
  // Per ora simulo successo
  return Math.random() > 0.1; // 90% success rate per demo
};

const ExtraCreditsStore: React.FC = () => {
  const { session } = useAuth();
  const [packages, setPackages] = useState<ExtraCreditsPackageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  // TODO: Get proper organization ID from user profile
  const organizationId = session?.user?.id;

  useEffect(() => {
    loadExtraCreditsPackages();
  }, []);

  const loadExtraCreditsPackages = async () => {
    try {
      setLoading(true);
      const packages = await extraCreditsStoreService.getActivePackages();
      setPackages(packages);
    } catch (error) {
      console.error('Error loading packages:', error);
      toast.error('Errore nel caricamento dei pacchetti');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: ExtraCreditsPackageType) => {
    if (!organizationId) {
      toast.error('Devi essere loggato per acquistare crediti');
      return;
    }

    try {
      setPurchasing(pkg.id);
      
      // Step 1: Process payment with Stripe
      const paymentSuccess = await processPayment(pkg, organizationId);
      
      if (!paymentSuccess) {
        toast.error('Pagamento fallito. Riprova.');
        return;
      }

      // Step 2: Create payment intent and record purchase
      const { paymentIntentId } = await extraCreditsStoreService.createPaymentIntent(
        pkg.id, 
        organizationId
      );
      
      // Step 3: Confirm purchase
      await extraCreditsStoreService.confirmPurchase(paymentIntentId);

      // Success handled by service
      // Refresh packages balance
      await loadExtraCreditsPackages();
      
    } catch (error) {
      console.error('Error in purchase flow:', error);
      toast.error('Errore durante l&apos;acquisto');
    } finally {
      setPurchasing(null);
    }
  };

  const getCreditIcon = (creditType: string) => {
    switch (creditType) {
      case 'ai': return <SparklesIcon className="h-6 w-6 text-purple-500" />;
      case 'whatsapp': return <MessageBotIcon className="h-6 w-6 text-green-500" />;
      case 'email': return <CheckCircleIcon className="h-6 w-6 text-blue-500" />;
      default: return <SparklesIcon className="h-6 w-6 text-blue-500" />;
    }
  };

  const getCreditColor = (creditType: string) => {
    switch (creditType) {
      case 'ai': return 'purple';
      case 'whatsapp': return 'green';
      case 'email': return 'blue';
      default: return 'blue';
    }
  };

  const formatPrice = (cents: number) => `€${(cents / 100).toFixed(2)}`;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Group packages by credit type
  const packagesByType = packages.reduce((acc, pkg) => {
    if (!acc[pkg.credit_type]) {
      acc[pkg.credit_type] = [];
    }
    acc[pkg.credit_type].push(pkg);
    return acc;
  }, {} as Record<string, ExtraCreditsPackageType[]>);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
          <SparklesIcon className="h-8 w-8 text-blue-500" />
          Store Crediti Extra
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          Acquista crediti aggiuntivi quando ne hai bisogno
        </p>
        <p className="text-sm text-gray-500">
          Margini ottimizzati 75-86% • Scadenza 12 mesi • Consumo automatico FIFO
        </p>
      </div>

      {/* Credits Packages by Type */}
      {Object.entries(packagesByType).map(([creditType, pkgs]) => (
        <div key={creditType} className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            {getCreditIcon(creditType)}
            <h2 className="text-2xl font-bold text-gray-900 capitalize">
              {creditType === 'ai' ? 'AI Credits' : 
               creditType === 'whatsapp' ? 'WhatsApp Credits' : 
               'Email Credits'}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pkgs.map((pkg) => {
              const color = getCreditColor(pkg.credit_type);
              const isPurchasing = purchasing === pkg.id;
              
              return (
                <div key={pkg.id} className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
                  {/* Package Header */}
                  <div className={`bg-${color}-50 border-b border-${color}-100 p-6 text-center`}>
                    <div className="flex justify-center mb-3">
                      {getCreditIcon(pkg.credit_type)}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {pkg.display_name}
                    </h3>
                    <div className="mb-3">
                      <span className={`text-3xl font-bold text-${color}-600`}>
                        {formatPrice(pkg.price_cents)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {pkg.credits_amount.toLocaleString()} crediti
                    </p>
                  </div>

                  {/* Package Details */}
                  <div className="p-6">
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Crediti:</span>
                        <span className="font-medium">{pkg.credits_amount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Prezzo per credito:</span>
                        <span className="font-medium">€{(pkg.price_cents / pkg.credits_amount / 100).toFixed(4)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Margine:</span>
                        <span className={`font-medium text-${color}-600`}>
                          {pkg.margin_percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Scadenza:</span>
                        <span className="font-medium">12 mesi</span>
                      </div>
                    </div>

                    {/* Purchase Button */}
                    <button
                      onClick={() => handlePurchase(pkg)}
                      disabled={isPurchasing}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                        isPurchasing
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : `bg-${color}-600 hover:bg-${color}-700 text-white`
                      }`}
                    >
                      {isPurchasing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Elaborando...
                        </>
                      ) : (
                        <>
                          <CreditCardIcon className="h-4 w-4" />
                          Acquista Ora
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {packages.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Nessun pacchetto crediti disponibile al momento.</p>
        </div>
      )}

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-12">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          ℹ️ Come Funzionano i Crediti Extra
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">✅ Consumo Automatico</h4>
            <p>I crediti extra vengono consumati automaticamente quando superi i limiti dell&apos;abbonamento.</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">🔄 Logica FIFO</h4>
            <p>I crediti più vecchi vengono consumati per primi, ottimizzando la durata.</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">📅 Scadenza 12 Mesi</h4>
            <p>Tutti i crediti extra scadono dopo 12 mesi dall&apos;acquisto.</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">💰 Margini Ottimizzati</h4>
            <p>Prezzi studiati per garantire sostenibilità con margini 75-86%.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtraCreditsStore;