import React, { useState, useEffect } from 'react';
// FIX: Corrected the import for useNavigate from 'react-router-dom' to resolve module export errors.
import { useNavigate } from 'react-router-dom';
import { GuardianIcon } from './ui/icons';
import { supabase } from '../lib/supabaseClient';
import { diagnoseJWT, JWTDiagnostics } from '../lib/jwtUtils';
import { recordLoginAttempt, detectLoginMethodFromUrl, getLoginHistory, analyzeLoginHistory, generateLoginHistoryReport } from '../lib/loginTracker';
import toast from 'react-hot-toast';

// Predefined accounts for explicit selection
const PREDEFINED_ACCOUNTS = [
    { 
        email: 'webproseoid@gmail.com', 
        label: 'Utente Standard',
        description: 'Accesso normale al CRM',
        icon: '👤'
    },
    { 
        email: 'agenziaseocagliari@gmail.com', 
        label: 'Super Admin',
        description: 'Accesso amministratore completo',
        icon: '🔐'
    }
];

export const Login: React.FC = () => {
    const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
    const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [jwtDiagnostics, setJwtDiagnostics] = useState<JWTDiagnostics | null>(null);
    const [showJwtDebug, setShowJwtDebug] = useState(false);
    const [showLoginHistory, setShowLoginHistory] = useState(false);
    const navigate = useNavigate();

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
        setLoading(true);
        setError(null);
        setMessage(null);

        if (mode === 'signIn') {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                setError(error.message);
                // Record failed login
                recordLoginAttempt({
                    method: 'password',
                    timestamp: new Date().toISOString(),
                    email: email,
                    success: false,
                    error: error.message,
                });
            }
            // Il successo del login viene gestito dal listener in App.tsx che naviga alla dashboard
        } else { // signUp
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) {
                setError(error.message);
            } else {
                setMessage('Registrazione avvenuta! Controlla la tua email per il link di conferma.');
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
        setSelectedAccount(null); // Reset account selection
        window.location.reload();
    };
    
    const handleAccountSelect = (accountEmail: string) => {
        setSelectedAccount(accountEmail);
        setEmail(accountEmail);
        setError(null);
        setMessage(null);
    };
    
    const handleBackToSelection = () => {
        setSelectedAccount(null);
        setEmail('');
        setPassword('');
        setError(null);
        setMessage(null);
    };
    
    const copyLoginHistory = () => {
        const report = generateLoginHistoryReport();
        navigator.clipboard.writeText(report);
        toast.success('Storico login copiato negli appunti!', { duration: 2000 });
    };

    const title = mode === 'signIn' ? 'Accedi a Guardian AI CRM' : 'Crea un nuovo account';
    const buttonText = mode === 'signIn' ? 'Accedi' : 'Registrati';
    const switchText = mode === 'signIn' ? "Non hai un account? Registrati" : "Hai già un account? Accedi";
    
    // Show account selection only for sign in mode and when no account is selected
    const showAccountSelection = mode === 'signIn' && !selectedAccount;

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
                    {showAccountSelection ? (
                        // Account Selection View
                        <div className="space-y-4">
                            <div className="text-center mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Seleziona il tipo di account
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Scegli l'account con cui vuoi accedere
                                </p>
                            </div>
                            
                            {/* Account Selection Cards */}
                            <div className="space-y-3">
                                {PREDEFINED_ACCOUNTS.map((account) => (
                                    <button
                                        key={account.email}
                                        onClick={() => handleAccountSelect(account.email)}
                                        className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left group"
                                    >
                                        <div className="flex items-start space-x-3">
                                            <span className="text-2xl">{account.icon}</span>
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900 group-hover:text-primary">
                                                    {account.label}
                                                </div>
                                                <div className="text-sm text-gray-600 mt-1">
                                                    {account.description}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1 font-mono">
                                                    {account.email}
                                                </div>
                                            </div>
                                            <svg 
                                                className="w-6 h-6 text-gray-400 group-hover:text-primary" 
                                                fill="none" 
                                                viewBox="0 0 24 24" 
                                                stroke="currentColor"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            
                            {/* Info Banner */}
                            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-start space-x-2">
                                    <span className="text-blue-600 text-lg">ℹ️</span>
                                    <div className="text-sm text-blue-800">
                                        <p className="font-semibold mb-1">Policy di cambio ruolo:</p>
                                        <ul className="list-disc list-inside space-y-1 text-xs">
                                            <li>Per cambiare ruolo occorre logout completo</li>
                                            <li>Quindi effettuare login con l'account specifico</li>
                                            <li>I ruoli sono legati all'account email utilizzato</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-6 text-center text-sm">
                                <button onClick={toggleMode} className="font-medium text-primary hover:text-indigo-500">
                                    {switchText}
                                </button>
                            </div>
                        </div>
                    ) : (
                        // Login Form View (existing form)
                        <>
                            {mode === 'signIn' && selectedAccount && (
                                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-lg">
                                                {PREDEFINED_ACCOUNTS.find(a => a.email === selectedAccount)?.icon}
                                            </span>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-900">
                                                    {PREDEFINED_ACCOUNTS.find(a => a.email === selectedAccount)?.label}
                                                </div>
                                                <div className="text-xs text-gray-600 font-mono">
                                                    {selectedAccount}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleBackToSelection}
                                            className="text-xs text-primary hover:text-indigo-500 underline"
                                        >
                                            Cambia
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            <form className="space-y-6" onSubmit={handleAuthAction}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Indirizzo email
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
                                    disabled={mode === 'signIn' && !!selectedAccount}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>

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
                        
                        {message && <p className="text-green-600 text-xs text-center">{message}</p>}
                        {error && <p className="text-red-500 text-xs text-center">{error}</p>}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
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
                    </> 
                    )}
                    
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
                    if (count === 0) return null;
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