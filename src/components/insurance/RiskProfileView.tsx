import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import RecommendedProducts from './RecommendedProducts';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import {
  Heart, DollarSign, Activity, Shield, Download,
  TrendingUp, TrendingDown, Clock, AlertCircle, FileText
} from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface RiskProfile {
  id: string;
  contact_id: string;
  age: number;
  gender: string;
  profession: string;
  health_score: number;
  financial_score: number;
  lifestyle_score: number;
  total_risk_score: number;
  risk_category: 'low' | 'medium' | 'high' | 'very_high';
  recommended_products: Array<{
    type: string;
    priority: string;
    estimated_premium: number;
    coverage_amount?: number;
    exclusions?: string[];
  }>;
  assessment_date: string;
  valid_until: string;
  notes?: string;
  contact: {
    name: string;
    email?: string;
  };
}

interface HistoryEntry {
  id: string;
  assessment_date: string;
  total_risk_score: number;
  risk_category: string;
  score_change: number;
}

const RISK_CATEGORY_CONFIG = {
  low: {
    label: 'Basso Rischio',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: '🟢',
    description: 'Profilo eccellente con rischio minimale'
  },
  medium: {
    label: 'Rischio Medio',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: '🟡',
    description: 'Profilo standard con alcuni fattori di attenzione'
  },
  high: {
    label: 'Alto Rischio',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: '🟠',
    description: 'Profilo che richiede valutazione attenta e premi maggiorati'
  },
  very_high: {
    label: 'Rischio Molto Alto',
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: '🔴',
    description: 'Profilo ad alto rischio con limitazioni significative'
  }
};

