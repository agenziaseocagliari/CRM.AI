import { AlertCircle, CheckCircle, Clock, Edit2, Eye, FileText, Plus, Search, XCircle } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import { supabase } from '../../lib/supabaseClient';

interface Claim {
  id: string;
  claim_number: string;
  claim_type: string;
  status: string;
  incident_date: string;
  incident_description: string;
  estimated_amount: number;
  approved_amount: number | null;
  report_date: string;
  contact_id: string;
  policy_id: string | null;
  // Joined data
  contact_name?: string;
  policy_number?: string;
}

export default function ClaimsList() {
  const { jwtClaims } = useAuth();
  const organizationId = jwtClaims?.organization_id;
  const navigate = useNavigate();

  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchClaims = useCallback(async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('insurance_claims')
        .select(`
          *,
          contact:contacts(first_name, last_name, email),
          policy:insurance_policies(policy_number)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Format data
      const formattedClaims = data?.map((claim: {
        id: string;
        claim_number: string;
        claim_type: string;
        status: string;
        incident_date: string;
        incident_description: string;
        estimated_amount: number;
        approved_amount: number | null;
        report_date: string;
        contact_id: string;
        policy_id: string | null;
        contact?: { first_name?: string; last_name?: string; email?: string } | null;
        policy?: { policy_number?: string } | null;
      }) => ({
        ...claim,
        contact_name: claim.contact 
          ? `${claim.contact.first_name || ''} ${claim.contact.last_name || ''}`.trim() || claim.contact.email || 'N/A'
          : 'N/A',
        policy_number: claim.policy?.policy_number || 'N/A'
      })) || [];

      setClaims(formattedClaims);
    } catch (error) {
      console.error('Error fetching claims:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId, statusFilter]);

  useEffect(() => {
    if (organizationId) {
      fetchClaims();
    }
  }, [fetchClaims, organizationId]);

  const filteredClaims = claims.filter(claim =>
    searchTerm === '' ||
    claim.claim_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    claim.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    claim.incident_description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles = {
      reported: 'bg-blue-100 text-blue-800',
      reviewing: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      pending_docs: 'bg-orange-100 text-orange-800',
      closed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };

    const labels = {
      reported: 'Segnalato',
      reviewing: 'In Valutazione',
      approved: 'Approvato',
      rejected: 'Respinto',
      pending_docs: 'Attesa Documenti',
      closed: 'Chiuso',
      cancelled: 'Annullato'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const getClaimTypeLabel = (type: string) => {
    const labels = {
      auto_damage: 'Danni Auto',
      auto_theft: 'Furto Auto',
      home_damage: 'Danni Casa',
      liability: 'Responsabilità Civile',
      health: 'Salute',
      injury: 'Infortuni',
      fire: 'Incendio',
      water_damage: 'Danni Acqua',
      natural_disaster: 'Calamità',
      other: 'Altro'
    };

    return labels[type as keyof typeof labels] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sinistri</h1>
          <p className="text-gray-600">Gestione sinistri assicurativi</p>
        </div>
        <button
          onClick={() => navigate('/assicurazioni/sinistri/new')}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          <span>Nuovo Sinistro</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cerca per numero, cliente, descrizione..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tutti gli stati</option>
              <option value="reported">Segnalato</option>
              <option value="reviewing">In Valutazione</option>
              <option value="approved">Approvato</option>
              <option value="rejected">Respinto</option>
              <option value="pending_docs">Attesa Documenti</option>
              <option value="closed">Chiuso</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Totali"
          value={claims.length}
          icon={FileText}
          color="blue"
        />
        <StatsCard
          title="In Corso"
          value={claims.filter(c => ['reported', 'reviewing', 'pending_docs'].includes(c.status)).length}
          icon={Clock}
          color="yellow"
        />
        <StatsCard
          title="Approvati"
          value={claims.filter(c => c.status === 'approved').length}
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="Respinti"
          value={claims.filter(c => c.status === 'rejected').length}
          icon={XCircle}
          color="red"
        />
      </div>

      {/* Claims Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredClaims.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nessun sinistro trovato
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'Prova a modificare i filtri di ricerca'
                : 'Inizia registrando il primo sinistro'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={() => navigate('/assicurazioni/sinistri/new')}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                <span>Registra Sinistro</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Numero
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Incidente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Importo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {claim.claim_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        Polizza: {claim.policy_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{claim.contact_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getClaimTypeLabel(claim.claim_type)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(claim.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(claim.incident_date).toLocaleDateString('it-IT')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        €{claim.estimated_amount.toLocaleString()}
                      </div>
                      {claim.approved_amount && (
                        <div className="text-xs text-green-600">
                          Approvato: €{claim.approved_amount.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/assicurazioni/sinistri/${claim.id}`)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => navigate(`/assicurazioni/sinistri/${claim.id}/edit`)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'yellow' | 'green' | 'red';
}

function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}