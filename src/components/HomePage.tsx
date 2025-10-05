import React from 'react';
import { Link } from 'react-router-dom';
import { GuardianIcon } from './ui/icons';

export const HomePage: React.FC = () => {
    return (
        <div className="bg-white min-h-screen">
            <header className="border-b bg-white shadow-sm">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center">
                        <GuardianIcon className="w-8 h-8 text-primary" />
                        <h1 className="text-xl font-bold ml-2">Guardian AI CRM</h1>
                    </div>
                    <nav className="flex space-x-6">
                        <Link to="/pricing" className="text-gray-700 hover:text-primary">Prezzi</Link>
                        <Link to="/verticals/insurance-agency" className="text-blue-600 hover:text-blue-800">🛡️ Assicurazioni</Link>
                        <Link to="/verticals/marketing-agency" className="text-purple-600 hover:text-purple-800">📊 Marketing</Link>
                        <Link to="/login" className="bg-primary text-white px-4 py-2 rounded">Accedi</Link>
                    </nav>
                </div>
            </header>
            <main className="container mx-auto px-6 py-16 text-center">
                <h2 className="text-4xl font-bold mb-6">Guardian AI CRM</h2>
                <p className="text-xl text-gray-600 mb-8">La soluzione CRM completa per ogni settore</p>
                <div className="flex justify-center space-x-4">
                    <Link to="/login" className="bg-primary text-white px-8 py-3 rounded-lg">Inizia Ora</Link>
                    <Link to="/pricing" className="border-2 border-primary text-primary px-8 py-3 rounded-lg">Prezzi</Link>
                </div>
            </main>
        </div>
    );
};
