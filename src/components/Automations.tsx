import React, { useState } from 'react';
import { SparklesIcon } from './ui/icons';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

export const Automations: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // State per lo strumento di diagnostica
    const [debugResult, setDebugResult] = useState<string | null>(null);
    const [isDebugging, setIsDebugging] = useState(false);


    const handleGenerateWorkflow = async () => {
        if (!prompt.trim()) {
            toast.error("Per favore, descrivi l'automazione che vuoi creare.");
            return;
        }
        setIsLoading(true);
        const toastId = toast.loading('Creazione workflow in corso...');

        try {
            const { data, error: invokeError } = await supabase.functions.invoke('generate-n8n-workflow', {
                body: { prompt },
            });

            if (invokeError) throw new Error(`Errore di rete: ${invokeError.message}`);
            if (data.error) throw new Error(data.error);

            toast.success(data.message, { id: toastId, duration: 5000 });
            setPrompt('');

        } catch (err: any) {
            console.error(err);
            toast.error(`Si è verificato un errore: ${err.message}`, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleRunDiagnostics = async () => {
        setIsDebugging(true);
        setDebugResult('Diagnostica in corso...');
        try {
            const { data, error } = await supabase.functions.invoke('debug-n8n-workflow');
            if (error) throw error;
            setDebugResult(JSON.stringify(data, null, 2));
        } catch (err: any) {
            setDebugResult(`ERRORE DURANTE LA DIAGNOSTICA:\n${err.message}\n\nControlla i log della funzione 'debug-n8n-workflow' nella dashboard di Supabase per maggiori dettagli.`);
        } finally {
            setIsDebugging(false);
        }
    };


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-text-primary">Automazioni</h1>
            </div>

            <div className="bg-card p-8 rounded-lg shadow">
                <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                        <img src="https://assets-global.website-files.com/63554faf18742c125a359b6c/635643666384813511b01c34_n8n-symbol-primary-rgb.svg" alt="N8N Logo" className="w-16 h-16" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold text-text-primary">
                            Automatizza il tuo Business con Linguaggio Naturale
                        </h2>
                        <p className="mt-1 text-text-secondary">
                            Potenziato da <span className="font-semibold">N8N</span> e <span className="font-semibold">Gemini AI</span>, il nostro motore di automazione ti permette di costruire workflow complessi. Descrivi semplicemente cosa vuoi automatizzare.
                        </p>
                    </div>
                </div>

                <div className="mt-6">
                    <label htmlFor="automation-prompt" className="block text-sm font-medium text-gray-700 mb-1">
                        Descrivi il workflow che vuoi creare:
                    </label>
                    <textarea
                        id="automation-prompt"
                        rows={4}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Es: 'Quando un nuovo contatto viene creato, invia una notifica al canale #vendite su Slack.'"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                    <div className="mt-3 flex justify-end">
                        <button
                            onClick={handleGenerateWorkflow}
                            disabled={isLoading}
                            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Creazione in corso...</span>
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="w-5 h-5" />
                                    <span>Genera Workflow</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Strumento di Diagnostica */}
            <div className="bg-yellow-50 border border-yellow-300 p-6 rounded-lg shadow-sm">
                 <h2 className="text-xl font-semibold text-yellow-800">
                    Strumento di Diagnostica
                </h2>
                <p className="mt-1 text-sm text-yellow-700">
                    Se riscontri un "Errore di rete", usa questo strumento per verificare la configurazione e le connessioni. Clicca il pulsante e condividi il risultato con il supporto.
                </p>
                <div className="mt-4">
                    <button
                        onClick={handleRunDiagnostics}
                        disabled={isDebugging}
                        className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 flex items-center space-x-2 disabled:bg-gray-400"
                    >
                         {isDebugging ? 'Esecuzione...' : 'Avvia Diagnostica'}
                    </button>
                </div>
                {debugResult && (
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700">Risultato Diagnostica:</label>
                        <pre className="bg-gray-800 text-white p-4 rounded-md text-xs whitespace-pre-wrap font-mono mt-1 max-h-96 overflow-auto">
                            {debugResult}
                        </pre>
                    </div>
                )}
            </div>

        </div>
    );
};