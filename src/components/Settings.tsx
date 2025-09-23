// src/components/Settings.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useSearchParams, useNavigate } from 'react-router-dom';
import { useCrmData } from '../hooks/useCrmData';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { GoogleIcon, CheckCircleIcon, GuardianIcon } from './ui/icons';
import { UsageDashboard } from './UsageDashboard';
import { invokeSupabaseFunction } from '../lib/api';
import { Modal } from './ui/Modal'; // Assicurati che Modal sia importato

// --- Componente Helper per UI di Stato ---
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
    
    const [authState, setAuthState] = useState<{
        status: 'loading' | 'success' | 'error';
        message: string;
    }>({
        status: 'loading',
        message: 'Verifica dell\'autenticazione in corso...',
    });
    
    const exchangeAttempted = useRef(false);

    useEffect(() => {
        if (exchangeAttempted.current) return;
        exchangeAttempted.current = true;

        const exchangeCodeForToken = async () => {
            const code = searchParams.get('code');
            const state = searchParams.get('state');
            const storedState = localStorage.getItem('oauth_state');
            
            if (!code || !state || state !== storedState) {
                const errorMsg = 'Richiesta di autenticazione non valida o scaduta. Riprova.';
                setAuthState({ status: 'error', message: errorMsg });
                localStorage.removeItem('oauth_state');
                return;
            }
            
            localStorage.removeItem('oauth_state');
            setAuthState({ status: 'loading', message: 'Finalizzazione della connessione sicura...' });
            
            try {
                await invokeSupabaseFunction('google-token-exchange', { code });
                setAuthState({ status: 'success', message: 'Account Google connesso! Sarai reindirizzato...' });
                toast.success('Integrazione Google Calendar attivata!');
                setTimeout(() => navigate('/settings'), 2500);
            } catch (err: any) {
                setAuthState({ status: 'error', message: `Connessione fallita. Riprova dalle impostazioni.` });
            }
        };

        exchangeCodeForToken();
    }, [searchParams, navigate]);

    return <AuthStatusDisplay 
        status={authState.status} 
        message={authState.message}
        onRetry={() => navigate('/settings')}
    />;
};

type SettingsTab = 'integrations' | 'billing';

export const Settings: React.FC = () => {
    const { organization, organizationSettings, subscription, ledger, refetch } = useOutletContext<ReturnType<typeof useCrmData>>();
    const [activeTab, setActiveTab] = useState<SettingsTab>('integrations');
    const [brevoApiKey, setBrevoApiKey] = useState('');
    const [twilioSid, setTwilioSid] = useState('');
    const [twilioToken, setTwilioToken] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    const [isCheckingToken, setIsCheckingToken] = useState(false);
    const [isDiagModalOpen, setIsDiagModalOpen] = useState(false);
    const [diagResult, setDiagResult] = useState<any>(null);

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
            const { url } = await invokeSupabaseFunction('google-auth-url', { state });
            if (url) window.location.href = url;
            else throw new Error("URL di autenticazione non ricevuto.");
        } catch (err: any) {
            console.error(err);
        }
    };
    
    const handleGoogleDisconnect = async () => {
        if (!organization || !window.confirm("Sei sicuro? Questo interromperà la sincronizzazione con Google Calendar.")) return;
        try {
            await supabase.from('organization_settings').update({ google_auth_token: null }).eq('organization_id', organization.id);
            toast.success("Account Google disconnesso.");
            refetch();
        } catch (err: any) {
            toast.error(`Errore: ${err.message}`);
        }
    };
    
    const handleCheckTokenStatus = async () => {
        if (!organization) return;
        setIsCheckingToken(true);
        setDiagResult(null);
        setIsDiagModalOpen(true);
        try {
            const result = await invokeSupabaseFunction('check-google-token-status', { organization_id: organization.id });
            setDiagResult(result.diagnostics);
        } catch (err) {
            setDiagResult({ error: 'Impossibile completare la diagnostica.', details: err.message });
        } finally {
            setIsCheckingToken(false);
        }
    };

    const TabButton: React.FC<{ tab: SettingsTab; label: string }> = ({ tab, label }) => (
        <button onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === tab ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            {label}
        </button>
    );

    return (
        <>
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
                                </div>
                                <div>
                                    <label htmlFor="twilio_sid" className="block text-sm font-medium text-gray-700">Twilio Account SID (per WhatsApp)</label>
                                    <input type="password" id="twilio_sid" value={twilioSid} onChange={(e) => setTwilioSid(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" placeholder="AC..." />
                                </div>
                                <div>
                                    <label htmlFor="twilio_token" className="block text-sm font-medium text-gray-700">Twilio Auth Token</label>
                                    <input type="password" id="twilio_token" value={twilioToken} onChange={(e) => setTwilioToken(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" placeholder="••••••••••••••••" />
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
                                        <p className="text-green-700 font-medium flex items-center"><CheckCircleIcon className="w-5 h-5 mr-2"/> Connesso</p>
                                        <div className="flex items-center space-x-2">
                                            <button onClick={handleCheckTokenStatus} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm hover:bg-gray-300">Verifica Stato</button>
                                            <button onClick={handleGoogleDisconnect} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">Disconnetti</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <p className="text-gray-600">Connetti il tuo account Google.</p>
                                        <button onClick={handleGoogleConnect} className="bg-white text-gray-700 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                                            <GoogleIcon /><span>Connetti a Google</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'billing' && <UsageDashboard subscription={subscription} ledger={ledger} />}
            </div>

            <Modal isOpen={isDiagModalOpen} onClose={() => setIsDiagModalOpen(false)} title="Diagnostica Connessione Google">
                {isCheckingToken ? (
                    <p>Verifica in corso...</p>
                ) : diagResult ? (
                    <div className="text-sm space-y-2">
                        <p><strong>Stato Generale:</strong> <span className={`font-semibold ${diagResult.status === 'FOUND' ? 'text-green-600' : 'text-red-600'}`}>{diagResult.message || diagResult.status}</span></p>
                        {diagResult.status === 'FOUND' && (
                            <ul className="list-disc list-inside bg-gray-50 p-3 rounded-md">
                                <li>Access Token: <span className={diagResult.has_access_token ? 'text-green-600' : 'text-red-600'}>{diagResult.has_access_token ? 'Presente' : 'MANCANTE'}</span></li>
                                <li>Refresh Token: <span className={diagResult.has_refresh_token ? 'text-green-600' : 'text-red-600'}>{diagResult.has_refresh_token ? 'Presente (OK)' : 'MANCANTE (CRITICO)'}</span></li>
                                <li>Scaduto: <span className={diagResult.is_expired ? 'text-yellow-600' : 'text-green-600'}>{diagResult.is_expired ? 'Sì' : 'No'}</span></li>
                                <li>Data Scadenza (UTC): <span>{diagResult.expiry_date_utc}</span></li>
                            </ul>
                        )}
                         {diagResult.error && <p className="text-red-600 mt-2"><strong>Dettagli Errore:</strong> {diagResult.details}</p>}
                        <p className="text-xs text-gray-500 pt-2 border-t mt-3">Se lo stato non è 'FOUND' o il 'Refresh Token' è mancante, per favore <button onClick={handleGoogleDisconnect} className="text-primary underline">disconnetti</button> e ricollega il tuo account.</p>
                    </div>
                ) : <p>Nessun risultato.</p>}
            </Modal>
        </>
    );
};
