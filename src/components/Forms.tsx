import React, { useCallback, useState } from 'react';
// FIX: Corrected the import for useOutletContext from 'react-router-dom' to resolve module export errors.
import toast from 'react-hot-toast';
import { useOutletContext } from 'react-router-dom';

import { useCrmData } from '../hooks/useCrmData';
import { supabase, supabaseAdmin } from '../lib/supabaseClient';
import { Form, FormField, FormStyle } from '../types';
import { UniversalAIChat } from './ai/UniversalAIChat';

import { CodeIcon, EyeIcon, PencilIcon, PlusIcon, SparklesIcon, TrashIcon } from './ui/icons';
import { Modal } from './ui/Modal';

import { diagnosticLogger } from '../lib/mockDiagnosticLogger';
import { InputValidator, SecureLogger } from '../lib/security/securityUtils';
import { generateKadenceForm } from '../lib/wordpress/WordPressKadenceGenerator';
import { PostAIEditor } from './forms/PostAIEditor';
import { InteractiveAIQuestionnaire } from './InteractiveAIQuestionnaire';

// Error interface for proper typing
interface ApiError {
    message: string;
    status?: number;
    code?: string;
}

// Componente per renderizzare dinamicamente i campi del form in anteprima o in modalità  pubblica
const DynamicFormField: React.FC<{
    field: FormField;
    privacyPolicyUrl?: string;
    style?: FormStyle;
}> = ({ field, privacyPolicyUrl, style }) => {
    console.log('🔧 FORMS.TSX DynamicFormField rendering:', {
        fieldName: field.name,
        fieldType: field.type,
        hasStyle: !!style,
        styleColors: style ? {
            primary: style.primary_color,
            background: style.background_color,
            text: style.text_color
        } : null
    });

    const primaryColor = style?.primary_color || '#6366f1';
    console.log('🎨 FORMS.TSX DynamicFormField calculated primaryColor:', primaryColor, 'vs default #6366f1');

    // 🎨 Calculate border color (direct primary color for better visibility)
    const borderColor = style?.primary_color || '#d1d5db';

    // 🎯 UX IMPROVEMENT: Se text_color non è specificato, usa primaryColor invece del grigio
    const textColor = style?.text_color || style?.primary_color || '#374151';

    const borderRadius = style?.border_radius || '6px';
    console.log('🎨 FORMS.TSX DynamicFormField calculated colors:', {
        primaryColor,
        borderColor,
        textColor,
        isCustomColors: primaryColor !== '#6366f1'
    });

    const commonClasses = `mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none sm:text-sm`;

    // 🎨 Dynamic focus colors based on style
    const focusStyles = {
        '--focus-ring-color': primaryColor,
        '--focus-border-color': primaryColor,
    } as React.CSSProperties;

    // FIX: Privacy checkbox alignment - checkbox a sinistra, label a destra
    if (field.type === 'checkbox') {
        // 🔒 CRITICAL FIX: Privacy policy checkbox con link cliccabile
        if (field.name === 'privacy_consent' && privacyPolicyUrl) {
            return (
                <div className="flex items-start gap-3">
                    <input
                        id={field.name}
                        name={field.name}
                        type="checkbox"
                        required={field.required}
                        className="mt-1 h-4 w-4 border-gray-300 rounded"
                        style={{
                            accentColor: primaryColor,
                            '--focus-ring-color': primaryColor,
                        } as React.CSSProperties}
                    />
                    <label htmlFor={field.name} className="text-sm flex-1" style={{ color: textColor }}>
                        Accetto l'
                        <a
                            href={privacyPolicyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:no-underline"
                            style={{ color: primaryColor }}
                        >
                            informativa sulla privacy
                        </a>
                        {' '}e il trattamento dei miei dati personali{field.required ? ' *' : ''}
                    </label>
                </div>
            );
        }

        // Checkbox generico (marketing consent, etc.)
        return (
            <div className="flex items-start gap-3">
                <input
                    id={field.name}
                    name={field.name}
                    type="checkbox"
                    required={field.required}
                    className="mt-1 h-4 w-4 border-gray-300 rounded"
                    style={{
                        accentColor: primaryColor,
                        '--focus-ring-color': primaryColor,
                    } as React.CSSProperties}
                />
                <label htmlFor={field.name} className="text-sm flex-1" style={{ color: textColor }}>
                    {field.label}{field.required ? ' *' : ''}
                </label>
            </div>
        );
    }

    const label = <label htmlFor={field.name} className="block text-sm font-medium" style={{ color: textColor }}>{field.label}{field.required ? ' *' : ''}</label>;

    // 🆕 SELECT support
    if (field.type === 'select') {
        return (
            <div>
                {label}
                <select
                    id={field.name}
                    name={field.name}
                    required={field.required}
                    className={commonClasses}
                    style={{
                        '--tw-ring-color': primaryColor,
                        borderColor: borderColor,
                        borderWidth: '2px',
                        outline: 'none',
                    } as React.CSSProperties}
                    onFocus={(e) => {
                        e.target.style.borderColor = primaryColor;
                        e.target.style.boxShadow = `0 0 0 2px ${primaryColor}25`;
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = borderColor;
                        e.target.style.boxShadow = 'none';
                    }}
                >
                    <option value="">-- Seleziona --</option>
                    {field.options?.map((option, idx) => (
                        <option key={idx} value={option}>{option}</option>
                    ))}
                </select>
            </div>
        );
    }

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
                    style={{
                        borderColor: borderColor,
                        borderWidth: '2px',
                        outline: 'none',
                    } as React.CSSProperties}
                    onFocus={(e) => {
                        e.target.style.borderColor = primaryColor;
                        e.target.style.boxShadow = `0 0 0 2px ${primaryColor}25`;
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = borderColor;
                        e.target.style.boxShadow = 'none';
                    }}
                />
            </div>
        );
    }

    return (
        <div>
            {label}
            <input
                id={field.name}
                name={field.name}
                type={field.type}
                required={field.required}
                className={commonClasses}
                style={{
                    borderColor: borderColor,
                    borderWidth: '2px',
                    outline: 'none',
                } as React.CSSProperties}
                onFocus={(e) => {
                    e.target.style.borderColor = primaryColor;
                    e.target.style.boxShadow = `0 0 0 2px ${primaryColor}25`;
                }}
                onBlur={(e) => {
                    e.target.style.borderColor = borderColor;
                    e.target.style.boxShadow = 'none';
                }}
            />
        </div>
    );
};

