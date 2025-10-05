import React from 'react';
import { Link } from 'react-router-dom';
import { SparklesIcon, CheckCircleIcon } from './ui/icons';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { SEOHead } from './SEOHead';

export const MarketingAgencyLanding: React.FC = () => {
    return (
        <div className="bg-white min-h-screen">
            <SEOHead 
                title="CRM per Agenzie Marketing - Guardian AI"
                description="CRM specializzato per agenzie marketing. Campagne automatizzate multi-canale, lead scoring AI e analytics predittivi. Aumenta la qualità dei lead del 65% e il ROI dell'80%."
                keywords="CRM marketing, automazione campagne, lead scoring AI, CRM agenzie marketing, analytics predittivi, gestione campagne"
                canonical="https://guardianacrm.com/verticals/marketing-agency"
            />
            <PublicHeader />

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-purple-50 to-purple-100 py-20">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-5xl font-bold text-gray-900 mb-6">
                            CRM per <span className="text-purple-600">Agenzie Marketing</span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-8">
                            Automazione completa delle campagne, lead scoring intelligente e analytics predittivi. 
                            Scala il tuo business con l&apos;AI nativa.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link 
                                to="/login" 
                                className="bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                            >
                                Prova Gratuita 14 Giorni
                            </Link>
                            <button className="border-2 border-purple-600 text-purple-600 px-8 py-4 rounded-lg font-semibold hover:bg-purple-600 hover:text-white transition-colors">
                                Richiedi Demo
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Funzionalità per Agenzie Marketing
                        </h2>
                        <p className="text-xl text-gray-600">
                            Tutto il necessario per gestire clienti e campagne
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="bg-gray-50 p-8 rounded-xl">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                                <SparklesIcon className="w-6 h-6 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Campagne Automatizzate</h3>
                            <p className="text-gray-600">
                                Gestione multi-canale delle campagne con ottimizzazione AI in tempo reale
                            </p>
                        </div>

                        <div className="bg-gray-50 p-8 rounded-xl">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                                <CheckCircleIcon className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Lead Scoring AI</h3>
                            <p className="text-gray-600">
                                Valutazione automatica dei prospect con algoritmi di machine learning
                            </p>
                        </div>

                        <div className="bg-gray-50 p-8 rounded-xl">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                <CheckCircleIcon className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Analytics Predittivi</h3>
                            <p className="text-gray-600">
                                Previsioni accurate su ROI, conversioni e performance delle campagne
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-20 bg-purple-50">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold text-gray-900 mb-4">
                                Risultati Misurabili
                            </h2>
                            <p className="text-xl text-gray-600">
                                Le agenzie che usano Guardian AI vedono risultati straordinari
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                            <div className="bg-white p-8 rounded-xl shadow-sm">
                                <div className="text-4xl font-bold text-purple-600 mb-2">+65%</div>
                                <div className="text-gray-600">Lead Quality</div>
                            </div>
                            <div className="bg-white p-8 rounded-xl shadow-sm">
                                <div className="text-4xl font-bold text-purple-600 mb-2">-50%</div>
                                <div className="text-gray-600">Tempo Gestione Campagne</div>
                            </div>
                            <div className="bg-white p-8 rounded-xl shadow-sm">
                                <div className="text-4xl font-bold text-purple-600 mb-2">+80%</div>
                                <div className="text-gray-600">ROI Campagne</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 bg-purple-600 text-white">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-4xl font-bold mb-6">
                        Pronto a Potenziare la Tua Agenzia?
                    </h2>
                    <p className="text-xl mb-8 opacity-90">
                        Unisciti alle agenzie che stanno già trasformando il marketing con l&apos;AI
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link 
                            to="/login"
                            className="bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                        >
                            Inizia Gratis Ora
                        </Link>
                        <Link 
                            to="/pricing"
                            className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors"
                        >
                            Vedi Prezzi
                        </Link>
                    </div>
                </div>
            </section>

            <PublicFooter />
        </div>
    );
};