import React, { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams, useNavigate } from 'react-router-dom';
import { useCrmData } from '../hooks/useCrmData';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { GoogleIcon } from './ui/icons';

export const GoogleAuthCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [message] = useState('Autenticazione in corso...');
    const { organization } = useCrmData();

    useEffect(() => {
        const exchangeCodeForToken = async () => {
            const code = searchParams.get('code');
            const state = searchParams.get('state');
            const storedState = localStorage.getItem('oauth_state');

            if (!code || !state || state !== storedState) {
                setError('Richiesta di autenticazione non valida o scaduta. Riprova.');
                return;
            }
            
            localStorage.removeItem('oauth_state');

            if (!organization) {
                setError("Informazioni sull'organizzazione non disponibili. Impossibile completare l'autenticazione.");
                return;
            }

            try {
                const { error: invokeError } = await supabase.functions.invoke('google-token-exchange', {
                    body: { code, organization_id: organization.id },
                });

                if (invokeError) throw new Error(invokeError.message);
                
                toast.success('Account Google connesso con successo!');
                navigate('/settings');

            } catch (err: any) {
                setError(`Errore durante la connessione: ${err.message}`);
                toast.error(`Errore: ${err.message}`);
            }
        };

        exchangeCodeForToken();
    }, [searchParams, navigate, organization]);

    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-center">
                {error ? (
                    <>
                        <p className="text-red-500">{error}</p>
                        <button onClick={() => navigate('/settings')} className="mt-4 bg-primary text-white px-4 py-2 rounded-lg">Torna alle Impostazioni</button>
                    </>
                ) : (
                    <p>{message}</p>
                )}
            </div>
        </div>
    );
};


export const Settings: React.FC = () => {
    const { organization, organizationSettings, refetch } = useOutletContext<ReturnType<typeof useCrmData>>();
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
            toast.error(`Errore nel salvataggio: ${err.message}`);
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

            window.location.href = data.url;
        } catch (err: any) {
            toast.error(`Impossibile avviare la connessione: ${err.message}`);
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

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-text-primary">Impostazioni</h1>
            
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
                            <p className="text-green-700 font-medium">✓ Connesso a Google Calendar</p>
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
    );
};