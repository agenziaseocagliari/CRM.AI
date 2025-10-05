/**
 * GUARDIAN AI CRM - INSURANCE AGENCY LANDING PAGE
 * Landing page specifica per Agenzie Assicurative con prezzi competitivi
 * Data: 2025-10-05
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { COMPETITIVE_PRICING } from '../../lib/verticalAccounts/competitivePricing';

const InsuranceAgencyLandingPage: React.FC = () => {
  const pricing = COMPETITIVE_PRICING.insurance_agency;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🛡️</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Guardian AI CRM</h1>
                <p className="text-sm text-blue-600">per Agenzie Assicurative</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                to="/login" 
                className="text-gray-600 hover:text-gray-900"
              >
                Accedi
              </Link>
              <Link 
                to="/register?account_type=insurance_agency"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Prova Gratis 30 Giorni
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-8">
              🚀 LANCIO SPECIALE: Sconto fino al 50% per i primi 6 mesi
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Il CRM per Agenzie <br />
              <span className="text-blue-600">Assicurative</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Aumenta le vendite, automatizza i rinnovi e migliora la soddisfazione dei clienti 
              con l'unico CRM progettato specificamente per le Agenzie Assicurative italiane.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/register?account_type=insurance_agency"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Inizia Gratis Oggi
              </Link>
              <Link 
                to="/demo"
                className="border border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Richiedi Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tutto quello che serve alla tua Agenzia
            </h2>
            <p className="text-xl text-gray-600">
              Funzionalità specifiche per il settore assicurativo
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Gestione Polizze</h3>
              <p className="text-gray-600">
                Traccia tutte le polizze, scadenze e rinnovi automatici
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📞</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Comunicazione Multi-canale</h3>
              <p className="text-gray-600">
                Email, WhatsApp, SMS automatici per clienti e prospect
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Tracking Provvigioni</h3>
              <p className="text-gray-600">
                Monitora provvigioni e commissioni in tempo reale
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚖️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Conformità IVASS</h3>
              <p className="text-gray-600">
                Rispetta automaticamente tutte le normative del settore
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics Avanzate</h3>
              <p className="text-gray-600">
                Report dettagliati su vendite, rinnovi e performance
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔗</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Integrazioni</h3>
              <p className="text-gray-600">
                Collegati con le principali compagnie assicurative
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Prezzi trasparenti per ogni Agenzia
            </h2>
            <p className="text-xl text-gray-600 mb-4">
              Basati sui costi reali, non sul numero di utenti
            </p>
            <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
              🎉 Offerta di lancio: fino al 50% di sconto per 6 mesi
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 max-w-full mx-auto">
            {/* Starter */}
            <div className="bg-white rounded-xl shadow-sm border p-4 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  LANCIO -26%
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Starter</h3>
                <div className="mb-3">
                  <div className="text-xl font-bold text-blue-600">
                    €{pricing.starter.launch_price}<span className="text-sm font-normal text-gray-500">/mese</span>
                  </div>
                  <div className="text-xs text-gray-400 line-through">
                    €{pricing.starter.price}/mese
                  </div>
                </div>
                <p className="text-gray-600 mb-4 text-xs">{pricing.starter.description}</p>
              </div>
              
              <ul className="space-y-1 mb-4 text-xs">
                {pricing.starter.features.slice(0, 5).map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link 
                to="/register?plan=starter&account_type=insurance_agency"
                className="w-full bg-gray-100 text-gray-900 py-2 px-3 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center block text-sm"
              >
                Inizia Gratis
              </Link>
            </div>

            {/* Professional */}
            <div className="bg-white rounded-xl shadow-md border-2 border-blue-500 p-4 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  POPOLARE -25%
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Professional</h3>
                <div className="mb-3">
                  <div className="text-xl font-bold text-blue-600">
                    €{pricing.professional.launch_price}<span className="text-sm font-normal text-gray-500">/mese</span>
                  </div>
                  <div className="text-xs text-gray-400 line-through">
                    €{pricing.professional.price}/mese
                  </div>
                </div>
                <p className="text-gray-600 mb-4 text-xs">{pricing.professional.description}</p>
              </div>
              
              <ul className="space-y-1 mb-4 text-xs">
                {pricing.professional.features.slice(0, 5).map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link 
                to="/register?plan=professional&account_type=insurance_agency"
                className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center block text-sm"
              >
                Inizia Gratis
              </Link>
            </div>

            {/* Premium */}
            <div className="bg-white rounded-xl shadow-sm border p-4 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  LANCIO -20%
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Premium</h3>
                <div className="mb-3">
                  <div className="text-xl font-bold text-blue-600">
                    €{pricing.premium.launch_price}<span className="text-sm font-normal text-gray-500">/mese</span>
                  </div>
                  <div className="text-xs text-gray-400 line-through">
                    €{pricing.premium.price}/mese
                  </div>
                </div>
                <p className="text-gray-600 mb-4 text-xs">{pricing.premium.description}</p>
              </div>
              
              <ul className="space-y-1 mb-4 text-xs">
                {pricing.premium.features.slice(0, 5).map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link 
                to="/register?plan=premium&account_type=insurance_agency"
                className="w-full bg-gray-100 text-gray-900 py-2 px-3 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center block text-sm"
              >
                Inizia Gratis
              </Link>
            </div>

            {/* Advanced */}
            <div className="bg-white rounded-xl shadow-sm border p-4 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  LANCIO -20%
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced</h3>
                <div className="mb-3">
                  <div className="text-xl font-bold text-blue-600">
                    €{pricing.advanced.launch_price}<span className="text-sm font-normal text-gray-500">/mese</span>
                  </div>
                  <div className="text-xs text-gray-400 line-through">
                    €{pricing.advanced.price}/mese
                  </div>
                </div>
                <p className="text-gray-600 mb-4 text-xs">{pricing.advanced.description}</p>
              </div>
              
              <ul className="space-y-1 mb-4 text-xs">
                {pricing.advanced.features.slice(0, 5).map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link 
                to="/register?plan=advanced&account_type=insurance_agency"
                className="w-full bg-gray-100 text-gray-900 py-2 px-3 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center block text-sm"
              >
                Contattaci
              </Link>
            </div>

            {/* Business */}
            <div className="bg-white rounded-xl shadow-sm border p-4 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  LANCIO -20%
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Business</h3>
                <div className="mb-3">
                  <div className="text-xl font-bold text-blue-600">
                    €{pricing.business.launch_price}<span className="text-sm font-normal text-gray-500">/mese</span>
                  </div>
                  <div className="text-xs text-gray-400 line-through">
                    €{pricing.business.price}/mese
                  </div>
                </div>
                <p className="text-gray-600 mb-4 text-xs">{pricing.business.description}</p>
              </div>
              
              <ul className="space-y-1 mb-4 text-xs">
                {pricing.business.features.slice(0, 5).map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link 
                to="/register?plan=business&account_type=insurance_agency"
                className="w-full bg-gray-100 text-gray-900 py-2 px-3 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center block text-sm"
              >
                Contattaci
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-white rounded-xl shadow-sm border p-4 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  CUSTOM
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Enterprise</h3>
                <div className="mb-3">
                  <div className="text-xl font-bold text-blue-600">
                    €{pricing.enterprise.launch_price}<span className="text-sm font-normal text-gray-500">/mese</span>
                  </div>
                  <div className="text-xs text-gray-400 line-through">
                    €{pricing.enterprise.price}/mese
                  </div>
                </div>
                <p className="text-gray-600 mb-4 text-xs">{pricing.enterprise.description}</p>
              </div>
              
              <ul className="space-y-1 mb-4 text-xs">
                {pricing.enterprise.features.slice(0, 5).map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link 
                to="/contact?plan=enterprise&account_type=insurance_agency"
                className="w-full bg-purple-600 text-white py-2 px-3 rounded-lg font-medium hover:bg-purple-700 transition-colors text-center block text-sm"
              >
                Contattaci
              </Link>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Tutti i piani includono 30 giorni di prova gratuita e supporto dedicato
            </p>
            <div className="flex justify-center space-x-8 text-sm text-gray-500">
              <span>✓ Nessun contratto vincolante</span>
              <span>✓ Cancellazione in qualsiasi momento</span>
              <span>✓ Migrazione dati gratuita</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Cosa dicono le Agenzie che ci hanno scelto
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  MR
                </div>
                <div className="ml-4">
                  <div className="font-semibold text-gray-900">Marco Rossi</div>
                  <div className="text-gray-600 text-sm">Agenzia Rossi & Associati</div>
                </div>
              </div>
              <p className="text-gray-700">
                &quot;Con Guardian AI abbiamo aumentato i rinnovi del 35% in 6 mesi. L&apos;automazione mi fa risparmiare 2 ore al giorno.&quot;
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                  SB
                </div>
                <div className="ml-4">
                  <div className="font-semibold text-gray-900">Sara Bianchi</div>
                  <div className="text-gray-600 text-sm">Assicurazioni Bianchi</div>
                </div>
              </div>
              <p className="text-gray-700">
                &quot;Finalmente un CRM che parla la mia lingua. Gestisco 1200 clienti senza stress e i clienti sono più soddisfatti.&quot;
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  LV
                </div>
                <div className="ml-4">
                  <div className="font-semibold text-gray-900">Luigi Verdi</div>
                  <div className="text-gray-600 text-sm">Broker Verdi Group</div>
                </div>
              </div>
              <p className="text-gray-700">
                &quot;ROI incredibile. In 1 anno ci ha permesso di crescere del 50% senza assumere nuovo personale.&quot;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-white mb-4">
            Pronto a trasformare la tua Agenzia?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Unisciti a centinaia di agenzie che hanno già scelto Guardian AI CRM
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/register?account_type=insurance_agency"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Inizia la Prova Gratuita
            </Link>
            <Link 
              to="/contact"
              className="border border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Parla con un Esperto
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">🛡️</span>
                <span className="text-xl font-bold">Guardian AI CRM</span>
              </div>
              <p className="text-gray-400">
                Il CRM progettato specificamente per le Agenzie Assicurative italiane.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Prodotto</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/features" className="hover:text-white">Funzionalità</Link></li>
                <li><Link to="/pricing" className="hover:text-white">Prezzi</Link></li>
                <li><Link to="/integrations" className="hover:text-white">Integrazioni</Link></li>
                <li><Link to="/security" className="hover:text-white">Sicurezza</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Supporto</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/help" className="hover:text-white">Aiuto</Link></li>
                <li><Link to="/docs" className="hover:text-white">Documentazione</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contatti</Link></li>
                <li><Link to="/training" className="hover:text-white">Formazione</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Azienda</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/about" className="hover:text-white">Chi siamo</Link></li>
                <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link to="/careers" className="hover:text-white">Lavora con noi</Link></li>
                <li><Link to="/privacy" className="hover:text-white">Privacy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Guardian AI CRM. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default InsuranceAgencyLandingPage;