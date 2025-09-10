import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { Modal } from './ui/Modal';
import { PlusIcon, SparklesIcon } from './ui/icons';

// Definiamo una interfaccia per la risposta di successo dalla funzione
interface ActivationSuccessResponse {
    message: string;
    workflowId: string;
    n8nLink: string;
}

export const Automations: React.FC = () => {
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [prompt, setPrompt] = useState('');
    
    const [activationResult, setActivationResult] = useState<ActivationSuccessResponse | null>(null);

    const handleOpenCreateModal = () => {
        setPrompt('');
        setActivationResult(null);
        setIsLoading(false);
        setCreateModalOpen(true);
    };
    
    const handleCloseModals = () => {
        setCreateModalOpen(false);
    };

    const handleActivateAutomation = async () => {
        if (!prompt) {
            toast.error("Descrivi l'automazione che vuoi creare.");
            return;
        }
        setIsLoading(true);
        setActivationResult(null);
        
        try {
            const { data, error } = await supabase.functions.invoke('generate-n8n-workflow', {
                body: { prompt },
            });

            if (error) throw new Error(`Errore di rete: ${error.message}`);
            if (data.error) throw new Error(data.error);
            
            setActivationResult(data as ActivationSuccessResponse);
            toast.success('Workflow attivato con successo su N8N!');

        } catch (err: any) {
            console.error(err);
            // Forniamo un messaggio di errore più utile per il comune problema di configurazione di n8n.
            if (err.message && err.message.includes('non-2xx status code')) {
                 toast.error("Attivazione fallita. Controlla la connessione e le credenziali di N8N nella pagina Impostazioni.", { duration: 6000 });
            } else {
                toast.error(`Impossibile attivare l'automazione: ${err.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    };
    

    return (
        <>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-text-primary">Automazioni</h1>
                    <button onClick={handleOpenCreateModal} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2">
                        <PlusIcon className="w-5 h-5" />
                        <span>Crea Automazione</span>
                    </button>
                </div>
                
                <div className="bg-card p-8 rounded-lg shadow text-center border-2 border-dashed border-gray-300">
                    <div className="mx-auto bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center">
                        <SparklesIcon className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="mt-4 text-2xl font-semibold text-text-primary">
                        Automatizza il tuo Business con l'AI
                    </h2>
                    <p className="mt-2 text-text-secondary max-w-2xl mx-auto">
                        Descrivi i processi che vuoi automatizzare in linguaggio naturale. L'AI genererà e attiverà un workflow nel tuo N8N, connettendo le tue app e risparmiando ore di lavoro manuale.
                    </p>
                    <div className="mt-6">
                        <button onClick={handleOpenCreateModal} className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-indigo-700 text-lg font-semibold flex items-center space-x-2 mx-auto">
                            <PlusIcon className="w-5 h-5"/>
                            <span>Crea la tua Prima Automazione</span>
                        </button>
                    </div>
                </div>
            </div>

            <Modal isOpen={isCreateModalOpen} onClose={handleCloseModals} title="Crea e Attiva una Nuova Automazione">
                <div className="space-y-4">
                    {!activationResult ? (
                        <>
                            <div>
                                <label htmlFor="automation-prompt" className="block text-sm font-medium text-gray-700">
                                    Descrivi la tua automazione
                                </label>
                                <textarea
                                    id="automation-prompt"
                                    rows={4}
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Es: Quando un nuovo contatto ha uno score 'Hot', invia una notifica su Slack e crea un'opportunità."
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                />
                            </div>
                            <div className="flex justify-end pt-4 border-t mt-4">
                                <button
                                    onClick={handleActivateAutomation}
                                    disabled={isLoading || !prompt}
                                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2 disabled:bg-gray-400"
                                >
                                    {isLoading ? 'Attivazione in corso...' : <><SparklesIcon className="w-5 h-5" /><span>Genera e Attiva su N8N</span></>}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center">
                            <div className="mx-auto bg-green-100 rounded-full w-16 h-16 flex items-center justify-center">
                                 <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mt-4">Successo!</h3>
                            <p className="text-gray-600 mt-2">{activationResult.message}</p>
                            <a 
                                href={activationResult.n8nLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="mt-6 inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                            >
                                Vedi il Workflow su N8N
                            </a>
                            <div className="mt-6">
                               <button onClick={handleCloseModals} className="text-sm text-gray-500 hover:text-gray-800">Chiudi</button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
};