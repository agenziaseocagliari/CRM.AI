import React, { useState } from 'react';
// FIX: Corrected the import for useOutletContext from 'react-router-dom' to resolve module export errors.
import toast from 'react-hot-toast';
import { useOutletContext } from 'react-router-dom';

import { useCrmData } from '../hooks/useCrmData';
import { supabase } from '../lib/supabaseClient';
import { Form, FormField, FormStyle } from '../types';
import { UniversalAIChat } from './ai/UniversalAIChat';
import { InteractiveAIQuestionnaire } from './InteractiveAIQuestionnaire';
import { PostAIEditor } from './PostAIEditor';

import {
  CodeIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
} from './ui/icons';
import { Modal } from './ui/Modal';

import { diagnosticLogger } from '../lib/mockDiagnosticLogger';
import { InputValidator, SecureLogger } from '../lib/security/securityUtils';
// WordPress integration functions (imported when needed)
// import { generateKadenceForm, generateKadenceBlockPattern } from '../lib/wordpress/WordPressKadenceGenerator';

// Error interface for proper typing
interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// Componente per renderizzare dinamicamente i campi del form in anteprima o in modalità pubblica
const DynamicFormField: React.FC<{ field: FormField; formStyle?: FormStyle }> = ({ field, formStyle }) => {
  // Apply form style if available
  const inputStyle = {
    borderColor: formStyle?.primary_color || '#d1d5db',
    backgroundColor: '#ffffff', // Keep inputs white for readability
    color: formStyle?.text_color || '#374151',
    borderRadius: `${formStyle?.border_radius || 6}px`,
  };
  
  const commonClasses =
    'mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 sm:text-sm';

  // Gestione speciale per checkbox (layout inline con supporto HTML nel label)
  if (field.type === 'checkbox') {
    return (
      <div className="flex items-start space-x-2">
        <input
          id={field.name}
          name={field.name}
          type="checkbox"
          required={field.required}
          className="h-4 w-4 border rounded mt-0.5"
          style={{
            accentColor: formStyle?.primary_color || '#6366f1',
            borderColor: formStyle?.primary_color || '#d1d5db',
          }}
        />
        <label
          htmlFor={field.name}
          className="text-sm text-gray-700 leading-5"
          dangerouslySetInnerHTML={{
            __html: field.label + (field.required ? ' *' : ''),
          }}
        />
      </div>
    );
  }

  // Gestione rating stars
  if (field.type === 'rating') {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {field.label}
          {field.required ? ' *' : ''}
        </label>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              className="text-2xl text-gray-300 hover:text-yellow-400 focus:text-yellow-400"
            >
              ★
            </button>
          ))}
        </div>
        {field.description && (
          <p className="mt-1 text-xs text-gray-500">{field.description}</p>
        )}
      </div>
    );
  }

  // Gestione file upload
  if (field.type === 'file') {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required ? ' *' : ''}
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-primary">
          <div className="space-y-1 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor={field.name}
                className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-indigo-500"
              >
                <span>Carica un file</span>
                <input
                  id={field.name}
                  name={field.name}
                  type="file"
                  className="sr-only"
                  required={field.required}
                />
              </label>
              <p className="pl-1">o trascina qui</p>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, PDF fino a 10MB</p>
          </div>
        </div>
        {field.description && (
          <p className="mt-1 text-xs text-gray-500">{field.description}</p>
        )}
      </div>
    );
  }

  // Label standard per altri tipi di campo
  const label = (
    <label
      htmlFor={field.name}
      className="block text-sm font-medium text-gray-700"
    >
      {field.label}
      {field.required ? ' *' : ''}
    </label>
  );

  // Gestione textarea
  if (field.type === 'textarea') {
    return (
      <div>
        {label}
        <textarea
          id={field.name}
          name={field.name}
          rows={4}
          required={field.required}
          className={commonClasses}
          style={inputStyle}
          placeholder={field.description}
        />
        {field.description && (
          <p className="mt-1 text-xs text-gray-500">{field.description}</p>
        )}
      </div>
    );
  }

  // Gestione select con opzioni
  if (field.type === 'select' && field.options) {
    return (
      <div>
        {label}
        <select
          id={field.name}
          name={field.name}
          required={field.required}
          className={commonClasses}
          style={inputStyle}
        >
          <option value="">Seleziona un&apos;opzione</option>
          {field.options.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Input standard per tutti gli altri tipi
  return (
    <div>
      {label}
      <input
        id={field.name}
        name={field.name}
        type={field.type}
        required={field.required}
        className={commonClasses}
        style={inputStyle}
        placeholder={field.description}
      />
      {field.description && (
        <p className="mt-1 text-xs text-gray-500">{field.description}</p>
      )}
    </div>
  );
};

interface FormCardProps {
  form: Form;
  onDelete: (form: Form) => void;
  onPreview: (form: Form) => void;
  onGetCode: (form: Form) => void;
  onWordPress: (form: Form) => void;
  onEdit: (form: Form) => void;
}

const FormCard: React.FC<FormCardProps> = ({
  form,
  onDelete,
  onPreview,
  onGetCode,
  onWordPress,
  onEdit,
}) => {
  // Check if form has custom colors (primary OR background)
  const hasCustomPrimary = form.style?.primary_color && 
    form.style.primary_color !== '#2563eb' && 
    form.style.primary_color !== '#6366f1';
    
  const hasCustomBackground = form.style?.background_color && 
    form.style.background_color !== '#ffffff';
    
  const hasCustomColors = hasCustomPrimary || hasCustomBackground;

  return (
    <div className="bg-white p-4 rounded-lg shadow border flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-text-primary truncate">
            {form.name}
          </h3>
          {hasCustomColors && (
            <div className="flex items-center space-x-1">
              <div 
                className="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
                style={{ backgroundColor: form.style.primary_color }}
                title={`Colore primario: ${form.style.primary_color}`}
              />
              {form.style.background_color && form.style.background_color !== '#ffffff' && (
                <div 
                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
                  style={{ backgroundColor: form.style.background_color }}
                  title={`Colore sfondo: ${form.style.background_color}`}
                />
              )}
              <span className="text-xs text-green-600 font-medium">🎨</span>
            </div>
          )}
        </div>
        <p className="text-sm text-text-secondary">
          Creato il: {new Date(form.created_at).toLocaleDateString('it-IT')}
        </p>
        {hasCustomColors && (
          <p className="text-xs text-green-600 mt-1">
            FormMaster Level 6 - Con personalizzazioni
          </p>
        )}
      </div>
      <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t">
      <button
        onClick={() => onEdit(form)}
        title="Modifica"
        className="p-2 text-blue-500 hover:bg-blue-50 rounded-md"
      >
        <PencilIcon className="w-5 h-5" />
      </button>
      <button
        onClick={() => onPreview(form)}
        title="Anteprima"
        className="p-2 text-gray-500 hover:bg-gray-100 rounded-md"
      >
        <EyeIcon className="w-5 h-5" />
      </button>
      <button
        onClick={() => onWordPress(form)}
        title="WordPress Embed"
        className="p-2 text-blue-500 hover:bg-blue-50 rounded-md"
      >
        <span className="w-5 h-5 text-xs font-bold">WP</span>
      </button>
      <button
        onClick={() => onGetCode(form)}
        title="Ottieni Codice"
        className="p-2 text-gray-500 hover:bg-gray-100 rounded-md"
      >
        <CodeIcon className="w-5 h-5" />
      </button>
      <button
        onClick={() => onDelete(form)}
        title="Elimina"
        className="p-2 text-red-500 hover:bg-red-50 rounded-md"
      >
        <TrashIcon className="w-5 h-5" />
      </button>
      </div>
    </div>
  );
};

export const Forms: React.FC = () => {
  console.log('📋 Forms component is rendering');
  const {
    forms,
    organization,
    refetch: refetchData,
  } = useOutletContext<ReturnType<typeof useCrmData>>();
  console.log('📋 Forms data:', { forms, organization });

  // Stati per le modali
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isPreviewModalOpen, setPreviewModalOpen] = useState(false);
  const [isGetCodeModalOpen, setGetCodeModalOpen] = useState(false);

  // Stati per i dati
  const [formToModify, setFormToModify] = useState<Form | null>(null);
  const [prompt, setPrompt] = useState('');
  const [formName, setFormName] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [generatedFields, setGeneratedFields] = useState<FormField[] | null>(
    null
  );
  const [publicUrl, setPublicUrl] = useState('');

  // Stati per editing manuale
  const [creationMode, setCreationMode] = useState<
    'ai' | 'manual' | 'edit-ai' | 'questionnaire' | null
  >(null);
  const [manualFields, setManualFields] = useState<FormField[]>([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FormField['type']>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  // Stati per questionario interattivo
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  // Stati per PostAI Editor (Level 6)
  const [formStyle, setFormStyle] = useState<FormStyle | undefined>(undefined);
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState('');
  const [isEditingAIFields, setIsEditingAIFields] = useState(false);

  // Stati di caricamento ed errore
  const [isLoading, setIsLoading] = useState(false);

  // Funzioni per editing manuale
  const addManualField = () => {
    if (!newFieldName || !newFieldLabel) {
      toast.error('Nome e label del campo sono obbligatori');
      return;
    }

    const newField: FormField = {
      name: newFieldName.toLowerCase().replace(/\s+/g, '_'),
      label: newFieldLabel,
      type: newFieldType,
      required: newFieldRequired,
    };

    setManualFields([...manualFields, newField]);
    setNewFieldName('');
    setNewFieldLabel('');
    setNewFieldType('text');
    setNewFieldRequired(false);
    toast.success('Campo aggiunto con successo!');
  };

  const removeManualField = (index: number) => {
    setManualFields(manualFields.filter((_, i) => i !== index));
  };

  const handleStartManualCreation = () => {
    setCreationMode('manual');
    setManualFields([]);
    setCreateModalOpen(true);
  };

  const handleStartAICreation = () => {
    setCreationMode('ai');
    setCreateModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setPrompt('');
    setFormName('');
    setFormTitle('');
    setGeneratedFields(null);
    setIsLoading(false);
    setCreateModalOpen(true);
  };

  const handleOpenDeleteModal = (form: Form) => {
    setFormToModify(form);
    setDeleteModalOpen(true);
  };
  const handleOpenPreviewModal = (form: Form) => {
    setFormToModify(form);
    setPreviewModalOpen(true);
  };
  const handleOpenGetCodeModal = (form: Form) => {
    setFormToModify(form);
    const url = `${window.location.origin}/form/${form.id}`;
    setPublicUrl(url);
    setGetCodeModalOpen(true);
  };

  const handleEditForm = (form: Form) => {
    // Load existing form data for editing
    setFormName(form.name);
    setFormTitle(form.title);
    setGeneratedFields(form.fields);
    
    // 🎨 CRITICAL: Restore form style from saved data
    if (form.style) {
      console.log('🎨 LOADING SAVED FORM STYLE:', form.style);
      setFormStyle(form.style);
    } else {
      console.log('⚠️ No saved style found for form:', form.name);
      setFormStyle(undefined);
    }
    
    // Set editing mode
    setCreationMode('ai'); // Use AI mode for editing
    setIsEditingAIFields(true);
    setCreateModalOpen(true);
    
    console.log('📝 EDIT FORM LOADED:', {
      formName: form.name,
      hasStyle: !!form.style,
      styleColors: form.style ? {
        primary: form.style.primary_color,
        background: form.style.background_color
      } : null
    });
  };

  const handleWordPressEmbed = (form: Form) => {
    // Genera il codice HTML per WordPress
    const embedCode = generateWordPressEmbedCode(form);
    navigator.clipboard.writeText(embedCode);
    toast.success('Codice WordPress copiato negli appunti!');
  };

  const generateWordPressEmbedCode = (form: Form): string => {
    const baseUrl = window.location.origin;
    const formUrl = `${baseUrl}/form/${form.id}`;

    return `<!-- Guardian AI CRM - Form: ${form.title} -->
<div id="guardian-ai-form-${form.id}" style="max-width: 600px; margin: 0 auto;">
    <iframe 
        src="${formUrl}" 
        width="100%" 
        height="600" 
        frameborder="0" 
        style="border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"
        title="${form.title}"
    >
        Il tuo browser non supporta gli iframe. 
        <a href="${formUrl}" target="_blank">Clicca qui per aprire il form</a>
    </iframe>
</div>
<!-- Fine Guardian AI CRM Form -->`;
  };

  const handleCloseModals = () => {
    setCreateModalOpen(false);
    setDeleteModalOpen(false);
    setPreviewModalOpen(false);
    setGetCodeModalOpen(false);
    setFormToModify(null);
    setPrompt('');
    setFormName('');
    setFormTitle('');
    setGeneratedFields(null);
    setPublicUrl('');

    // Reset manual editing states
    setCreationMode(null);
    setManualFields([]);
    setNewFieldName('');
    setNewFieldLabel('');
    setNewFieldType('text');
    setNewFieldRequired(false);

    // Reset questionnaire states
    setShowQuestionnaire(false);
    setIsEditingAIFields(false);
    
    // Reset FormMaster Level 6 states
    setFormStyle(undefined);
    setPrivacyPolicyUrl('');
  };

  const handleGenerateForm = async (customPrompt?: string) => {
    const currentPrompt = customPrompt || prompt;
    if (!currentPrompt) {
      toast.error('Per favore, inserisci una descrizione per il tuo form.');
      return;
    }

    // Sanitize and validate prompt input
    const sanitizedPrompt = InputValidator.sanitizeString(currentPrompt);
    if (sanitizedPrompt.length < 5) {
      toast.error(
        'La descrizione deve essere più dettagliata (almeno 5 caratteri).'
      );
      return;
    }

    SecureLogger.info('forms', 'Form generation initiated', {
      promptLength: sanitizedPrompt.length,
      organizationId: organization?.id,
    });

    setIsLoading(true);
    setGeneratedFields(null);

    const toastId = toast.loading('Generazione campi in corso...');
    try {
      console.log('🔍 Debugging form generation request:', {
        organization_id: organization?.id,
        organization,
        prompt_length: sanitizedPrompt.length,
      });

      if (!organization?.id) {
        throw new Error(
          'Organization ID non disponibile. Ricarica la pagina e riprova.'
        );
      }

      // TEMPORARY FIX: Use direct fetch instead of invokeSupabaseFunction
      // to bypass retry logic and session refresh issues
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Sessione non trovata. Ricarica la pagina.');
      }

      const supabaseUrl = (
        import.meta as unknown as { env: Record<string, string> }
      ).env.VITE_SUPABASE_URL;
      const supabaseAnonKey = (
        import.meta as unknown as { env: Record<string, string> }
      ).env.VITE_SUPABASE_ANON_KEY;

      // DETAILED LOGGING FOR DEBUGGING
      console.log('🔍 FORMMASTER DEBUG - Request Details:', {
        url: `${supabaseUrl}/functions/v1/generate-form-fields`,
        organization_id: organization.id,
        prompt_length: sanitizedPrompt.length,
        token_length: session.access_token?.length,
        token_preview: session.access_token?.substring(0, 30),
        expires_at: session.expires_at,
        timestamp: new Date().toISOString(),
      });

      const requestBody = {
        prompt: sanitizedPrompt,
        organization_id: organization.id,
      };

      console.log('🔍 FORMMASTER DEBUG - Request Body:', requestBody);

      const response = await fetch(
        `${supabaseUrl}/functions/v1/generate-form-fields`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            apikey: supabaseAnonKey,
          },
          body: JSON.stringify(requestBody),
        }
      );

      console.log('🔍 FORMMASTER DEBUG - Response Status:', response.status);
      console.log('🔍 FORMMASTER DEBUG - Response Headers:', [
        ...response.headers.entries(),
      ]);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 FORMMASTER DEBUG - Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
          timestamp: new Date().toISOString(),
        });

        let errorMessage = `Server error (${response.status})`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
          console.error('🔍 FORMMASTER DEBUG - Parsed Error:', errorData);
        } catch {
          errorMessage = errorText || errorMessage;
          console.error('🔍 FORMMASTER DEBUG - Raw Error:', errorText);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // 🔍 EXTENDED DEBUG LOGGING
      console.log('🔍 FORMMASTER DEBUG - Raw Response Data:', data);
      console.log('🔍 FORMMASTER DEBUG - Data Type:', typeof data);
      console.log(
        '🔍 FORMMASTER DEBUG - Has fields property:',
        'fields' in data
      );
      console.log('🔍 FORMMASTER DEBUG - Fields value:', data.fields);
      console.log(
        '🔍 FORMMASTER DEBUG - Fields is Array:',
        Array.isArray(data.fields)
      );
      console.log('🔍 FORMMASTER DEBUG - Fields length:', data.fields?.length);

      // Type guard for API response
      if (
        !data ||
        typeof data !== 'object' ||
        !('fields' in data) ||
        !Array.isArray((data as Record<string, unknown>).fields)
      ) {
        console.error('🔍 FORMMASTER DEBUG - Type guard failed:', {
          hasData: !!data,
          isObject: typeof data === 'object',
          hasFieldsProperty: 'fields' in data,
          fieldsIsArray: Array.isArray(
            (data as Record<string, unknown>).fields
          ),
        });
        throw new Error('Risposta API non valida');
      }

      const fields = (data as { fields: FormField[] }).fields;
      console.log('🔍 FORMMASTER DEBUG - Extracted fields:', fields);

      if (!fields || !Array.isArray(fields) || fields.length === 0) {
        console.error('🔍 FORMMASTER DEBUG - Fields validation failed:', {
          hasFields: !!fields,
          isArray: Array.isArray(fields),
          length: fields?.length,
        });
        throw new Error("L'AI ha restituito una struttura non valida o vuota.");
      }

      console.log('🔍 FORMMASTER DEBUG - Setting generated fields:', fields);
      console.log('🎯 FORMMASTER LEVEL 6 - API Response Meta:', data.meta);

      // ✨ FIXED: Handle questionnaire customizations from correct location
      // Check both data.style (new format) and data.meta?.style_customizations (legacy)
      const styleData = data.style || data.meta?.style_customizations;
      const settingsData = data.settings;
      
      if (styleData) {
        console.log('🎨 Applying style customizations:', styleData);

        // Set form style from questionnaire data - check for ANY color customization
        if (styleData.primary_color || styleData.secondary_color || styleData.background_color) {
          console.log('🎨 BACKGROUND COLOR DEBUG:', {
            primary_color: styleData.primary_color,
            background_color: styleData.background_color,
            secondary_color: styleData.secondary_color
          });
          
          setFormStyle({
            primary_color: styleData.primary_color || '#6366f1',
            secondary_color: styleData.secondary_color || '#f3f4f6',
            background_color: styleData.background_color || '#ffffff',
            text_color: styleData.text_color || '#1f2937',
            font_family: styleData.font_family || 'system-ui, -apple-system, sans-serif',
            border_radius: parseInt(styleData.border_radius) || 8,
            spacing: 'normal',
            button_style: 'solid',
          });
        }

        // Set privacy policy URL if provided from settings or style
        const privacyUrl = settingsData?.privacy_policy_url || styleData.privacy_policy_url;
        if (privacyUrl && privacyUrl !== '') {
          setPrivacyPolicyUrl(privacyUrl);
        }

        // Show appropriate success message based on data source
        const businessContext = data.meta?.questionnaire_data?.businessType || 'personalizzazioni';
        toast.success(
          `FormMaster Level 6: Form generato con ${businessContext}!`,
          { id: toastId }
        );
      } else {
        toast.success('Campi generati con successo!', { id: toastId });
      }

      setGeneratedFields(fields);
      console.log('🔍 FORMMASTER DEBUG - Generated fields set successfully!');
    } catch (err: unknown) {
      const error = err as ApiError;
      diagnosticLogger.error(
        'api',
        'Errore dettagliato generazione form:',
        error
      );
      // The error toast is now handled by invokeSupabaseFunction, so we just log.
      toast.dismiss(toastId);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveForm = async () => {
    console.log('🔥 FUNCTION ENTRY: handleSaveForm called!');
    
    const fieldsToSave =
      creationMode === 'manual' ? manualFields : generatedFields;

    if (
      !formName ||
      !formTitle ||
      !fieldsToSave ||
      fieldsToSave.length === 0 ||
      !organization
    ) {
      console.log('🚨 VALIDATION FAILED:', { formName, formTitle, fieldsCount: fieldsToSave?.length, hasOrg: !!organization });
      toast.error('Nome, titolo e almeno un campo sono necessari per salvare.');
      return;
    }

    // 🔍 CRITICAL DEBUG: Check formStyle before saving
    console.log('🔥 PRE-SAVE CHECK:', {
      hasFormStyle: !!formStyle,
      formStyleValue: formStyle,
      isEditingAIFields: isEditingAIFields,
      creationMode: creationMode
    });

    // 🎨 EXTRA DEBUG: Detailed color analysis
    if (formStyle) {
      console.log('🎨 DETAILED COLOR ANALYSIS:', {
        primary_color: formStyle.primary_color,
        background_color: formStyle.background_color,
        secondary_color: formStyle.secondary_color,
        hasBackground: !!formStyle.background_color,
        backgroundValue: formStyle.background_color,
        backgroundNotDefault: formStyle.background_color !== '#ffffff'
      });
    }

    // Sanitize form inputs
    const sanitizedName = InputValidator.sanitizeString(formName);
    const sanitizedTitle = InputValidator.sanitizeString(formTitle);

    if (sanitizedName.length < 2 || sanitizedTitle.length < 2) {
      toast.error('Nome e titolo devono avere almeno 2 caratteri validi.');
      return;
    }

    SecureLogger.info('forms', 'Form save operation initiated', {
      nameLength: sanitizedName.length,
      titleLength: sanitizedTitle.length,
      fieldsCount: fieldsToSave.length,
      organizationId: organization.id,
      creationMode: creationMode,
    });

    setIsLoading(true);

    try {
      // FormMaster Level 6: Use proper database columns for style and settings
      const formData = {
        name: sanitizedName,
        title: sanitizedTitle,
        fields: fieldsToSave, // Pure form fields array
        organization_id: organization.id,
        style: formStyle || {}, // Dedicated style column
        settings: {
          // Dedicated settings column
          privacy_policy_url: privacyPolicyUrl || undefined,
          show_logo: true,
          success_message: 'Grazie per averci contattato!',
          gdpr_compliance: true,
          created_with: 'FormMaster Level 6',
          generation_timestamp: new Date().toISOString(),
        },
      };

      // 🎨 DATABASE SAVE DEBUG: What exactly are we sending?
      const styleData = formData.style as FormStyle | undefined;
      console.log('📊 FORM DATA TO DATABASE:', {
        name: formData.name,
        hasStyle: !!formData.style,
        styleObject: formData.style,
        stylePrimary: styleData?.primary_color,
        styleBackground: styleData?.background_color,
        styleKeys: formData.style ? Object.keys(formData.style) : [],
      });

      console.log('🎨 Saving form with FormMaster Level 6 structure:', {
        fieldsCount: fieldsToSave.length,
        hasStyle: !!formStyle,
        styleKeys: formStyle ? Object.keys(formStyle) : [],
        styleValues: formStyle,
        settingsKeys: Object.keys(formData.settings),
        privacyPolicy: !!privacyPolicyUrl,
        fullFormData: formData,
      });
      
      // Extra visible debug
      if (formStyle) {
        console.log('🔍 STYLE DEBUG - Colors being saved:', {
          primary: formStyle.primary_color,
          background: formStyle.background_color,
          text: formStyle.text_color
        });
      } else {
        console.log('⚠️ STYLE DEBUG - NO STYLE TO SAVE!');
      }

      const { data: insertedData, error: insertError } = await supabase
        .from('forms')
        .insert(formData)
        .select('*');
      if (insertError) {
        console.error('❌ FormMaster Level 6 save error:', insertError);
        throw insertError;
      }
      
      console.log('✅ Form saved successfully! Checking saved data:', {
        insertedForm: insertedData?.[0],
        savedStyle: insertedData?.[0]?.style,
        savedSettings: insertedData?.[0]?.settings
      });
      
      // Store style info before handleCloseModals resets it
      const savedStyleInfo = formStyle ? 
        `con colori: ${formStyle.primary_color} / ${formStyle.background_color}` : 
        'senza personalizzazioni';

      // Extra visible debug for saved colors
      const savedStyle = insertedData?.[0]?.style;
      if (savedStyle) {
        console.log('🎨 SAVED STYLE CONFIRMED:', {
          primary: savedStyle.primary_color,
          background: savedStyle.background_color,
          complete: savedStyle
        });
      } else {
        console.log('❌ SAVED STYLE MISSING FROM DATABASE!');
      }

      console.log(
        '✅ FormMaster Level 6 form saved successfully with full customizations'
      );

      refetchData();
      handleCloseModals();
      toast.success(`🎉 Form FormMaster Level 6 salvato ${savedStyleInfo}!`);
    } catch (err: unknown) {
      const error = err as ApiError;
      toast.error(`Errore durante il salvaggio: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteForm = async () => {
    if (!formToModify) {
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formToModify.id);
      if (error) {
        throw error;
      }
      refetchData();
      handleCloseModals();
      toast.success('Form eliminato!');
    } catch (err: unknown) {
      const error = err as ApiError;
      toast.error(`Errore: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderFieldPreview = (field: FormField, index: number) => {
    // Input fields use white background for better readability, 
    // while container uses the custom background_color
    const commonStyle = {
      borderColor: formStyle?.primary_color || '#d1d5db',
      backgroundColor: '#ffffff', // Keep inputs white for readability
      color: formStyle?.text_color || '#374151',
      borderRadius: `${formStyle?.border_radius || 6}px`,
    };
    const commonClasses =
      'mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm focus:ring-2 focus:ring-opacity-50';
    
    // Stile per hover e focus che usa il colore di background
    const focusStyle = `
      .form-preview-field:focus {
        border-color: ${formStyle?.primary_color || '#6366f1'} !important;
        box-shadow: 0 0 0 2px ${formStyle?.primary_color || '#6366f1'}40 !important;
      }
      .form-preview-field:hover {
        background-color: ${formStyle?.background_color || '#f9fafb'} !important;
        filter: brightness(0.98);
      }
    `;

    // Gestione checkbox con layout inline e supporto HTML per privacy policy
    if (field.type === 'checkbox') {
      const hasHTML = field.label.includes('<a') || field.label.includes('<');

      return (
        <div key={index} className="flex items-start space-x-2 mt-1">
          <input
            type="checkbox"
            disabled
            className="h-4 w-4 border rounded mt-0.5 flex-shrink-0"
            style={{
              accentColor: formStyle?.primary_color || '#6366f1',
              borderColor: formStyle?.primary_color || '#d1d5db',
            }}
          />
          {hasHTML ? (
            <span
              className="text-sm text-gray-600 leading-5"
              dangerouslySetInnerHTML={{
                __html: field.label + (field.required ? ' *' : ''),
              }}
            />
          ) : (
            <span className="text-sm text-gray-600 leading-5">
              {field.label}
              {field.required ? ' *' : ''}
            </span>
          )}
        </div>
      );
    }

    // Gestione textarea
    if (field.type === 'textarea') {
      return (
        <>
          <style dangerouslySetInnerHTML={{ __html: focusStyle }} />
          <textarea
            key={index}
            rows={3}
            className={`${commonClasses} form-preview-field`}
            style={commonStyle}
            disabled
          />
        </>
      );
    }

    // Gestione select con opzioni
    if (field.type === 'select' && field.options) {
      return (
        <>
          <style dangerouslySetInnerHTML={{ __html: focusStyle }} />
          <select
            key={index}
            className={`${commonClasses} form-preview-field`}
            style={commonStyle}
            disabled
          >
            <option>Seleziona un&apos;opzione</option>
            {field.options.map((option, optIndex) => (
              <option key={optIndex} value={option}>
                {option}
              </option>
            ))}
          </select>
        </>
      );
    }

    // Input standard
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: focusStyle }} />
        <input
          key={index}
          type={field.type === 'select' ? 'text' : field.type}
          className={`${commonClasses} form-preview-field`}
          style={commonStyle}
          disabled
        />
      </>
    );
  };

  const renderContent = () => {
    if (forms.length === 0) {
      return (
        <div className="bg-card p-8 rounded-lg shadow text-center">
          <div className="mx-auto bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center">
            {' '}
            <SparklesIcon className="w-8 h-8 text-primary" />{' '}
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-text-primary">
            {' '}
            Crea il tuo primo Form con l&apos;AI{' '}
          </h2>
          <p className="mt-2 text-text-secondary max-w-2xl mx-auto">
            {' '}
            Inizia a raccogliere lead in pochi secondi. Descrivi i campi di cui
            hai bisogno e lascia che l&apos;AI faccia il resto.{' '}
          </p>
          <div className="mt-6">
            {' '}
            <button
              onClick={handleOpenCreateModal}
              className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-indigo-700 text-lg font-semibold flex items-center space-x-2 mx-auto"
            >
              {' '}
              <PlusIcon className="w-5 h-5" />{' '}
              <span>Inizia a Costruire</span>{' '}
            </button>{' '}
          </div>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {' '}
        {forms.map(form => (
          <FormCard
            key={form.id}
            form={form}
            onDelete={handleOpenDeleteModal}
            onPreview={handleOpenPreviewModal}
            onGetCode={handleOpenGetCodeModal}
            onWordPress={handleWordPressEmbed}
            onEdit={handleEditForm}
          />
        ))}{' '}
      </div>
    );
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-text-primary">I Tuoi Form</h1>
          {forms.length > 0 && (
            <button
              onClick={handleOpenCreateModal}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
            >
              {' '}
              <PlusIcon className="w-5 h-5" /> <span>Crea Nuovo Form</span>{' '}
            </button>
          )}
        </div>
        {renderContent()}
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModals}
        title={
          creationMode
            ? `Crea Form ${creationMode === 'ai' ? 'con AI' : 'Manuale'}`
            : 'Crea Nuovo Form'
        }
      >
        <div className="space-y-4">
          {(() => {
            console.log('🔍 MODAL RENDER - Current states:', {
              creationMode,
              showQuestionnaire,
              generatedFields: !!generatedFields,
              isEditingAIFields,
            });

            if (showQuestionnaire) {
              console.log('🎯 RENDERING QUESTIONNAIRE');
              return true;
            } else if (!creationMode) {
              console.log('🎯 RENDERING MODE SELECTION');
              return false;
            } else {
              console.log('🎯 RENDERING OTHER MODE:', creationMode);
              return null;
            }
          })()}

          {showQuestionnaire ? (
            // 🎯 Questionario Interattivo AI - PRIORITÀ MASSIMA
            <>
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">✨</span>
                  <span className="text-green-800 font-medium">
                    FormMaster Level 6 - Questionario Attivo
                  </span>
                </div>
              </div>
              <InteractiveAIQuestionnaire
                initialPrompt={prompt}
                onComplete={enhancedPrompt => {
                  console.log(
                    '🎯 Enhanced Prompt from Questionnaire:',
                    enhancedPrompt
                  );
                  setPrompt(enhancedPrompt);
                  setShowQuestionnaire(false);
                  setCreationMode('ai');
                  // Auto-genera il form con il prompt migliorato (passaggio diretto)
                  handleGenerateForm(enhancedPrompt);
                }}
              />
            </>
          ) : !creationMode ? (
            // Selezione metodo di creazione
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Come vuoi creare il tuo form?
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🎯 AI Guidata clicked - BEFORE STATE CHANGE');
                    console.log('🎯 Current states BEFORE:', {
                      showQuestionnaire,
                      creationMode,
                      isCreateModalOpen,
                      generatedFields: !!generatedFields,
                    });

                    setShowQuestionnaire(true);
                    setCreationMode(null);
                    setPrompt('');

                    console.log('🎯 AI Guidata - STATE CHANGE REQUESTED');

                    // Forza re-render
                    setTimeout(() => {
                      console.log('🎯 After timeout - states should be:', {
                        showQuestionnaire: true,
                        creationMode: null,
                      });
                    }, 100);
                  }}
                  className="p-4 border-2 border-green-500 rounded-lg hover:bg-green-500 hover:text-white transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <SparklesIcon className="w-6 h-6" />
                    <div>
                      <h3 className="font-semibold">AI Guidata ⭐</h3>
                      <p className="text-sm opacity-75">
                        Questionario intelligente per form perfetti
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={handleStartAICreation}
                  className="p-4 border-2 border-primary rounded-lg hover:bg-primary hover:text-white transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <SparklesIcon className="w-6 h-6" />
                    <div>
                      <h3 className="font-semibold">AI Rapida</h3>
                      <p className="text-sm opacity-75">
                        Descrivi il form in poche parole
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={handleStartManualCreation}
                  className="p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <PlusIcon className="w-6 h-6" />
                    <div>
                      <h3 className="font-semibold">Manuale</h3>
                      <p className="text-sm opacity-75">
                        Controllo completo sui campi
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ) : creationMode === 'ai' && !generatedFields ? (
            // Prompt AI
            <>
              <div>
                <label
                  htmlFor="form-prompt"
                  className="block text-sm font-medium text-gray-700"
                >
                  Descrivi il tuo form
                </label>
                <textarea
                  id="form-prompt"
                  rows={3}
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Es: Un form di contatto con nome, email, telefono e un'area per il messaggio."
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
              <div className="flex justify-between">
                <button
                  onClick={() => setCreationMode(null)}
                  className="text-sm text-gray-600 hover:text-primary"
                >
                  ← Indietro
                </button>
                <button
                  onClick={() => handleGenerateForm()}
                  disabled={isLoading}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2 disabled:bg-gray-400"
                >
                  {' '}
                  {isLoading ? (
                    'Generazione...'
                  ) : (
                    <>
                      <SparklesIcon className="w-5 h-5" />
                      <span>Genera Campi</span>
                    </>
                  )}{' '}
                </button>
              </div>
            </>
          ) : creationMode === 'manual' ? (
            // Editor manuale
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campi del Form
                </label>
                {manualFields.length > 0 && (
                  <div className="mb-4 p-4 border rounded-md bg-gray-50 space-y-2">
                    {manualFields.map((field, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white p-2 rounded border"
                      >
                        <div className="flex-1">
                          <span className="font-medium">{field.label}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            ({field.type})
                          </span>
                          {field.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </div>
                        <button
                          onClick={() => removeManualField(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Form per aggiungere nuovo campo */}
                <div className="border rounded-md p-4 space-y-3">
                  <h4 className="font-medium text-gray-900">Aggiungi Campo</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        Nome Campo
                      </label>
                      <input
                        type="text"
                        value={newFieldName}
                        onChange={e => setNewFieldName(e.target.value)}
                        placeholder="es: nome"
                        className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        Etichetta
                      </label>
                      <input
                        type="text"
                        value={newFieldLabel}
                        onChange={e => setNewFieldLabel(e.target.value)}
                        placeholder="es: Nome Completo"
                        className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        Tipo
                      </label>
                      <select
                        value={newFieldType}
                        onChange={e =>
                          setNewFieldType(e.target.value as FormField['type'])
                        }
                        className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="text">Testo</option>
                        <option value="email">Email</option>
                        <option value="tel">Telefono</option>
                        <option value="textarea">Area di Testo</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="select">Select</option>
                        <option value="url">URL</option>
                        <option value="date">Data</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newFieldRequired}
                          onChange={e => setNewFieldRequired(e.target.checked)}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <span className="text-xs font-medium text-gray-700">
                          Obbligatorio
                        </span>
                      </label>
                    </div>
                  </div>
                  <button
                    onClick={addManualField}
                    className="w-full bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200 text-sm"
                  >
                    Aggiungi Campo
                  </button>
                </div>
              </div>

              {manualFields.length > 0 && (
                <>
                  <div>
                    <label
                      htmlFor="manual-form-name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Nome del Form (interno)
                    </label>
                    <input
                      type="text"
                      id="manual-form-name"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      placeholder="Es: Form Contatti Sito Web"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="manual-form-title"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Titolo del Form (pubblico)
                    </label>
                    <input
                      type="text"
                      id="manual-form-title"
                      value={formTitle}
                      onChange={e => setFormTitle(e.target.value)}
                      placeholder="Es: Contattaci"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-between items-center pt-4 border-t">
                <button
                  onClick={() => setCreationMode(null)}
                  className="text-sm text-gray-600 hover:text-primary"
                >
                  ← Indietro
                </button>
                {manualFields.length > 0 && (
                  <button
                    onClick={() => {
                      console.log('🚀 BUTTON CLICKED: Manual Save Form', { manualFields: manualFields.length });
                      handleSaveForm();
                    }}
                    disabled={isLoading}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                  >
                    {isLoading ? 'Salvataggio...' : 'Salva Form'}
                  </button>
                )}
              </div>
            </>
          ) : (
            // Editor Avanzato Post-AI (FormMaster Level 6)
            <>
              {!isEditingAIFields ? (
                // Anteprima Standard
                <>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Anteprima Form Generato dall&apos;AI
                        {formStyle && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            ✨ Stile personalizzato
                          </span>
                        )}
                      </label>
                      <button
                        onClick={() => setIsEditingAIFields(true)}
                        className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 flex items-center space-x-1"
                      >
                        <PencilIcon className="w-4 h-4" />
                        <span>Modifica Campi</span>
                      </button>
                    </div>
                    <div
                      className="mt-2 p-4 border rounded-md space-y-3 transition-all duration-300"
                      style={{
                        backgroundColor:
                          formStyle?.background_color || '#f9fafb',
                        borderColor: formStyle?.primary_color || '#d1d5db',
                        borderRadius: `${formStyle?.border_radius || 6}px`,
                        boxShadow: `0 1px 3px ${formStyle?.primary_color || '#e5e7eb'}20, 0 4px 6px -1px ${formStyle?.primary_color || '#e5e7eb'}10`,
                      }}
                    >
                      {generatedFields?.map((field, index) => (
                        <div key={index}>
                          <label
                            className="text-sm font-medium block mb-1"
                            style={{
                              color: formStyle?.text_color || '#111827',
                            }}
                          >
                            {field.label}
                            {field.required ? ' *' : ''}
                          </label>
                          {renderFieldPreview(field, index)}
                        </div>
                      )) || (
                        <p className="text-gray-500">Nessun campo generato</p>
                      )}

                      {/* Preview Submit Button with Custom Colors */}
                      <div className="pt-4">
                        <button
                          disabled
                          className="px-6 py-2 rounded font-medium text-white cursor-not-allowed"
                          style={{
                            backgroundColor:
                              formStyle?.primary_color || '#6366f1',
                            borderRadius: `${formStyle?.border_radius || 6}px`,
                          }}
                        >
                          Invia Form
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      💡 <strong>Nuovo in FormMaster Level 6:</strong> Ora puoi
                      modificare i campi generati dall&apos;AI! Clicca
                      &quot;Modifica Campi&quot; per personalizzare etichette,
                      aggiungere link privacy, cambiare stili e molto altro.
                    </p>
                  </div>
                </>
              ) : (
                // Editor Avanzato PostAI
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-900">
                      ✨ FormMaster Level 6 - Editor Avanzato
                    </h4>
                    <button
                      onClick={() => setIsEditingAIFields(false)}
                      className="text-sm text-gray-600 hover:text-primary"
                    >
                      ← Torna Anteprima
                    </button>
                  </div>

                  <PostAIEditor
                    fields={generatedFields || []}
                    onFieldsChange={setGeneratedFields}
                    style={formStyle}
                    onStyleChange={setFormStyle}
                    privacyPolicyUrl={privacyPolicyUrl}
                    onPrivacyPolicyChange={setPrivacyPolicyUrl}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label
                    htmlFor="ai-form-name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Nome del Form (interno)
                  </label>
                  <input
                    type="text"
                    id="ai-form-name"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="Es: Form Contatti Sito Web"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label
                    htmlFor="ai-form-title"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Titolo del Form (pubblico)
                  </label>
                  <input
                    type="text"
                    id="ai-form-title"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder="Es: Contattaci"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t mt-4">
                <button
                  onClick={() => setGeneratedFields(null)}
                  className="text-sm text-gray-600 hover:text-primary"
                >
                  ← Ricomincia
                </button>
                <button
                  onClick={() => {
                    console.log('🚀 BUTTON CLICKED: AI Form Level 6 Save', { 
                      generatedFields: generatedFields.length,
                      formStyle: formStyle,
                      hasColors: !!(formStyle?.primary_color || formStyle?.background_color)
                    });
                    handleSaveForm();
                  }}
                  disabled={isLoading}
                  className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 flex items-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Salvataggio...</span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-4 h-4" />
                      <span>Salva Form Level 6</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseModals}
        title="Conferma Eliminazione"
      >
        <p>
          Sei sicuro di voler eliminare il form{' '}
          <strong>{formToModify?.name}</strong>? Questa azione è irreversibile.
        </p>
        <div className="flex justify-end pt-4 border-t mt-4">
          <button
            type="button"
            onClick={handleCloseModals}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 mr-2"
          >
            Annulla
          </button>
          <button
            onClick={handleDeleteForm}
            disabled={isLoading}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400"
          >
            {isLoading ? 'Eliminazione...' : 'Elimina'}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isPreviewModalOpen}
        onClose={handleCloseModals}
        title={`Anteprima: ${formToModify?.title}`}
      >
        <form className="space-y-4" onSubmit={e => e.preventDefault()}>
          {formToModify?.fields.map(field => (
            <DynamicFormField key={field.name} field={field} formStyle={formToModify?.style} />
          ))}
          <div className="flex justify-end pt-4">
            {' '}
            <button
              type="submit"
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Invia (Anteprima)
            </button>{' '}
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isGetCodeModalOpen}
        onClose={handleCloseModals}
        title="Ottieni Link Pubblico"
      >
        <p className="text-sm text-gray-600">
          Condividi questo link per permettere a chiunque di compilare il tuo
          form.
        </p>
        <div className="mt-2 flex">
          <input
            type="text"
            readOnly
            value={publicUrl}
            className="flex-grow bg-gray-100 border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(publicUrl);
              toast.success('Link copiato!');
            }}
            className="bg-primary text-white px-4 py-2 rounded-r-md hover:bg-indigo-700"
          >
            Copia
          </button>
        </div>
      </Modal>

      {/* Universal AI Chat - FormMaster */}
      <UniversalAIChat
        currentModule="Forms"
        organizationId={organization?.id || 'demo-org'}
        userId="demo-user"
        onActionTriggered={(action, data) => {
          console.log('🎯 Forms AI Action triggered:', action, data);

          // 📝 FORMMASTER ACTION HANDLER
          if (action === 'form_generated' && data && typeof data === 'object') {
            const formData = data as {
              formFields?: Array<{
                name: string;
                label: string;
                type: 'text' | 'email' | 'tel' | 'textarea';
                required: boolean;
              }>;
            };
            if (
              formData.formFields &&
              Array.isArray(formData.formFields) &&
              formData.formFields.length > 0
            ) {
              console.log(
                '🎉 Setting generated fields from AI Chat:',
                formData.formFields
              );
              // Type cast to FormField[] to match the expected interface
              const typedFields = formData.formFields.map(field => ({
                ...field,
                type: field.type as 'text' | 'email' | 'tel' | 'textarea',
              }));
              setGeneratedFields(typedFields);
              setCreateModalOpen(true); // Open the form creation modal
              toast.success(
                `${formData.formFields.length} campi generati con successo!`
              );
            }
          }
        }}
      />
    </>
  );
};
