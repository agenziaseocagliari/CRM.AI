import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useOutletContext } from 'react-router-dom';
import { useCrmData } from '../hooks/useCrmData';
import { supabase } from '../lib/supabaseClient';
import { GoogleIcon } from './ui/icons';

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
    const [twilioAccountSid, setTwilioAccountSid] = useState('');
    const [twilioAuthToken, setTwilioAuthToken] = useState('');
    
    const [isSaving, setIsSaving] = useState(false);
    const [isGoogleConnected, setIsGoogleConnected] = useState(false);

    // Popola i campi del form quando i dati vengono caricati e gestisce il redirect da Google
    useEffect(() => {
        if (organizationSettings) {
            setBrevoApiKey(organizationSettings.brevo_api_key || '');
            setTwilioAccountSid(organizationSettings.twilio_account_sid || '');
            setTwilioAuthToken(organizationSettings.twilio_auth_token || '');
            
            // Controlla se l'account Google è connesso
            try {
                const tokenData = organizationSettings.google_auth_token ? JSON.parse(organizationSettings.google_auth_token) : null;
                setIsGoogleConnected(!!tokenData?.access_token);
            } catch (e) {
                console.error("Errore parsing token Google:", e);
                setIsGoogleConnected(false);
            }
        } else {
            setIsGoogleConnected(false);
        }

        const handleGoogleRedirect = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const state = urlParams.get('state');

            if (code && state === localStorage.getItem('google_oauth_state')) {
                localStorage.removeItem('google_oauth_state');
                window.history.replaceState({}, document.title, window.location.pathname);

                const toastId = toast.loading('Connessione a Google in corso...');
                try {
                    const { data, error } = await supabase.functions.invoke('google-token-exchange', {
                        body: { code, organization_id: organization?.id },
                    });

                    if (error) throw new Error(error.message);
                    if (data.error) throw new Error(data.error);

                    toast.success('Account Google connesso!', { id: toastId });
                    refetch();
                } catch (err: any) {
                    toast.error(`Errore: ${err.message}`, { id: toastId });
                }
            }
        };

        if (organization) {
            handleGoogleRedirect();
        }
    }, [organizationSettings, organization, refetch]);


    const handleSaveSettings = async () => {
        setIsSaving(true);
        
        if (!organization) {
            toast.error("Impossibile trovare le informazioni sull'organizzazione. Riprova.");
            setIsSaving(false);
            return;
        }

        try {
            const { error } = await supabase
                .from('organization_settings')
                .upsert({
                    organization_id: organization.id,
                    brevo_api_key: brevoApiKey,
                    twilio_account_sid: twilioAccountSid,
                    twilio_auth_token: twilioAuthToken,
                }, { onConflict: 'organization_id' });
            
            if (error) throw error;

            toast.success('Impostazioni API salvate con successo!');
            refetch();
        } catch (err: any) {
            toast.error(`Errore nel salvaggio: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleGoogleConnect = async () => {
        const toastId = toast.loading('Reindirizzamento a Google...');
        try {
            const state = Math.random().toString(36).substring(2);
            localStorage.setItem('google_oauth_state', state);

            // La funzione ora restituisce un oggetto JSON: { url: "..." } o { error: "..." }
            const { data, error } = await supabase.functions.invoke('google-auth-url', {
                body: { state }
            });

            if (error) {
                // Gestisce errori di rete o del client Supabase
                throw new Error(error.message);
            }
            
            if (data && data.error) {
                // Gestisce errori applicativi restituiti dalla funzione
                throw new Error(data.error);
            }
            
            // Verifica che la risposta contenga un URL valido
            if (!data || typeof data.url !== 'string' || !data.url.startsWith("https://accounts.google.com")) {
                console.error("La funzione 'google-auth-url' ha restituito una risposta non valida:", data);
                throw new Error("Impossibile ottenere l'URL di autenticazione. Risposta non valida dal server.");
            }
            
            // Reindirizza all'URL di autenticazione Google
            window.location.href = data.url;

        } catch (err: any) {
            toast.error(`Errore: ${err.message}`, { id: toastId });
        }
    };
    
    const handleGoogleDisconnect = async () => {
        setIsSaving(true);
        try {
             const { error } = await supabase
                .from('organization_settings')
                .update({ google_auth_token: null })
                .eq('organization_id', organization!.id);

            if (error) throw error;
            toast.success('Account Google disconnesso.');
            refetch();

        } catch(err: any) {
            toast.error(`Errore: ${err.message}`);
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
                    title="Comunicazione WhatsApp con Twilio"
                    description="Connetti il tuo account Twilio per inviare messaggi WhatsApp tramite la loro API. Inserisci il tuo Account SID e l'Auth Token."
                >
                     <div>
                        <label htmlFor="twilioAccountSid" className="block text-sm font-medium text-gray-700">Twilio Account SID</label>
                        <input 
                            type="password" 
                            id="twilioAccountSid" 
                            value={twilioAccountSid}
                            onChange={(e) => setTwilioAccountSid(e.target.value)}
                            placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="twilioAuthToken" className="block text-sm font-medium text-gray-700">Twilio Auth Token</label>
                        <input 
                            type="password" 
                            id="twilioAuthToken" 
                            value={twilioAuthToken}
                            onChange={(e) => setTwilioAuthToken(e.target.value)}
                            placeholder="Nascondi e salva in modo sicuro"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                         <p className="mt-2 text-xs text-gray-500">
                           Puoi trovare entrambi nella dashboard principale del tuo account Twilio.
                        </p>
                    </div>
                </IntegrationCard>

                <IntegrationCard
                    title="Integrazione Calendario Google"
                    description="Collega il tuo account Google per permettere al CRM di creare eventi e meeting per tuo conto."
                >
                     <div>
                        <div className="mt-1">
                            {!isGoogleConnected ? (
                                <button
                                    onClick={handleGoogleConnect}
                                    className="bg-white border border-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
                                >
                                    <GoogleIcon className="w-5 h-5" />
                                    <span>Connetti a Google</span>
                                </button>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <p className="text-green-700 font-medium flex items-center">
                                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                                        Account Google Connesso
                                    </p>
                                    <button
                                        onClick={handleGoogleDisconnect}
                                        disabled={isSaving}
                                        className="bg-red-50 text-red-700 px-4 py-2 rounded-lg hover:bg-red-100 text-sm disabled:opacity-50"
                                    >
                                        Disconnetti
                                    </button>
                                </div>
                            )}
                        </div>
                         <p className="mt-2 text-xs text-gray-500">
                           Questa integrazione richiederà l'autenticazione tramite Google per accedere e creare eventi sul tuo calendario primario.
                        </p>
                    </div>
                </IntegrationCard>

                <div className="pt-4 flex justify-end">
                    <button
                        onClick={handleSaveSettings}
                        disabled={isSaving}
                        className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-indigo-700 text-base font-semibold disabled:bg-gray-400"
                    >
                       {isSaving ? 'Salvataggio...' : 'Salva Impostazioni API'}
                    </button>
                </div>
            </div>
        </div>
    );
};