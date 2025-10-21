/**
 * Risk Assessment List Component
 * 
 * Landing page for Risk Profiling system showing all risk profiles
 * for the organization with search, filter, and create capabilities.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Search, Filter, Plus, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface RiskProfile {
  id: string;
  contact_id: string;
  contact: {
    first_name: string;
    last_name: string;
    email: string;
  };
  total_risk_score: number;
  risk_category: 'low' | 'medium' | 'high' | 'very_high';
  health_score: number;
  financial_score: number;
  lifestyle_score: number;
  assessment_date: string;
  valid_until: string;
  is_active: boolean;
}

const RISK_CATEGORY_CONFIG = {
  low: { label: 'Basso Rischio', color: 'bg-green-100 text-green-800', icon: '🟢' },
  medium: { label: 'Rischio Medio', color: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
  high: { label: 'Alto Rischio', color: 'bg-orange-100 text-orange-800', icon: '🟠' },
  very_high: { label: 'Rischio Molto Alto', color: 'bg-red-100 text-red-800', icon: '🔴' },
};

export default function RiskAssessmentList() {
  const navigate = useNavigate();
  const { organizationId } = useAuth();
  
  const [profiles, setProfiles] = useState<RiskProfile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<RiskProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (organizationId) {
      fetchProfiles();
    }
  }, [organizationId]);

  useEffect(() => {
    filterProfiles();
  }, [searchTerm, filterCategory, profiles]);

  const fetchProfiles = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('insurance_risk_profiles')
        .select(`
          id,
          contact_id,
          total_risk_score,
          risk_category,
          health_score,
          financial_score,
          lifestyle_score,
          assessment_date,
          valid_until,
          is_active,
          contact:contacts!inner(first_name, last_name, email)
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('assessment_date', { ascending: false });

      if (fetchError) throw fetchError;
      
      // Type assertion since Supabase returns contact as array in joins
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const typedData = (data || []).map((profile: any) => ({
        ...profile,
        contact: Array.isArray(profile.contact) ? profile.contact[0] : profile.contact
      })) as RiskProfile[];
      
      setProfiles(typedData);
    } catch (err) {
      console.error('Error fetching risk profiles:', err);
      setError('Errore nel caricamento dei profili di rischio');
    } finally {
      setLoading(false);
    }
  };

  const filterProfiles = () => {
    let filtered = [...profiles];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(profile => {
        const fullName = `${profile.contact?.first_name} ${profile.contact?.last_name}`.toLowerCase();
        const email = profile.contact?.email?.toLowerCase() || '';
        return fullName.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
      });
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(profile => profile.risk_category === filterCategory);
    }

    setFilteredProfiles(filtered);
  };

  const getRiskTrend = (_score: number): 'up' | 'down' | 'stable' => {
    // This would compare with previous assessment in real implementation
    return 'stable';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Valutazione Rischio</h1>
            <p className="text-sm text-gray-600">
              Sistema di analisi multi-dimensionale del rischio assicurativo
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/dashboard/contatti')}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Nuova Valutazione</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Totale Profili</p>
              <p className="text-2xl font-bold text-gray-900">{profiles.length}</p>
            </div>
            <Shield className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Basso Rischio</p>
              <p className="text-2xl font-bold text-green-800">
                {profiles.filter(p => p.risk_category === 'low').length}
              </p>
            </div>
            <span className="text-3xl">🟢</span>
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Rischio Medio</p>
              <p className="text-2xl font-bold text-yellow-800">
                {profiles.filter(p => p.risk_category === 'medium').length}
              </p>
            </div>
            <span className="text-3xl">🟡</span>
          </div>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Alto Rischio</p>
              <p className="text-2xl font-bold text-red-800">
                {profiles.filter(p => p.risk_category === 'high' || p.risk_category === 'very_high').length}
              </p>
            </div>
            <span className="text-3xl">🔴</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca per nome o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tutte le Categorie</option>
              <option value="low">Basso Rischio</option>
              <option value="medium">Rischio Medio</option>
              <option value="high">Alto Rischio</option>
              <option value="very_high">Rischio Molto Alto</option>
            </select>
          </div>
        </div>
      </div>

      {/* Profiles List */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {filteredProfiles.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nessun profilo di rischio trovato
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filterCategory !== 'all'
              ? 'Prova a modificare i filtri di ricerca'
              : 'Inizia creando la prima valutazione del rischio da un contatto'}
          </p>
          <button
            onClick={() => navigate('/dashboard/contatti')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Vai ai Contatti
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria Rischio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Punteggio Totale
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dimensioni
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Valutazione
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Validità
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProfiles.map((profile) => {
                const config = RISK_CATEGORY_CONFIG[profile.risk_category];
                const validUntil = new Date(profile.valid_until);
                const isExpiringSoon = validUntil.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;
                
                return (
                  <tr
                    key={profile.id}
                    onClick={() => navigate(`/dashboard/assicurazioni/valutazione-rischio/view/${profile.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {profile.contact?.first_name} {profile.contact?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{profile.contact?.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
                        <span>{config.icon}</span>
                        <span>{config.label}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-gray-900">
                          {profile.total_risk_score.toFixed(1)}
                        </span>
                        {getRiskTrend(profile.total_risk_score) === 'up' && (
                          <TrendingUp className="h-4 w-4 text-red-500" />
                        )}
                        {getRiskTrend(profile.total_risk_score) === 'down' && (
                          <TrendingDown className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2 text-xs">
                        <span className="text-red-600" title="Salute">
                          ❤️ {profile.health_score.toFixed(0)}
                        </span>
                        <span className="text-green-600" title="Finanziario">
                          💰 {profile.financial_score.toFixed(0)}
                        </span>
                        <span className="text-blue-600" title="Lifestyle">
                          🏃 {profile.lifestyle_score.toFixed(0)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(profile.assessment_date).toLocaleDateString('it-IT')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${isExpiringSoon ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
                        {validUntil.toLocaleDateString('it-IT')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/assicurazioni/valutazione-rischio/view/${profile.id}`);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Visualizza
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
