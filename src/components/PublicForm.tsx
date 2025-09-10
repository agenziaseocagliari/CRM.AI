import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Form, FormField } from '../types';
import { GuardianIcon } from './ui/icons';

interface PublicFormProps {
    formId: string;
}

// Componente riutilizzabile per renderizzare campi di form dinamici
const DynamicFormField: React.FC<{ field: FormField }> = ({ field }) => {
    const commonClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm";
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


export const PublicForm: React.FC<PublicFormProps> = ({ formId }) => {
    const [form, setForm] = useState<Form | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    useEffect(() => {
        const fetchForm = async () => {
            setLoading(true);
            try {
                const { data, error: fetchError } = await supabase
                    .from('forms')
                    .select('*')
                    .eq('id', formId)
                    .single();
                
                if (fetchError) throw fetchError;
                if (!data) throw new Error("Form non trovato.");

                setForm(data);
            } catch (err: any) {
                setError(`Impossibile caricare il form: ${err.message}`);
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
        const formValues: { [key: string]: any } = {};
        formData.forEach((value, key) => {
            formValues[key] = value;
        });

        try {
            const { error: rpcError } = await supabase.rpc('create_submission', {
                p_form_id: formId,
                p_form_data: formValues
            });

            if (rpcError) throw rpcError;

            setSubmitSuccess(true);
        } catch (err: any) {
            setError(`Errore durante l'invio: ${err.message}`);
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
        <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
             <div className="w-full max-w-lg">
                <div className="text-center mb-6">
                    <GuardianIcon className="w-12 h-12 text-primary mx-auto mb-2" />
                    <h1 className="text-3xl font-bold text-text-primary">{form?.title}</h1>
                </div>

                <div className="bg-white p-8 rounded-lg shadow-md">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {form?.fields.map(field => (
                            <DynamicFormField key={field.name} field={field} />
                        ))}

                        <div className="pt-2">
                             <button 
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-primary text-white px-4 py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 font-semibold"
                            >
                                {isSubmitting ? 'Invio in corso...' : 'Invia'}
                            </button>
                        </div>
                        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    </form>
                </div>
                 <p className="mt-8 text-sm text-gray-500 text-center">
                    Powered by <a href="#" onClick={(e) => {e.preventDefault(); window.location.href='/'}} className="font-bold text-primary hover:underline">Guardian AI CRM</a>
                </p>
            </div>
        </div>
    );
};
