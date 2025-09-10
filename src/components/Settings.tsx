import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useCrmData } from '../hooks/useCrmData';
import toast from 'react-hot-toast';

const SettingsCard: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
    <div className="bg-card shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
            <p className="text-sm text-text-secondary mt-1">{description}</p>
        </div>
        <div className="p-6">
            {children}
        </div>
    </div>
);


export const Settings: React.FC = () => {
    const { organization, refetch: refetchData } = useOutletContext<ReturnType<typeof useCrmData>>();

    // User state
    const [userEmail, setUserEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordSaving, setIsPasswordSaving] = useState(false);

    // Organization state
    const [organizationName, setOrganizationName] = useState(organization?.name || '');
    const [isOrgSaving, setIsOrgSaving] = useState(false);
    
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUserEmail(user?.email || 'Email non disponibile');
        };
        fetchUser();
    }, []);

    useEffect(() => {
        setOrganizationName(organization?.name || '');
    }, [organization]);

    const handleUpdateOrganization = (e: React.FormEvent) => {
        e.preventDefault();
        if (!organization || !organizationName.trim()) {
            toast.error("Il nome dell'organizzazione non può essere vuoto.");
            return;
        }
        setIsOrgSaving(true);
        
        const updatePromise = (async () => {
            const { error } = await supabase
                .from('organizations')
                .update({ name: organizationName.trim() })
                .eq('id', organization.id);
            if (error) {
                throw error;
            }
        })();

        toast.promise(updatePromise, {
            loading: 'Salvataggio in corso...',
            success: () => {
                refetchData();
                setIsOrgSaving(false);
                return 'Organizzazione aggiornata!';
            },
            error: (err) => {
                setIsOrgSaving(false);
                return `Errore: ${err.message}`;
            },
        });
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("Le password non coincidono.");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("La password deve essere di almeno 6 caratteri.");
            return;
        }
        setIsPasswordSaving(true);
        
        const updatePromise = supabase.auth.updateUser({ password: newPassword });

        toast.promise(updatePromise, {
            loading: 'Aggiornamento password...',
            success: () => {
                setNewPassword('');
                setConfirmPassword('');
                setIsPasswordSaving(false);
                return 'Password aggiornata con successo!';
            },
            error: (err) => {
                setIsPasswordSaving(false);
                return `Errore: ${err.message}`;
            }
        });
    };


    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-text-primary">Impostazioni</h1>

            {/* Organization Settings */}
            <SettingsCard
                title="Organizzazione"
                description="Modifica le informazioni della tua organizzazione."
            >
                <form onSubmit={handleUpdateOrganization} className="space-y-4">
                    <div>
                        <label htmlFor="orgName" className="block text-sm font-medium text-gray-700">Nome Organizzazione</label>
                        <input
                            type="text"
                            id="orgName"
                            value={organizationName}
                            onChange={(e) => setOrganizationName(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" disabled={isOrgSaving} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">
                           {isOrgSaving ? 'Salvataggio...' : 'Salva Modifiche'}
                        </button>
                    </div>
                </form>
            </SettingsCard>

            {/* User Profile Settings */}
            <SettingsCard
                title="Profilo Utente"
                description="Gestisci le impostazioni del tuo account."
            >
                 <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={userEmail}
                            disabled
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">Nuova Password</label>
                        <input
                            type="password"
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Lascia vuoto per non modificare"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                    </div>
                     <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Conferma Nuova Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" disabled={isPasswordSaving || !newPassword} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">
                            {isPasswordSaving ? 'Salvataggio...' : 'Cambia Password'}
                        </button>
                    </div>
                </form>
            </SettingsCard>
        </div>
    );
};