export default function RiskProfileView() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const { organizationId } = useAuth();
  
  const [riskProfile, setRiskProfile] = useState<RiskProfile | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profileId && organizationId) {
      fetchRiskProfile();
      fetchHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, organizationId]);

  const fetchRiskProfile = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('insurance_risk_profiles')
        .select(`
          *,
          contact:contacts(name, email)
        `)
        .eq('id', profileId)
        .eq('organization_id', organizationId)
        .single();

      if (fetchError) throw fetchError;
      
      // Parse JSONB fields
      const parsedData = {
        ...data,
        recommended_products: typeof data.recommended_products === 'string' 
          ? JSON.parse(data.recommended_products) 
          : data.recommended_products
      };
      
      setRiskProfile(parsedData);
    } catch (err) {
      const error = err as Error;
      console.error('Error fetching risk profile:', error);
      setError(error.message || 'Errore nel caricamento del profilo');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('risk_assessment_history')
        .select('id, assessment_date, total_risk_score, risk_category, score_change')
        .eq('risk_profile_id', profileId)
        .order('assessment_date', { ascending: false })
        .limit(10);

      if (fetchError) throw fetchError;
      setHistory(data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const handleExportPDF = async () => {
    try {
      // Dynamic import jsPDF
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text('Profilo di Rischio Assicurativo', 20, 20);
      
      // Client info
      doc.setFontSize(12);
      doc.text(`Cliente: ${riskProfile?.contact.name}`, 20, 35);
      doc.text(`Data Valutazione: ${new Date(riskProfile?.assessment_date || '').toLocaleDateString('it-IT')}`, 20, 42);
      
      // Risk category
      doc.setFontSize(14);
      doc.text(`Categoria Rischio: ${RISK_CATEGORY_CONFIG[riskProfile?.risk_category || 'medium'].label}`, 20, 55);
      
      // Scores
      doc.setFontSize(11);
      doc.text('Punteggi Dettagliati:', 20, 70);
      doc.text(`Salute: ${riskProfile?.health_score?.toFixed(1)}/100`, 30, 78);
      doc.text(`Finanziario: ${riskProfile?.financial_score?.toFixed(1)}/100`, 30, 85);
      doc.text(`Lifestyle: ${riskProfile?.lifestyle_score?.toFixed(1)}/100`, 30, 92);
      doc.text(`Totale: ${riskProfile?.total_risk_score?.toFixed(1)}/100`, 30, 99);
      
      // Recommended products
      doc.text('Prodotti Raccomandati:', 20, 115);
      let yPos = 123;
      riskProfile?.recommended_products?.slice(0, 5).forEach((product, idx) => {
        doc.text(`${idx + 1}. ${product.type} - €${product.estimated_premium}/anno`, 30, yPos);
        yPos += 7;
      });
      
      // Footer
      doc.setFontSize(9);
      doc.text('Guardian AI CRM - Documento generato automaticamente', 20, 280);
      doc.text(`Generato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}`, 20, 285);
      
      // Save
      const safeFilename = riskProfile?.contact.name.replace(/\s+/g, '_');
      doc.save(`Profilo_Rischio_${safeFilename}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Errore nella generazione del PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !riskProfile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-800">Errore</h3>
            <p className="text-red-700">{error || 'Profilo non trovato'}</p>
            <button
              onClick={() => navigate('/dashboard/assicurazioni/clienti')}
              className="mt-2 text-red-600 underline"
            >
              Torna all'elenco clienti
            </button>
          </div>
        </div>
      </div>
    );
  }

  const radarData = {
    labels: ['Salute', 'Finanziario', 'Lifestyle'],
    datasets: [{
      label: 'Punteggio Rischio (0-100)',
      data: [
        riskProfile.health_score,
        riskProfile.financial_score,
        riskProfile.lifestyle_score
      ],
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 2,
      pointBackgroundColor: 'rgb(59, 130, 246)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgb(59, 130, 246)',
      pointRadius: 5,
      pointHoverRadius: 7,
    }]
  };

  const radarOptions = {
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        angleLines: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      }
    },
    responsive: true,
    maintainAspectRatio: false
  };

  const categoryConfig = RISK_CATEGORY_CONFIG[riskProfile.risk_category];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {riskProfile.contact.name}
            </h1>
            <p className="text-gray-600">
              {riskProfile.profession} • {riskProfile.age} anni
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Valutazione del {new Date(riskProfile.assessment_date).toLocaleDateString('it-IT')}
            </p>
          </div>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Esporta PDF
          </button>
        </div>

        {/* Risk Category Badge */}
        <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 border-2 rounded-lg ${categoryConfig.color}`}>
          <span className="text-2xl">{categoryConfig.icon}</span>
          <div>
            <p className="font-bold text-lg">{categoryConfig.label}</p>
            <p className="text-sm">{categoryConfig.description}</p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Analisi Multidimensionale
          </h2>
          <div className="h-80">
            <Radar data={radarData} options={radarOptions} />
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-4">
          {/* Health Score */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold">Salute</h3>
              </div>
              <span className="text-2xl font-bold">{riskProfile.health_score.toFixed(1)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${
                  riskProfile.health_score >= 70 ? 'bg-green-500' :
                  riskProfile.health_score >= 40 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${riskProfile.health_score}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {riskProfile.health_score >= 70 ? 'Eccellente condizione fisica' :
               riskProfile.health_score >= 40 ? 'Condizione nella media' :
               'Richiede attenzione medica'}
            </p>
          </div>

          {/* Financial Score */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold">Situazione Finanziaria</h3>
              </div>
              <span className="text-2xl font-bold">{riskProfile.financial_score.toFixed(1)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${
                  riskProfile.financial_score >= 70 ? 'bg-green-500' :
                  riskProfile.financial_score >= 40 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${riskProfile.financial_score}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {riskProfile.financial_score >= 70 ? 'Solida capacità finanziaria' :
               riskProfile.financial_score >= 40 ? 'Capacità finanziaria moderata' :
               'Limitata capacità di pagamento'}
            </p>
          </div>

          {/* Lifestyle Score */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold">Stile di Vita</h3>
              </div>
              <span className="text-2xl font-bold">{riskProfile.lifestyle_score.toFixed(1)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${
                  riskProfile.lifestyle_score >= 70 ? 'bg-green-500' :
                  riskProfile.lifestyle_score >= 40 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${riskProfile.lifestyle_score}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {riskProfile.lifestyle_score >= 70 ? 'Stile di vita sicuro' :
               riskProfile.lifestyle_score >= 40 ? 'Alcuni rischi moderati' :
               'Attività ad alto rischio'}
            </p>
          </div>
        </div>
      </div>

      {/* Assessment History Timeline */}
      {history.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Storico Valutazioni
          </h2>
          <div className="space-y-3">
            {history.map((entry, index) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">
                      {new Date(entry.assessment_date).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">
                      Punteggio: {entry.total_risk_score.toFixed(1)} / 100
                    </p>
                    <p className="text-sm text-gray-600">
                      Categoria: {RISK_CATEGORY_CONFIG[entry.risk_category as keyof typeof RISK_CATEGORY_CONFIG].label}
                    </p>
                  </div>
                </div>
                {index < history.length - 1 && entry.score_change !== null && (
                  <div className="flex items-center gap-1">
                    {entry.score_change > 0 ? (
                      <>
                        <TrendingUp className="w-4 h-4 text-red-500" />
                        <span className="text-red-600 font-semibold">
                          +{entry.score_change.toFixed(1)}
                        </span>
                      </>
                    ) : entry.score_change < 0 ? (
                      <>
                        <TrendingDown className="w-4 h-4 text-green-500" />
                        <span className="text-green-600 font-semibold">
                          {entry.score_change.toFixed(1)}
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-500">Invariato</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {riskProfile.notes && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Note Aggiuntive
          </h2>
          <p className="text-gray-700 whitespace-pre-wrap">{riskProfile.notes}</p>
        </div>
      )}

      {/* Recommended Products */}
      {riskProfile.recommended_products && riskProfile.recommended_products.length > 0 && (
        <RecommendedProducts
          products={riskProfile.recommended_products as Array<{
            type: string;
            priority: 'critical' | 'high' | 'medium' | 'low';
            estimated_premium: number;
            coverage_amount?: number;
            exclusions?: string[];
          }>}
          riskCategory={riskProfile.risk_category}
          contactId={riskProfile.contact_id}
        />
      )}

      {/* Validity */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          📅 <strong>Validità:</strong> Questa valutazione è valida fino al{' '}
          {new Date(riskProfile.valid_until).toLocaleDateString('it-IT')}.
          Si consiglia di effettuare una nuova valutazione annualmente.
        </p>
      </div>
    </div>
  );
}
