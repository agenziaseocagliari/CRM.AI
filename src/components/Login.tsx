import React, { useState, useEffect } from 'react';
// FIX: Corrected the import for useNavigate from 'react-router-dom' to resolve module export errors.
import { useNavigate } from 'react-router-dom';
import { GuardianIcon } from './ui/icons';
import { supabase } from '../lib/supabaseClient';
import { diagnoseJWT, JWTDiagnostics } from '../lib/jwtUtils';
import toast from 'react-hot-toast';

export const Login: React.FC = () => {
    const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [jwtDiagnostics, setJwtDiagnostics] = useState<JWTDiagnostics | null>(null);
    const [showJwtDebug, setShowJwtDebug] = useState(false);
    const navigate = useNavigate();

    // Check JWT after login
    useEffect(() => {
        const checkJWT = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                const diag = diagnoseJWT(session.access_token);
                setJwtDiagnostics(diag);
                
                // Auto-show debug info if there's a JWT issue
                if (!diag.hasUserRole && diag.isValid) {
                    setShowJwtDebug(true);
                    toast.error('⚠️ TOKEN DEFECT: user_role mancante nel JWT', {
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
                
                if (!diag.hasUserRole && diag.isValid) {
                    setShowJwtDebug(true);
                    toast.error('⚠️ TOKEN DEFECT: user_role mancante nel JWT', {
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
            if (error) setError(error.message);
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
        window.location.reload();
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
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
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
                </div>
            </div>
        </div>
    );
};