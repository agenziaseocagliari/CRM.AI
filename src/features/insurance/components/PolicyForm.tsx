/**
 * PolicyForm Component - Create/Edit form for insurance policies
 * Features: Contact selector, validation, auto-generate policy number, Italian labels
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { 
  Save, 
  X, 
  RefreshCw, 
  User, 
  Building2, 
  AlertCircle,
  Calendar,
  Euro,
  FileText,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

import { supabase } from '../../../lib/supabaseClient';
import { useCrmData } from '../../../hooks/useCrmData';
import { ROUTES } from '../../../config/routes';
import { 
  PolicyFormData,
  DEFAULT_POLICY_FORM,
  POLICY_TYPES,
  POLICY_STATUSES,
  PREMIUM_FREQUENCIES,
  POLICY_TYPE_LABELS,
  POLICY_STATUS_LABELS,
  PREMIUM_FREQUENCY_LABELS,
  generatePolicyNumber,
  validatePolicyForm
} from '../types/insurance';

interface Contact {
  id: string; // Fixed: Changed from number to string (UUID)
  name: string;
  email?: string;
  phone?: string;
  company?: string;
}

export const PolicyForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const contextData = useOutletContext<ReturnType<typeof useCrmData>>();
  const { organization } = contextData || {};

  // State Management
  const [formData, setFormData] = useState<PolicyFormData>(DEFAULT_POLICY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [loadingPolicy, setLoadingPolicy] = useState(isEditMode);

  // Fetch contacts for dropdown
  const fetchContacts = useCallback(async () => {
    if (!organization?.id) return;

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, name, email, phone, company')
        .eq('organization_id', organization.id)
        .order('name');

      if (error) {
        console.error('Error fetching contacts:', error);
        return;
      }

      setContacts(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  }, [organization?.id]);

  // Fetch existing policy for edit mode
  const fetchPolicy = useCallback(async () => {
    if (!id || !organization?.id) return;

    setLoadingPolicy(true);
    try {
      const { data, error } = await supabase
        .from('insurance_policies')
        .select('*')
        .eq('id', id)
        .eq('organization_id', organization.id)
        .single();

      if (error) {
        console.error('Error fetching policy:', error);
        toast.error('Errore nel caricamento della polizza');
        navigate(ROUTES.insurance.policies);
        return;
      }

      // Convert database format to form format
      setFormData({
        contact_id: data.contact_id,
        policy_number: data.policy_number,
        policy_type: data.policy_type,
        status: data.status,
        insurance_company: data.insurance_company,
        premium_amount: data.premium_amount,
        premium_frequency: data.premium_frequency,
        start_date: data.start_date,
        end_date: data.end_date,
        coverage_amount: data.coverage_amount || undefined,
        deductible: data.deductible || undefined,
        notes: data.notes || '',
      });

      // Set contact search if contact is already selected
      if (data.contact_id) {
        const contact = contacts.find(c => c.id === data.contact_id);
        if (contact) {
          setContactSearch(contact.name);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Errore nel caricamento della polizza');
      navigate(ROUTES.insurance.policies);
    } finally {
      setLoadingPolicy(false);
    }
  }, [id, organization?.id, contacts, navigate]);

  // Initialize component
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    if (isEditMode && contacts.length > 0) {
      fetchPolicy();
    }
  }, [fetchPolicy, isEditMode, contacts.length]);

  // Filter contacts based on search
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    contact.email?.toLowerCase().includes(contactSearch.toLowerCase()) ||
    contact.company?.toLowerCase().includes(contactSearch.toLowerCase())
  );

  // Event Handlers
  const handleInputChange = (field: keyof PolicyFormData, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleContactSelect = (contact: Contact) => {
    setFormData(prev => ({ ...prev, contact_id: contact.id }));
    setContactSearch(contact.name);
    setShowContactDropdown(false);
    if (errors.contact_id) {
      setErrors(prev => ({ ...prev, contact_id: '' }));
    }
  };

  const handleGeneratePolicyNumber = () => {
    const policyNumber = generatePolicyNumber();
    setFormData(prev => ({ ...prev, policy_number: policyNumber }));
    if (errors.policy_number) {
      setErrors(prev => ({ ...prev, policy_number: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validatePolicyForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Correggi gli errori nel modulo');
      return;
    }

    if (!organization?.id) {
      toast.error('Informazioni sull\'organizzazione non disponibili');
      return;
    }

    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      const policyData = {
        ...formData,
        organization_id: organization.id,
        created_by: user?.id,
        // Convert empty strings to null for optional numeric fields
        coverage_amount: formData.coverage_amount || null,
        deductible: formData.deductible || null,
      };

      if (isEditMode) {
        // Update existing policy
        const { error } = await supabase
          .from('insurance_policies')
          .update(policyData)
          .eq('id', id)
          .eq('organization_id', organization.id);

        if (error) {
          console.error('Error updating policy:', error);
          if (error.code === '23505') {
            toast.error('Numero polizza già esistente');
          } else {
            toast.error('Errore nell\'aggiornamento della polizza');
          }
          return;
        }

        toast.success('Polizza aggiornata con successo');
      } else {
        // Create new policy
        const { error } = await supabase
          .from('insurance_policies')
          .insert(policyData);

        if (error) {
          console.error('Error creating policy:', error);
          if (error.code === '23505') {
            toast.error('Numero polizza già esistente');
          } else {
            toast.error('Errore nella creazione della polizza');
          }
          return;
        }

        toast.success('Polizza creata con successo');
      }

      navigate(ROUTES.insurance.policies);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Errore nel salvataggio della polizza');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(ROUTES.insurance.policies);
  };

  // Render loading state
  if (loadingPolicy) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-3 text-gray-600">Caricamento polizza...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleCancel}
          className="inline-flex items-center text-gray-600 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna alle polizze
        </button>
        
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Modifica Polizza' : 'Nuova Polizza'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEditMode 
            ? 'Aggiorna i dettagli della polizza assicurativa'
            : 'Crea una nuova polizza assicurativa per un cliente'
          }
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Client Information Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Informazioni Cliente
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente *
            </label>
            <div className="relative">
              <input
                type="text"
                value={contactSearch}
                onChange={(e) => {
                  setContactSearch(e.target.value);
                  setShowContactDropdown(true);
                }}
                onFocus={() => setShowContactDropdown(true)}
                placeholder="Cerca cliente per nome, email o azienda..."
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.contact_id ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              
              {showContactDropdown && filteredContacts.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredContacts.map(contact => (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => handleContactSelect(contact)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{contact.name}</div>
                      {contact.company && (
                        <div className="text-sm text-gray-600 flex items-center mt-1">
                          <Building2 className="w-3 h-3 mr-1" />
                          {contact.company}
                        </div>
                      )}
                      {contact.email && (
                        <div className="text-sm text-gray-500">{contact.email}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.contact_id && (
              <p className="text-red-600 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.contact_id}
              </p>
            )}
          </div>
        </div>

        {/* Policy Information Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Informazioni Polizza
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Policy Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numero Polizza *
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={formData.policy_number}
                  onChange={(e) => handleInputChange('policy_number', e.target.value)}
                  placeholder="POL-2025-123456"
                  className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.policy_number ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleGeneratePolicyNumber}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Genera numero polizza"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              {errors.policy_number && (
                <p className="text-red-600 text-sm mt-1">{errors.policy_number}</p>
              )}
            </div>

            {/* Policy Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo Polizza *
              </label>
              <select
                value={formData.policy_type}
                onChange={(e) => handleInputChange('policy_type', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.policy_type ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                {POLICY_TYPES.map(type => (
                  <option key={type} value={type}>
                    {POLICY_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
              {errors.policy_type && (
                <p className="text-red-600 text-sm mt-1">{errors.policy_type}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stato *
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {POLICY_STATUSES.map(status => (
                  <option key={status} value={status}>
                    {POLICY_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>

            {/* Insurance Company */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Compagnia Assicurativa *
              </label>
              <input
                type="text"
                value={formData.insurance_company}
                onChange={(e) => handleInputChange('insurance_company', e.target.value)}
                placeholder="Es. Generali, Allianz, UnipolSai..."
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.insurance_company ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.insurance_company && (
                <p className="text-red-600 text-sm mt-1">{errors.insurance_company}</p>
              )}
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Inizio *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.start_date ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.start_date && (
                <p className="text-red-600 text-sm mt-1">{errors.start_date}</p>
              )}
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Fine *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.end_date ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.end_date && (
                <p className="text-red-600 text-sm mt-1">{errors.end_date}</p>
              )}
            </div>
          </div>
        </div>

        {/* Financial Information Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Euro className="w-5 h-5 mr-2" />
            Informazioni Finanziarie
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Premium Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Premio Assicurativo *
              </label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.premium_amount || ''}
                  onChange={(e) => handleInputChange('premium_amount', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.premium_amount ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.premium_amount && (
                <p className="text-red-600 text-sm mt-1">{errors.premium_amount}</p>
              )}
            </div>

            {/* Premium Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequenza Pagamento *
              </label>
              <select
                value={formData.premium_frequency}
                onChange={(e) => handleInputChange('premium_frequency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {PREMIUM_FREQUENCIES.map(frequency => (
                  <option key={frequency} value={frequency}>
                    {PREMIUM_FREQUENCY_LABELS[frequency]}
                  </option>
                ))}
              </select>
            </div>

            {/* Coverage Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Massimale Copertura
              </label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.coverage_amount || ''}
                  onChange={(e) => handleInputChange('coverage_amount', parseFloat(e.target.value) || undefined)}
                  placeholder="0.00"
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.coverage_amount ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.coverage_amount && (
                <p className="text-red-600 text-sm mt-1">{errors.coverage_amount}</p>
              )}
            </div>

            {/* Deductible */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Franchigia
              </label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.deductible || ''}
                  onChange={(e) => handleInputChange('deductible', parseFloat(e.target.value) || undefined)}
                  placeholder="0.00"
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.deductible ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.deductible && (
                <p className="text-red-600 text-sm mt-1">{errors.deductible}</p>
              )}
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Note Aggiuntive
          </h2>

          <div>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Note, clausole particolari, informazioni aggiuntive..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center space-x-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvataggio...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditMode ? 'Aggiorna Polizza' : 'Crea Polizza'}
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="inline-flex items-center px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
          >
            <X className="w-4 h-4 mr-2" />
            Annulla
          </button>
        </div>
      </form>
    </div>
  );
};