import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useOutletContext } from 'react-router-dom';
import { useCrmData } from '../hooks/useCrmData';
import { supabase } from '../lib/supabaseClient';

const IntegrationCard: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
    <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        <p className="text-sm text-text-secondary mt-1 mb-4">{description}</p>
        <div className="space-y-4">{children}</div>
    </div>
);

export const Settings: React.FC = () => {
    const { organization, organizationSettings, refetch } = useOutletContext<ReturnType<typeof useCrmData>>();
    
    const [brevoApiKey, setBrevoApiKey] = useState('');
    const [whatsappApiKey, setWhatsappApiKey] = useState(''); // Placeholder
    
    const [isSaving, setIsSaving] = useState(false);

    // Popola i campi del form quando i dati vengono caricati
    useEffect(() => {
        if (organizationSettings) {
            setBrevoApiKey(organizationSettings.brevo_api_key || '');
            // Imposta qui anche le altre chiavi API quando le aggiungeremo
        }
    }, [organizationSettings]);

    const handleSaveSettings = async () => {
        setIsSaving(true);
        
        if (!organization) {
            toast.error("Impossibile trovare le informazioni sull'organizzazione. Riprova.");
            setIsSaving(false);
            return;
        }

        try {
            // 'upsert' crea la riga se non esiste, o la aggiorna se esiste già.
            // 'onConflict' dice a Supabase quale colonna usare per determinare un conflitto.
            const { error } = await supabase
                .from('organization_settings')
                .upsert({
                    organization_id: organization.id,
                    brevo_api_key: brevoApiKey,
                    // Aggiungi qui altre chiavi API quando necessario
                }, { onConflict: 'organization_id' });
            
            if (error) throw error;

            toast.success('Impostazioni salvate con successo!');
            refetch(); // Ricarica i dati per assicurarsi che lo stato sia aggiornato
        } catch (err: any) {
            toast.error(`Errore nel salvataggio: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };


    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-text-primary">Impostazioni & Integrazioni</h1>
             <p className="text-text-secondary">
                Collega i tuoi strumenti preferiti per dare i superpoteri alle tue automazioni. Le chiavi API sono archiviate in modo sicuro.
            </p>
            
            <div className="space-y-6">

                <IntegrationCard
                    title="Marketing via Email con Brevo"
                    description="Connetti il tuo account Brevo (ex Sendinblue) per consentire alle automazioni di inviare email per tuo conto."
                >
                     <div>
                        <label htmlFor="brevoApiKey" className="block text-sm font-medium text-gray-700">Brevo API Key</label>
                        <input 
                            type="password" 
                            id="brevoApiKey" 
                            value={brevoApiKey}
                            onChange={(e) => setBrevoApiKey(e.target.value)}
                            placeholder="xkeysib-••••••••••••••••••••••••••••••••"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                         <p className="mt-2 text-xs text-gray-500">
                           Puoi trovare la tua chiave API v3 nelle impostazioni SMTP & API del tuo account Brevo.
                        </p>
                    </div>
                </IntegrationCard>

                <IntegrationCard
                    title="Integrazione Calendario Google"
                    description="Collega il tuo account Google per permettere agli agenti di leggere la tua disponibilità e creare eventi."
                >
                     <div>
                        <label htmlFor="googleApiKey" className="block text-sm font-medium text-gray-700">Google API Key / OAuth</label>
                         <div className="mt-1">
                            <button
                                disabled
                                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                Connetti a Google (Prossimamente)
                            </button>
                        </div>
                         <p className="mt-2 text-xs text-gray-500">
                           Questa integrazione richiederà l'autenticazione tramite Google OAuth.
                        </p>
                    </div>
                </IntegrationCard>

                 <IntegrationCard
                    title="Comunicazione con WhatsApp"
                    description="Connetti la tua API di WhatsApp Business per inviare messaggi e notifiche direttamente ai tuoi contatti."
                >
                     <div>
                        <label htmlFor="whatsappApiKey" className="block text-sm font-medium text-gray-700">WhatsApp API Key</label>
                        <input 
                            type="password" 
                            id="whatsappApiKey" 
                            value={whatsappApiKey}
                            onChange={(e) => setWhatsappApiKey(e.target.value)}
                            placeholder="••••••••••••••••••••••••••••••••"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
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
