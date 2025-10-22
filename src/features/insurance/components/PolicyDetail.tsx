/**
 * PolicyDetail Component - Read-only view of insurance policy with actions
 * Features: Complete policy information display, edit/delete actions, contact linking
 */

import {
    AlertTriangle,
    ArrowLeft,
    Building2,
    Calendar,
    Edit,
    Euro,
    ExternalLink,
    FileText,
    Mail,
    Phone,
    Trash2,
    User
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';

// Document Management Components
import DocumentGallery from '../../../components/insurance/DocumentGallery';
import DocumentUploader from '../../../components/insurance/DocumentUploader';

import { ROUTES } from '../../../config/routes';
import { useCrmData } from '../../../hooks/useCrmData';
import { supabase } from '../../../lib/supabaseClient';
import {
    POLICY_STATUS_LABELS,
    POLICY_TYPE_LABELS,
    PREMIUM_FREQUENCY_LABELS,
    formatCurrency
} from '../types/insurance';

interface PolicyData {
  id: string;
  policy_number: string;
  policy_type: string;
  status: string;
  insurance_company: string;
  premium_amount: number;
  premium_frequency: string;
  start_date: string;
  end_date: string;
  coverage_amount?: number | null;
  deductible?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
  contacts?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
  } | null;
  profiles?: {
    id: string;
    full_name?: string;
  } | null;
}

