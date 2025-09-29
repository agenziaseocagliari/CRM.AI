import React, { useState, useEffect, useRef } from 'react';
import { UserCircleIcon, SunIcon, MoonIcon, BellIcon, SparklesIcon, CheckCircleIcon } from '../ui/icons';
import { useSuperAdminData } from '../../hooks/useSuperAdminData';

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
                {notifications.map(n => (
                    <div key={n.id} className="p-3 flex items-start space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="flex-shrink-0 mt-1">{getIcon(n.type)}</div>
                        <div>
                            <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{n.message}</p>
                            <p className="text-xs text-text-secondary dark:text-dark-text-secondary">{new Date(n.timestamp).toLocaleString()}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


export const SuperAdminHeader: React.FC = () => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [isNotificationsOpen, setNotificationsOpen] = useState(false);

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

    return (
        <header className="bg-card dark:bg-dark-card shadow-sm p-4 flex justify-between items-center z-10">
            <h1 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">AI Ops & Admin Panel</h1>
            
            <div className="flex items-center space-x-2">
                <div className="relative">
                    <button onClick={() => setNotificationsOpen(o => !o)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 relative">
                        <BellIcon className="w-6 h-6 text-gray-500 dark:text-gray-300" />
                        <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-dark-card"></span>
                    </button>
                    {isNotificationsOpen && <NotificationPanel onClose={() => setNotificationsOpen(false)} />}
                </div>

                <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600">
                    {theme === 'light' ? 
                        <MoonIcon className="w-6 h-6 text-gray-500 dark:text-gray-300" /> : 
                        <SunIcon className="w-6 h-6 text-gray-500 dark:text-gray-300" />
                    }
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600">
                    <UserCircleIcon className="w-8 h-8 text-gray-500 dark:text-gray-300" />
                </button>
            </div>
        </header>
    );
};

// Dummy icon to avoid breaking changes if it's not present in the main icons file
const InfoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
);
