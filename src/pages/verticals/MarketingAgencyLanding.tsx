/**
 * GUARDIAN AI CRM - MARKETING AGENCY LANDING PAGE
 * Landing page specifica per Agenzie di Marketing con prezzi competitivi
 * Data: 2025-10-05
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { COMPETITIVE_PRICING } from '../../lib/verticalAccounts/competitivePricing';

const MarketingAgencyLandingPage: React.FC = () => {
  const pricing = COMPETITIVE_PRICING.marketing_agency;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🚀</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Guardian AI CRM</h1>
                <p className="text-sm text-purple-600">per Agenzie di Marketing</p>
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
                to="/register?account_type=marketing_agency"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
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
            <div className="inline-flex items-center bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-8">
              🎯 LANCIO SPECIALE: Sconto fino al 40% per i primi 6 mesi
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Il CRM per Agenzie <br />
              <span className="text-purple-600">di Marketing</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Gestisci clienti, campagne e risultati in un&apos;unica piattaforma. 
              Aumenta il ROI dei tuoi clienti e scala la tua agenzia con l&apos;AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/register?account_type=marketing_agency"
                className="bg-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Inizia Gratis Oggi
              </Link>
              <Link 
                to="/demo"
                className="border border-purple-600 text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-50 transition-colors"
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
              Funzionalità specifiche per il marketing digitale
            </p>
          </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 max-w-full mx-auto">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Gestione Campagne</h3>
              <p className="text-gray-600">
                Organizza e monitora tutte le campagne marketing dei tuoi clienti
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">ROI Tracking</h3>
              <p className="text-gray-600">
                Traccia il ritorno sull&apos;investimento di ogni singola campagna
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Lead Generation</h3>
              <p className="text-gray-600">
                Automatizza la generazione e qualificazione dei lead
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📧</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Email Marketing</h3>
              <p className="text-gray-600">
                Crea e automatizza sequenze email personalizzate
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Social Media</h3>
              <p className="text-gray-600">
                Integra e gestisci tutti i canali social dei clienti
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics</h3>
              <p className="text-gray-600">
                Report avanzati e dashboard personalizzati per ogni cliente
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
              Prezzi pensati per ogni tipo di Agenzia
            </h2>
            <p className="text-xl text-gray-600 mb-4">
              Da freelancer a grandi network, abbiamo il piano giusto per te
            </p>
            <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
              🎉 Offerta di lancio: risparmia fino al 40% per 6 mesi
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
            {/* Freelancer */}
            <div className="bg-white rounded-xl shadow-sm border p-6 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                  PROVA 14 GIORNI GRATIS
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Freelancer</h3>
                <div className="mb-3">
                  <div className="text-xl font-bold text-purple-600">
                    €{pricing.freelancer.launch_price}<span className="text-sm font-normal text-gray-500">/mese</span>
                  </div>
                  <div className="text-xs text-gray-400 line-through">
                    €{pricing.freelancer.price}/mese
                  </div>
                </div>
                <p className="text-gray-600 mb-4 text-xs">{pricing.freelancer.description}</p>
              </div>
              
              <ul className="space-y-1 mb-4 text-xs">
                {pricing.freelancer.features.slice(0, 5).map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link 
                to="/register?plan=freelancer&account_type=marketing_agency"
                className="w-full bg-green-600 text-white py-2 px-3 rounded-lg font-medium hover:bg-green-700 transition-colors text-center block text-sm"
              >
                Prova 14 Giorni Gratis
              </Link>
            </div>

            {/* Agency */}
            <div className="bg-white rounded-xl shadow-md border-2 border-purple-500 p-6 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                  POPOLARE -34%
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Agency</h3>
                <div className="mb-3">
                  <div className="text-xl font-bold text-purple-600">
                    €{pricing.agency.launch_price}<span className="text-sm font-normal text-gray-500">/mese</span>
                  </div>
                  <div className="text-xs text-gray-400 line-through">
                    €{pricing.agency.price}/mese
                  </div>
                </div>
                <p className="text-gray-600 mb-4 text-xs">{pricing.agency.description}</p>
              </div>
              
              <ul className="space-y-1 mb-4 text-xs">
                {pricing.agency.features.slice(0, 5).map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link 
                to="/checkout?plan=agency&account_type=marketing_agency"
                className="w-full bg-purple-600 text-white py-2 px-3 rounded-lg font-medium hover:bg-purple-700 transition-colors text-center block text-sm"
              >
                Acquista Ora
              </Link>
            </div>

            {/* Studio */}
            <div className="bg-white rounded-xl shadow-sm border p-6 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  LANCIO -20%
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Studio</h3>
                <div className="mb-3">
                  <div className="text-xl font-bold text-purple-600">
                    €{pricing.studio.launch_price}<span className="text-sm font-normal text-gray-500">/mese</span>
                  </div>
                  <div className="text-xs text-gray-400 line-through">
                    €{pricing.studio.price}/mese
                  </div>
                </div>
                <p className="text-gray-600 mb-4 text-xs">{pricing.studio.description}</p>
              </div>
              
              <ul className="space-y-1 mb-4 text-xs">
                {pricing.studio.features.slice(0, 5).map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link 
                to="/checkout?plan=studio&account_type=marketing_agency"
                className="w-full bg-gray-600 text-white py-2 px-3 rounded-lg font-medium hover:bg-gray-700 transition-colors text-center block text-sm"
              >
                Acquista Ora
              </Link>
            </div>

            {/* Business */}
            <div className="bg-white rounded-xl shadow-sm border p-6 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  LANCIO -20%
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Business</h3>
                <div className="mb-3">
                  <div className="text-xl font-bold text-purple-600">
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
                to="/register?plan=business&account_type=marketing_agency"
                className="w-full bg-gray-100 text-gray-900 py-2 px-3 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center block text-sm"
              >
                Contattaci
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-white rounded-xl shadow-sm border p-6 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  CUSTOM
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Enterprise</h3>
                <div className="mb-3">
                  <div className="text-xl font-bold text-purple-600">
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
                to="/contact?plan=enterprise&account_type=marketing_agency"
                className="w-full bg-purple-600 text-white py-2 px-3 rounded-lg font-medium hover:bg-purple-700 transition-colors text-center block text-sm"
              >
                Contattaci
              </Link>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Tutti i piani includono 30 giorni di prova gratuita e onboarding personalizzato
            </p>
            <div className="flex justify-center space-x-8 text-sm text-gray-500">
              <span>✓ Setup campagne incluso</span>
              <span>✓ Migrazione dati gratuita</span>
              <span>✓ Formazione del team inclusa</span>
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
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  AF
                </div>
                <div className="ml-4">
                  <div className="font-semibold text-gray-900">Alessandro Ferrari</div>
                  <div className="text-gray-600 text-sm">Digital Marketing Pro</div>
                </div>
              </div>
              <p className="text-gray-700">
                &quot;Abbiamo triplicato il numero di clienti gestiti senza aumentare il team. L&apos;automazione è incredibile.&quot;
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                  MC
                </div>
                <div className="ml-4">
                  <div className="font-semibold text-gray-900">Maria Conti</div>
                  <div className="text-gray-600 text-sm">Creative Studio Milano</div>
                </div>
              </div>
              <p className="text-gray-700">
                &quot;I report automatici hanno migliorato la trasparenza con i clienti. Rinnovano di più e sono più felici.&quot;
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  GP
                </div>
                <div className="ml-4">
                  <div className="font-semibold text-gray-900">Giovanni Pellegrini</div>
                  <div className="text-gray-600 text-sm">Growth Agency Network</div>
                </div>
              </div>
              <p className="text-gray-700">
                &quot;ROI del 400% nel primo anno. È diventato il cuore operativo delle nostre 8 agenzie.&quot;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-white mb-4">
            Pronto a scalare la tua Agenzia?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Unisciti a migliaia di professionisti che hanno già scelto Guardian AI CRM
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/register?account_type=marketing_agency"
              className="bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Inizia la Prova Gratuita
            </Link>
            <Link 
              to="/contact"
              className="border border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              Richiedi Consulenza
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
                <span className="text-2xl">🚀</span>
                <span className="text-xl font-bold">Guardian AI CRM</span>
              </div>
              <p className="text-gray-400">
                Il CRM progettato specificamente per Agenzie di Marketing e Digital Agency.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Prodotto</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/features" className="hover:text-white">Funzionalità</Link></li>
                <li><Link to="/pricing" className="hover:text-white">Prezzi</Link></li>
                <li><Link to="/integrations" className="hover:text-white">Integrazioni</Link></li>
                <li><Link to="/templates" className="hover:text-white">Template</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Supporto</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/help" className="hover:text-white">Aiuto</Link></li>
                <li><Link to="/academy" className="hover:text-white">Academy</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contatti</Link></li>
                <li><Link to="/community" className="hover:text-white">Community</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Risorse</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link to="/case-studies" className="hover:text-white">Case Studies</Link></li>
                <li><Link to="/webinars" className="hover:text-white">Webinar</Link></li>
                <li><Link to="/ebooks" className="hover:text-white">E-books</Link></li>
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

export default MarketingAgencyLandingPage;