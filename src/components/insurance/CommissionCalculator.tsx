// CommissionCalculator.tsx - Real-time Commission Calculator
// Sprint 2 Session 4 - Commission Calculation Form

import { AlertCircle, Calculator, CheckCircle, Euro, FileText } from 'lucide-react';
import React, { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { ROUTES } from '../../config/routes';

// TypeScript Interfaces
interface CommissionForm {
  policy_id: string;
  contact_id: string;
  base_premium: number;
  commission_rate: number;
  commission_amount: number;
  status: 'pending' | 'calculated' | 'paid' | 'cancelled';
  commission_type: string;
  calculation_date: string;
  notes: string;
}

interface Policy {
  id: string;
  policy_number: string;
  policy_type: string;
}

interface Contact {
  id: string;
  name: string;
  company?: string;
}

interface ValidationErrors {
  policy_id?: string;
  contact_id?: string;
  base_premium?: string;
  commission_rate?: string;
  commission_type?: string;
}

const CommissionCalculator: React.FC = () => {
  // Navigation and Auth
  const navigate = useNavigate();
  const { session, organizationId } = useAuth();

  // Form State
  const [form, setForm] = useState<CommissionForm>({
    policy_id: '',
    contact_id: '',
    base_premium: 0,
    commission_rate: 0,
    commission_amount: 0,
    status: 'calculated',
    commission_type: 'auto',
    calculation_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Data State
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  // UI State
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [success, setSuccess] = useState(false);

  // Commission Types
  const commissionTypes = [
    { value: 'auto', label: 'Auto / RCA' },
    { value: 'vita', label: 'Assicurazione Vita' },
    { value: 'casa', label: 'Assicurazione Casa' },
    { value: 'infortuni', label: 'Infortuni' },
    { value: 'malattia', label: 'Malattia' },
    { value: 'viaggio', label: 'Assicurazione Viaggio' },
    { value: 'responsabilita', label: 'Responsabilità Civile' },
    { value: 'altro', label: 'Altro' }
  ];

  // Data Loading Effects
  useEffect(() => {
    const loadInitialData = async () => {
      if (!session?.user) return;

      try {
        setDataLoading(true);
        setError(null);

        console.log('🔍 [CommissionCalculator] Loading data for organization:', organizationId);

        // Load Policies
        const { data: policiesData, error: policiesError } = await supabase
          .from('insurance_policies')
          .select('id, policy_number, policy_type')
          .eq('organization_id', organizationId)
          .order('policy_number');

        if (policiesError) throw policiesError;

        // Load Contacts
        const { data: contactsData, error: contactsError } = await supabase
          .from('contacts')
          .select('id, name, company')
          .eq('organization_id', organizationId)
          .order('name');

        if (contactsError) throw contactsError;

        setPolicies(policiesData || []);
        setContacts(contactsData || []);

      } catch (error) {
        console.error('Error loading initial data:', error);
        setError(error instanceof Error ? error.message : 'Errore nel caricamento dei dati');
      } finally {
        setDataLoading(false);
      }
    };

    loadInitialData();
  }, [session?.user, organizationId]);

  // Real-time Commission Calculation
  useEffect(() => {
    // Calculate commission amount whenever base_premium or commission_rate changes
    if (form.base_premium > 0 && form.commission_rate > 0) {
      const calculatedAmount = (form.base_premium * form.commission_rate) / 100;
      const roundedAmount = Number(calculatedAmount.toFixed(2));
      
      // Only update if the calculated amount is different from current
      if (form.commission_amount !== roundedAmount) {
        setForm(prev => ({
          ...prev,
          commission_amount: roundedAmount
        }));
      }
    } else {
      // Reset to 0 if base premium or rate is 0
      if (form.commission_amount !== 0) {
        setForm(prev => ({
          ...prev,
          commission_amount: 0
        }));
      }
    }
  }, [form.base_premium, form.commission_rate, form.commission_amount]);

  // Form Validation
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Policy validation
    if (!form.policy_id.trim()) {
      errors.policy_id = 'Seleziona una polizza';
    }

    // Contact validation
    if (!form.contact_id.trim()) {
      errors.contact_id = 'Seleziona un contatto';
    }

    // Base premium validation
    if (form.base_premium <= 0) {
      errors.base_premium = 'Il premio base deve essere maggiore di 0';
    }

    // Commission rate validation
    if (form.commission_rate < 0 || form.commission_rate > 100) {
      errors.commission_rate = 'La percentuale deve essere tra 0 e 100';
    }

    // Commission type validation
    if (!form.commission_type.trim()) {
      errors.commission_type = 'Seleziona un tipo di commissione';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Correggere gli errori nel form prima di continuare');
      return;
    }

    if (!session?.user) {
      setError('Sessione non valida');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 [CommissionCalculator] Saving commission for organization:', organizationId);

      // Insert commission into database
      const { error } = await supabase
        .from('insurance_commissions')
        .insert({
          organization_id: organizationId,
          policy_id: form.policy_id,
          contact_id: form.contact_id,
          base_premium: form.base_premium,
          commission_rate: form.commission_rate,
          commission_amount: form.commission_amount,
          commission_type: form.commission_type,
          status: form.status,
          calculation_date: form.calculation_date,
          notes: form.notes.trim() || null
        })
        .select('id')
        .single();

      if (error) throw error;

      // Show success message
      setSuccess(true);
      
      // Navigate to list after short delay
      setTimeout(() => {
        navigate(ROUTES.insurance.commissions);
      }, 2000);

    } catch (error) {
      console.error('Error saving commission:', error);
      setError(error instanceof Error ? error.message : 'Errore nel salvataggio della provvigione');
    } finally {
      setLoading(false);
    }
  };

  // Handle form field changes
  const handleFormChange = (field: keyof CommissionForm, value: string | number) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Early return if organization_id is not available
  if (!organizationId) {
    console.error('❌ [CommissionCalculator] Organization ID not found - redirecting to dashboard');
    navigate(ROUTES.dashboard);
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Accesso Negato</h2>
          <p className="text-gray-600">Organization ID non trovato. Reindirizzamento in corso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Calculator className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">
            Calcolo Provvigioni
          </h1>
        </div>
        <p className="text-gray-600">
          Calcola e salva una nuova provvigione assicurativa
        </p>
      </div>

      {/* Loading State */}
      {dataLoading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Caricamento dati...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Errore
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Successo!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Provvigione calcolata e salvata con successo.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      {!dataLoading && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Dati Commissione
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Policy Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Polizza *
                </label>
                <select
                  value={form.policy_id}
                  onChange={(e) => handleFormChange('policy_id', e.target.value)}
                  className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    validationErrors.policy_id ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  disabled={loading}
                >
                  <option value="">Seleziona una polizza</option>
                  {policies.map((policy) => (
                    <option key={policy.id} value={policy.id}>
                      {policy.policy_number} - {policy.policy_type}
                    </option>
                  ))}
                </select>
                {validationErrors.policy_id && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.policy_id}</p>
                )}
              </div>

              {/* Contact Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contatto *
                </label>
                <select
                  value={form.contact_id}
                  onChange={(e) => handleFormChange('contact_id', e.target.value)}
                  className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    validationErrors.contact_id ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  disabled={loading}
                >
                  <option value="">Seleziona un contatto</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name} {contact.company && ` - ${contact.company}`}
                    </option>
                  ))}
                </select>
                {validationErrors.contact_id && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.contact_id}</p>
                )}
              </div>

              {/* Commission Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo Commissione *
                </label>
                <select
                  value={form.commission_type}
                  onChange={(e) => handleFormChange('commission_type', e.target.value)}
                  className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    validationErrors.commission_type ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  disabled={loading}
                >
                  <option value="">Seleziona tipo</option>
                  {commissionTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {validationErrors.commission_type && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.commission_type}</p>
                )}
              </div>

              {/* Calculation Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Calcolo
                </label>
                <input
                  type="date"
                  value={form.calculation_date}
                  onChange={(e) => handleFormChange('calculation_date', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>

              {/* Base Premium */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Premio Base (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.base_premium || ''}
                  onChange={(e) => handleFormChange('base_premium', parseFloat(e.target.value) || 0)}
                  className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    validationErrors.base_premium ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="0.00"
                  disabled={loading}
                />
                {validationErrors.base_premium && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.base_premium}</p>
                )}
              </div>

              {/* Commission Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Percentuale Commissione (%) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={form.commission_rate || ''}
                  onChange={(e) => handleFormChange('commission_rate', parseFloat(e.target.value) || 0)}
                  className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    validationErrors.commission_rate ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="0.00"
                  disabled={loading}
                />
                {validationErrors.commission_rate && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.commission_rate}</p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note
              </label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Note aggiuntive (opzionale)"
                disabled={loading}
              />
            </div>
          </div>

          {/* Commission Preview */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Euro className="h-5 w-5 mr-2 text-blue-600" />
              Anteprima Calcolo
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Premio Base</p>
                <p className="text-2xl font-bold text-gray-900">
                  €{form.base_premium.toLocaleString('it-IT', { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2 
                  })}
                </p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">Percentuale</p>
                <p className="text-2xl font-bold text-blue-600">
                  {form.commission_rate}%
                </p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">Commissione Calcolata</p>
                <p className="text-3xl font-bold text-green-600">
                  €{form.commission_amount.toLocaleString('it-IT', { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2 
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
            <button
              type="button"
              onClick={() => navigate(ROUTES.insurance.commissions)}
              className="w-full sm:w-auto px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={loading}
            >
              Annulla
            </button>
            
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={loading || form.commission_amount === 0}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Salva Commissione
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CommissionCalculator;