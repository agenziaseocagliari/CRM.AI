import React, { useState } from 'react';
import { SparklesIcon, PlusIcon, BrainCircuitIcon } from './ui/icons';
import { Modal } from './ui/Modal';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

// Placeholder for automation type - in a real app this would be more detailed
interface Automation {
    id: string;
    name: string;
    description: string;
    created_at: string;
    n8n_link: string;
}

export const Automations: React.FC = () => {
    // For now, we don't have automations in useCrmData, so we'll use a local state
    const [automations] = useState<Automation[]>([]);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedWorkflow, setGeneratedWorkflow] = useState<{ message: string; workflowId: string; n8nLink: string } | null>(null);

    const handleOpenCreateModal = () => {
        setPrompt('');
        setGeneratedWorkflow(null);
        setIsLoading(false);
        setCreateModalOpen(true);
    };

    const handleCloseModal = () => {
        setCreateModalOpen(false);
    };

    const handleGenerateAutomation = async () => {
        if (!prompt) {
            toast.error("Per favore, descrivi l'automazione che vuoi creare.");
            return;
        }
        setIsLoading(true);
        setGeneratedWorkflow(null);
        const toastId = toast.loading("Creazione dell'agente AI in corso...");

        try {
            const { data, error } = await supabase.functions.invoke('generate-n8n-workflow', {
                body: { prompt },
            });

            if (error) throw new Error(error.message);
            // FIX: Check for error property within the data object, which is a common pattern for Supabase function returns.
            if (data.error) {
                // Try to parse nested error details if they exist
                const nestedError = data.diag?.hint ? `${data.error} (Hint: ${data.diag.hint})` : data.error;
                throw new Error(nestedError);
            }
            
            setGeneratedWorkflow(data);
            toast.success('Agente AI creato e attivato con successo!', { id: toastId });
            // Here you would typically refetch the list of automations
        } catch (err: any) {
            console.error("Errore generazione automazione:", err);
            const errorMessage = err.message || "Si è verificato un errore sconosciuto.";
            toast.error(`Creazione fallita: ${errorMessage}`, { id: toastId, duration: 6000 });
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderContent = () => {
        if (automations.length === 0) {
            return (
                <div className="bg-card p-8 rounded-lg shadow text-center">
                    <div className="mx-auto bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center">
                        <BrainCircuitIcon className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="mt-4 text-2xl font-semibold text-text-primary">Crea il tuo primo Agente AI</h2>
                    <p className="mt-2 text-text-secondary max-w-2xl mx-auto">
                        Automatizza i tuoi processi descrivendo ciò che ti serve. L'AI costruirà il workflow per te, collegando le tue app e risparmiandoti ore di lavoro manuale.
                    </p>
                    <div className="mt-6">
                        <button onClick={handleOpenCreateModal} className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-indigo-700 text-lg font-semibold flex items-center space-x-2 mx-auto">
                            <PlusIcon className="w-5 h-5" />
                            <span>Crea Agente</span>
                        </button>
                    </div>
                </div>
            );
        }
        // Placeholder for when automations exist
        return (
            <div className="text-center p-8">
                <p>Elenco delle automazioni (funzionalità in sviluppo).</p>
            </div>
        );
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-text-primary">Agenti AI & Automazioni</h1>
                    {automations.length > 0 && (
                        <button onClick={handleOpenCreateModal} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2">
                            <PlusIcon className="w-5 h-5" />
                            <span>Crea Nuovo Agente</span>
                        </button>
                    )}
                </div>
                {renderContent()}
            </div>
            
            <Modal isOpen={isCreateModalOpen} onClose={handleCloseModal} title="Crea un Nuovo Agente AI">
                <div className="space-y-4">
                    {!generatedWorkflow ? (
                        <>
                            <div>
                                <label htmlFor="automation-prompt" className="block text-sm font-medium text-gray-700">Descrivi l'automazione</label>
                                <textarea
                                    id="automation-prompt"
                                    rows={4}
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Es: Quando viene creato un nuovo contatto in Guardian, inviagli un'email di benvenuto tramite Brevo e attendi 3 giorni. Se non risponde, crea un task per chiamarlo."
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                />
                                <p className="mt-2 text-xs text-gray-500">
                                    Sii il più descrittivo possibile. L'AI userà queste istruzioni per costruire il workflow.
                                </p>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={handleGenerateAutomation}
                                    disabled={isLoading}
                                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2 disabled:bg-gray-400"
                                >
                                    {isLoading ? 'Creazione in corso...' : (
                                        <>
                                            <SparklesIcon className="w-5 h-5" />
                                            <span>Crea e Attiva</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                            <h3 className="text-lg font-semibold text-green-800">Agente Creato con Successo!</h3>
                            <p className="mt-2 text-green-700">{generatedWorkflow.message}</p>
                            <a 
                                href={generatedWorkflow.n8nLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="mt-4 inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                            >
                                Visualizza su n8n
                            </a>
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
};