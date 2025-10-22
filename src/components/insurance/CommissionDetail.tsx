/**
 * CommissionDetail Component - Read-only view of commission with actions
 * Pattern: Based on ClaimDetail.tsx and PolicyDetail.tsx
 * Features: Complete commission information display, edit/delete actions, document management
 */

import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    CheckCircle,
    Clock,
    Edit2,
    Euro,
    FileText,
    Loader2,
    User,
    XCircle
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '../../config/routes';
import { useAuth } from '../../contexts/useAuth';
import { supabase } from '../../lib/supabaseClient';
import DocumentGallery from './DocumentGallery';
import DocumentUploader from './DocumentUploader';

interface Commission {
  id: string;
  policy_id: string;
  contact_id: string;
  base_premium: number;
  commission_rate: number;
  commission_amount: number;
  status: 'pending' | 'calculated' | 'paid' | 'cancelled';
  commission_type: string;
  calculation_date: string;
  payment_date?: string | null;
  notes?: string | null;
  // Relations
  policy?: {
    policy_number: string;
    policy_type: string;
    insurance_company: string;
  };
  contact?: {
    name: string;
    email?: string;
    phone?: string;
  };
  created_at: string;
  updated_at?: string;
}

const STATUS_CONFIG = {
  pending: { label: 'In Attesa', icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
  calculated: { label: 'Calcolata', icon: CheckCircle, color: 'text-blue-600 bg-blue-50' },
  paid: { label: 'Pagata', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  cancelled: { label: 'Annullata', icon: XCircle, color: 'text-red-600 bg-red-50' }
};

const COMMISSION_TYPE_LABELS: Record<string, string> = {
  auto: 'Auto / RCA',
  vita: 'Assicurazione Vita',
  casa: 'Assicurazione Casa',
  infortuni: 'Infortuni',
  malattia: 'Malattia',
  viaggio: 'Assicurazione Viaggio',
  azienda: 'Polizza Aziendale',
  altro: 'Altro'
};

export default function CommissionDetail() {
  const { id } = useParams<{ id: string }>();
  const { jwtClaims } = useAuth();
  const organizationId = jwtClaims?.organization_id;
  const navigate = useNavigate();

  const [commission, setCommission] = useState<Commission | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchCommission = useCallback(async () => {
    if (!id || !organizationId) {
      console.error('❌ [CommissionDetail] Missing ID or organization');
      navigate(ROUTES.insurance.commissions);
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 [CommissionDetail] Fetching commission:', id);

      const { data, error } = await supabase
        .from('commissions')
        .select(`
          *,
          policy:insurance_policies!commissions_policy_id_fkey(policy_number, policy_type, insurance_company),
          contact:contacts!commissions_contact_id_fkey(name, email, phone)
        `)
        .eq('id', id)
        .eq('organization_id', organizationId)
        .single();

      if (error) {
        console.error('❌ [CommissionDetail] Fetch error:', error);
        throw error;
      }

      console.log('✅ [CommissionDetail] Commission loaded:', data);
      setCommission(data);
    } catch (error) {
      console.error('❌ [CommissionDetail] Error:', error);
      alert('Errore nel caricamento della provvigione: ' + (error as Error).message);
      navigate(ROUTES.insurance.commissions);
    } finally {
      setLoading(false);
    }
  }, [id, organizationId, navigate]);

  useEffect(() => {
    fetchCommission();
  }, [fetchCommission]);

  const handleDelete = async () => {
    if (!commission || !organizationId) return;

    try {
      setDeleting(true);
      console.log('🗑️ [CommissionDetail] Deleting commission:', commission.id);

      const { error } = await supabase
        .from('commissions')
        .delete()
        .eq('id', commission.id)
        .eq('organization_id', organizationId);

      if (error) throw error;

      console.log('✅ [CommissionDetail] Commission deleted');
      alert('Provvigione eliminata con successo');
      navigate(ROUTES.insurance.commissions);
    } catch (error) {
      console.error('❌ [CommissionDetail] Delete error:', error);
      alert('Errore nell\'eliminazione: ' + (error as Error).message);
    } finally {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const handleDocumentUpload = () => {
    // Refresh commission data after document upload
    fetchCommission();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!commission) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-500">Provvigione non trovata</p>
        <button
          onClick={() => navigate(ROUTES.insurance.commissions)}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Torna alla lista
        </button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[commission.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(ROUTES.insurance.commissions)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dettaglio Provvigione
            </h1>
            <p className="text-sm text-gray-500">
              Calcolata il {new Date(commission.calculation_date).toLocaleDateString('it-IT')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(ROUTES.insurance.commissionsEdit(commission.id))}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Modifica
          </button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${statusConfig.color}`}>
          <StatusIcon className="w-5 h-5" />
          <span className="font-medium">{statusConfig.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Commission Details Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Euro className="w-5 h-5 text-gray-600" />
              Dettagli Provvigione
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Premio Base</label>
                <p className="font-medium text-gray-900">
                  €{commission.base_premium.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Percentuale</label>
                <p className="font-medium text-gray-900">
                  {commission.commission_rate}%
                </p>
              </div>
              <div className="col-span-2">
                <label className="text-sm text-gray-500">Importo Provvigione</label>
                <p className="text-2xl font-bold text-green-600">
                  €{commission.commission_amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Tipo Provvigione</label>
                <p className="font-medium text-gray-900">
                  {COMMISSION_TYPE_LABELS[commission.commission_type] || commission.commission_type}
                </p>
              </div>
              {commission.payment_date && (
                <div>
                  <label className="text-sm text-gray-500">Data Pagamento</label>
                  <p className="font-medium text-gray-900">
                    {new Date(commission.payment_date).toLocaleDateString('it-IT')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Policy Information */}
          {commission.policy && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                Polizza Associata
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Numero Polizza</label>
                  <p className="font-medium text-gray-900">{commission.policy.policy_number}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Tipo Polizza</label>
                  <p className="font-medium text-gray-900">{commission.policy.policy_type}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Compagnia Assicurativa</label>
                  <p className="font-medium text-gray-900">{commission.policy.insurance_company}</p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {commission.notes && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                Note
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap">{commission.notes}</p>
            </div>
          )}

          {/* Documents Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-600" />
              Documenti
            </h2>
            
            {organizationId && (
              <>
                <DocumentUploader
                  entityType="commissions"
                  entityId={commission.id}
                  organizationId={organizationId}
                  category="general"
                  onUploadComplete={handleDocumentUpload}
                />
                
                <div className="mt-4">
                  <DocumentGallery
                    entityType="commissions"
                    entityId={commission.id}
                    organizationId={organizationId}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Card */}
          {commission.contact && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-gray-600" />
                Cliente
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Nome</label>
                  <p className="font-medium text-gray-900">{commission.contact.name}</p>
                </div>
                {commission.contact.email && (
                  <div>
                    <label className="text-sm text-gray-500">Email</label>
                    <p className="font-medium text-gray-900">{commission.contact.email}</p>
                  </div>
                )}
                {commission.contact.phone && (
                  <div>
                    <label className="text-sm text-gray-500">Telefono</label>
                    <p className="font-medium text-gray-900">{commission.contact.phone}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadata Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-600" />
              Informazioni
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-gray-500">Creata il</label>
                <p className="font-medium text-gray-900">
                  {new Date(commission.created_at).toLocaleString('it-IT')}
                </p>
              </div>
              {commission.updated_at && (
                <div>
                  <label className="text-gray-500">Ultima modifica</label>
                  <p className="font-medium text-gray-900">
                    {new Date(commission.updated_at).toLocaleString('it-IT')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Azioni</h2>
            <div className="space-y-2">
              <button
                onClick={() => navigate(ROUTES.insurance.commissionsEdit(commission.id))}
                className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Modifica Provvigione
              </button>
              
              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="w-full px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Elimina Provvigione
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-red-600 font-medium">Confermi l'eliminazione?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleting ? 'Eliminazione...' : 'Conferma'}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(false)}
                      disabled={deleting}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Annulla
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
