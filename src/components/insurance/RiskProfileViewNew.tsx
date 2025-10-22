import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Legend,
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    Radar,
    RadarChart,
    ResponsiveContainer
} from 'recharts';

const COMPONENT_VERSION = 'v3.0-PRODUCTION-READY';

// Helper functions for risk category badges
const getRiskBadgeColor = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'low': return 'bg-green-100 text-green-800 border-green-300';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'very_high': return 'bg-red-100 text-red-800 border-red-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getRiskLabel = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'low': return 'Basso Rischio';
    case 'medium': return 'Rischio Medio';
    case 'high': return 'Alto Rischio';
    case 'very_high': return 'Rischio Molto Alto';
    default: return 'Non Classificato';
  }
};

// Helper function for recommended products based on risk score
const getRecommendedProducts = (riskScore: number) => {
  if (riskScore < 40) {
    return [
      { name: 'Polizza Auto Base', description: 'Copertura standard per veicoli', priority: 'low' },
      { name: 'Polizza Casa Standard', description: 'Protezione abitazione base', priority: 'low' }
    ];
  } else if (riskScore < 70) {
    return [
      { name: 'Polizza Auto Estesa', description: 'Copertura completa con kasko', priority: 'medium' },
      { name: 'Polizza Vita Consigliata', description: 'Protezione famiglia', priority: 'medium' },
      { name: 'Polizza Salute Base', description: 'Assistenza sanitaria', priority: 'medium' }
    ];
  } else {
    return [
      { name: 'Polizza Auto Premium', description: 'Massima copertura veicolo', priority: 'high' },
      { name: 'Polizza Vita Obbligatoria', description: 'Protezione essenziale', priority: 'high' },
      { name: 'Polizza Salute Completa', description: 'Copertura sanitaria totale', priority: 'high' },
      { name: 'Polizza Infortuni', description: 'Protezione incidenti', priority: 'high' }
    ];
  }
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800 border-red-300';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'low': return 'bg-green-100 text-green-800 border-green-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case 'high': return 'Alta Priorità';
    case 'medium': return 'Media Priorità';
    case 'low': return 'Bassa Priorità';
    default: return 'N/A';
  }
};

