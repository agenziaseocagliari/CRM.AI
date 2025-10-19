import {
    AlertCircle,
    AlertTriangle,
    ArrowLeft,
    Calendar,
    CheckCircle,
    Clock,
    DollarSign,
    Edit2,
    FileText,
    Loader2,
    Mail,
    MapPin,
    Phone,
    User,
    XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import { supabase } from '../../lib/supabaseClient';

interface Claim {
  id: string;
  claim_number: string;
  claim_type: string;
  status: string;
  incident_date: string;
  incident_location: string;
  incident_description: string;
  estimated_amount: number;
  approved_amount: number | null;
  report_date: string;
  notes: string;
  timeline: Array<{
    status: string;
    date: string;
    note: string;
    user_id?: string;
  }>;
  // Relations
  contact?: {
    name: string; // ← FIXED
    email: string;
    phone: string;
  };
  policy?: {
    policy_number: string;
    policy_type: string;
    insurance_company: string;
  };
  created_at: string;
  updated_at: string;
}

export default function ClaimDetail() {
  const { id } = useParams<{ id: string }>();
  const { jwtClaims } = useAuth();
  const organizationId = jwtClaims?.organization_id;
  const userId = jwtClaims?.sub;
  const navigate = useNavigate();

  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (id && organizationId) {
      fetchClaim();
    }
  }, [id, organizationId]);

  const fetchClaim = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('insurance_claims')
        .select(`
          *,
          contact:contacts(name, email, phone),
          policy:insurance_policies(policy_number, policy_type, insurance_company)
        `)
        .eq('id', id)
        .eq('organization_id', organizationId)
        .single();

      if (error) {
        console.error('Fetch error:', error);
        throw error;
      }

      setClaim(data);
    } catch (error) {
      console.error('Error fetching claim:', error);
      alert('Errore nel caricamento del sinistro: ' + (error as Error).message);
      navigate('/assicurazioni/sinistri');
    } finally {
      setLoading(false);
    }
  };

  const updateClaimStatus = async (newStatus: string) => {
    if (!claim) return;

    const confirmed = window.confirm(
      `Confermi il cambio stato a "${getStatusLabel(newStatus)}"?`
    );

    if (!confirmed) return;

    setUpdatingStatus(true);

    try {
      // Add to timeline
      const newTimeline = [
        ...(claim.timeline || []),
        {
          status: newStatus,
          date: new Date().toISOString(),
          note: `Stato cambiato da ${getStatusLabel(claim.status)} a ${getStatusLabel(newStatus)}`,
          user_id: userId
        }
      ];

      const { error } = await supabase
        .from('insurance_claims')
        .update({
          status: newStatus,
          timeline: newTimeline,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Refresh
      await fetchClaim();
      alert('Stato aggiornato con successo!');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Errore nell\'aggiornamento dello stato');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      reported: 'bg-blue-100 text-blue-800 border-blue-200',
      reviewing: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      pending_docs: 'bg-orange-100 text-orange-800 border-orange-200',
      closed: 'bg-gray-100 text-gray-800 border-gray-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    const icons = {
      reported: AlertCircle,
      reviewing: Clock,
      approved: CheckCircle,
      rejected: XCircle,
      pending_docs: AlertTriangle,
      closed: CheckCircle,
      cancelled: XCircle
    };

    const Icon = icons[status as keyof typeof icons] || AlertCircle;

    return (
      <span className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium border ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        <Icon className="w-4 h-4" />
        <span>{getStatusLabel(status)}</span>
      </span>
    );
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      reported: 'Segnalato',
      reviewing: 'In Valutazione',
      approved: 'Approvato',
      rejected: 'Respinto',
      pending_docs: 'Attesa Documenti',
      closed: 'Chiuso',
      cancelled: 'Annullato'
    };
    return labels[status as keyof typeof labels] || status;
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
      natural_disaster: 'Calamità Naturali',
      other: 'Altro'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Sinistro non trovato
        </h3>
        <button
          onClick={() => navigate('/assicurazioni/sinistri')}
          className="text-blue-600 hover:text-blue-800"
        >
          Torna alla lista
        </button>
      </div>
    );
  }

  const contactName = claim.contact?.name || 'N/A';

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/assicurazioni/sinistri')}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Sinistro {claim.claim_number}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Creato il {new Date(claim.created_at).toLocaleString('it-IT')}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/assicurazioni/sinistri/${id}/edit`)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Edit2 className="w-4 h-4" />
          <span>Modifica</span>
        </button>
      </div>

      {/* Status & Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Stato Attuale</h3>
            {getStatusBadge(claim.status)}
          </div>
          {updatingStatus && (
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          )}
        </div>

        {/* Quick Status Actions */}
        {claim.status !== 'closed' && claim.status !== 'cancelled' && (
          <div className="border-t pt-4 mt-4">
            <p className="text-sm font-medium text-gray-600 mb-3">Azioni Rapide</p>
            <div className="flex flex-wrap gap-2">
              {claim.status === 'reported' && (
                <button
                  onClick={() => updateClaimStatus('reviewing')}
                  disabled={updatingStatus}
                  className="px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 text-sm font-medium transition disabled:opacity-50"
                >
                  Inizia Valutazione
                </button>
              )}
              {claim.status === 'reviewing' && (
                <>
                  <button
                    onClick={() => updateClaimStatus('approved')}
                    disabled={updatingStatus}
                    className="px-3 py-1.5 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 text-sm font-medium transition disabled:opacity-50"
                  >
                    Approva
                  </button>
                  <button
                    onClick={() => updateClaimStatus('rejected')}
                    disabled={updatingStatus}
                    className="px-3 py-1.5 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 text-sm font-medium transition disabled:opacity-50"
                  >
                    Respingi
                  </button>
                  <button
                    onClick={() => updateClaimStatus('pending_docs')}
                    disabled={updatingStatus}
                    className="px-3 py-1.5 bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 text-sm font-medium transition disabled:opacity-50"
                  >
                    Richiedi Documenti
                  </button>
                </>
              )}
              {(claim.status === 'approved' || claim.status === 'rejected') && (
                <button
                  onClick={() => updateClaimStatus('closed')}
                  disabled={updatingStatus}
                  className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 text-sm font-medium transition disabled:opacity-50"
                >
                  Chiudi Sinistro
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Incident Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Dettagli Incidente
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Tipo Sinistro</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {getClaimTypeLabel(claim.claim_type)}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Data Incidente</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(claim.incident_date).toLocaleDateString('it-IT', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {claim.incident_location && (
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Luogo</p>
                    <p className="text-sm text-gray-900 mt-1">
                      {claim.incident_location}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-3">
                <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Importi</p>
                  <div className="mt-1 space-y-1">
                    <p className="text-sm text-gray-900">
                      Stima: <span className="font-medium">€{claim.estimated_amount.toLocaleString()}</span>
                    </p>
                    {claim.approved_amount !== null && (
                      <p className="text-sm text-green-600">
                        Approvato: <span className="font-medium">€{claim.approved_amount.toLocaleString()}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm font-medium text-gray-600 mb-2">Descrizione</p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {claim.incident_description}
              </p>
            </div>

            {claim.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium text-gray-600 mb-2">Note</p>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {claim.notes}
                </p>
              </div>
            )}
          </div>

          {/* Documents Placeholder */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Documenti
            </h3>
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-2">
                Sezione documenti in sviluppo
              </p>
              <p className="text-xs text-gray-500">
                Disponibile in Sprint 2 - Session 4
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Cliente
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{contactName}</p>
                </div>
              </div>
              {claim.contact?.email && (
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <a
                    href={`mailto:${claim.contact.email}`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {claim.contact.email}
                  </a>
                </div>
              )}
              {claim.contact?.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <a
                    href={`tel:${claim.contact.phone}`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {claim.contact.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Policy Info */}
          {claim.policy && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Polizza
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Numero</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {claim.policy.policy_number}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Tipo</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {claim.policy.policy_type}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Compagnia</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {claim.policy.insurance_company}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Timeline Eventi
            </h3>
            <div className="space-y-4">
              {claim.timeline && claim.timeline.length > 0 ? (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200" />
                  
                  {/* Timeline items */}
                  <div className="space-y-4">
                    {claim.timeline
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((item, index) => (
                        <div key={index} className="relative pl-10">
                          <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {getStatusLabel(item.status)}
                            </p>
                            <p className="text-xs text-gray-600 mt-0.5">
                              {new Date(item.date).toLocaleString('it-IT')}
                            </p>
                            {item.note && (
                              <p className="text-xs text-gray-500 mt-1">
                                {item.note}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nessun evento registrato
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}