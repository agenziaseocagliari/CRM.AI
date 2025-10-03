import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from '../../contexts/AuthContext';
import { useSuperAdminData } from '../../hooks/useSuperAdminData';
import { supabase } from '../../lib/supabaseClient';
import { UserCircleIcon, SunIcon, MoonIcon, BellIcon, SparklesIcon, CheckCircleIcon, LogoutIcon, SettingsIcon } from '../ui/icons';
import { Modal } from '../ui/Modal';

import { diagnosticLogger } from '../../lib/mockDiagnosticLogger';
const NotificationPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { notifications } = useSuperAdminData();
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'AI Recommendation': return <SparklesIcon className="w-5 h-5 text-purple-500" />;
            case 'System Alert': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
            default: return <InfoIcon className="w-5 h-5 text-gray-500" />;
        }
    };

    return (
        <div ref={panelRef} className="absolute right-0 mt-2 w-80 bg-card dark:bg-dark-card rounded-md shadow-lg border dark:border-gray-600 z-10">
            <div className="p-3 border-b dark:border-gray-600">
                <h3 className="font-semibold text-text-primary dark:text-dark-text-primary">Notifiche</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="p-4 text-center text-text-secondary dark:text-dark-text-secondary text-sm">
                        Nessuna notifica
                    </div>
                ) : (
                    notifications.map(n => (
                        <div key={n.id} className="p-3 flex items-start space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <div className="flex-shrink-0 mt-1">{getIcon(n.type)}</div>
                            <div>
                                <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{n.message}</p>
                                <p className="text-xs text-text-secondary dark:text-dark-text-secondary">{new Date(n.timestamp).toLocaleString()}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const AccountMenu: React.FC<{ onClose: () => void; onOpenSettings: () => void; onLogout: () => void }> = ({ onClose, onOpenSettings, onLogout }) => {
    const { userEmail, userRole } = useAuth();
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div ref={menuRef} className="absolute right-0 mt-2 w-64 bg-card dark:bg-dark-card rounded-md shadow-lg border dark:border-gray-600 z-10">
            <div className="p-3 border-b dark:border-gray-600">
                <p className="font-semibold text-text-primary dark:text-dark-text-primary text-sm">{userEmail}</p>
                <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                    {userRole === 'super_admin' ? 'ðŸ” Super Admin' : userRole}
                </p>
            </div>
            <div className="py-1">
                <button
                    onClick={() => {
                        onClose();
                        onOpenSettings();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-text-primary dark:text-dark-text-primary hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                >
                    <SettingsIcon className="w-4 h-4" />
                    <span>Impostazioni Account</span>
                </button>
                <button
                    onClick={onLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                >
                    <LogoutIcon className="w-4 h-4" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export const SuperAdminHeader: React.FC = () => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [isNotificationsOpen, setNotificationsOpen] = useState(false);
    const [isAccountMenuOpen, setAccountMenuOpen] = useState(false);
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const { userEmail, userRole } = useAuth();

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        setAccountMenuOpen(false);
        
        try {
            diagnosticLogger.info('ðŸ‘‹ [SuperAdminHeader] Initiating logout...');
            
            // Show loading toast
            const loadingToast = toast.loading('Disconnessione in corso...');
            
            // Clear all local storage and session storage
            localStorage.clear();
            sessionStorage.clear();
            
            // Sign out from Supabase
            const { error } = await supabase.auth.signOut();
            
            if (error) {
                diagnosticLogger.error('âŒ [SuperAdminHeader] Logout error:', error);
                toast.error('Errore durante il logout: ' + error.message, { id: loadingToast });
            } else {
                diagnosticLogger.info('âœ… [SuperAdminHeader] Logout successful');
                toast.success('Disconnessione avvenuta con successo', { id: loadingToast });
                // Navigation will be handled by AuthContext
            }
        } catch (error) {
            diagnosticLogger.error('âŒ [SuperAdminHeader] Unexpected logout error:', error);
            toast.error('Errore imprevisto durante il logout');
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <>
            <header className="bg-card dark:bg-dark-card shadow-sm p-4 flex justify-between items-center z-10">
                <h1 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">AI Ops & Admin Panel</h1>
                
                <div className="flex items-center space-x-2">
                    <div className="relative">
                        <button 
                            onClick={() => setNotificationsOpen(o => !o)} 
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 relative"
                            title="Notifiche"
                        >
                            <BellIcon className="w-6 h-6 text-gray-500 dark:text-gray-300" />
                            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-dark-card" />
                        </button>
                        {isNotificationsOpen && <NotificationPanel onClose={() => setNotificationsOpen(false)} />}
                    </div>

                    <button 
                        onClick={toggleTheme} 
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
                        title="Cambia tema"
                    >
                        {theme === 'light' ? 
                            <MoonIcon className="w-6 h-6 text-gray-500 dark:text-gray-300" /> : 
                            <SunIcon className="w-6 h-6 text-gray-500 dark:text-gray-300" />
                        }
                    </button>
                    
                    <div className="relative">
                        <button 
                            onClick={() => setAccountMenuOpen(o => !o)} 
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50"
                            title="Account"
                            disabled={isLoggingOut}
                        >
                            <UserCircleIcon className="w-8 h-8 text-gray-500 dark:text-gray-300" />
                        </button>
                        {isAccountMenuOpen && (
                            <AccountMenu 
                                onClose={() => setAccountMenuOpen(false)} 
                                onOpenSettings={() => setSettingsOpen(true)}
                                onLogout={handleLogout}
                            />
                        )}
                    </div>
                </div>
            </header>

            {/* Account Settings Modal */}
            <Modal
                isOpen={isSettingsOpen}
                onClose={() => setSettingsOpen(false)}
                title="Impostazioni Account"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={userEmail || ''}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                        />
                        <p className="mt-1 text-xs text-gray-500">L'email non puÃ² essere modificata</p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ruolo</label>
                        <input
                            type="text"
                            value={userRole === 'super_admin' ? 'ðŸ” Super Admin' : userRole || ''}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                        />
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-2">Preferenze</h4>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-sm text-gray-700">Tema</span>
                            <button
                                onClick={toggleTheme}
                                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                            >
                                {theme === 'light' ? 'â˜€ï¸ Chiaro' : 'ðŸŒ™ Scuro'}
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                            ðŸ’¡ Per ulteriori impostazioni avanzate, contatta il supporto tecnico.
                        </p>
                    </div>
                </div>
            </Modal>
        </>
    );
};

// Dummy icon to avoid breaking changes if it's not present in the main icons file
const InfoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
);