export default function RiskProfileViewNew() {
  console.log(`🎯 [NEW COMPONENT] RiskProfileViewNew loaded - ${COMPONENT_VERSION}`);
  
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('📍 [PARAMS] Profile ID:', profileId);

  useEffect(() => {
    async function fetchProfile() {
      try {
        console.log('📡 [FETCH] Starting fetch for profile:', profileId);
        
        const { data, error: fetchError } = await supabase
          .from('insurance_risk_profiles')
          .select(`
            *,
            contact:contacts!contact_id(name, email)
          `)
          .eq('id', profileId)
          .single();
        
        console.log('📡 [FETCH] Result:', { 
          success: !fetchError, 
          hasData: !!data,
          error: fetchError,
          dataKeys: data ? Object.keys(data) : []
        });
        
        if (fetchError) {
          console.error('❌ [FETCH ERROR] Supabase error:', fetchError);
          throw fetchError;
        }
        
        if (!data) {
          throw new Error('Profile not found');
        }
        
        console.log('✅ [FETCH SUCCESS] Profile loaded:', data.contact?.name);
        setProfile(data);
      } catch (err: any) {
        console.error('❌ [FETCH ERROR] Exception:', err);
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
        console.log('📡 [FETCH] Complete');
      }
    }
    
    if (profileId) {
      fetchProfile();
    } else {
      setError('No profile ID provided');
      setLoading(false);
    }
  }, [profileId]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-xl text-gray-700">⏳ Loading profile data...</p>
            <p className="text-sm text-gray-500 mt-2">Version: {COMPONENT_VERSION}</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Profile</h2>
              <p className="text-gray-700">{error}</p>
            </div>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => navigate('/dashboard/assicurazioni/valutazione-rischio')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                ← Torna alla Lista Profili
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold"
              >
                🔄 Riprova
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Profile Not Found</h2>
            <button
              onClick={() => navigate('/dashboard/assicurazioni/valutazione-rischio')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              ← Torna alla Lista Profili
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Prepare data for Recharts radar chart
  const radarData = [
    {
      category: 'Salute',
      value: Number(profile.health_score) || 0,
      fullMark: 100
    },
    {
      category: 'Finanziario',
      value: Number(profile.financial_score) || 0,
      fullMark: 100
    },
    {
      category: 'Lifestyle',
      value: Number(profile.lifestyle_score) || 0,
      fullMark: 100
    }
  ];

  const recommendedProducts = getRecommendedProducts(profile.total_risk_score || 0);

  // Success - Display polished UI with Recharts
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Profile Header with Risk Badge */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {profile.contact?.name || 'N/A'}
              </h1>
              <p className="text-lg text-gray-600">
                {profile.profession || 'Profession N/A'} • {profile.age || 'N/A'} anni
              </p>
            </div>
            <div className={`px-6 py-3 rounded-full font-bold border-2 text-lg ${getRiskBadgeColor(profile.risk_category)}`}>
              {getRiskLabel(profile.risk_category)}
            </div>
          </div>
          
          {/* Contact Info Inline */}
          <div className="flex gap-6 mt-6 pt-6 border-t">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">📧</span>
              <span className="text-gray-900 font-medium">{profile.contact?.email || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">🆔</span>
              <span className="text-gray-600 text-sm font-mono">{profile.id?.substring(0, 8)}...</span>
            </div>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column - Risk Scores */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span>📊</span> Punteggi di Rischio
            </h3>
            <div className="space-y-4">
              {/* Health Score */}
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-red-600 font-semibold mb-1">Salute</p>
                    <p className="text-xs text-gray-600">Valutazione condizioni fisiche</p>
                  </div>
                  <p className="text-4xl font-bold text-red-700">{profile.health_score ?? 'N/A'}</p>
                </div>
                <div className="mt-2 bg-red-200 rounded-full h-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${profile.health_score || 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Financial Score */}
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-green-600 font-semibold mb-1">Finanziario</p>
                    <p className="text-xs text-gray-600">Stabilità economica</p>
                  </div>
                  <p className="text-4xl font-bold text-green-700">{profile.financial_score ?? 'N/A'}</p>
                </div>
                <div className="mt-2 bg-green-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${profile.financial_score || 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Lifestyle Score */}
              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-purple-600 font-semibold mb-1">Lifestyle</p>
                    <p className="text-xs text-gray-600">Abitudini quotidiane</p>
                  </div>
                  <p className="text-4xl font-bold text-purple-700">{profile.lifestyle_score ?? 'N/A'}</p>
                </div>
                <div className="mt-2 bg-purple-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${profile.lifestyle_score || 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Total Risk Score */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-blue-600 font-semibold mb-1">Rischio Totale</p>
                    <p className="text-xs text-gray-600">Punteggio complessivo</p>
                  </div>
                  <p className="text-5xl font-bold text-blue-700">{profile.total_risk_score ?? 'N/A'}</p>
                </div>
                <div className="mt-2 bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${profile.total_risk_score || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Recharts Radar Chart */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span>📡</span> Visualizzazione Radar
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis 
                  dataKey="category" 
                  tick={{ fill: '#374151', fontSize: 14, fontWeight: 600 }}
                />
                <PolarRadiusAxis 
                  domain={[0, 100]} 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <Radar 
                  name="Punteggio Rischio" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6}
                  strokeWidth={2}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
              </RadarChart>
            </ResponsiveContainer>
            <div className="mt-4 text-center text-sm text-gray-600">
              <p>Visualizzazione radar dei tre principali fattori di rischio</p>
            </div>
          </div>
        </div>

        {/* Recommended Products Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span>🎯</span> Prodotti Raccomandati
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedProducts.map((product, idx) => (
              <div 
                key={idx} 
                className="p-5 border-2 border-gray-200 rounded-lg hover:shadow-lg hover:border-blue-400 transition-all duration-200 cursor-pointer"
              >
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-lg text-gray-900">{product.name}</h4>
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${getPriorityBadge(product.priority)}`}>
                    {getPriorityLabel(product.priority)}
                  </span>
                </div>
                <p className="text-gray-600 text-sm">{product.description}</p>
                <button className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-semibold text-sm">
                  Visualizza Dettagli
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Assessment Details */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📋</span> Dettagli Valutazione
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded">
              <p className="text-xs text-gray-600 mb-1">Data Creazione</p>
              <p className="font-bold text-gray-900">{profile.created_at ? new Date(profile.created_at).toLocaleDateString('it-IT') : 'N/A'}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded">
              <p className="text-xs text-gray-600 mb-1">Ultimo Aggiornamento</p>
              <p className="font-bold text-gray-900">{profile.updated_at ? new Date(profile.updated_at).toLocaleDateString('it-IT') : 'N/A'}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded">
              <p className="text-xs text-gray-600 mb-1">Categoria Rischio</p>
              <p className="font-bold text-gray-900 uppercase">{profile.risk_category || 'N/A'}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded">
              <p className="text-xs text-gray-600 mb-1">Punteggio Totale</p>
              <p className="font-bold text-gray-900">{profile.total_risk_score ?? 'N/A'}/100</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/dashboard/assicurazioni/valutazione-rischio')}
            className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold flex items-center justify-center gap-2"
          >
            <span>←</span> Torna alla Lista Profili
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center gap-2"
          >
            <span>📄</span> Esporta PDF
          </button>
          <button
            onClick={() => navigate('/dashboard/assicurazioni')}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2"
          >
            <span>🏠</span> Dashboard Assicurazioni
          </button>
        </div>

        {/* Debug Section (collapsible) */}
        <details className="bg-gray-900 rounded-lg shadow-lg p-6">
          <summary className="cursor-pointer font-bold text-white hover:text-green-400 transition flex items-center gap-2">
            <span>🔍</span> Dati Tecnici (JSON) - Click per Espandere
          </summary>
          <pre className="mt-4 p-4 bg-black text-green-400 rounded text-xs overflow-auto max-h-96 font-mono">
            {JSON.stringify(profile, null, 2)}
          </pre>
        </details>

        {/* Version Footer */}
        <div className="text-center text-sm text-gray-500 py-4">
          <p>Component Version: <span className="font-mono font-bold">{COMPONENT_VERSION}</span></p>
        </div>
      </div>
    </div>
  );
}
