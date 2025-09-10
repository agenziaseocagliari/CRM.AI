import React, { useState } from 'react';
import { SparklesIcon } from './ui/icons';

// Definiamo un tipo per la risposta parziale che ci aspettiamo da N8N dopo la creazione
interface N8nWorkflowCreationResponse {
    id: string;
}

export const Automations: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleGenerateWorkflow = async () => {
        if (!prompt.trim()) {
            setError("Per favore, descrivi l'automazione che vuoi creare.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            // Step 1: Chiamare Gemini per generare il JSON del workflow N8N
            const { GoogleGenAI } = await import('@google/genai');
            const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY! });
            
            const generationPrompt = `
                You are an expert n8n workflow designer. Your task is to convert the following user request into a valid n8n workflow JSON object.
                Output ONLY the raw JSON object, without any markdown formatting or explanations. The user's language is Italian.

                **User Request:** "${prompt}"

                **Workflow Requirements:**
                1. The workflow should start with a Webhook trigger ('n8n-nodes-base.webhook'). This webhook will be called by our CRM.
                   - The webhook must listen for POST requests.
                   - Generate a unique path for the webhook (e.g., a UUID).
                   - Name the node "CRM Trigger".
                2. Based on the user request, add subsequent nodes.
                3. For actions like sending a Slack message, use the 'n8n-nodes-base.slack' node. Use a placeholder URL like 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL' for the 'webhookUrl' parameter. The message text can use expressions to get data from the trigger, for example: "New event: {{$json.body.name}}". The trigger will send a JSON body with relevant data.
                4. Connect the nodes sequentially in the 'connections' object.
                5. Set the workflow 'active' status to false. Name the workflow appropriately based on the user's prompt.
                6. The response must be a valid JSON object.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: generationPrompt,
                config: { responseMimeType: 'application/json' },
            });
            
            const workflowJsonString = response.text;
            if (!workflowJsonString) {
                throw new Error("L'AI non ha generato una risposta valida.");
            }

            const workflowData = JSON.parse(workflowJsonString);

            // Step 2: Creare il workflow in N8N usando la sua API
            const n8nUrl = process.env.VITE_N8N_URL;
            const n8nApiKey = process.env.VITE_N8N_API_KEY;

            if (!n8nUrl || !n8nApiKey) {
                throw new Error("Le credenziali di N8N non sono configurate correttamente.");
            }

            const createResponse = await fetch(`${n8nUrl}api/v1/workflows`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-N8N-API-KEY': n8nApiKey,
                },
                body: JSON.stringify(workflowData),
            });

            if (!createResponse.ok) {
                const errorBody = await createResponse.text();
                throw new Error(`Errore nella creazione del workflow N8N: ${errorBody}`);
            }

            const newWorkflow = (await createResponse.json()) as N8nWorkflowCreationResponse;
            const workflowId = newWorkflow.id;

            // Step 3: Attivare il workflow appena creato
            const activateResponse = await fetch(`${n8nUrl}api/v1/workflows/${workflowId}/activate`, {
                method: 'POST',
                headers: { 'X-N8N-API-KEY': n8nApiKey },
            });

            if (!activateResponse.ok) {
                throw new Error("Workflow creato ma impossibile attivarlo.");
            }
            
            setSuccessMessage(`Workflow "${workflowData.name}" creato e attivato con successo!`);
            setPrompt('');

        } catch (err: any) {
            console.error(err);
            setError(`Si è verificato un errore: ${err.message}`);
        } finally {
            setIsLoading(false);
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
                     <div className="mt-4 h-6 text-sm">
                        {error && <p className="text-red-500">{error}</p>}
                        {successMessage && <p className="text-green-600">{successMessage}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};