export const PolicyDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const contextData = useOutletContext<ReturnType<typeof useCrmData>>();
  const { organization } = contextData || {};

  // State Management
  const [policy, setPolicy] = useState<PolicyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [documentsRefreshKey, setDocumentsRefreshKey] = useState(0);

  // Fetch policy data
  const fetchPolicy = useCallback(async () => {
    if (!id) {
      console.error('❌ [PolicyDetail] No policy ID provided');
      toast.error('ID polizza mancante');
      navigate(ROUTES.insurance.policies);
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 [PolicyDetail] Fetching policy with ID:', id);
      
      // First, try to fetch the policy with organization check if available
      let query = supabase
        .from('insurance_policies')
        .select(`
          *,
          contacts!fk_insurance_policies_contact(id, name, email, phone, company),
          profiles!created_by(id, full_name)
        `)
        .eq('id', id);

      // Add organization filter only if available
      if (organization?.id) {
        console.log('🏢 [PolicyDetail] Filtering by organization ID:', organization.id);
        query = query.eq('organization_id', organization.id);
      } else {
        console.log('⚠️ [PolicyDetail] No organization context available, fetching without org filter');
      }

      console.log('🚀 [PolicyDetail] Executing Supabase query...');
      const { data, error } = await query.single();

      console.log('📊 [PolicyDetail] Query result:', { data, error });

      if (error) {
        console.error('❌ [PolicyDetail] Error fetching policy:', error);
        console.error('❌ [PolicyDetail] Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        if (error.code === 'PGRST116') {
          toast.error('Polizza non trovata o non hai i permessi per visualizzarla');
        } else {
          toast.error(`Errore nel caricamento della polizza: ${error.message}`);
        }
        navigate(ROUTES.insurance.policies);
        return;
      }

      if (!data) {
        console.error('❌ [PolicyDetail] No policy data returned');
        toast.error('Polizza non trovata');
        navigate(ROUTES.insurance.policies);
        return;
      }

      console.log('✅ [PolicyDetail] Policy data received:', data);
      console.log('🔧 [PolicyDetail] Validating policy data structure...');
      
      // Detailed validation of required fields
      const requiredFields = ['id', 'policy_number', 'policy_type', 'insurance_company', 'start_date', 'end_date', 'premium_amount', 'premium_frequency', 'status'];
      const missingFields = requiredFields.filter(field => !data[field]);
      
      if (missingFields.length > 0) {
        console.error('❌ [PolicyDetail] Missing required fields:', missingFields);
        console.error('📋 [PolicyDetail] Available fields:', Object.keys(data));
        toast.error(`Dati polizza incompleti. Campi mancanti: ${missingFields.join(', ')}`);
        navigate(ROUTES.insurance.policies);
        return;
      }

      // Validate dates
      console.log('📅 [PolicyDetail] Validating dates:', { start_date: data.start_date, end_date: data.end_date });
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('❌ [PolicyDetail] Invalid dates:', { start_date: data.start_date, end_date: data.end_date });
        toast.error('Date della polizza non valide');
        navigate(ROUTES.insurance.policies);
        return;
      }

      // Validate premium amount
      console.log('💰 [PolicyDetail] Validating premium amount:', data.premium_amount);
      if (typeof data.premium_amount !== 'number' || data.premium_amount < 0) {
        console.error('❌ [PolicyDetail] Invalid premium amount:', data.premium_amount);
        toast.error('Premio assicurativo non valido');
        navigate(ROUTES.insurance.policies);
        return;
      }

      // Log contact information
      console.log('👤 [PolicyDetail] Contact information:', data.contact);
      console.log('👥 [PolicyDetail] Created by user:', data.created_by_user);

      console.log('✅ [PolicyDetail] All validations passed, setting policy data');
      console.log('📋 [PolicyDetail] Final policy object:', JSON.stringify(data, null, 2));
      
      setPolicy(data);
      console.log('🎯 [PolicyDetail] Policy state set successfully');
    } catch (error) {
      console.error('💥 [PolicyDetail] Unexpected error:', error);
      console.error('💥 [PolicyDetail] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      toast.error(`Errore imprevisto nel caricamento della polizza: ${error instanceof Error ? error.message : 'Unknown error'}`);
      navigate(ROUTES.insurance.policies);
    } finally {
      setLoading(false);
      console.log('🏁 [PolicyDetail] fetchPolicy completed');
    }
  }, [id, organization?.id, navigate]);

  // Initialize component
  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy]);

  // Event Handlers
  const handleEdit = () => {
    navigate(ROUTES.insurance.editPolicy(id!));
  };

  const handleDelete = async () => {
    if (!policy || !organization?.id) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('insurance_policies')
        .delete()
        .eq('id', policy.id)
        .eq('organization_id', organization.id);

      if (error) {
        console.error('Error deleting policy:', error);
        toast.error('Errore nella cancellazione della polizza');
        return;
      }

      toast.success('Polizza cancellata con successo');
      navigate(ROUTES.insurance.policies);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Errore nella cancellazione della polizza');
    } finally {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const handleBack = () => {
    navigate(ROUTES.insurance.policies);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-3 text-gray-600">Caricamento polizza...</p>
        </div>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Polizza non trovata</h2>
          <p className="text-gray-600 mb-4">La polizza richiesta non esiste o non hai i permessi per visualizzarla.</p>
          <button
            onClick={handleBack}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alle polizze
          </button>
        </div>
      </div>
    );
  }

  // Calculate policy duration and status
  const startDate = new Date(policy.start_date);
  const endDate = new Date(policy.end_date);
  const now = new Date();
  const isExpired = endDate < now;
  const isActive = startDate <= now && endDate >= now;
  const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'expired':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'cancelled':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'suspended':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-blue-100 text-blue-800`;
    }
  };

  // Safe rendering with error boundary
  try {
    console.log('🎨 [PolicyDetail] Starting render with policy:', policy?.policy_number);
    
    return (
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="inline-flex items-center text-gray-600 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alle polizze
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Polizza {policy.policy_number}
              </h1>
            <p className="text-gray-600 mt-1 flex items-center">
              <span className={getStatusBadge(policy.status)}>
                {POLICY_STATUS_LABELS[policy.status as keyof typeof POLICY_STATUS_LABELS] || policy.status}
              </span>
              {isActive && daysUntilExpiry <= 30 && daysUntilExpiry > 0 && (
                <span className="ml-2 text-amber-600 text-sm font-medium">
                  Scade tra {daysUntilExpiry} giorni
                </span>
              )}
              {isExpired && (
                <span className="ml-2 text-red-600 text-sm font-medium">
                  Scaduta
                </span>
              )}
            </p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleEdit}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" />
              Modifica
            </button>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Elimina
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Policy Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Informazioni Polizza
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">Numero Polizza</label>
                <p className="text-lg font-semibold text-gray-900">{policy.policy_number}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Tipo Polizza</label>
                <p className="text-lg text-gray-900">
                  {POLICY_TYPE_LABELS[policy.policy_type as keyof typeof POLICY_TYPE_LABELS] || policy.policy_type}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Compagnia Assicurativa</label>
                <p className="text-lg text-gray-900">{policy.insurance_company}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Stato</label>
                <p className="text-lg text-gray-900">
                  {POLICY_STATUS_LABELS[policy.status as keyof typeof POLICY_STATUS_LABELS] || policy.status}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Data Inizio</label>
                <p className="text-lg text-gray-900 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  {new Date(policy.start_date).toLocaleDateString('it-IT')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Data Fine</label>
                <p className="text-lg text-gray-900 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  {new Date(policy.end_date).toLocaleDateString('it-IT')}
                </p>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Euro className="w-5 h-5 mr-2" />
              Informazioni Finanziarie
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">Premio Assicurativo</label>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(policy.premium_amount)}
                </p>
                <p className="text-sm text-gray-500">
                  {PREMIUM_FREQUENCY_LABELS[policy.premium_frequency as keyof typeof PREMIUM_FREQUENCY_LABELS] || policy.premium_frequency}
                </p>
              </div>

              {policy.coverage_amount && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Massimale Copertura</label>
                  <p className="text-xl font-semibold text-blue-600">
                    {formatCurrency(policy.coverage_amount)}
                  </p>
                </div>
              )}

              {policy.deductible && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Franchigia</label>
                  <p className="text-lg text-gray-900">
                    {formatCurrency(policy.deductible)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {policy.notes && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Note Aggiuntive
              </h2>
              <div className="prose text-gray-700">
                <p className="whitespace-pre-wrap">{policy.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Information */}
          {policy.contacts && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Cliente
              </h2>

              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-gray-900">{policy.contacts.name}</p>
                  {policy.contacts.company && (
                    <p className="text-sm text-gray-600 flex items-center mt-1">
                      <Building2 className="w-3 h-3 mr-1" />
                      {policy.contacts.company}
                    </p>
                  )}
                </div>

                {policy.contacts.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    <a 
                      href={`mailto:${policy.contacts.email}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {policy.contacts.email}
                    </a>
                  </div>
                )}

                {policy.contacts.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    <a 
                      href={`tel:${policy.contacts.phone}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {policy.contacts.phone}
                    </a>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-200">
                  <Link
                    to={ROUTES.contactsDetail(policy.contacts.id.toString())}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Vedi profilo cliente
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Policy Statistics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Statistiche Polizza
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Durata contratto</span>
                <span className="font-medium">
                  {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} giorni
                </span>
              </div>

              {isActive && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Giorni rimanenti</span>
                  <span className={`font-medium ${daysUntilExpiry <= 30 ? 'text-amber-600' : 'text-green-600'}`}>
                    {daysUntilExpiry}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Premio annuale stimato</span>
                <span className="font-medium">
                  {(() => {
                    const multiplier = {
                      'monthly': 12,
                      'quarterly': 4,
                      'semi_annual': 2,
                      'annual': 1
                    }[policy.premium_frequency] || 1;
                    return formatCurrency(policy.premium_amount * multiplier);
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Informazioni Sistema</h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div>
                <span className="font-medium">Creata il:</span>{' '}
                {new Date(policy.created_at).toLocaleDateString('it-IT')} alle{' '}
                {new Date(policy.created_at).toLocaleTimeString('it-IT')}
              </div>
              {policy.updated_at && (
                <div>
                  <span className="font-medium">Modificata il:</span>{' '}
                  {new Date(policy.updated_at).toLocaleDateString('it-IT')} alle{' '}
                  {new Date(policy.updated_at).toLocaleTimeString('it-IT')}
                </div>
              )}
              {policy.profiles && (
                <div>
                  <span className="font-medium">Creata da:</span>{' '}
                  {policy.profiles.full_name || 'Utente sconosciuto'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Documenti Polizza
            </h2>
          </div>
          
          <div className="p-6">
            {/* Document Uploader */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Carica Nuovi Documenti</h3>
              {organization?.id && (
                <DocumentUploader
                  organizationId={organization.id}
                  category="policy"
                  entityType="policy"
                  entityId={policy.id}
                  onUploadComplete={() => {
                    toast.success('Documento caricato con successo!');
                    setDocumentsRefreshKey(prev => prev + 1);
                  }}
                  onUploadError={(error) => {
                    toast.error(`Errore caricamento: ${error}`);
                  }}
                />
              )}
            </div>

            {/* Document Gallery */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Documenti Caricati</h3>
              {organization?.id && (
                <DocumentGallery
                  key={documentsRefreshKey}
                  organizationId={organization.id}
                  entityType="policy"
                  entityId={policy.id}
                  viewMode="grid"
                  onDocumentDelete={() => {
                    toast.success('Documento eliminato');
                    setDocumentsRefreshKey(prev => prev + 1);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Conferma Eliminazione
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Sei sicuro di voler eliminare la polizza <strong>{policy.policy_number}</strong>? 
              Questa azione non può essere annullata.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Eliminazione...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Elimina
                  </>
                )}
              </button>
              
              <button
                onClick={() => setDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  } catch (renderError) {
    console.error('💥 [PolicyDetail] Rendering error:', renderError);
    console.error('💥 [PolicyDetail] Policy data during error:', policy);
    
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Errore di visualizzazione</h2>
          <p className="text-gray-600 mb-4">
            Si è verificato un errore durante la visualizzazione della polizza.
          </p>
          <div className="text-sm text-gray-500 mb-4">
            <strong>Errore:</strong> {renderError instanceof Error ? renderError.message : 'Unknown error'}
          </div>
          <button
            onClick={handleBack}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alle polizze
          </button>
        </div>
      </div>
    );
  }
};