import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useCrmData } from '../hooks/useCrmData';
import toast from 'react-hot-toast';
import { Modal } from './ui/Modal';
import { PlusIcon, SparklesIcon } from './ui/icons';

export const Automations: React.FC = () => {
    const { organization } = useOutletContext<ReturnType<typeof useCrmData>>();
    
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [automationName, setAutomationName] = useState('');
    const [generatedWorkflow, setGeneratedWorkflow] = useState<any | null>(null);

    const handleOpenCreateModal = () => {
        setPrompt('');
        setAutomationName('');
        setGeneratedWorkflow(null);
        setCreateModalOpen(true);
    };
    
    const handleCloseModals = () => {
        setCreateModalOpen(false);
    };

    const handleGenerateWorkflow = async () => {
        if (!prompt) {
            toast.error("Descrivi l'automazione che vuoi creare.");
            return;
        }
        setIsLoading(true);
        setGeneratedWorkflow(null);
        const toastId = toast.loading('Generazione workflow in corso...');

        try {
            const { data, error } = await supabase.functions.invoke('generate-n8n-workflow', {
                body: { prompt },
            });
            if (error) throw new Error(`Errore di rete: ${error.message}`);
            if (data.error) throw new Error(data.error);
            
            setGeneratedWorkflow(data.workflow);
            toast.success('Workflow generato con successo!', { id: toastId });
        } catch (err: any) {
            console.error(err);
            toast.error(`Impossibile generare il workflow: ${err.message}`, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveAutomation = async () => {
        if (!automationName || !generatedWorkflow || !organization) {
            toast.error("Il nome dell'automazione e un workflow generato sono necessari per salvare.");
            return;
        }
        setIsLoading(true);
        
        // In a real application, you would save the automation to the database.
        // For this example, we'll just simulate the save.
        await new Promise(resolve => setTimeout(resolve, 1000));

        toast.success(`Automazione "${automationName}" salvata! (Simulazione)`);
        setIsLoading(false);
        handleCloseModals();
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
                        Descrivi i processi che vuoi automatizzare in linguaggio naturale. L'AI genererà un workflow pronto per essere eseguito, connettendo le tue app e risparmiando ore di lavoro manuale.
                    </p>
                    <div className="mt-6">
                        <button onClick={handleOpenCreateModal} className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-indigo-700 text-lg font-semibold flex items-center space-x-2 mx-auto">
                            <PlusIcon className="w-5 h-5"/>
                            <span>Crea la tua Prima Automazione</span>
                        </button>
                    </div>
                </div>
            </div>

            <Modal isOpen={isCreateModalOpen} onClose={handleCloseModals} title="Crea Nuova Automazione con AI">
                <div className="space-y-4">
                    {!generatedWorkflow ? (
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
                            <div className="flex justify-end">
                                <button
                                    onClick={handleGenerateWorkflow}
                                    disabled={isLoading || !prompt}
                                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2 disabled:bg-gray-400"
                                >
                                    {isLoading ? 'Generazione...' : <><SparklesIcon className="w-5 h-5" /><span>Genera Workflow</span></>}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Anteprima Workflow (JSON)</label>
                                <div className="mt-2 p-4 border rounded-md bg-gray-50 max-h-64 overflow-y-auto">
                                    <pre className="text-xs whitespace-pre-wrap break-all">
                                        <code>{JSON.stringify(generatedWorkflow, null, 2)}</code>
                                    </pre>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="automation-name" className="block text-sm font-medium text-gray-700">
                                    Nome dell'Automazione
                                </label>
                                <input
                                    type="text"
                                    id="automation-name"
                                    value={automationName}
                                    onChange={(e) => setAutomationName(e.target.value)}
                                    placeholder="Es: Notifica Lead Caldi su Slack"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                />
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t mt-4">
                                <button onClick={() => setGeneratedWorkflow(null)} className="text-sm text-gray-600 hover:text-primary">
                                    Indietro
                                </button>
                                <button
                                    onClick={handleSaveAutomation}
                                    disabled={isLoading || !automationName}
                                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                                >
                                    {isLoading ? 'Salvataggio...' : 'Salva Automazione'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>
        </>
    );
};