interface FormCardProps {
    form: Form;
    onEdit: (form: Form) => void;
    onDelete: (form: Form) => void;
    onPreview: (form: Form) => void;
    onGetCode: (form: Form) => void;
    onWordPress: (form: Form) => void;
    onKadence: (form: Form) => void;
}

const FormCard: React.FC<FormCardProps> = ({ form, onEdit, onDelete, onPreview, onGetCode, onWordPress, onKadence }) => {
    // 🎨 Check se ci sono colori personalizzati
    const hasCustomPrimary = form.styling?.primary_color && form.styling.primary_color !== '#6366f1';
    const hasCustomBackground = form.styling?.background_color && form.styling.background_color !== '#ffffff';
    const hasCustomColors = hasCustomPrimary || hasCustomBackground;

    return (
        <div className="bg-white p-4 rounded-lg shadow border flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-lg text-text-primary truncate flex-1">{form.name}</h3>
                    {hasCustomColors && (
                        <div className="flex items-center space-x-1 ml-2">
                            {hasCustomPrimary && (
                                <div
                                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                                    style={{ backgroundColor: form.styling?.primary_color }}
                                    title={`Colore primario: ${form.styling?.primary_color}`}
                                />
                            )}
                            {hasCustomBackground && (
                                <div
                                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                                    style={{ backgroundColor: form.styling?.background_color }}
                                    title={`Sfondo: ${form.styling?.background_color}`}
                                />
                            )}
                            <span className="text-xs" title="Personalizzato">🎨</span>
                        </div>
                    )}
                </div>
                <p className="text-sm text-text-secondary">Creato il: {new Date(form.created_at).toLocaleDateString('it-IT')}</p>
                {hasCustomColors && (
                    <p className="text-xs text-green-600 mt-1 font-medium">
                        FormMaster Level 6 - Personalizzato
                    </p>
                )}
            </div>
            <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t">
                <button onClick={() => onEdit(form)} title="Modifica" className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-md">
                    <PencilIcon className="w-5 h-5" />
                </button>
                <button onClick={() => onPreview(form)} title="Anteprima" className="p-2 text-gray-500 hover:bg-gray-100 rounded-md">
                    <EyeIcon className="w-5 h-5" />
                </button>
                <button onClick={() => onWordPress(form)} title="WordPress Embed (Iframe)" className="p-2 text-blue-500 hover:bg-blue-50 rounded-md">
                    <span className="w-5 h-5 text-xs font-bold">WP</span>
                </button>
                <button onClick={() => onKadence(form)} title="Kadence Native Form" className="p-2 text-purple-500 hover:bg-purple-50 rounded-md">
                    <span className="w-5 h-5 text-xs font-bold">K</span>
                </button>
                <button onClick={() => onGetCode(form)} title="Ottieni Codice" className="p-2 text-gray-500 hover:bg-gray-100 rounded-md">
                    <CodeIcon className="w-5 h-5" />
                </button>
                <button onClick={() => onDelete(form)} title="Elimina" className="p-2 text-red-500 hover:bg-red-50 rounded-md">
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};


export const Forms: React.FC = () => {
    console.log('📋 Forms component is rendering');
    const { forms, organization, refetch: refetchData } = useOutletContext<ReturnType<typeof useCrmData>>();
    console.log('📋 Forms data:', { forms, organization });

    // Stati per le modali
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isPreviewModalOpen, setPreviewModalOpen] = useState(false);
    const [isGetCodeModalOpen, setGetCodeModalOpen] = useState(false);
    const [showQuestionnaire, setShowQuestionnaire] = useState(false);

    // Stati per i dati
    const [formToModify, setFormToModify] = useState<Form | null>(null);
    const [prompt, setPrompt] = useState('');
    const [formName, setFormName] = useState('');
    const [formTitle, setFormTitle] = useState('');
    const [generatedFields, setGeneratedFields] = useState<FormField[] | null>(null);
    const [publicUrl, setPublicUrl] = useState('');
    const [formMeta, setFormMeta] = useState<{
        industry?: string;
        confidence?: number;
        platform?: string;
        gdpr_enabled?: boolean;
        timestamp?: string;
        generation_method?: string;
    } | null>(null); // 🆕 Metadata AI (industry, confidence, GDPR)

    // 🎨 Stati per personalizzazione colori (PostAIEditor)
    const [formStyle, setFormStyle] = useState<FormStyle>({
        primary_color: '#6366f1',
        secondary_color: '#f3f4f6',
        background_color: '#ffffff',
        text_color: '#1f2937',
        border_color: '#6366f1',
        border_radius: '8px',
        font_family: 'Inter, system-ui, sans-serif',
        button_style: {
            background_color: '#6366f1',
            text_color: '#ffffff',
            border_radius: '6px'
        }
    });
    const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState('');

    // Stati di caricamento ed errore
    const [isLoading, setIsLoading] = useState(false);

    const handleOpenCreateModal = () => {
        setPrompt('');
        setFormName('');
        setFormTitle('');
        setGeneratedFields(null);
        setIsLoading(false);
        setFormMeta(null); // 🆕 Reset metadata AI
        setShowQuestionnaire(false); // 🆕 Reset questionario

        // ✅ FIX CRITICAL: Reset formStyle solo quando si apre modal per NUOVO form
        setFormStyle({
            primary_color: '#6366f1',
            secondary_color: '#f3f4f6',
            background_color: '#ffffff',
            text_color: '#1f2937',
            border_color: '#6366f1',
            border_radius: '8px',
            font_family: 'Inter, system-ui, sans-serif',
            button_style: {
                background_color: '#6366f1',
                text_color: '#ffffff',
                border_radius: '6px'
            }
        });
        setPrivacyPolicyUrl('');

        setCreateModalOpen(true);
    };

    const handleOpenDeleteModal = (form: Form) => { setFormToModify(form); setDeleteModalOpen(true); };
    const handleOpenPreviewModal = (form: Form) => {
        console.log('👀 PREVIEW MODAL - Form data:', {
            formId: form.id,
            formName: form.name,
            hasStyling: !!form.styling,
            styling: form.styling,
            hasPrivacyUrl: !!form.privacy_policy_url,
            privacyUrl: form.privacy_policy_url
        });
        setFormToModify(form);
        setPreviewModalOpen(true);
    };
    const handleOpenGetCodeModal = (form: Form) => {
        setFormToModify(form);
        const url = `${window.location.origin}/form/${form.id}`;
        setPublicUrl(url);
        setGetCodeModalOpen(true);
    };

    const handleCloseModals = () => {
        setCreateModalOpen(false);
        setDeleteModalOpen(false);
        setPreviewModalOpen(false);
        setGetCodeModalOpen(false);
        setFormToModify(null);
        // ✅ NON resettiamo formStyle qui - manteniamo personalizzazioni
    };

    // ✅ CALLBACK MEMOIZZATE per evitare re-render loop in PostAIEditor
    const handleStyleChange = useCallback(async (newStyle: FormStyle) => {
        console.log('🎨 Forms.tsx - Style Update:', newStyle);
        console.log('🎯 Current formToModify:', formToModify);
        console.log('🆔 FormToModify ID:', formToModify?.id);

        setFormStyle(newStyle);

        // 💾 ENTERPRISE SOLUTION: Use admin client to bypass RLS policies
        if (formToModify?.id) {
            try {
                console.log('💾 Executing enterprise-level database save with admin client...');

                const { error, data } = await supabaseAdmin
                    .from('forms')
                    .update({ styling: newStyle })
                    .eq('id', formToModify.id)
                    .select('styling');

                if (error) {
                    console.error('❌ Database save failed:', error);
                    toast.error('❌ Errore nel salvataggio dei colori: ' + error.message);
                } else if (data && data.length > 0) {
                    console.log('✅ Style saved to database successfully');
                    console.log('✅ Updated database record:', data[0]);
                    toast.success('✅ Colori salvati nel database!');

                    // Update local state with confirmed database data
                    setFormToModify(prev => prev ? { ...prev, styling: data[0].styling } : null);
                } else {
                    console.warn('⚠️ Database update executed but no records affected');
                    toast.error('⚠️ Aggiornamento database non ha modificato record');
                }

                // Always refetch to ensure UI is in sync
                await refetchData();

            } catch (err) {
                console.error('❌ Exception in style saving:', err);
                toast.error('❌ Errore nel salvataggio: ' + (err as Error).message);
            }
        } else {
            console.warn('⚠️ No form to modify, style change not saved');
            console.warn('⚠️ FormToModify state:', formToModify);
        }
    }, [formToModify, refetchData]);

    const handlePrivacyPolicyChange = useCallback((url: string) => {
        console.log('🔒 Forms.tsx - Privacy URL Update:', url);
        setPrivacyPolicyUrl(url);
    }, []);

    // ✅ LEVEL 6 FIX: Accetta metadata completo dal questionnaire
    const handleGenerateForm = async (customPrompt?: string, requiredFields?: string[], metadata?: any, colors?: any) => {
        console.log('🔍 handleGenerateForm CALLED with:', {
            customPrompt: !!customPrompt,
            promptLength: customPrompt?.length,
            requiredFieldsCount: requiredFields?.length,
            requiredFields: requiredFields,
            hasMetadata: !!metadata,
            metadata: metadata,
            hasColors: !!colors,  // ✅ Debug colors
            colors: colors        // ✅ Debug colors
        });

        const promptToUse = customPrompt || prompt;

        if (!promptToUse.trim()) {
            toast.error("Per favore, inserisci una descrizione per il tuo form.");
            return;
        }

        // Sanitize and validate prompt input
        const sanitizedPrompt = InputValidator.sanitizeString(promptToUse);
        if (sanitizedPrompt.length < 5) {
            toast.error("La descrizione deve essere più dettagliata (almeno 5 caratteri).");
            return;
        }

        SecureLogger.info('forms', 'Form generation initiated', {
            promptLength: sanitizedPrompt.length,
            organizationId: organization?.id,
            isCustomPrompt: !!customPrompt,
            requiredFieldsCount: requiredFields?.length || 0,
            hasMarketingConsent: metadata?.marketing_consent
        });

        setIsLoading(true); setGeneratedFields(null);

        const toastId = toast.loading('Generazione campi in corso...');
        try {
            console.log('🔍 Debugging form generation request:', {
                organization_id: organization?.id,
                organization,
                prompt_length: sanitizedPrompt.length,
                custom_prompt: !!customPrompt,
                required_fields: requiredFields
            });

            if (!organization?.id) {
                throw new Error('Organization ID non disponibile. Ricarica la pagina e riprova.');
            }

            // TEMPORARY FIX: Use direct fetch instead of invokeSupabaseFunction
            // to bypass retry logic and session refresh issues
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                throw new Error('Sessione non trovata. Ricarica la pagina.');
            }

            const supabaseUrl = (import.meta as unknown as { env: Record<string, string> }).env.VITE_SUPABASE_URL;
            const supabaseAnonKey = (import.meta as unknown as { env: Record<string, string> }).env.VITE_SUPABASE_ANON_KEY;

            // DETAILED LOGGING FOR DEBUGGING
            console.log('🔍 FORMMASTER DEBUG - Request Details:', {
                url: `${supabaseUrl}/functions/v1/generate-form-fields`,
                organization_id: organization.id,
                prompt_length: sanitizedPrompt.length,
                token_length: session.access_token?.length,
                token_preview: session.access_token?.substring(0, 30),
                expires_at: session.expires_at,
                timestamp: new Date().toISOString()
            });

            const requestBody = {
                prompt: sanitizedPrompt,
                organization_id: organization.id,
                required_fields: requiredFields || [],  // ✅ Passa campi selezionati dall'utente
                metadata: {  // ✅ ENTERPRISE LEVEL 6 FIX: Passa metadata completo
                    gdpr_required: metadata?.gdpr_required || formMeta?.gdpr_enabled || false,
                    marketing_consent: metadata?.marketing_consent || false,
                    organization: organization?.name || 'Unknown'
                },
                style_customizations: {  // 🎨 CRITICAL FIX: Usa colori dal questionnaire se disponibili!
                    primary_color: colors?.primary || formStyle?.primary_color || '#6366f1',
                    background_color: colors?.background || formStyle?.background_color || '#ffffff',
                    text_color: colors?.text || formStyle?.text_color || '#1f2937'  // ✅ FIX: Usa text color dal questionnaire!
                },
                privacy_policy_url: privacyPolicyUrl  // 🔒 CRITICAL FIX: Passa URL privacy!
            };

            console.log('🔍 FORMMASTER DEBUG - Request Body:', requestBody);
            console.log('� STYLE_CUSTOMIZATIONS DEBUG:', {
                fromColors: colors,
                fromFormStyle: {
                    primary: formStyle?.primary_color,
                    background: formStyle?.background_color,
                    text: formStyle?.text_color
                },
                finalValues: requestBody.style_customizations
            });
            console.log('�🎯 MARKETING CONSENT DEBUG:', {
                fromMetadata: metadata?.marketing_consent,
                finalValue: requestBody.metadata.marketing_consent,
                hasMetadata: !!metadata,
                metadataKeys: metadata ? Object.keys(metadata) : 'no metadata'
            });
            console.log('🎨 COLOR DEBUG:', {
                fromFormStyle: {
                    primary: formStyle.primary_color,
                    background: formStyle.background_color,
                    text: formStyle.text_color
                },
                finalValues: requestBody.style_customizations
            });

            const response = await fetch(`${supabaseUrl}/functions/v1/generate-form-fields`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                    'apikey': supabaseAnonKey
                },
                body: JSON.stringify(requestBody)
            });

            console.log('🔍 FORMMASTER DEBUG - Response Status:', response.status);
            console.log('🔍 FORMMASTER DEBUG - Response Headers:', [...response.headers.entries()]);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('🔍 FORMMASTER DEBUG - Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorText: errorText,
                    timestamp: new Date().toISOString()
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
            console.log('🔍 FORMMASTER DEBUG - Has fields property:', 'fields' in data);
            console.log('🔍 FORMMASTER DEBUG - Fields value:', data.fields);
            console.log('🔍 FORMMASTER DEBUG - Fields is Array:', Array.isArray(data.fields));
            console.log('🔍 FORMMASTER DEBUG - Fields length:', data.fields?.length);

            // Type guard for API response
            if (!data || typeof data !== 'object' || !('fields' in data) || !Array.isArray((data as Record<string, unknown>).fields)) {
                console.error('🔍 FORMMASTER DEBUG - Type guard failed:', {
                    hasData: !!data,
                    isObject: typeof data === 'object',
                    hasFieldsProperty: 'fields' in data,
                    fieldsIsArray: Array.isArray((data as Record<string, unknown>).fields)
                });
                throw new Error('Risposta API non valida');
            }

            const fields = (data as { fields: FormField[] }).fields;
            console.log('🔍 FORMMASTER DEBUG - Extracted fields:', fields);

            if (!fields || !Array.isArray(fields) || fields.length === 0) {
                console.error('🔍 FORMMASTER DEBUG - Fields validation failed:', {
                    hasFields: !!fields,
                    isArray: Array.isArray(fields),
                    length: fields?.length
                });
                throw new Error("L'AI ha restituito una struttura non valida o vuota.");
            }

            console.log('🔍 FORMMASTER DEBUG - Setting generated fields:', fields);
            setGeneratedFields(fields);

            // � CRITICAL FIX: Gestisci style_customizations dalla response
            if (data.style_customizations) {
                console.log('🎨 Applying style customizations from Edge Function:', data.style_customizations);
                setFormStyle({
                    primary_color: data.style_customizations.primaryColor || '#6366f1',
                    secondary_color: '#f3f4f6',
                    background_color: data.style_customizations.backgroundColor || '#ffffff',
                    text_color: data.style_customizations.textColor || '#1f2937',
                    border_color: data.style_customizations.primaryColor || '#6366f1',
                    border_radius: '8px',
                    font_family: 'Inter, system-ui, sans-serif',
                    button_style: {
                        background_color: data.style_customizations.primaryColor || '#6366f1',
                        text_color: '#ffffff',
                        border_radius: '6px'
                    }
                });
            }

            // 🔒 CRITICAL FIX: Gestisci privacy_policy_url dalla response
            if (data.privacy_policy_url && data.privacy_policy_url !== privacyPolicyUrl) {
                console.log('🔒 Applying privacy URL from Edge Function:', data.privacy_policy_url);
                setPrivacyPolicyUrl(data.privacy_policy_url);
            }

            // �🆕 LEVEL 6 FIX: Applica colori e privacy dal meta SOLO se non già impostati dal questionario
            if (data.meta) {
                console.log('🧠 AI METADATA - Received:', data.meta);
                setFormMeta(data.meta);

                // ✅ CRITICAL FIX: Se Edge Function ha estratto colori, applicali
                // MA SOLO se formStyle è ancora DEFAULT (non impostato dal questionario)
                const isDefaultStyle = formStyle.primary_color === '#6366f1';
                if (data.meta.colors && isDefaultStyle && !data.style_customizations) {
                    console.log('🎨 Applying colors from Edge Function meta (formStyle was default):', data.meta.colors);
                    setFormStyle({
                        primary_color: data.meta.colors.primary_color || '#6366f1',
                        secondary_color: '#f3f4f6',
                        background_color: data.meta.colors.background_color || '#ffffff',
                        text_color: data.meta.colors.text_color || '#1f2937',
                        border_color: data.meta.colors.primary_color || '#6366f1',
                        border_radius: '8px',
                        font_family: 'Inter, system-ui, sans-serif',
                        button_style: {
                            background_color: data.meta.colors.primary_color || '#6366f1',
                            text_color: '#ffffff',
                            border_radius: '6px'
                        }
                    });
                } else if (isDefaultStyle) {
                    console.log('🎨 Colors from Edge Function not available, keeping current formStyle');
                } else {
                    console.log('🎨 Keeping formStyle from style_customizations or questionnaire (not default):', formStyle.primary_color);
                }

                // ✅ CRITICAL FIX: Se Edge Function ha estratto privacy URL, applicalo
                // MA SOLO se non già impostato dal questionario e non da style_customizations
                if (data.meta.privacy_policy_url && !privacyPolicyUrl && !data.privacy_policy_url) {
                    console.log('🔒 Applying privacy URL from Edge Function meta:', data.meta.privacy_policy_url);
                    setPrivacyPolicyUrl(data.meta.privacy_policy_url);
                } else if (privacyPolicyUrl) {
                    console.log('🔒 Keeping privacy URL from questionnaire or response:', privacyPolicyUrl);
                }
            } else {
                setFormMeta(null);
            }

            console.log('🔍 FORMMASTER DEBUG - Generated fields set successfully!');
            toast.success('Campi generati con successo!', { id: toastId });

        } catch (err: unknown) {
            const error = err as ApiError;
            diagnosticLogger.error('api', 'Errore dettagliato generazione form:', error);
            // The error toast is now handled by invokeSupabaseFunction, so we just log.
            toast.dismiss(toastId);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveForm = async () => {
        if (!formName || !formTitle || !generatedFields || !organization) {
            toast.error("Nome, titolo e campi generati sono necessari per salvare.");
            return;
        }

        // Sanitize form inputs
        const sanitizedName = InputValidator.sanitizeString(formName);
        const sanitizedTitle = InputValidator.sanitizeString(formTitle);

        if (sanitizedName.length < 2 || sanitizedTitle.length < 2) {
            toast.error("Nome e titolo devono avere almeno 2 caratteri validi.");
            return;
        }

        console.log('🎨 FORM SAVE - Styling Data:', {
            formStyle,
            privacyPolicyUrl,
            timestamp: new Date().toISOString()
        });

        SecureLogger.info('forms', 'Form save operation initiated', {
            nameLength: sanitizedName.length,
            titleLength: sanitizedTitle.length,
            fieldsCount: generatedFields.length,
            organizationId: organization.id,
            hasCustomColors: formStyle.primary_color !== '#6366f1',
            hasPrivacyUrl: !!privacyPolicyUrl
        });

        setIsLoading(true);

        try {
            // 🔍 DEBUG: Log stato PRIMA del save
            console.log('💾 SAVE - Current State Variables:', {
                formStyle_full: JSON.stringify(formStyle, null, 2),
                privacyPolicyUrl_value: privacyPolicyUrl,
                privacyPolicyUrl_type: typeof privacyPolicyUrl,
                privacyPolicyUrl_length: privacyPolicyUrl?.length || 0,
                primary_color: formStyle?.primary_color,
                is_default_color: formStyle?.primary_color === '#6366f1'
            });

            // 🎯 UX CRITICAL FIX: Assicurati che text_color sia presente se in auto-sync
            let finalFormStyle = { ...formStyle };
            if (finalFormStyle && !finalFormStyle.text_color && finalFormStyle.primary_color) {
                finalFormStyle.text_color = finalFormStyle.primary_color;
                console.log('🔄 AUTO-SYNC: Added missing text_color:', finalFormStyle.text_color);
            }

            const dataToInsert = {
                name: sanitizedName,
                title: sanitizedTitle,
                fields: generatedFields,
                styling: finalFormStyle, // Usa lo stile corretto con text_color
                privacy_policy_url: privacyPolicyUrl || null,
                organization_id: organization.id
            };

            console.log('💾 SAVE - Object Being Inserted:', JSON.stringify(dataToInsert, null, 2));

            const { data: insertedData, error: insertError } = await supabase
                .from('forms')
                .insert(dataToInsert)
                .select(); // ✅ SELECT per vedere cosa è stato salvato

            console.log('💾 SAVE - Supabase Response:', {
                success: !insertError,
                error: insertError,
                insertedData: insertedData
            });

            if (insertError) {
                console.error('❌ SAVE - Insert Error:', insertError);
                throw insertError;
            }

            if (insertedData && insertedData.length > 0) {
                console.log('✅ SAVE - Form Salvato nel DB:', {
                    id: insertedData[0].id,
                    name: insertedData[0].name,
                    has_styling: !!insertedData[0].styling,
                    styling_primary: insertedData[0].styling?.primary_color,
                    has_privacy_url: !!insertedData[0].privacy_policy_url,
                    privacy_url_value: insertedData[0].privacy_policy_url
                });
            }

            refetchData();

            // ✅ CRITICAL FIX: NON resettare formStyle dopo salvataggio!
            // Le personalizzazioni devono rimanere per essere usate in altri form
            // Reset solo quando necessario (nuovo form)

            handleCloseModals();
            toast.success('Form salvato con successo con personalizzazione colori!');
        } catch (err: unknown) {
            const error = err as ApiError;
            toast.error(`Errore durante il salvaggio: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteForm = async () => {
        if (!formToModify) { return; }
        setIsLoading(true);
        try {
            const { error } = await supabase.from('forms').delete().eq('id', formToModify.id);
            if (error) { throw error; }
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

    // ✏️ Funzione per modificare un form esistente
    const handleEditForm = (form: Form) => {
        setFormName(form.name);
        setFormTitle(form.title || '');
        setGeneratedFields(form.fields);

        // 🎨 CARICA STILE CON LOCALSTORAGE FALLBACK
        const formStyleKey = `form_style_${form.id}`;
        const localStorageStyle = localStorage.getItem(formStyleKey);

        let styleToUse = form.styling;

        if (localStorageStyle) {
            try {
                const parsedLocalStyle = JSON.parse(localStorageStyle);
                console.log('🎨 Loading style from localStorage:', parsedLocalStyle);
                styleToUse = parsedLocalStyle;
                toast.success('🎨 Colori personalizzati caricati dal browser');
            } catch (e) {
                console.warn('⚠️ Failed to parse localStorage style, using database style');
            }
        }

        // Carica lo stile esistente o usa quello di default
        if (styleToUse) {
            setFormStyle(styleToUse);
        } else {
            // 🎯 UX IMPROVEMENT: Se non c'è styling, inizializza con auto-sync text_color
            const defaultPrimary = '#6366f1';
            setFormStyle({
                primary_color: defaultPrimary,
                secondary_color: '#f3f4f6',
                background_color: '#ffffff',
                text_color: defaultPrimary, // 🎯 Auto-sync: usa primary_color come text_color
                border_color: defaultPrimary,
                border_radius: '8px',
                font_family: 'Inter, system-ui, sans-serif',
                button_style: {
                    background_color: defaultPrimary,
                    text_color: '#ffffff',
                    border_radius: '6px'
                }
            });
        }

        // Carica privacy policy URL se esiste
        setPrivacyPolicyUrl(form.privacy_policy_url || '');

        // Imposta il form in modalità modifica
        setFormToModify(form);
        setCreateModalOpen(true);
    };

    // 🌐 Funzione per generare codice WordPress embed
    const generateWordPressEmbedCode = (form: Form): string => {
        const baseUrl = window.location.origin;
        const formUrl = `${baseUrl}/form/${form.id}`;

        return `<!-- Guardian AI CRM - Form: ${form.title || form.name} -->
<div id="guardian-ai-form-${form.id}" class="guardian-ai-form-wrapper">
  <iframe 
    src="${formUrl}" 
    width="100%" 
    height="600" 
    frameborder="0" 
    scrolling="auto"
    title="${form.title || form.name}"
    style="border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
  ></iframe>
</div>

<style>
.guardian-ai-form-wrapper {
  max-width: 800px;
  margin: 20px auto;
  padding: 0;
}
</style>`;
    };

    // 📋 Funzione per copiare codice WordPress negli appunti
    const handleWordPressEmbed = (form: Form) => {
        const embedCode = generateWordPressEmbedCode(form);
        navigator.clipboard.writeText(embedCode);
        toast.success('🎉 Codice WordPress copiato negli appunti!', {
            duration: 3000,
            icon: '📋'
        });
    };

    // 🎯 Funzione per export Kadence Blocks nativo
    const handleKadenceExport = (form: Form) => {
        try {
            console.log('📦 Kadence Export - Original fields:', form.fields.length);
            console.log('📦 Kadence Export - Privacy URL:', form.privacy_policy_url);

            // ✅ FIX KADENCE DUPLICAZIONE: Filtra campi privacy generati dall'AI
            // L'AI genera un checkbox privacy quando GDPR è richiesto, ma noi aggiungiamo
            // il nostro checkbox privacy personalizzato con link. Rimuoviamo i duplicati.
            const fieldsWithoutPrivacy = form.fields.filter(field => {
                const labelLower = field.label.toLowerCase();
                const nameLower = field.name.toLowerCase();

                // Escludi campi che contengono parole chiave privacy
                const isPrivacyField =
                    labelLower.includes('privacy') ||
                    labelLower.includes('gdpr') ||
                    labelLower.includes('consenso') ||
                    labelLower.includes('accetto') ||
                    labelLower.includes('informativa') ||
                    labelLower.includes('trattamento') ||
                    nameLower.includes('privacy') ||
                    nameLower.includes('gdpr') ||
                    nameLower === 'privacy_consent' ||
                    nameLower === 'gdpr_consent';

                if (isPrivacyField) {
                    console.log('📦 Kadence Export - Rimosso campo privacy AI:', field.label);
                }

                return !isPrivacyField;
            });

            console.log('📦 Kadence Export - Filtered fields:', fieldsWithoutPrivacy.length);
            console.log('📦 Kadence Export - Removed fields:', form.fields.length - fieldsWithoutPrivacy.length);

            // Cast fields to Kadence FormField type (compatible subset)
            const kadenceCode = generateKadenceForm(fieldsWithoutPrivacy as unknown as Array<{
                name: string;
                label: string;
                type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'number';
                required: boolean;
                options?: string[];
            }>, {
                colors: {
                    primary: form.styling?.primary_color || '#6366f1',
                    secondary: form.styling?.secondary_color || '#f3f4f6',
                    background: form.styling?.background_color || '#ffffff',
                    text: form.styling?.text_color || '#1f2937',
                    border: form.styling?.primary_color || '#6366f1'
                }
            }, form.privacy_policy_url || undefined); // ✅ PASSA PRIVACY URL

            // Crea un file HTML completo con tutte le parti
            const completeHTML = `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Form Kadence - ${form.name}</title>
    <style>
${kadenceCode.css}
    </style>
</head>
<body>
${kadenceCode.html}

<script>
${kadenceCode.javascript}
</script>

<!-- ISTRUZIONI:
${kadenceCode.instructions}

SHORTCODE WORDPRESS:
${kadenceCode.shortcode}
-->
</body>
</html>`;

            // Download come file HTML
            const blob = new Blob([completeHTML], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `kadence-form-${form.name.toLowerCase().replace(/\s+/g, '-')}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success('📦 Form Kadence scaricato! Importalo in WordPress', {
                duration: 4000,
                icon: '✅'
            });
        } catch (error) {
            console.error('Kadence export error:', error);
            toast.error('Errore durante l\'export Kadence');
        }
    };

    // const renderFieldPreview = (field: FormField, index: number) => {
    //     const commonClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-gray-50";
    //     if (field.type === 'textarea') { return <textarea key={index} rows={3} className={commonClasses} disabled />; }
    //     return <input key={index} type={field.type} className={commonClasses} disabled />;
    // };


    const renderContent = () => {
        if (forms.length === 0) {
            return (
                <div className="bg-card p-8 rounded-lg shadow text-center">
                    <div className="mx-auto bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center"> <SparklesIcon className="w-8 h-8 text-primary" /> </div>
                    <h2 className="mt-4 text-2xl font-semibold text-text-primary"> Crea il tuo primo Form con l&apos;AI </h2>
                    <p className="mt-2 text-text-secondary max-w-2xl mx-auto"> Inizia a raccogliere lead in pochi secondi. Descrivi i campi di cui hai bisogno e lascia che l&apos;AI faccia il resto. </p>
                    <div className="mt-6"> <button onClick={handleOpenCreateModal} className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-indigo-700 text-lg font-semibold flex items-center space-x-2 mx-auto"> <PlusIcon className="w-5 h-5" /> <span>Inizia a Costruire</span> </button> </div>
                </div>
            );
        }
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {forms.map(form => (
                    <FormCard
                        key={form.id}
                        form={form}
                        onEdit={handleEditForm}
                        onDelete={handleOpenDeleteModal}
                        onPreview={handleOpenPreviewModal}
                        onGetCode={handleOpenGetCodeModal}
                        onWordPress={handleWordPressEmbed}
                        onKadence={handleKadenceExport}
                    />
                ))}
            </div>
        );
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-text-primary">I Tuoi Form</h1>
                    {forms.length > 0 && (<button onClick={handleOpenCreateModal} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"> <PlusIcon className="w-5 h-5" /> <span>Crea Nuovo Form</span> </button>)}
                </div>
                {renderContent()}
            </div>

            <Modal isOpen={isCreateModalOpen} onClose={handleCloseModals} title="Crea Nuovo Form con AI">
                <div className="space-y-4">
                    {!generatedFields ? (
                        <>
                            {/* 🎯 QUESTIONARIO INTERATTIVO */}
                            {showQuestionnaire ? (
                                <InteractiveAIQuestionnaire
                                    initialPrompt={prompt}
                                    onComplete={(result) => {
                                        console.log('✅ Questionnaire - Received:', {
                                            hasColors: !!result.colors,
                                            hasPrivacy: !!result.privacyUrl,
                                            hasMetadata: !!result.metadata,
                                            colors: result.colors,
                                            privacy: result.privacyUrl,
                                            marketingConsent: result.metadata?.marketing_consent,
                                            requiredFields: result.required_fields
                                        });

                                        console.log('🔍 QUESTIONNAIRE COMPLETE RESULT:', JSON.stringify(result, null, 2));

                                        // Imposta TUTTO subito, nessun setTimeout
                                        setPrompt(result.prompt);
                                        setShowQuestionnaire(false);

                                        // Salva colori e privacy IMMEDIATAMENTE
                                        if (result.colors) {
                                            console.log('🎨 Setting colors from questionnaire:', result.colors);
                                            const newFormStyle = {
                                                primary_color: result.colors.primary,
                                                secondary_color: '#f3f4f6',
                                                background_color: result.colors.background,
                                                text_color: result.colors.text,
                                                border_color: result.colors.primary,
                                                border_radius: '8px',
                                                font_family: 'Inter, system-ui, sans-serif',
                                                button_style: {
                                                    background_color: result.colors.primary,
                                                    text_color: '#ffffff',
                                                    border_radius: '6px'
                                                }
                                            };
                                            setFormStyle(newFormStyle);
                                            console.log('🎨 FormStyle set to:', newFormStyle);
                                        }

                                        if (result.privacyUrl) {
                                            setPrivacyPolicyUrl(result.privacyUrl);
                                        }

                                        if (result.metadata?.gdpr_required) {
                                            setFormMeta({ gdpr_enabled: true });
                                        }

                                        // ✅ CRITICAL FIX: Passa TUTTO il metadata completo E i colori
                                        console.log('🚀 CALLING handleGenerateForm with:', {
                                            prompt: result.prompt,
                                            requiredFields: result.required_fields,
                                            metadata: result.metadata,
                                            colors: result.colors  // ✅ Passa i colori direttamente!
                                        });
                                        handleGenerateForm(result.prompt, result.required_fields, result.metadata, result.colors);
                                    }}
                                />
                            ) : (
                                <>
                                    {/* Pulsante per aprire questionario */}
                                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-indigo-900 flex items-center">
                                                    <SparklesIcon className="w-4 h-4 mr-2" />
                                                    Crea form perfetto con l&apos;assistente guidato
                                                </p>
                                                <p className="text-xs text-indigo-700 mt-1">
                                                    Rispondi a poche domande e l&apos;AI genererà il form ideale per te
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setShowQuestionnaire(true)}
                                                className="ml-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center space-x-2"
                                            >
                                                <SparklesIcon className="w-4 h-4" />
                                                <span>Inizia Guidato</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-300"></div>
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="px-2 bg-white text-gray-500">oppure descrivi manualmente</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="form-prompt" className="block text-sm font-medium text-gray-700">Descrivi il tuo form</label>
                                        <textarea id="form-prompt" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Es: Un form di contatto con nome, email, telefono e un'area per il messaggio." className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                                    </div>
                                    <div className="flex justify-end"> <button onClick={() => handleGenerateForm()} disabled={isLoading} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2 disabled:bg-gray-400"> {isLoading ? 'Generazione...' : <><SparklesIcon className="w-5 h-5" /><span>Genera Campi</span></>} </button> </div>
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            {/* 🧠 AI METADATA VISUALIZATION (Industry Detection) */}
                            {formMeta && (
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <span className="text-sm font-medium text-blue-900">
                                                📊 Settore rilevato: <strong className="capitalize">{formMeta.industry?.replace('_', ' ')}</strong>
                                            </span>
                                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                                <div
                                                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${(formMeta.confidence || 0) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                        <span className="text-xs text-blue-700 ml-4">
                                            {Math.round((formMeta.confidence || 0) * 100)}% accurato
                                        </span>
                                    </div>

                                    {/* GDPR Badge */}
                                    {formMeta.gdpr_enabled && (
                                        <div className="mt-2 inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            GDPR Compliant
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 🎨 PostAIEditor - Personalizzazione Completa */}
                            <PostAIEditor
                                fields={generatedFields}
                                onFieldsChange={setGeneratedFields}
                                style={formStyle}
                                onStyleChange={handleStyleChange}
                                privacyPolicyUrl={privacyPolicyUrl}
                                onPrivacyPolicyChange={handlePrivacyPolicyChange}
                            />

                            {/* Nome e Titolo Form */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label htmlFor="form-name" className="block text-sm font-medium text-gray-700">Nome del Form (interno)</label>
                                    <input type="text" id="form-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Es: Form Contatti Sito Web" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                                </div>
                                <div>
                                    <label htmlFor="form-title" className="block text-sm font-medium text-gray-700">Titolo del Form (pubblico)</label>
                                    <input type="text" id="form-title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Es: Contattaci" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t mt-4">
                                <button onClick={() => setGeneratedFields(null)} className="text-sm text-gray-600 hover:text-primary">← Indietro</button>
                                <button onClick={handleSaveForm} disabled={isLoading} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 flex items-center space-x-2">
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Salvataggio...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>💾 Salva Form con Colori</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>

            <Modal isOpen={isDeleteModalOpen} onClose={handleCloseModals} title="Conferma Eliminazione">
                <p>Sei sicuro di voler eliminare il form <strong>{formToModify?.name}</strong>? Questa azione è irreversibile.</p>
                <div className="flex justify-end pt-4 border-t mt-4">
                    <button type="button" onClick={handleCloseModals} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 mr-2">Annulla</button>
                    <button onClick={handleDeleteForm} disabled={isLoading} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400">{isLoading ? 'Eliminazione...' : 'Elimina'}</button>
                </div>
            </Modal>

            <Modal isOpen={isPreviewModalOpen} onClose={handleCloseModals} title={`Anteprima: ${formToModify?.title}`}>
                {(() => {
                    console.log('🎨 PREVIEW MODAL RENDER - Complete styling data:', {
                        formToModify_id: formToModify?.id,
                        formToModify_styling: formToModify?.styling,
                        primary_color: formToModify?.styling?.primary_color,
                        background_color: formToModify?.styling?.background_color,
                        has_custom_primary: formToModify?.styling?.primary_color && formToModify?.styling?.primary_color !== '#6366f1',
                        privacy_url: formToModify?.privacy_policy_url
                    });
                    return null;
                })()}
                <div
                    className="p-6 rounded-lg"
                    style={{
                        backgroundColor: formToModify?.styling?.background_color || '#f9fafb',
                        fontFamily: formToModify?.styling?.font_family || 'Inter, system-ui, sans-serif'
                    }}
                >
                    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                        {formToModify?.fields.map(field =>
                            <DynamicFormField
                                key={field.name}
                                field={field}
                                privacyPolicyUrl={formToModify?.privacy_policy_url}
                                style={formToModify?.styling}
                            />
                        )}
                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                className="px-4 py-2 rounded-lg text-white hover:opacity-90"
                                style={{
                                    backgroundColor: formToModify?.styling?.primary_color || '#6366f1',
                                    borderRadius: formToModify?.styling?.button_style?.border_radius || '6px'
                                }}
                            >
                                Invia (Anteprima)
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            <Modal isOpen={isGetCodeModalOpen} onClose={handleCloseModals} title="Ottieni Link Pubblico">
                <p className="text-sm text-gray-600">Condividi questo link per permettere a chiunque di compilare il tuo form.</p>
                <div className="mt-2 flex">
                    <input type="text" readOnly value={publicUrl} className="flex-grow bg-gray-100 border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none" />
                    <button onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success('Link copiato!'); }} className="bg-primary text-white px-4 py-2 rounded-r-md hover:bg-indigo-700">Copia</button>
                </div>
            </Modal>

            {/* Universal AI Chat - FormMaster */}
            <UniversalAIChat
                currentModule="Forms"
                organizationId={organization?.id || "demo-org"}
                userId="demo-user"
                onActionTriggered={(action, data) => {
                    console.log('🎯 Forms AI Action triggered:', action, data);

                    // 📝 FORMMASTER ACTION HANDLER
                    if (action === 'form_generated' && data && typeof data === 'object') {
                        const formData = data as { formFields?: Array<{ name: string; label: string; type: 'text' | 'email' | 'tel' | 'textarea'; required: boolean }> };
                        if (formData.formFields && Array.isArray(formData.formFields) && formData.formFields.length > 0) {
                            console.log('🎉 Setting generated fields from AI Chat:', formData.formFields);
                            // Type cast to FormField[] to match the expected interface
                            const typedFields = formData.formFields.map(field => ({
                                ...field,
                                type: field.type as 'text' | 'email' | 'tel' | 'textarea'
                            }));
                            setGeneratedFields(typedFields);
                            setCreateModalOpen(true); // Open the form creation modal
                            toast.success(`${formData.formFields.length} campi generati con successo!`);
                        }
                    }
                }}
            />
        </>
    );
};


