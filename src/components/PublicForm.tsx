import React, { useState, useEffect } from 'react';
// FIX: Import useParams to get formId directly from the URL.
// FIX: Corrected the import for useParams from 'react-router-dom' to resolve module export errors.
import { useParams } from 'react-router-dom';

import { supabase } from '../lib/supabaseClient';
import { Form, FormField } from '../types';

import { GuardianIcon } from './ui/icons';
import { SecureLogger, InputValidator } from '../lib/security/securityUtils';

// Error interface for proper typing
interface ApiError {
    message: string;
    status?: number;
    code?: string;
}

// FIX: Removed PublicFormProps interface as formId is now retrieved from URL params.
// interface PublicFormProps {
//     formId: string;
// }

// Componente riutilizzabile per renderizzare campi di form dinamici
const DynamicFormField: React.FC<{ field: FormField }> = ({ field }) => {
    const commonClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm";
    
    // FIX: Privacy checkbox alignment - checkbox a sinistra, label a destra
    if (field.type === 'checkbox') {
        return (
            <div className="flex items-start gap-3">
                <input 
                    id={field.name} 
                    name={field.name} 
                    type="checkbox" 
                    required={field.required} 
                    className="mt-1 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                />
                <label htmlFor={field.name} className="text-sm text-gray-700 flex-1">
                    {field.label}{field.required ? ' *' : ''}
                </label>
            </div>
        );
    }
    
    const label = <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">{field.label}{field.required ? ' *' : ''}</label>;

    if (field.type === 'textarea') {
        return (
            <div>
                {label}
                <textarea id={field.name} name={field.name} rows={4} required={field.required} className={commonClasses} />
            </div>
        );
    }
    return (
        <div>
            {label}
            <input id={field.name} name={field.name} type={field.type} required={field.required} className={commonClasses} />
        </div>
    );
};


// FIX: Updated component to use useParams hook instead of props to get formId.
export const PublicForm: React.FC = () => {
    const { formId } = useParams<{ formId: string }>();
    const [form, setForm] = useState<Form | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    useEffect(() => {
        const fetchForm = async () => {
            setLoading(true);
            try {
                if (!formId) {
                    throw new Error("Form non trovato.");
                }

                const { data, error: fetchError } = await supabase
                    .from('forms')
                    .select('*')
                    .eq('id', formId)
                    .single();
                
                if (fetchError) {throw fetchError;}
                if (!data) {throw new Error("Form non trovato.");}

                setForm(data);
            } catch (err: unknown) {
                const error = err as ApiError;
                setError(`Impossibile caricare il form: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchForm();
    }, [formId]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        
        const formData = new FormData(e.currentTarget);
        const formValues: { [key: string]: FormDataEntryValue } = {};
        
        // Input validation and sanitization
        formData.forEach((value, key) => {
            const sanitizedKey = InputValidator.sanitizeString(key);
            const sanitizedValue = InputValidator.sanitizeString(value.toString());
            
            // Validate specific field types
            if (sanitizedKey.toLowerCase().includes('email')) {
                if (!InputValidator.isValidEmail(sanitizedValue)) {
                    throw new Error('Formato email non valido');
                }
            }
            if (sanitizedKey.toLowerCase().includes('phone')) {
                if (sanitizedValue && !InputValidator.isValidPhone(sanitizedValue)) {
                    throw new Error('Formato telefono non valido');
                }
            }
            
            formValues[sanitizedKey] = sanitizedValue;
        });

        try {
            // Log form submission with secure logging
            SecureLogger.info('public-form', `Form submission attempt for form ${formId}`, {
                formFields: Object.keys(formValues).join(', '),
                timestamp: new Date().toISOString(),
                source: 'PublicForm'
            });
            
            const { error: rpcError } = await supabase.rpc('create_submission', {
                p_form_id: formId,
                p_form_data: formValues
            });

            if (rpcError) {throw rpcError;}

            setSubmitSuccess(true);
            SecureLogger.info('public-form', 'Form submission successful', {
                formId: formId,
                formFields: Object.keys(formValues).join(', ')
            });
        } catch (err: unknown) {
            const error = err as ApiError;
            setError(`Errore durante l'invio: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-background flex items-center justify-center">Caricamento form...</div>;
    }

    if (error) {
        return <div className="min-h-screen bg-background flex items-center justify-center text-red-500">{error}</div>;
    }

    if (submitSuccess) {
        return (
             <div className="min-h-screen bg-background flex flex-col justify-center items-center text-center p-4">
                <GuardianIcon className="w-16 h-16 text-green-500 mb-4" />
                <h1 className="text-3xl font-bold text-text-primary">{form?.title}</h1>
                <p className="mt-4 text-xl text-text-secondary">Grazie per aver inviato le tue informazioni!</p>
                <p className="mt-8 text-sm text-gray-500">
                    Powered by <span className="font-bold text-primary">Guardian AI CRM</span>
                </p>
            </div>
        );
    }

    return (
        <div 
            className="min-h-screen flex flex-col justify-center items-center p-4"
            style={{ 
                backgroundColor: form?.styling?.background_color || '#f9fafb',
                fontFamily: form?.styling?.font_family || 'Inter, system-ui, sans-serif'
            }}
        >
             <div className="w-full max-w-lg">
                <div className="text-center mb-6">
                    <GuardianIcon 
                        className="w-12 h-12 mx-auto mb-2" 
                        style={{ color: form?.styling?.primary_color || '#6366f1' }}
                    />
                    <h1 
                        className="text-3xl font-bold"
                        style={{ color: form?.styling?.text_color || '#1f2937' }}
                    >
                        {form?.title}
                    </h1>
                </div>

                <div 
                    className="p-8 rounded-lg shadow-md"
                    style={{
                        backgroundColor: '#ffffff',
                        borderRadius: form?.styling?.border_radius || '8px'
                    }}
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {form?.fields.map(field => (
                            <DynamicFormField key={field.name} field={field} />
                        ))}

                        {/* 🔗 Privacy Policy Link */}
                        {form?.privacy_policy_url && (
                            <div className="text-center text-sm" style={{ color: '#6b7280' }}>
                                <a 
                                    href={form.privacy_policy_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="hover:underline font-medium"
                                    style={{ color: form?.styling?.primary_color || '#6366f1' }}
                                >
                                    📄 Leggi la nostra Privacy Policy
                                </a>
                            </div>
                        )}

                        <div className="pt-2">
                             <button 
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full px-4 py-3 font-semibold transition-colors"
                                style={{
                                    backgroundColor: form?.styling?.button_style?.background_color || form?.styling?.primary_color || '#6366f1',
                                    color: form?.styling?.button_style?.text_color || '#ffffff',
                                    borderRadius: form?.styling?.button_style?.border_radius || '6px'
                                }}
                            >
                                {isSubmitting ? 'Invio in corso...' : 'Invia'}
                            </button>
                        </div>
                        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    </form>
                </div>
                 <p className="mt-8 text-sm text-center" style={{ color: '#6b7280' }}>
                    Powered by <a 
                        href="#" 
                        onClick={(e) => {e.preventDefault(); window.location.href='/'}} 
                        className="font-bold hover:underline"
                        style={{ color: form?.styling?.primary_color || '#6366f1' }}
                    >
                        Guardian AI CRM
                    </a>
                </p>
            </div>
        </div>
    );
};