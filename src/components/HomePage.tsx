import React from 'react';
// FIX: Corrected the import for Link from 'react-router-dom' to resolve module export errors.
import { Link } from 'react-router-dom';
import { GuardianIcon, BrainCircuitIcon, ClipboardDataIcon, MessageBotIcon } from './ui/icons';

export const HomePage: React.FC = () => {
    return (
        <div className="bg-white text-gray-800">
            {/* Header */}
            <header className="container mx-auto px-6 py-4 flex justify-between items-center">
                <div className="flex items-center">
                    <GuardianIcon className="w-8 h-8 text-primary" />
                    <h1 className="text-xl font-bold ml-2">Guardian AI CRM</h1>
                </div>
                <nav className="space-x-4">
                    <Link to="/login" className="bg-primary text-white px-5 py-2 rounded-md hover:bg-indigo-700 font-semibold">
                        Accedi
                    </Link>
                </nav>
            </header>

            {/* Hero Section */}
            <main className="container mx-auto px-6 py-20 text-center">
                <h2 className="text-5xl font-extrabold text-text-primary">
                    Il CRM Potenziato dall'AI per la Tua Crescita
                </h2>
                <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
                    Guardian AI automatizza le tue vendite, gestisce i contatti e ottimizza la tua pipeline con la potenza dell'intelligenza artificiale.
                </p>
                <Link to="/login" className="mt-8 inline-block bg-primary text-white px-8 py-4 rounded-lg hover:bg-indigo-700 font-bold text-lg">
                    Inizia la Prova Gratuita
                </Link>
            </main>

            {/* Features Section */}
            <section className="bg-background py-20">
                <div className="container mx-auto px-6">
                    <h3 className="text-3xl font-bold text-center mb-12">Funzionalità Principali</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-lg shadow-md text-center">
                            <BrainCircuitIcon className="w-12 h-12 text-primary mx-auto mb-4" />
                            <h4 className="text-xl font-semibold mb-2">Lead Scoring Intelligente</h4>
                            <p className="text-text-secondary">L'AI analizza e qualifica i tuoi lead, permettendoti di concentrarti sulle opportunità migliori.</p>
                        </div>
                        <div className="bg-white p-8 rounded-lg shadow-md text-center">
                            <MessageBotIcon className="w-12 h-12 text-primary mx-auto mb-4" />
                            <h4 className="text-xl font-semibold mb-2">Comunicazione Assistita</h4>
                            <p className="text-text-secondary">Genera email e messaggi WhatsApp efficaci in pochi secondi con l'aiuto dei nostri modelli AI.</p>
                        </div>
                        <div className="bg-white p-8 rounded-lg shadow-md text-center">
                            <ClipboardDataIcon className="w-12 h-12 text-primary mx-auto mb-4" />
                            <h4 className="text-xl font-semibold mb-2">Gestione Pipeline Semplificata</h4>
                            <p className="text-text-secondary">Visualizza e gestisci le tue opportunità di vendita con una pipeline Kanban intuitiva.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-sidebar text-white py-8">
                <div className="container mx-auto px-6 text-center">
                     <div className="flex justify-center space-x-6 mb-4">
                        <Link to="/privacy-policy" className="hover:underline">Privacy Policy</Link>
                        <Link to="/terms-of-service" className="hover:underline">Termini di Servizio</Link>
                    </div>
                    <p>&copy; {new Date().getFullYear()} Guardian AI CRM. Tutti i diritti riservati.</p>
                </div>
            </footer>
        </div>
    );
};