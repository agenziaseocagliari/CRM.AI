import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GuardianIcon } from './ui/icons';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

export const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    // Extract token from URL
    const token = searchParams.get('token') || searchParams.get('access_token');

    useEffect(() => {
        // Check if we have a valid token
        if (!token) {
            toast.error('Link non valido o scaduto. Richiedi un nuovo link di reset.');
            setTimeout(() => navigate('/forgot-password'), 2000);
        }
    }, [token, navigate]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        // Validate passwords match
        if (password !== confirmPassword) {
            toast.error('Le password non coincidono.');
            return;
        }

        // Validate password strength
        if (password.length < 8) {
            toast.error('La password deve contenere almeno 8 caratteri.');
            return;
        }

        setLoading(true);

        try {
            // Update the user's password using the recovery token
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) {
                console.error('Password reset error:', error);
                toast.error('Errore durante il reset della password. Il link potrebbe essere scaduto.');
            } else {
                setSuccess(true);
                toast.success('Password aggiornata con successo! Reindirizzamento in corso...');
                
                // Redirect to dashboard after successful password reset
                // The user should be automatically logged in after password reset
                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);
            }
        } catch (error) {
            console.error('Password reset error:', error);
            toast.error('Si è verificato un errore. Riprova più tardi.');
        } finally {
            setLoading(false);
        }
    };

    const handleBackToLogin = () => {
        navigate('/login');
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="flex justify-center">
                        <GuardianIcon className="w-16 h-16 text-primary" />
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Password Aggiornata!
                    </h2>
                </div>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                        <div className="text-center space-y-4">
                            <div className="text-6xl">✅</div>
                            <p className="text-gray-700">
                                La tua password è stata aggiornata con successo.
                            </p>
                            <p className="text-sm text-gray-600">
                                Verrai reindirizzato alla dashboard automaticamente...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="flex justify-center">
                        <GuardianIcon className="w-16 h-16 text-primary" />
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Link Non Valido
                    </h2>
                </div>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                        <div className="text-center space-y-4">
                            <div className="text-6xl">⚠️</div>
                            <p className="text-gray-700">
                                Il link di reset password non è valido o è scaduto.
                            </p>
                            <button
                                onClick={() => navigate('/forgot-password')}
                                className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                            >
                                Richiedi Nuovo Link
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
                    Imposta Nuova Password
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Inserisci la tua nuova password
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Nuova Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    minLength={8}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    placeholder="Almeno 8 caratteri"
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                La password deve contenere almeno 8 caratteri
                            </p>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Conferma Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    minLength={8}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    placeholder="Ripeti la password"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                            >
                                {loading ? 'Aggiornamento in corso...' : 'Aggiorna Password'}
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
