import React, { useEffect, useState } from 'react';
// FIX: Corrected the import for useNavigate from 'react-router-dom' to resolve module export errors.
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { diagnoseJWT, JWTDiagnostics } from '../lib/jwtUtils';
import { analyzeLoginHistory, detectLoginMethodFromUrl, generateLoginHistoryReport, getLoginHistory, recordLoginAttempt } from '../lib/loginTracker';
import { supabase } from '../lib/supabaseClient';

import { GuardianIcon } from './ui/icons';
import { Shield } from 'lucide-react';

// Maximum failed login attempts before adding delay
const MAX_FAILED_ATTEMPTS = 3;
const LOGIN_DELAY_MS = 2000; // 2 seconds delay after max attempts

export const Login: React.FC = () => {
    const [searchParams] = useSearchParams();
    const vertical = searchParams.get('vertical') || 'standard';
    const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [jwtDiagnostics, setJwtDiagnostics] = useState<JWTDiagnostics | null>(null);
    const [showJwtDebug, setShowJwtDebug] = useState(false);
    const [showLoginHistory, setShowLoginHistory] = useState(false);
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [isDelayed, setIsDelayed] = useState(false);
    const [sessionExpired, setSessionExpired] = useState(false);
    const navigate = useNavigate();

    // Log vertical info for debugging
    useEffect(() => {
        console.log('Signing up for vertical:', vertical);
    }, [vertical]);

    // Check if redirected due to session expiry
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('session_expired') === 'true') {
            setSessionExpired(true);
            toast.error('La tua sessione è scaduta. Effettua nuovamente il login.', {
                duration: 5000,
                id: 'session-expired'
            });
        }
    }, []);

    // Check JWT after login and detect login method
    useEffect(() => {
        const checkJWT = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                const diag = diagnoseJWT(session.access_token);
                setJwtDiagnostics(diag);

                // Detect login method from URL
                const loginMethod = detectLoginMethodFromUrl();

                // Record the login attempt
                recordLoginAttempt({
                    method: loginMethod,
                    timestamp: new Date().toISOString(),
                    email: session.user?.email,
                    success: true,
                    jwtHasUserRole: diag.hasUserRole,
                });

                // Auto-show debug info if there's a JWT issue
                if (!diag.hasUserRole && diag.isValid) {
                    setShowJwtDebug(true);
                    toast.error(`⚠️ TOKEN DEFECT: user_role mancante (Login method: ${loginMethod})`, {
                        duration: 8000,
                    });
                }
            }
        };

        checkJWT();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (_event === 'SIGNED_IN' && session?.access_token) {
                const diag = diagnoseJWT(session.access_token);
                setJwtDiagnostics(diag);

                const loginMethod = detectLoginMethodFromUrl();

                recordLoginAttempt({
                    method: loginMethod,
                    timestamp: new Date().toISOString(),
                    email: session.user?.email,
                    success: true,
                    jwtHasUserRole: diag.hasUserRole,
                });

                if (!diag.hasUserRole && diag.isValid) {
                    setShowJwtDebug(true);
                    toast.error(`⚠️ TOKEN DEFECT: user_role mancante (Login method: ${loginMethod})`, {
                        duration: 8000,
                    });
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleAuthAction = async (event: React.FormEvent) => {
        event.preventDefault();

        // Check if we need to add delay
        if (isDelayed) {
            toast.error('Troppi tentativi falliti. Attendi prima di riprovare.');
            return;
        }

        setLoading(true);
        setError(null);
        setMessage(null);

        if (mode === 'signIn') {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                // Generic error message - don't leak account information
                setError('Credenziali errate. Verifica email e password.');

                // Track failed attempts
                const newFailedAttempts = failedAttempts + 1;
                setFailedAttempts(newFailedAttempts);

                // Record failed login
                recordLoginAttempt({
                    method: 'password',
                    timestamp: new Date().toISOString(),
                    email: email,
                    success: false,
                    error: 'Credenziali errate',
                });

                // Add delay after max attempts
                if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
                    setIsDelayed(true);
                    toast.error(`Troppi tentativi falliti. Attendi ${LOGIN_DELAY_MS / 1000} secondi.`);
                    setTimeout(() => {
                        setIsDelayed(false);
                        setFailedAttempts(0);
                    }, LOGIN_DELAY_MS);
                }
            } else {
                // Reset failed attempts on successful login
                setFailedAttempts(0);
            }
            // Il successo del login viene gestito dal listener in App.tsx che naviga alla dashboard
        } else { // signUp
            const { data: authData, error } = await supabase.auth.signUp({ 
                email, 
                password,
                options: {
                    data: {
                        name: name || email.split('@')[0],
                        vertical: vertical,
                        user_role: 'user'
                    }
                }
            });
            
            if (error) {
                setError('Errore durante la registrazione. Riprova più tardi.');
            } else if (authData.user) {
                // Wait for confirmation, then create profile and organization
                setMessage('Registrazione avvenuta! Controlla la tua email per il link di conferma.');
                
                // Update profile with vertical information
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({ 
                        name: name || email.split('@')[0],
                        vertical: vertical,
                    })
                    .eq('id', authData.user.id);
                
                if (profileError) {
                    console.error('Error updating profile:', profileError);
                }
                
                // Create organization for this vertical
                const orgName = `${name || email.split('@')[0]}'s ${vertical === 'insurance' ? 'Agenzia' : 'Organizzazione'}`;
                const { data: org, error: orgError } = await supabase
                    .from('organizations')
                    .insert({
                        name: orgName,
                        vertical: vertical,
                    })
                    .select()
                    .single();

                if (!orgError && org) {
                    // Link user to organization
                    await supabase
                        .from('profiles')
                        .update({ organization_id: org.id })
                        .eq('id', authData.user.id);
                }
                
                setMode('signIn'); // Torna al login dopo la registrazione
            }
        }
        setLoading(false);
    };

    const toggleMode = () => {
        setMode(mode === 'signIn' ? 'signUp' : 'signIn');
        setError(null);
        setMessage(null);
    }

    const handleBackToHome = () => {
        navigate('/');
    };

    const handleDeepLogout = async () => {
        localStorage.clear();
        sessionStorage.clear();
        await supabase.auth.signOut();
        toast.success('Logout profondo completato. Riprova ad accedere.', { duration: 4000 });
        setJwtDiagnostics(null);
        setShowJwtDebug(false);
        window.location.reload();
    };

    const copyLoginHistory = () => {
        const report = generateLoginHistoryReport();
        navigator.clipboard.writeText(report);
        toast.success('Storico login copiato negli appunti!', { duration: 2000 });
    };

    const title = mode === 'signIn' ? 'Accedi a Guardian AI CRM' : 'Crea un nuovo account';
    const buttonText = mode === 'signIn' ? 'Accedi' : 'Registrati';
    const switchText = mode === 'signIn' ? "Non hai un account? Registrati" : "Hai già un account? Accedi";

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <GuardianIcon className="w-16 h-16 text-primary" />
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    {title}
                </h2>
                <button onClick={handleBackToHome} className="mt-2 text-center text-sm text-primary hover:text-indigo-500 w-full">
                    &larr; Torna alla Home
                </button>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {vertical === 'insurance' && mode === 'signUp' && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 text-blue-800">
                                <Shield className="w-5 h-5" />
                                <span className="font-medium">
                                    Stai creando un account per CRM Assicurazioni
                                </span>
                            </div>
                        </div>
                    )}
                    
                    {sessionExpired && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-semibold text-red-800">
                                        Sessione Scaduta o Non Valida
                                    </h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        <p>La tua sessione è scaduta o non valida. Effettua nuovamente il login con le tue credenziali.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <form className="space-y-6" onSubmit={handleAuthAction}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Indirizzo Email
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    placeholder="tua@email.com"
                                />
                            </div>
                        </div>

                        {mode === 'signUp' && (
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Nome e Cognome
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        autoComplete="name"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                        placeholder="Mario Rossi"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                />
                            </div>
                        </div>

                        {mode === 'signIn' && (
                            <div className="flex items-center justify-end">
                                <button
                                    type="button"
                                    onClick={() => navigate('/forgot-password')}
                                    className="text-sm font-medium text-primary hover:text-indigo-500"
                                >
                                    Password dimenticata?
                                </button>
                            </div>
                        )}

                        {message && <p className="text-green-600 text-xs text-center">{message}</p>}
                        {error && <p className="text-red-500 text-xs text-center">{error}</p>}

                        <div>
                            <button
                                type="submit"
                                disabled={loading || isDelayed}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Caricamento...' : buttonText}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <button onClick={toggleMode} className="font-medium text-primary hover:text-indigo-500">
                            {switchText}
                        </button>
                    </div>

                    {jwtDiagnostics && showJwtDebug && (
                        <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-500 rounded-lg">
                            <h3 className="font-bold text-yellow-800 mb-2">⚠️ TOKEN DEFECT RILEVATO</h3>
                            <div className="text-sm text-yellow-900 space-y-2">
                                <p><strong>user_role presente:</strong> {jwtDiagnostics.hasUserRole ? '✅ Sì' : '❌ No'}</p>
                                {jwtDiagnostics.claims?.user_role && (
                                    <p><strong>Ruolo attuale:</strong> <code className="bg-yellow-100 px-2 py-1 rounded">{jwtDiagnostics.claims.user_role}</code></p>
                                )}
                                {!jwtDiagnostics.hasUserRole && (
                                    <>
                                        <p className="font-semibold mt-2">📝 Azioni necessarie:</p>
                                        <ol className="list-decimal list-inside ml-2 space-y-1">
                                            <li>Effettua logout profondo (pulsante sotto)</li>
                                            <li>Effettua login solo da form email + password</li>
                                            <li>Non usare magic link o reset password</li>
                                        </ol>
                                        <button
                                            onClick={handleDeepLogout}
                                            className="mt-3 w-full bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600"
                                        >
                                            🔄 Esegui Logout Profondo
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => setShowJwtDebug(false)}
                                    className="mt-2 text-xs text-yellow-700 underline"
                                >
                                    Nascondi diagnostica
                                </button>
                            </div>
                        </div>
                    )}

                    {jwtDiagnostics && !showJwtDebug && !jwtDiagnostics.hasUserRole && (
                        <button
                            onClick={() => setShowJwtDebug(true)}
                            className="mt-4 w-full text-sm text-yellow-600 hover:text-yellow-800 underline"
                        >
                            ⚠️ Mostra diagnostica JWT
                        </button>
                    )}

                    {/* Login History Viewer */}
                    {getLoginHistory().length > 0 && (
                        <div className="mt-4">
                            {showLoginHistory ? (
                                <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-bold text-sm">📊 Storico Login</h4>
                                        <button
                                            onClick={() => setShowLoginHistory(false)}
                                            className="text-xs text-gray-600 hover:text-gray-800"
                                        >
                                            Nascondi
                                        </button>
                                    </div>
                                    <LoginHistoryView />
                                    <button
                                        onClick={copyLoginHistory}
                                        className="mt-2 w-full text-xs bg-gray-200 text-gray-800 px-3 py-2 rounded hover:bg-gray-300"
                                    >
                                        📋 Copia Report Completo
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowLoginHistory(true)}
                                    className="w-full text-xs text-gray-600 hover:text-gray-800 underline"
                                >
                                    📊 Visualizza storico login ({getLoginHistory().length} tentativi)
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper component to display login history
const LoginHistoryView: React.FC = () => {
    const history = getLoginHistory();
    const analysis = analyzeLoginHistory();

    return (
        <div className="text-xs space-y-2">
            <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="bg-white p-2 rounded">
                    <div className="text-gray-600">Totale</div>
                    <div className="font-bold">{analysis.totalAttempts}</div>
                </div>
                <div className="bg-white p-2 rounded">
                    <div className="text-gray-600">Successi</div>
                    <div className="font-bold text-green-600">{analysis.successfulLogins}</div>
                </div>
            </div>

            <div className="bg-white p-2 rounded">
                <div className="font-semibold mb-1">Per Metodo:</div>
                {Object.entries(analysis.methodBreakdown).map(([method, count]) => {
                    if (count === 0) { return null; }
                    const defects = analysis.jwtDefectsByMethod[method as keyof typeof analysis.jwtDefectsByMethod];
                    return (
                        <div key={method} className="flex justify-between text-xs">
                            <span>{method}:</span>
                            <span>
                                {count} {defects > 0 && <span className="text-red-600">({defects} JWT defect)</span>}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white p-2 rounded max-h-32 overflow-y-auto">
                <div className="font-semibold mb-1">Recenti:</div>
                {history.slice(0, 5).map((attempt, idx) => (
                    <div key={idx} className="text-xs mb-1 pb-1 border-b border-gray-200 last:border-0">
                        <div className="flex justify-between">
                            <span>{attempt.method}</span>
                            <span>{attempt.success ? '✅' : '❌'}</span>
                        </div>
                        <div className="text-gray-500">
                            {new Date(attempt.timestamp).toLocaleString('it-IT', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </div>
                        {attempt.jwtHasUserRole === false && (
                            <div className="text-red-600 font-semibold">⚠️ JWT defect</div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};