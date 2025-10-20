import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car, Home, Heart, Plane, Shield, Briefcase,
  AlertTriangle, CheckCircle, ArrowRight, TrendingUp
} from 'lucide-react';

interface RecommendedProduct {
  type: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimated_premium: number;
  coverage_amount?: number;
  exclusions?: string[];
  description?: string;
}

interface RecommendedProductsProps {
  products: RecommendedProduct[];
  riskCategory: 'low' | 'medium' | 'high' | 'very_high';
  contactId?: string;
}

const PRODUCT_ICONS: Record<string, React.ReactNode> = {
  auto: <Car className="w-6 h-6" />,
  home: <Home className="w-6 h-6" />,
  life: <Heart className="w-6 h-6" />,
  health: <Heart className="w-6 h-6" />,
  travel: <Plane className="w-6 h-6" />,
  liability: <Shield className="w-6 h-6" />,
  professional: <Briefcase className="w-6 h-6" />,
};

const PRIORITY_CONFIG = {
  critical: {
    label: 'CRITICO',
    color: 'bg-red-600 text-white',
    badgeColor: 'bg-red-100 text-red-800 border-red-300',
    description: 'Fortemente raccomandato per il profilo di rischio'
  },
  high: {
    label: 'ALTA',
    color: 'bg-orange-500 text-white',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
    description: 'Consigliato per migliorare la copertura'
  },
  medium: {
    label: 'MEDIA',
    color: 'bg-yellow-500 text-white',
    badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    description: 'Opzione da considerare'
  },
  low: {
    label: 'BASSA',
    color: 'bg-gray-500 text-white',
    badgeColor: 'bg-gray-100 text-gray-800 border-gray-300',
    description: 'Opzionale in base alle esigenze'
  }
};

const PRODUCT_NAMES: Record<string, string> = {
  auto: 'Polizza Auto',
  home: 'Polizza Casa',
  life: 'Assicurazione Vita',
  health: 'Assicurazione Salute',
  travel: 'Assicurazione Viaggi',
  liability: 'Responsabilità Civile',
  professional: 'Polizza Professionale'
};

const PRODUCT_DESCRIPTIONS: Record<string, string> = {
  auto: 'Protezione completa per il tuo veicolo con copertura RC, furto e incendio',
  home: 'Tutela la tua abitazione da danni, furti e responsabilità civile',
  life: 'Sicurezza finanziaria per i tuoi cari in caso di eventi imprevisti',
  health: 'Accesso a cure mediche private e rimborso spese sanitarie',
  travel: 'Viaggia sereno con assistenza medica e protezione bagaglio',
  liability: 'Protezione per danni causati involontariamente a terzi',
  professional: 'Copertura per rischi professionali e responsabilità lavorativa'
};

export default function RecommendedProducts({ products, riskCategory, contactId }: RecommendedProductsProps) {
  const navigate = useNavigate();

  // Sort products by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedProducts = [...products].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  const handleRequestQuote = (productType: string) => {
    // Navigate to quote request form (to be implemented)
    if (contactId) {
      navigate(`/dashboard/assicurazioni/preventivi/nuovo?contact=${contactId}&product=${productType}`);
    } else {
      alert('Seleziona un contatto prima di richiedere un preventivo');
    }
  };

  const getRiskMessage = () => {
    switch (riskCategory) {
      case 'low':
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          message: 'Profilo eccellente: accesso a tutte le coperture con premi vantaggiosi'
        };
      case 'medium':
        return {
          icon: <TrendingUp className="w-5 h-5 text-yellow-600" />,
          message: 'Profilo standard: buone opzioni assicurative disponibili'
        };
      case 'high':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-orange-600" />,
          message: 'Profilo che richiede valutazione: alcune limitazioni potrebbero applicarsi'
        };
      case 'very_high':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
          message: 'Profilo ad alto rischio: coperture limitate con premi maggiorati'
        };
    }
  };

  const riskMessage = getRiskMessage();

  if (!products || products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Prodotti Raccomandati</h2>
        <div className="text-center py-8 text-gray-500">
          <Shield className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>Nessun prodotto disponibile per questo profilo</p>
          <p className="text-sm mt-2">Contatta un consulente per maggiori informazioni</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Risk Message */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Prodotti Assicurativi Raccomandati</h2>
        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
          {riskMessage.icon}
          <div>
            <p className="font-semibold">Analisi Profilo</p>
            <p className="text-gray-700">{riskMessage.message}</p>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedProducts.map((product, index) => {
          const priorityConfig = PRIORITY_CONFIG[product.priority];
          const productIcon = PRODUCT_ICONS[product.type] || <Shield className="w-6 h-6" />;
          const productName = PRODUCT_NAMES[product.type] || product.type;
          const productDescription = PRODUCT_DESCRIPTIONS[product.type] || product.description || '';

          return (
            <div
              key={`${product.type}-${index}`}
              className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-transparent hover:border-blue-300 transition-all"
            >
              {/* Priority Badge */}
              <div className={`px-4 py-2 ${priorityConfig.color} flex items-center justify-between`}>
                <span className="font-bold text-sm">{priorityConfig.label} PRIORITÀ</span>
                {productIcon}
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{productName}</h3>
                <p className="text-gray-600 text-sm mb-4">{productDescription}</p>

                {/* Premium */}
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600">Premio Stimato</p>
                  <p className="text-3xl font-bold text-blue-600">
                    €{product.estimated_premium.toLocaleString('it-IT')}
                    <span className="text-base text-gray-600">/anno</span>
                  </p>
                  {product.coverage_amount && (
                    <p className="text-sm text-gray-500 mt-1">
                      Massimale: €{product.coverage_amount.toLocaleString('it-IT')}
                    </p>
                  )}
                </div>

                {/* Exclusions */}
                {product.exclusions && product.exclusions.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      Esclusioni
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {product.exclusions.slice(0, 3).map((exclusion, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-orange-500 mt-0.5">•</span>
                          <span>{exclusion}</span>
                        </li>
                      ))}
                      {product.exclusions.length > 3 && (
                        <li className="text-gray-500 italic">
                          +{product.exclusions.length - 3} altre esclusioni
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={() => handleRequestQuote(product.type)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors ${
                    product.priority === 'critical' || product.priority === 'high'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Richiedi Preventivo
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Footer Note */}
              <div className="px-6 py-3 bg-gray-50 border-t">
                <p className="text-xs text-gray-500">{priorityConfig.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6 border border-blue-200">
        <div className="flex items-start gap-4">
          <div className="bg-blue-600 rounded-full p-3">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-2">Consulenza Personalizzata</h3>
            <p className="text-gray-700 mb-3">
              Hai bisogno di aiuto per scegliere la soluzione migliore? 
              I nostri consulenti sono a tua disposizione per una valutazione gratuita.
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
                Prenota Consulenza
              </button>
              <button className="px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 font-semibold">
                Confronta Prodotti
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-xs text-gray-600">
          <strong>Nota:</strong> I premi indicati sono puramente indicativi e soggetti a variazione in base a:
          verifiche mediche, analisi documentale, condizioni di mercato e politiche della compagnia assicurativa.
          Per un preventivo definitivo è necessaria una valutazione completa.
        </p>
      </div>
    </div>
  );
}
