import React from 'react';
import { Link } from 'react-router-dom';
import { GuardianIcon } from './ui/icons';

export const TermsOfService: React.FC = () => {
    return (
        <div className="bg-background min-h-screen">
            <header className="bg-white shadow-sm border-b">
                <div className="container mx-auto px-6 py-4">
                    <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity w-fit">
                        <GuardianIcon className="w-8 h-8 text-primary" />
                        <span className="text-xl font-bold text-text-primary">Guardian AI CRM</span>
                    </Link>
                </div>
            </header>
            <main className="container mx-auto px-6 py-12">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-text-primary mb-6">Termini e Condizioni del Servizio</h1>
                    <div className="space-y-4 text-text-secondary">
                        <p><strong>Ultimo aggiornamento:</strong> 11 settembre 2025</p>
                        <h2 className="text-xl font-semibold text-text-primary mt-6 mb-3">1. Accettazione dei Termini</h2>
                        <p>I presenti Termini e Condizioni disciplinano l&apos;utilizzo di Guardian AI CRM.</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TermsOfService;
