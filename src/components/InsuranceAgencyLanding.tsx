import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheckIcon, CheckCircleIcon } from './ui/icons';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { SEOHead } from './SEOHead';

export const InsuranceAgencyLanding: React.FC = () => {
    return (
        <div className="bg-white min-h-screen">
            <SEOHead 
                title="CRM per Agenti Assicurativi - Guardian AI"
                description="CRM specializzato per agenti e broker assicurativi. Gestione polizze, sinistri e clienti con AI nativa. Aumenta le vendite del 40% e riduci i tempi operativi del 60%."
                keywords="CRM assicurazioni, gestione polizze, CRM agenti assicurativi, CRM broker, gestione sinistri, automazione assicurativa"
                canonical="https://guardianacrm.com/verticals/insurance-agency"
            />
            <PublicHeader />

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-blue-50 to-blue-100 py-20">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-5xl font-bold text-gray-900 mb-6">
                            CRM per <span className="text-blue-600">Agenti Assicurativi</span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-8">
                            Gestisci clienti, polizze e sinistri con l&apos;intelligenza artificiale. 
                            Automazione completa per aumentare le vendite e ridurre i tempi operativi.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link 
                                to="/login" 
                                className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                            >
                                Prova Gratuita 14 Giorni
                            </Link>
                            <button className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition-colors">
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
                            Funzionalità Specifiche per Assicurazioni
                        </h2>
                        <p className="text-xl text-gray-600">
                            Tutto ciò che serve per gestire il tuo portafoglio clienti
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="bg-gray-50 p-8 rounded-xl">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Gestione Polizze</h3>
                            <p className="text-gray-600">
                                Registro completo di tutte le polizze, scadenze automatiche e rinnovi intelligenti
                            </p>
                        </div>

                        <div className="bg-gray-50 p-8 rounded-xl">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                                <CheckCircleIcon className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Gestione Sinistri</h3>
                            <p className="text-gray-600">
                                Tracciamento completo dei sinistri, documentazione automatica e follow-up
                            </p>
                        </div>

                        <div className="bg-gray-50 p-8 rounded-xl">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                                <CheckCircleIcon className="w-6 h-6 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Automazione Vendite</h3>
                            <p className="text-gray-600">
                                Lead scoring, campagne automatiche e follow-up intelligenti per clienti e prospect
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-20 bg-blue-50">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold text-gray-900 mb-4">
                                Risultati Garantiti
                            </h2>
                            <p className="text-xl text-gray-600">
                                I nostri clienti vedono risultati immediati
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                            <div className="bg-white p-8 rounded-xl shadow-sm">
                                <div className="text-4xl font-bold text-blue-600 mb-2">+40%</div>
                                <div className="text-gray-600">Vendite Polizze</div>
                            </div>
                            <div className="bg-white p-8 rounded-xl shadow-sm">
                                <div className="text-4xl font-bold text-blue-600 mb-2">-60%</div>
                                <div className="text-gray-600">Tempo Gestione Sinistri</div>
                            </div>
                            <div className="bg-white p-8 rounded-xl shadow-sm">
                                <div className="text-4xl font-bold text-blue-600 mb-2">+25%</div>
                                <div className="text-gray-600">Retention Clienti</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 bg-blue-600 text-white">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-4xl font-bold mb-6">
                        Pronto a Trasformare la Tua Agenzia?
                    </h2>
                    <p className="text-xl mb-8 opacity-90">
                        Inizia oggi e vedrai i risultati in poche settimane
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link 
                            to="/login"
                            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                        >
                            Inizia Gratis Ora
                        </Link>
                        <Link 
                            to="/pricing"
                            className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
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