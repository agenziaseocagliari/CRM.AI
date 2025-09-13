import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useSearchParams, useNavigate } from 'react-router-dom';
import { useCrmData } from '../hooks/useCrmData';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { GoogleIcon, CheckCircleIcon, GuardianIcon } from './ui/icons';
import { UsageDashboard } from './UsageDashboard'; // Importa la nuova dashboard

// --- OTTIMIZZAZIONE: Componente Helper per UI di Stato ---
const AuthStatusDisplay: React.FC<{
    status: 'loading' | 'success' | 'error';
    message: string;
    onRetry?: () => void;
}> = ({ status, message, onRetry }) => {
    
    const renderIcon = () => {
        switch (status) {
            case 'loading':
                return <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>;
            case 'success':
                return <CheckCircleIcon className="w-16 h-16 text-green-500" />;
            case 'error':
                 // Usiamo l'icona dell'app per gli errori, per coerenza del brand
                return <GuardianIcon className="w-16 h-16 text-red-500" />;
            default:
                return null;
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="text-center p-8 bg-white shadow-lg rounded-lg max-w-md w-full">
                <div className="mx-auto flex items-center justify-center h-16 w-16">
                   {renderIcon()}
                </div>
                <h2 className="mt-4 text-xl font-semibold text-gray-800">
                    {status === 'loading' && 'Connessione in corso...'}
                    {status === 'success' && 'Successo!'}
                    {status === 'error' && 'Si è verificato un problema'}
                </h2>
                <p className={`mt-2 text-gray-600 ${status === 'error' ? 'text-red-600' : ''}`}>
                    {message}
                </p>
                {status === 'error' && onRetry && (
                    <button onClick={onRetry} className="mt-6 bg-primary text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700">
                        Torna alle Impostazioni
                    </button>
                )}
            </div>
        </div>
    );
};


export const GoogleAuthCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { organization, loading: crmLoading } = useCrmData(); 
    
    // OTTIMIZZAZIONE: Stato strutturato per gestire UI e messaggi in modo pulito.
    const [authState, setAuthState] = useState<{
        status: 'loading' | 'success' | 'error';
        message: string;
    }>({
        status: 'loading',
        message: 'Caricamento delle informazioni dell\'account...',
    });
    
    // OTTIMIZZAZIONE: useRef per prevenire esecuzioni multiple della logica di autenticazione.
    const exchangeAttempted = useRef(false);

    useEffect(() => {
        // Log iniziale al montaggio del componente
        console.log('[GoogleAuthCallback] Componente montato.');

        if (crmLoading) {
            console.log('[GoogleAuthCallback] In attesa dei dati CRM...');
            return; // Attende che i dati dell'organizzazione siano caricati
        }

        if (exchangeAttempted.current) {
            console.warn('[GoogleAuthCallback] Tentativo di scambio già eseguito. Annullamento.');
            return; // Previene riesecuzioni
        }
        exchangeAttempted.current = true; // Marca il tentativo come eseguito

        const exchangeCodeForToken = async () => {
            console.log('[GoogleAuthCallback] Avvio del processo di scambio del token.');
            setAuthState({ status: 'loading', message: 'Verifica dell\'autenticazione...' });
            
            // --- OTTIMIZZAZIONE: Validazione robusta dello stato CSRF ---
            const code = searchParams.get('code');
            const state = searchParams.get('state');
            const storedState = localStorage.getItem('oauth_state');
            
            console.log(`[GoogleAuthCallback] Parametri ricevuti - code: ${code ? 'OK' : 'MANCANTE'}, state: ${state ? `"${state}"` : 'MANCANTE'}`);
            console.log(`[GoogleAuthCallback] Stato salvato in localStorage: "${storedState}"`);
            
            if (!code || !state || state !== storedState) {
                const errorMsg = 'Richiesta di autenticazione non valida o scaduta. Per favore, torna alle impostazioni e riprova.';
                console.error(`[GoogleAuthCallback] ERRORE: Discrepanza di stato o parametri mancanti. Processo interrotto.`);
                setAuthState({ status: 'error', message: errorMsg });
                localStorage.removeItem('oauth_state'); // Pulisce comunque lo state vecchio
                return;
            }
            
            // La validazione è andata a buon fine, puliamo lo stato
            localStorage.removeItem('oauth_state');
            console.log('[GoogleAuthCallback] Stato CSRF validato con successo e rimosso.');

            if (!organization) {
                const errorMsg = "Impossibile identificare l'organizzazione. Autenticazione fallita.";
                console.error('[GoogleAuthCallback] ERRORE: Dati dell\'organizzazione non disponibili.');
                setAuthState({ status: 'error', message: errorMsg });
                return;
            }
            
            const payload = { code, organization_id: organization.id };
            console.log('[GoogleAuthCallback] Dati pronti per l\'invocazione della funzione Supabase:', payload);
            setAuthState({ status: 'loading', message: 'Finalizzazione della connessione sicura...' });
            
            try {
                // --- OTTIMIZZAZIONE: Gestione del timeout esplicito di 20 secondi ---
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout della richiesta dopo 20 secondi. La connessione potrebbe essere lenta.')), 20000)
                );

                const invokePromise = supabase.functions.invoke('google-token-exchange', { body: payload });

                // Fa competere la chiamata API con il timeout
                const response: any = await Promise.race([invokePromise, timeoutPromise]);
                
                // --- OTTIMIZZAZIONE: Logging trasparente della risposta ---
                console.log('[GoogleAuthCallback] Risposta ricevuta dalla funzione:', response);

                if (response.error) throw new Error(response.error.message || 'Errore di rete/invoke sconosciuto.');
                if (response.data && response.data.error) throw new Error(response.data.error);
                
                // --- OTTIMIZZAZIONE: Gestione del successo con feedback e redirect ---
                console.log('[GoogleAuthCallback] Successo! Scambio del token completato.');
                setAuthState({ status: 'success', message: 'Account Google connesso con successo! Sarai reindirizzato a breve...' });
                toast.success('Integrazione Google Calendar attivata!');
                setTimeout(() => navigate('/settings'), 2500); // Redirect dopo aver mostrato il messaggio

            } catch (err: any) {
                console.error('[GoogleAuthCallback] ERRORE nel blocco catch finale:', err);
                setAuthState({ status: 'error', message: `Si è verificato un errore: ${err.message}` });
                toast.error(`Connessione fallita: ${err.message}`);
            }
        };

        exchangeCodeForToken();

    }, [searchParams, navigate, organization, crmLoading]);

    // --- OTTIMIZZAZIONE: UI reattiva basata sullo stato ---
    return <AuthStatusDisplay 
        status={authState.status} 
        message={authState.message}
        onRetry={() => navigate('/settings')}
    />;
};

