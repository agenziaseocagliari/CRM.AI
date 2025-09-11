import React, { useState } from 'react';
import toast from 'react-hot-toast';

const IntegrationCard: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
    <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        <p className="text-sm text-text-secondary mt-1 mb-4">{description}</p>
        <div className="space-y-4">{children}</div>
    </div>
);

export const Settings: React.FC = () => {
    // In un'applicazione reale, questi valori verrebbero caricati e salvati da/in un database
    const [n8nUrl, setN8nUrl] = useState('');
    const [n8nApiKey, setN8nApiKey] = useState('');
    const [brevoApiKey, setBrevoApiKey] = useState('');
    
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);


    const handleSaveSettings = async () => {
        setIsSaving(true);
        // Logica per salvare le impostazioni nel database (es. tabella 'organization_settings')
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simula chiamata API
        toast.success('Impostazioni salvate con successo!');
        setIsSaving(false);
    };

    const handleTestN8NConnection = async () => {
        if (!n8nUrl || !n8nApiKey) {
            toast.error("URL e API Key di N8N sono necessari per il test.");
            return;
        }
        setIsTesting(true);
        // Logica per chiamare una funzione (es. 'test-n8n-connection') che verifica la connessione
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simula chiamata API
        // Simula una risposta di successo
        toast.success("Connessione a N8N riuscita!");
        setIsTesting(false);
    };


    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-text-primary">Impostazioni</h1>
            
            <div className="space-y-6">
                <IntegrationCard
                    title="Automazione con N8N Cloud"
                    description="Collega la tua istanza N8N (Cloud o Self-Hosted) per attivare workflow complessi direttamente dal CRM."
                >
                    <div>
                        <label htmlFor="n8nUrl" className="block text-sm font-medium text-gray-700">URL Istanza N8N</label>
                        <input 
                            type="text" 
                            id="n8nUrl" 
                            value={n8nUrl}
                            onChange={(e) => setN8nUrl(e.target.value)}
                            placeholder="https://iltuodominio.n8n.cloud"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                    </div>
                     <div>
                        <label htmlFor="n8nApiKey" className="block text-sm font-medium text-gray-700">N8N API Key</label>
                        <input 
                            type="password" 
                            id="n8nApiKey" 
                            value={n8nApiKey}
                            onChange={(e) => setN8nApiKey(e.target.value)}
                            placeholder="••••••••••••••••••••••••••••••••"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={handleTestN8NConnection}
                            disabled={isTesting}
                            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 mr-2 disabled:bg-gray-100"
                        >
                            {isTesting ? 'Verifica...' : 'Testa Connessione'}
                        </button>
                    </div>
                </IntegrationCard>

                <IntegrationCard
                    title="Marketing via Email con Brevo"
                    description="Connetti il tuo account Brevo (ex Sendinblue) per inviare email di marketing automatizzate ai tuoi contatti."
                >
                     <div>
                        <label htmlFor="brevoApiKey" className="block text-sm font-medium text-gray-700">Brevo API Key</label>
                        <input 
                            type="password" 
                            id="brevoApiKey" 
                            value={brevoApiKey}
                            onChange={(e) => setBrevoApiKey(e.target.value)}
                            placeholder="••••••••••••••••••••••••••••••••"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                         <p className="mt-2 text-xs text-gray-500">
                           Puoi trovare la tua chiave API nelle impostazioni SMTP & API del tuo account Brevo.
                        </p>
                    </div>
                </IntegrationCard>

                <div className="pt-4 flex justify-end">
                    <button
                        onClick={handleSaveSettings}
                        disabled={isSaving}
                        className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-indigo-700 text-base font-semibold disabled:bg-gray-400"
                    >
                       {isSaving ? 'Salvataggio...' : 'Salva Tutte le Impostazioni'}
                    </button>
                </div>
            </div>
        </div>
    );
};
