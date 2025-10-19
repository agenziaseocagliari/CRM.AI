import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/useAuth';
import { useNavigate, useParams } from 'react-router-dom';
import {
  X,
  Save,
  Loader2,
  AlertCircle,
  Calendar,
  MapPin,
  DollarSign
} from 'lucide-react';

interface ClaimFormData {
  contact_id: string;
  policy_id: string;
  claim_type: string;
  status: string;
  incident_date: string;
  incident_location: string;
  incident_description: string;
  estimated_amount: number;
  notes: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
}

interface Policy {
  id: string;
  policy_number: string;
  policy_type: string;
  contact_id: string;
}

export default function ClaimsForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { jwtClaims } = useAuth();
  const organizationId = jwtClaims?.organization_id;
  const userId = jwtClaims?.sub;
  const navigate = useNavigate();

  const [formData, setFormData] = useState<ClaimFormData>({
    contact_id: '',
    policy_id: '',
    claim_type: 'auto_damage',
    status: 'reported',
    incident_date: new Date().toISOString().split('T')[0],
    incident_location: '',
    incident_description: '',
    estimated_amount: 0,
    notes: ''
  });

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [filteredPolicies, setFilteredPolicies] = useState<Policy[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ClaimFormData, string>>>({});

  useEffect(() => {
    fetchContacts();
    fetchPolicies();
    if (isEdit && id) {
      fetchClaim();
    }
  }, [id, isEdit]);

  useEffect(() => {
    // Filter policies by selected contact
    if (formData.contact_id) {
      setFilteredPolicies(
        policies.filter(p => p.contact_id === formData.contact_id)
      );
    } else {
      setFilteredPolicies(policies);
    }
  }, [formData.contact_id, policies]);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, name, email')
        .eq('organization_id', organizationId)
        .order('name');

      if (error) throw error;

      setContacts(
        data?.map((c: {id: string, name: string, email: string}) => ({
          id: c.id,
          name: c.name,
          email: c.email
        })) || []
      );
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const fetchPolicies = async () => {
    try {
      const { data, error } = await supabase
        .from('insurance_policies')
        .select('id, policy_number, policy_type, contact_id, status')
        .eq('organization_id', organizationId);

      if (error) throw error;

      setPolicies(data || []);
      setFilteredPolicies(data || []);
    } catch (error) {
      console.error('Error fetching policies:', error);
    }
  };

  const fetchClaim = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('insurance_claims')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          contact_id: data.contact_id || '',
          policy_id: data.policy_id || '',
          claim_type: data.claim_type || 'auto_damage',
          status: data.status || 'reported',
          incident_date: data.incident_date?.split('T')[0] || '',
          incident_location: data.incident_location || '',
          incident_description: data.incident_description || '',
          estimated_amount: data.estimated_amount || 0,
          notes: data.notes || ''
        });
      }
    } catch (error) {
      console.error('Error fetching claim:', error);
      alert('Errore nel caricamento del sinistro');
    } finally {
      setLoading(false);
    }
  };

  const generateClaimNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `CLM-${year}-${random}`;
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ClaimFormData, string>> = {};

    if (!formData.contact_id) newErrors.contact_id = 'Seleziona un cliente';
    if (!formData.policy_id) newErrors.policy_id = 'Seleziona una polizza';
    if (!formData.incident_date) newErrors.incident_date = 'Data incidente obbligatoria';
    if (!formData.incident_description.trim()) {
      newErrors.incident_description = 'Descrizione obbligatoria';
    }
    if (formData.incident_description.length < 20) {
      newErrors.incident_description = 'Descrizione troppo breve (minimo 20 caratteri)';
    }
    if (formData.estimated_amount < 0) {
      newErrors.estimated_amount = 'Importo non valido';
    }

    // Validate incident date not in future
    if (new Date(formData.incident_date) > new Date()) {
      newErrors.incident_date = 'La data non può essere nel futuro';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const claimData = {
        ...formData,
        organization_id: organizationId,
        estimated_amount: parseFloat(formData.estimated_amount.toString()),
        report_date: new Date().toISOString(),
        timeline: [{
          status: formData.status,
          date: new Date().toISOString(),
          note: isEdit ? 'Sinistro aggiornato' : 'Sinistro creato',
          user_id: userId
        }]
      };

      if (isEdit) {
        // Update
        const { data, error } = await supabase
          .from('insurance_claims')
          .update({
            ...claimData,
            updated_by: userId
          })
          .eq('id', id)
          .select();

        if (error) throw error;

        alert('Sinistro aggiornato con successo!');
      } else {
        // Create
        const { data, error } = await supabase
          .from('insurance_claims')
          .insert([{
            ...claimData,
            claim_number: generateClaimNumber(),
            created_by: userId
          }])
          .select();
        if (error) throw error;

        alert('Sinistro creato con successo!');
      }

      // Wait a moment before redirect to ensure DB write completes
      await new Promise(resolve => setTimeout(resolve, 500));

      navigate('/assicurazioni/sinistri');
    } catch (error) {
      console.error('Error saving claim:', error);
      alert('Errore nel salvare il sinistro: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof ClaimFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Modifica Sinistro' : 'Nuovo Sinistro'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Inserisci i dettagli del sinistro assicurativo
            </p>
          </div>
          <button
            onClick={() => navigate('/assicurazioni/sinistri')}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Cliente e Polizza */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente *
              </label>
              <select
                value={formData.contact_id}
                onChange={(e) => handleChange('contact_id', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.contact_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Seleziona cliente...</option>
                {contacts.map(contact => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </select>
              {errors.contact_id && (
                <p className="text-red-500 text-xs mt-1">{errors.contact_id}</p>
              )}
            </div>

            {/* Polizza */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Polizza *
              </label>
              <select
                value={formData.policy_id}
                onChange={(e) => handleChange('policy_id', e.target.value)}
                disabled={!formData.contact_id}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.policy_id ? 'border-red-500' : 'border-gray-300'
                } ${!formData.contact_id ? 'bg-gray-100' : ''}`}
              >
                <option value="">
                  {formData.contact_id ? 'Seleziona polizza...' : 'Prima seleziona cliente'}
                </option>
                {filteredPolicies.map(policy => (
                  <option key={policy.id} value={policy.id}>
                    {policy.policy_number} - {policy.policy_type}
                  </option>
                ))}
              </select>
              {errors.policy_id && (
                <p className="text-red-500 text-xs mt-1">{errors.policy_id}</p>
              )}
            </div>
          </div>

          {/* Tipo e Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo Sinistro */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo Sinistro *
              </label>
              <select
                value={formData.claim_type}
                onChange={(e) => handleChange('claim_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="auto_damage">Danni Auto</option>
                <option value="auto_theft">Furto Auto</option>
                <option value="home_damage">Danni Casa</option>
                <option value="liability">Responsabilità Civile</option>
                <option value="health">Salute</option>
                <option value="injury">Infortuni</option>
                <option value="fire">Incendio</option>
                <option value="water_damage">Danni Acqua</option>
                <option value="natural_disaster">Calamità Naturali</option>
                <option value="other">Altro</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stato
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="reported">Segnalato</option>
                <option value="reviewing">In Valutazione</option>
                <option value="approved">Approvato</option>
                <option value="rejected">Respinto</option>
                <option value="pending_docs">Attesa Documenti</option>
                <option value="closed">Chiuso</option>
                <option value="cancelled">Annullato</option>
              </select>
            </div>
          </div>

          {/* Data e Luogo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Data Incidente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data Incidente *
              </label>
              <input
                type="date"
                value={formData.incident_date}
                onChange={(e) => handleChange('incident_date', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.incident_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.incident_date && (
                <p className="text-red-500 text-xs mt-1">{errors.incident_date}</p>
              )}
            </div>

            {/* Luogo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="w-4 h-4 inline mr-1" />
                Luogo Incidente
              </label>
              <input
                type="text"
                value={formData.incident_location}
                onChange={(e) => handleChange('incident_location', e.target.value)}
                placeholder="Via, Città..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Importo Stimato */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Importo Stimato Danno (€)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.estimated_amount}
              onChange={(e) => handleChange('estimated_amount', parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.estimated_amount ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.estimated_amount && (
              <p className="text-red-500 text-xs mt-1">{errors.estimated_amount}</p>
            )}
          </div>

          {/* Descrizione Incidente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrizione Incidente * (minimo 20 caratteri)
            </label>
            <textarea
              value={formData.incident_description}
              onChange={(e) => handleChange('incident_description', e.target.value)}
              rows={6}
              placeholder="Descrivi dettagliatamente l'incidente: cosa è successo, dove, come, danni riportati..."
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.incident_description ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.incident_description && (
                <p className="text-red-500 text-xs">{errors.incident_description}</p>
              )}
              <p className="text-xs text-gray-500 ml-auto">
                {formData.incident_description.length} caratteri
              </p>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note Aggiuntive
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              placeholder="Note interne, informazioni aggiuntive..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Alert Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Importante</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Il numero sinistro verrà generato automaticamente</li>
                <li>Il cliente riceverà una notifica email (se configurata)</li>
                <li>I documenti potranno essere caricati dopo la creazione</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/assicurazioni/sinistri')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvataggio...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEdit ? 'Aggiorna' : 'Crea'} Sinistro</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}