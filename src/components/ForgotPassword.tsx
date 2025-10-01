import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GuardianIcon } from './ui/icons';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

export const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/login`,
            });

            if (error) {
                // Generic message - don't leak if account exists or not
                toast.error('Si è verificato un errore. Riprova più tardi.');
                console.error('Password reset error:', error);
            } else {
                setSubmitted(true);
                toast.success('Controlla la tua email per le istruzioni di reset.');
            }
        } catch (error) {
            toast.error('Si è verificato un errore. Riprova più tardi.');
            console.error('Password reset error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBackToLogin = () => {
        navigate('/login');
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="flex justify-center">
                        <GuardianIcon className="w-16 h-16 text-primary" />
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Email Inviata
                    </h2>
                </div>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                        <div className="text-center space-y-4">
                            <div className="text-6xl">📧</div>
                            <p className="text-gray-700">
                                Se l'indirizzo email è registrato nel sistema, riceverai un link per reimpostare la password.
                            </p>
                            <p className="text-sm text-gray-600">
                                Controlla anche la cartella spam se non vedi l'email.
                            </p>
                            <button
                                onClick={handleBackToLogin}
                                className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                            >
                                Torna al Login
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <GuardianIcon className="w-16 h-16 text-primary" />
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Password Dimenticata
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Inserisci la tua email per ricevere le istruzioni di reset
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
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

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                            >
                                {loading ? 'Invio in corso...' : 'Invia Link di Reset'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={handleBackToLogin}
                            className="text-sm font-medium text-primary hover:text-indigo-500"
                        >
                            &larr; Torna al Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
