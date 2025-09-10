import React, { useState } from 'react';
import { Form, FormField, Organization } from '../types';
import { SparklesIcon, PlusIcon, TrashIcon, CodeIcon, EyeIcon } from './ui/icons';
import { Modal } from './ui/Modal';
import { supabase } from '../lib/supabaseClient';

// Componente per renderizzare dinamicamente i campi del form in anteprima o in modalità pubblica
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


interface FormsProps {
    forms: Form[];
    organization: Organization | null;
    refetchData: () => void;
}

const FormCard: React.FC<{
    form: Form;
    onDelete: (form: Form) => void;
    onPreview: (form: Form) => void;
    onGetCode: (form: Form) => void;
}> = ({ form, onDelete, onPreview, onGetCode }) => (
    <div className="bg-white p-4 rounded-lg shadow border flex flex-col justify-between">
        <div>
            <h3 className="font-bold text-lg text-text-primary truncate">{form.name}</h3>
            <p className="text-sm text-text-secondary">Creato il: {new Date(form.created_at).toLocaleDateString('it-IT')}</p>
        </div>
        <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t">
            <button onClick={() => onPreview(form)} title="Anteprima" className="p-2 text-gray-500 hover:bg-gray-100 rounded-md">
                <EyeIcon className="w-5 h-5" />
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


export const Forms: React.FC<FormsProps> = ({ forms, organization, refetchData }) => {
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
    const [generatedFields, setGeneratedFields] = useState<FormField[] | null>(null);
    const [publicUrl, setPublicUrl] = useState('');
    
    // Stati di caricamento ed errore
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleOpenCreateModal = () => {
        setPrompt(''); setFormName(''); setFormTitle('');
        setGeneratedFields(null); setError(null); setIsLoading(false);
        setCreateModalOpen(true);
    };

    const handleOpenDeleteModal = (form: Form) => { setFormToModify(form); setDeleteModalOpen(true); };
    const handleOpenPreviewModal = (form: Form) => { setFormToModify(form); setPreviewModalOpen(true); };
    const handleOpenGetCodeModal = (form: Form) => {
        setFormToModify(form);
        const url = `${window.location.origin}/form/${form.id}`;
        setPublicUrl(url);
        setGetCodeModalOpen(true);
    };

    const handleCloseModals = () => {
        setCreateModalOpen(false); setDeleteModalOpen(false);
        setPreviewModalOpen(false); setGetCodeModalOpen(false);
        setFormToModify(null);
    };
    
    const handleGenerateForm = async () => {
        if (!prompt) { setError("Per favore, inserisci una descrizione per il tuo form."); return; }
        setIsLoading(true); setError(null); setGeneratedFields(null);

        try {
            const { GoogleGenAI, Type } = await import('@google/genai');
            const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY! });

            const schema = {
                type: Type.ARRAY, items: {
                    type: Type.OBJECT, properties: {
                        name: { type: Type.STRING, description: 'A lowercase, snake_case string for the input name attribute (e.g., "full_name", "email", "phone", "company"). MUST BE ONE OF: name, email, phone, company, or message.' },
                        label: { type: Type.STRING, description: 'A user-friendly, capitalized string for the form label (e.g., "Full Name").' },
                        type: { type: Type.STRING, description: 'The input type. Must be one of: "text", "email", "tel", or "textarea".' },
                        required: { type: Type.BOOLEAN },
                    }, required: ["name", "label", "type", "required"],
                },
            };
            
            const fullPrompt = `You are an expert form builder AI. Your task is to convert a user's description into a valid JSON array of form fields. The user's description is in Italian. Output MUST be only the raw JSON array. Description: "${prompt}"`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash', contents: fullPrompt,
                config: { responseMimeType: "application/json", responseSchema: schema },
            });

            const jsonText = response.text;
            if (!jsonText) { throw new Error("La risposta dell'AI era vuota o non valida."); }
            const fields = JSON.parse(jsonText) as FormField[];
            setGeneratedFields(fields);
        } catch (err) {
            console.error(err);
            setError("Impossibile generare il form. Riprova con una descrizione diversa o controlla la tua chiave API.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveForm = async () => {
        if (!formName || !formTitle || !generatedFields || !organization) { setError("Nome, titolo e campi generati sono necessari per salvare."); return; }
        setIsLoading(true); setError(null);

        try {
            const { error: insertError } = await supabase.from('forms').insert({ name: formName, title: formTitle, fields: generatedFields, organization_id: organization.id });
            if (insertError) throw insertError;
            refetchData(); handleCloseModals();
        } catch (err: any) {
            setError(`Errore durante il salvataggio: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDeleteForm = async () => {
        if (!formToModify) return;
        setIsLoading(true);
        try {
            const { error } = await supabase.from('forms').delete().eq('id', formToModify.id);
            if(error) throw error;
            refetchData(); handleCloseModals();
        } catch (err: any) { alert(`Errore: ${err.message}`); }
        finally { setIsLoading(false); }
    };

    const renderFieldPreview = (field: FormField, index: number) => {
        const commonClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-gray-50";
        if (field.type === 'textarea') { return <textarea key={index} rows={3} className={commonClasses} disabled />; }
        return <input key={index} type={field.type} className={commonClasses} disabled />;
    };

    const renderContent = () => {
        if (forms.length === 0) {
            return (
                <div className="bg-card p-8 rounded-lg shadow text-center">
                    <div className="mx-auto bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center"> <SparklesIcon className="w-8 h-8 text-primary" /> </div>
                    <h2 className="mt-4 text-2xl font-semibold text-text-primary"> Crea il tuo primo Form con l'AI </h2>
                    <p className="mt-2 text-text-secondary max-w-2xl mx-auto"> Inizia a raccogliere lead in pochi secondi. Descrivi i campi di cui hai bisogno e lascia che l'AI faccia il resto. </p>
                    <div className="mt-6"> <button onClick={handleOpenCreateModal} className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-indigo-700 text-lg font-semibold flex items-center space-x-2 mx-auto"> <PlusIcon className="w-5 h-5"/> <span>Inizia a Costruire</span> </button> </div>
                </div>
            );
        }
        return ( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {forms.map(form => <FormCard key={form.id} form={form} onDelete={handleOpenDeleteModal} onPreview={handleOpenPreviewModal} onGetCode={handleOpenGetCodeModal} />)} </div> );
    };

    return (
    <>
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-text-primary">I Tuoi Form</h1>
                {forms.length > 0 && ( <button onClick={handleOpenCreateModal} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"> <PlusIcon className="w-5 h-5" /> <span>Crea Nuovo Form</span> </button> )}
            </div>
            {renderContent()}
        </div>

        <Modal isOpen={isCreateModalOpen} onClose={handleCloseModals} title="Crea Nuovo Form con AI">
            <div className="space-y-4">
                {!generatedFields ? (
                    <>
                        <div>
                            <label htmlFor="form-prompt" className="block text-sm font-medium text-gray-700">Descrivi il tuo form</label>
                            <textarea id="form-prompt" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Es: Un form di contatto con nome, email, telefono e un'area per il messaggio." className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                        </div>
                        <div className="flex justify-end"> <button onClick={handleGenerateForm} disabled={isLoading} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2 disabled:bg-gray-400"> {isLoading ? 'Generazione...' : <><SparklesIcon className="w-5 h-5" /><span>Genera Campi</span></>} </button> </div>
                    </>
                ) : (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Anteprima Form</label>
                            <div className="mt-2 p-4 border rounded-md space-y-3 bg-gray-50"> {generatedFields.map((field, index) => (<div key={index}> <label className="text-sm font-medium text-gray-900">{field.label}{field.required ? ' *' : ''}</label> {renderFieldPreview(field, index)} </div>))} </div>
                        </div>
                        <div>
                            <label htmlFor="form-name" className="block text-sm font-medium text-gray-700">Nome del Form (interno)</label>
                            <input type="text" id="form-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Es: Form Contatti Sito Web" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                        </div>
                        <div>
                            <label htmlFor="form-title" className="block text-sm font-medium text-gray-700">Titolo del Form (pubblico)</label>
                            <input type="text" id="form-title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Es: Contattaci" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t mt-4">
                            <button onClick={() => setGeneratedFields(null)} className="text-sm text-gray-600 hover:text-primary">Indietro</button>
                            <button onClick={handleSaveForm} disabled={isLoading} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">{isLoading ? 'Salvataggio...' : 'Salva Form'}</button>
                        </div>
                    </>
                )}
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
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
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                {formToModify?.fields.map(field => <DynamicFormField key={field.name} field={field} />)}
                <div className="flex justify-end pt-4"> <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Invia (Anteprima)</button> </div>
            </form>
        </Modal>

        <Modal isOpen={isGetCodeModalOpen} onClose={handleCloseModals} title="Ottieni Link Pubblico">
            <p className="text-sm text-gray-600">Condividi questo link per permettere a chiunque di compilare il tuo form.</p>
            <div className="mt-2 flex">
                <input type="text" readOnly value={publicUrl} className="flex-grow bg-gray-100 border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none"/>
                <button onClick={() => navigator.clipboard.writeText(publicUrl)} className="bg-primary text-white px-4 py-2 rounded-r-md hover:bg-indigo-700">Copia</button>
            </div>
        </Modal>
    </>
    );
};