type SettingsTab = 'integrations' | 'billing';

export const Settings: React.FC = () => {
    const { organization, organizationSettings, refetch } = useOutletContext<ReturnType<typeof useCrmData>>();
    const [activeTab, setActiveTab] = useState<SettingsTab>('integrations');
    const [brevoApiKey, setBrevoApiKey] = useState('');
    const [twilioSid, setTwilioSid] = useState('');
    const [twilioToken, setTwilioToken] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    const isGoogleConnected = !!organizationSettings?.google_auth_token;

    useEffect(() => {
        if (organizationSettings) {
            setBrevoApiKey(organizationSettings.brevo_api_key || '');
            setTwilioSid(organizationSettings.twilio_account_sid || '');
            setTwilioToken(organizationSettings.twilio_auth_token || '');
        }
    }, [organizationSettings]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!organization) return;
        setIsSaving(true);
        
        try {
            const { error } = await supabase.from('organization_settings').upsert(
                {
                    organization_id: organization.id,
                    brevo_api_key: brevoApiKey,
                    twilio_account_sid: twilioSid,
                    twilio_auth_token: twilioToken,
                },
                { onConflict: 'organization_id' }
            );

            if (error) throw error;
            toast.success('Impostazioni salvate con successo!');
            refetch();
        } catch (err: any) {
            toast.error(`Errore nel salvaggio: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleGoogleConnect = async () => {
        try {
            const state = Math.random().toString(36).substring(2, 15);
            localStorage.setItem('oauth_state', state);

            const { data, error } = await supabase.functions.invoke('google-auth-url', {
                body: { state },
            });
            
            if (error) throw new Error(error.message);
            if (data.error) throw new Error(data.error);

            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error("La funzione ha restituito una risposta inaspettata.");
            }
            
        } catch (err: any) {
            toast.error(`Impossibile avviare la connessione: ${err.message}`, { duration: 10000 });
        }
    };
    
    const handleGoogleDisconnect = async () => {
        if (!organization) return;
        const confirmation = window.confirm("Sei sicuro di voler disconnettere il tuo account Google? Questo interromperà la creazione di eventi su Google Calendar.");
        if (!confirmation) return;

        try {
            const { error } = await supabase
                .from('organization_settings')
                .update({ google_auth_token: null })
                .eq('organization_id', organization.id);
            if (error) throw error;
            toast.success("Account Google disconnesso.");
            refetch();
        } catch (err: any) {
            toast.error(`Errore: ${err.message}`);
        }
    };

    const TabButton: React.FC<{ tab: SettingsTab; label: string }> = ({ tab, label }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === tab 
                ? 'bg-primary text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-text-primary">Impostazioni</h1>
            
            <div className="border-b border-gray-200">
                <nav className="flex space-x-2" aria-label="Tabs">
                    <TabButton tab="integrations" label="Integrazioni" />
                    <TabButton tab="billing" label="Billing & Usage" />
                </nav>
            </div>

            {activeTab === 'integrations' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-3">Integrazioni API</h2>
                        <form onSubmit={handleSave} className="space-y-6 mt-4">
                            <div>
                                <label htmlFor="brevo" className="block text-sm font-medium text-gray-700">Chiave API Brevo (per Email)</label>
                                <input type="password" id="brevo" value={brevoApiKey} onChange={(e) => setBrevoApiKey(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" placeholder="v3.xxx..." />
                                <p className="text-xs text-gray-500 mt-1">Necessaria per l'invio di email automatiche ai nuovi contatti.</p>
                            </div>
                            <div>
                                <label htmlFor="twilio_sid" className="block text-sm font-medium text-gray-700">Twilio Account SID (per WhatsApp)</label>
                                <input type="password" id="twilio_sid" value={twilioSid} onChange={(e) => setTwilioSid(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" placeholder="AC..." />
                            </div>
                            <div>
                                <label htmlFor="twilio_token" className="block text-sm font-medium text-gray-700">Twilio Auth Token</label>
                                <input type="password" id="twilio_token" value={twilioToken} onChange={(e) => setTwilioToken(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" placeholder="••••••••••••••••" />
                                <p className="text-xs text-gray-500 mt-1">Necessari per inviare messaggi tramite la sandbox di Twilio WhatsApp.</p>
                            </div>

                            <div className="flex justify-end pt-4 border-t">
                                <button type="submit" disabled={isSaving} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">
                                    {isSaving ? 'Salvataggio...' : 'Salva Impostazioni API'}
                                </button>
                            </div>
                        </form>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow">
                         <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-3">Integrazione Google Calendar</h2>
                         <div className="mt-4">
                            {isGoogleConnected ? (
                                <div className="flex items-center justify-between">
                                    <p className="text-green-700 font-medium flex items-center">
                                        <CheckCircleIcon className="w-5 h-5 mr-2"/> Connesso a Google Calendar
                                    </p>
                                    <button onClick={handleGoogleDisconnect} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">Disconnetti</button>
                                </div>
                            ) : (
                                 <div className="flex items-center justify-between">
                                    <p className="text-gray-600">Connetti il tuo account Google per creare eventi direttamente dal CRM.</p>
                                    <button onClick={handleGoogleConnect} className="bg-white text-gray-700 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                                        <GoogleIcon />
                                        <span>Connetti a Google</span>
                                    </button>
                                </div>
                            )}
                         </div>
                    </div>
                </div>
            )}
            
            {activeTab === 'billing' && (
                <UsageDashboard />
            )}
        </div>
    );
};
