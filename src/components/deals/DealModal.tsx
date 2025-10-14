import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, DollarSign, User, Building2, Percent, FileText } from 'lucide-react';
import { Deal, PipelineStage, Contact } from '../../services/dealsService';

interface DealFormData {
  title: string;
  description: string;
  value: string;
  currency: string;
  probability: number;
  stage_id: string;
  expected_close_date: string;
  assigned_to: string;
  contact_id: string;
  company: string;
  tags: string[];
  custom_fields: Record<string, unknown>;
}

interface DealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deal: Partial<Deal>) => Promise<void>;
  deal?: Deal | null; // null for new deal, Deal for editing
  stages: PipelineStage[];
  organizationId?: string;
}

export default function DealModal({
  isOpen,
  onClose,
  onSave,
  deal,
  stages,
  organizationId
}: DealModalProps) {
  // Form state
  const [formData, setFormData] = useState<DealFormData>({
    title: '',
    description: '',
    value: '',
    currency: 'EUR',
    probability: 50,
    stage_id: '',
    expected_close_date: '',
    assigned_to: '',
    contact_id: '',
    company: '',
    tags: [],
    custom_fields: {}
  });

  // UI state
  const [isLoading, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [contacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Reset form when modal opens/closes or deal changes
  useEffect(() => {
    if (isOpen) {
      if (deal) {
        // Editing existing deal
        setFormData({
          title: deal.title || '',
          description: deal.description || '',
          value: deal.value?.toString() || '',
          currency: deal.currency || 'EUR',
          probability: deal.probability || 50,
          stage_id: deal.stage_id || '',
          expected_close_date: deal.expected_close_date 
            ? new Date(deal.expected_close_date).toISOString().split('T')[0] 
            : '',
          assigned_to: deal.assigned_to || '',
          contact_id: deal.contact_id || '',
          company: deal.company || '',
          tags: deal.tags || [],
          custom_fields: deal.custom_fields || {}
        });
      } else {
        // New deal - set defaults
        const defaultStage = stages.find(s => s.order === 0) || stages[0];
        setFormData({
          title: '',
          description: '',
          value: '',
          currency: 'EUR',
          probability: 50,
          stage_id: defaultStage?.id || '',
          expected_close_date: '',
          assigned_to: '',
          contact_id: '',
          company: '',
          tags: [],
          custom_fields: {}
        });
      }
      setErrors({});
      loadContacts();
    }
  }, [isOpen, deal, stages]);

  const loadContacts = async () => {
    try {
      setLoadingContacts(true);
      // We'll implement this when we have the contacts service
      // const contactsData = await contactsService.fetchContacts({ organizationId });
      // setContacts(contactsData);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoadingContacts(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Il titolo è obbligatorio';
    }

    if (!formData.value || parseFloat(formData.value) <= 0) {
      newErrors.value = 'Inserisci un valore valido maggiore di zero';
    }

    if (!formData.stage_id) {
      newErrors.stage_id = 'Seleziona uno stage';
    }

    if (formData.probability < 0 || formData.probability > 100) {
      newErrors.probability = 'La probabilità deve essere tra 0 e 100';
    }

    if (formData.expected_close_date) {
      const selectedDate = new Date(formData.expected_close_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.expected_close_date = 'La data di chiusura non può essere nel passato';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSaving(true);
      
      const dealData: Partial<Deal> = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        value: parseFloat(formData.value),
        currency: formData.currency,
        probability: formData.probability,
        stage_id: formData.stage_id,
        expected_close_date: formData.expected_close_date || undefined,
        assigned_to: formData.assigned_to || undefined,
        contact_id: formData.contact_id || undefined,
        company: formData.company.trim() || undefined,
        tags: formData.tags,
        custom_fields: formData.custom_fields,
        organization_id: organizationId
      };

      if (deal) {
        dealData.id = deal.id;
      }

      await onSave(dealData);
      onClose();
    } catch (error) {
      console.error('Error saving deal:', error);
      setErrors({ submit: 'Errore nel salvataggio del deal. Riprova.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {deal ? 'Modifica Deal' : 'Nuovo Deal'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Informazioni Base
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Titolo Deal *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.title ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Es: Vendita software CRM per Azienda X"
                        maxLength={100}
                      />
                      {errors.title && (
                        <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descrizione
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Aggiungi dettagli sul deal..."
                        maxLength={500}
                      />
                    </div>

                    {/* Value and Currency */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Valore *
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={formData.value}
                            onChange={(e) => {
                              setFormData(prev => ({ ...prev, value: e.target.value }));
                            }}
                            className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.value ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="0.00"
                          />
                        </div>
                        {errors.value && (
                          <p className="mt-1 text-sm text-red-600">{errors.value}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Valuta
                        </label>
                        <select
                          value={formData.currency}
                          onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="EUR">EUR</option>
                          <option value="USD">USD</option>
                          <option value="GBP">GBP</option>
                        </select>
                      </div>
                    </div>

                    {/* Probability */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Probabilità di Chiusura: {formData.probability}%
                      </label>
                      <div className="flex items-center gap-3">
                        <Percent className="w-4 h-4 text-gray-400" />
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={formData.probability}
                          onChange={(e) => setFormData(prev => ({ ...prev, probability: parseInt(e.target.value) }))}
                          className="flex-1"
                        />
                        <span className="w-12 text-sm text-gray-600">{formData.probability}%</span>
                      </div>
                      {errors.probability && (
                        <p className="mt-1 text-sm text-red-600">{errors.probability}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact & Company */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Contatto & Azienda
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Contact */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contatto
                      </label>
                      <select
                        value={formData.contact_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, contact_id: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={loadingContacts}
                      >
                        <option value="">Seleziona un contatto</option>
                        {contacts.map(contact => (
                          <option key={contact.id} value={contact.id}>
                            {contact.name} {contact.email && `(${contact.email})`}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Company */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Azienda
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nome dell'azienda"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Pipeline & Assignment */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Pipeline & Assegnazione
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Stage */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stage *
                      </label>
                      <select
                        value={formData.stage_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, stage_id: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.stage_id ? 'border-red-300' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Seleziona uno stage</option>
                        {stages.map(stage => (
                          <option key={stage.id} value={stage.id}>
                            {stage.name}
                          </option>
                        ))}
                      </select>
                      {errors.stage_id && (
                        <p className="mt-1 text-sm text-red-600">{errors.stage_id}</p>
                      )}
                    </div>

                    {/* Expected Close Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data di Chiusura Prevista
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="date"
                          value={formData.expected_close_date}
                          onChange={(e) => setFormData(prev => ({ ...prev, expected_close_date: e.target.value }))}
                          className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.expected_close_date ? 'border-red-300' : 'border-gray-300'
                          }`}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      {errors.expected_close_date && (
                        <p className="mt-1 text-sm text-red-600">{errors.expected_close_date}</p>
                      )}
                    </div>

                    {/* Assigned To */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assegnato a
                      </label>
                      <select
                        value={formData.assigned_to}
                        onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleziona un utente</option>
                        {/* We'll populate this with actual users later */}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tag
                  </label>
                  
                  <div className="space-y-3">
                    {/* Tag input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Aggiungi un tag..."
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Aggiungi
                      </button>
                    </div>

                    {/* Tag list */}
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{errors.submit}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {deal ? 'Salva Modifiche' : 'Crea Deal'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}