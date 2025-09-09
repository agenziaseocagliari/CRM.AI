
import React, { useState } from 'react';
import { GuardianIcon } from './ui/icons';
import { supabase } from '../lib/supabaseClient';

interface LoginProps {
    onBackToHome: () => void;
}

type AuthMode = 'signIn' | 'signUp';

export const Login: React.FC<LoginProps> = ({ onBackToHome }) => {
    const [mode, setMode] = useState<AuthMode>('signIn');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleAuthAction = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        if (mode === 'signIn') {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) setError(error.message);
            // Il successo del login viene gestito dal listener in App.tsx
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
                <button onClick={onBackToHome} className="mt-2 text-center text-sm text-primary hover:text-indigo-500 w-full">
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
                </div>
            </div>
        </div>
    );
};