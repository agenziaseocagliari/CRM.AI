import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Zap, Users, BarChart3, Sparkles, Shield, Globe, Clock } from 'lucide-react';
import { PublicHeader } from './PublicHeader';

export const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <PublicHeader />
      <Helmet>
        <title>CRM AI - Gestione Clienti Intelligente | Aumenta le Tue Vendite</title>
        <meta name="description" content="Trasforma la tua azienda con CRM AI - la piattaforma intelligente per la gestione delle relazioni con i clienti. Automatizza i flussi di lavoro, aumenta le vendite del 40% e offri esperienze clienti eccezionali con insights basati sull'AI." />
        <meta name="keywords" content="CRM, AI, gestione relazioni clienti, automazione vendite, generazione lead, business intelligence, analytics clienti" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://crm-8dj903aor-seo-cagliaris-projects-a561cd5b.vercel.app/" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://crm-8dj903aor-seo-cagliaris-projects-a561cd5b.vercel.app/" />
        <meta property="og:title" content="CRM AI - Gestione Clienti Intelligente" />
        <meta property="og:description" content="Trasforma la tua azienda con il CRM basato su AI. Automatizza i flussi di lavoro, aumenta le vendite e offri esperienze clienti eccezionali." />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://crm-8dj903aor-seo-cagliaris-projects-a561cd5b.vercel.app/" />
        <meta property="twitter:title" content="CRM AI - Gestione Clienti Intelligente" />
        <meta property="twitter:description" content="Trasforma la tua azienda con il CRM basato su AI. Automatizza i flussi di lavoro, aumenta le vendite e offri esperienze clienti eccezionali." />
        
        {/* Additional meta tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#3B82F6" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-6xl">
          <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500/10 rounded-full blur-xl"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-purple-500/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-40 left-1/4 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-8 ring-1 ring-blue-600/20">
              <Sparkles className="w-4 h-4 mr-2" />
              Piattaforma CRM Basata su AI
            </div>

            {/* Main heading */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Trasforma la Tua
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Azienda </span>
              con il CRM Intelligente
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-4xl mx-auto leading-relaxed">
              Automatizza i flussi di lavoro, aumenta le vendite del 40% e offri esperienze clienti eccezionali 
              con la nostra piattaforma di gestione clienti basata sull&apos;intelligenza artificiale.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <button className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                Inizia Prova Gratuita
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="bg-white hover:bg-gray-50 text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-gray-200 hover:border-gray-300 transition-all duration-300">
                Guarda Demo
              </button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2 text-green-500" />
                Sicurezza Enterprise
              </div>
              <div className="flex items-center">
                <Globe className="w-4 h-4 mr-2 text-blue-500" />
                Scala Globale
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-purple-500" />
                Supporto 24/7
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Funzionalità Potenti per Aziende Moderne
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tutto ciò di cui hai bisogno per gestire le relazioni con i clienti, automatizzare i processi di vendita 
              e far crescere la tua azienda in modo intelligente.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/50 transition-all duration-300 border border-blue-200/50">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Automazione Basata su AI</h3>
              <p className="text-gray-600">
                Automatizza attività ripetitive, valutazione lead e follow-up con algoritmi AI avanzati 
                che imparano dai tuoi modelli di business.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 hover:from-purple-100 hover:to-purple-200/50 transition-all duration-300 border border-purple-200/50">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Vista Cliente 360°</h3>
              <p className="text-gray-600">
                Ottieni insights completi sui clienti con profili unificati, cronologia delle interazioni 
                e analytics predittive per decisioni migliori.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-2xl bg-gradient-to-br from-green-50 to-green-100/50 hover:from-green-100 hover:to-green-200/50 transition-all duration-300 border border-green-200/50">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Analytics Avanzate</h3>
              <p className="text-gray-600">
                Traccia metriche di performance, prevedi le vendite e identifica opportunità 
                con dashboard in tempo reale e reporting intelligente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Scelto da Aziende in Crescita
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Unisciti a migliaia di aziende che hanno trasformato le loro relazioni con i clienti grazie alla nostra piattaforma.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">10k+</div>
              <div className="text-blue-100">Utenti Attivi</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">40%</div>
              <div className="text-blue-100">Aumento Vendite</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">99.9%</div>
              <div className="text-blue-100">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">24/7</div>
              <div className="text-blue-100">Supporto</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Pronto a Trasformare la Tua Azienda?
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Inizia oggi la tua prova gratuita e scopri come il nostro CRM basato su AI può aiutarti 
            ad aumentare le vendite, migliorare le relazioni con i clienti e far crescere la tua azienda.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              Inizia Gratis
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="bg-white hover:bg-gray-50 text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-gray-200 hover:border-gray-300 transition-all duration-300">
              Contatta Vendite
            </button>
          </div>

          {/* Additional trust elements */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-6 text-sm text-gray-500">
            <span>✓ Nessuna carta di credito richiesta</span>
            <span>✓ Prova gratuita di 14 giorni</span>
            <span>✓ Cancella in qualsiasi momento</span>
          </div>
        </div>
      </section>
    </div>
  );
};
