import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircleIcon, SparklesIcon, ShieldCheckIcon, CpuChipIcon } from './ui/icons';

export const PublicPricingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
            ← Torna alla Home
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Piani Tariffari Guardian AI CRM
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Il primo CRM con intelligenza artificiale nativa. Automazione completa, 
              margini sostenibili e integrazione totale per far crescere il tuo business.
            </p>
          </div>
        </div>
      </div>

      {/* Competitive Advantages */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Perché Guardian AI è Diverso
            </h2>
            <p className="text-lg text-gray-600">
              Ciò che ci distingue dalla concorrenza
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-8 rounded-xl shadow-lg text-center">
              <CpuChipIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-3">AI Nativo</h3>
              <p className="text-gray-600">
                Intelligenza artificiale integrata nativamente, non aggiunta come modulo esterno. 
                Automazione intelligente in ogni processo.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg text-center">
              <ShieldCheckIcon className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-3">Margini Sostenibili</h3>
              <p className="text-gray-600">
                Modello di pricing trasparente che cresce con te. Nessun costo nascosto, 
                solo valore aggiunto al tuo business.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg text-center">
              <SparklesIcon className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-3">Integrazione Completa</h3>
              <p className="text-gray-600">
                Un&apos;unica piattaforma per CRM, automazione, calendario, meeting e form. 
                Tutto sincronizzato e ottimizzato.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-6">
            
            {/* Starter Plan */}
            <div className="bg-white rounded-2xl shadow-xl p-6 relative">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Starter</h3>
                <p className="text-gray-600 mb-4">Perfetto per iniziare</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">€19</span>
                  <span className="text-gray-600">/mese</span>
                </div>
              </div>
              
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                  <span>200 AI Credits</span>
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                  <span>150 WhatsApp Credits</span>
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                  <span>1.000 Email Credits</span>
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                  <span>Calendario integrato</span>
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                  <span>Supporto email</span>
                </li>
              </ul>
              
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm">
                Inizia Subito
              </button>
            </div>

            {/* Professional Plan */}
            <div className="bg-white rounded-2xl shadow-xl p-6 relative">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Professional</h3>
                <p className="text-gray-600 mb-4">Small business</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">€39</span>
                  <span className="text-gray-600">/mese</span>
                </div>
              </div>
              
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                  <span>400 AI Credits</span>
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                  <span>300 WhatsApp Credits</span>
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                  <span>3.000 Email Credits</span>
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                  <span>Meeting integrati</span>
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                  <span>Analisi base</span>
                </li>
              </ul>
              
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm">
                Scegli Professional
              </button>
            </div>

            {/* Business Plan - Most Popular */}
            <div className="bg-white rounded-2xl shadow-xl p-6 relative border-2 border-blue-500">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-semibold">
                  Più Popolare
                </span>
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Business</h3>
                <p className="text-gray-600 mb-4">Medium business</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">€79</span>
                  <span className="text-gray-600">/mese</span>
                </div>
              </div>
              
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                  <span>800 AI Credits</span>
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                  <span>600 WhatsApp Credits</span>
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                  <span>8.000 Email Credits</span>
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                  <span>Automazioni avanzate</span>
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                  <span>Reportistica completa</span>
                </li>
              </ul>
              
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm">
                Scegli Business
              </button>
            </div>

            {/* Premium Plan */}
            <div className="bg-white rounded-2xl shadow-xl p-6 relative">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Premium</h3>
                <p className="text-gray-600 mb-4">Large business</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">€149</span>
                  <span className="text-gray-600">/mese</span>
                </div>
              </div>
              
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                  <span>1.500 AI Credits</span>
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                  <span>1.200 WhatsApp Credits</span>
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                  <span>20.000 Email Credits</span>
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                  <span>Priority Support</span>
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                  <span>Integrazioni API</span>
                </li>
              </ul>
              
              <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors text-sm">
                Scegli Premium
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-2xl shadow-xl p-6 relative border-2 border-gold-500">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Enterprise</h3>
                <p className="text-gray-600 mb-4">Soluzione su misura</p>
                <div className="mb-4">
                  <span className="text-2xl font-bold text-gray-900">Custom</span>
                </div>
              </div>
              
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                  <span>Crediti illimitati</span>
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                  <span>AI personalizzata</span>
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                  <span>Infrastruttura dedicata</span>
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                  <span>Account manager</span>
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                  <span>SLA garantito</span>
                </li>
              </ul>
              
              <button className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-900 transition-colors text-sm">
                Contattaci
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Domande Frequenti
            </h2>
          </div>
          
          <div className="space-y-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Posso cambiare piano in qualsiasi momento?</h3>
              <p className="text-gray-600">
                Sì, puoi upgrade o downgrade il tuo piano in qualsiasi momento. 
                Le modifiche avranno effetto dal ciclo di fatturazione successivo.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Cosa include il supporto prioritario?</h3>
              <p className="text-gray-600">
                Supporto prioritario include risposta entro 4 ore, supporto telefonico, 
                e accesso diretto al team tecnico per risoluzione rapida dei problemi.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">I dati sono al sicuro?</h3>
              <p className="text-gray-600">
                Assolutamente. Utilizziamo crittografia avanzata, backup automatici e 
                infrastruttura cloud certificata ISO 27001 per garantire la massima sicurezza.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto a Trasformare il Tuo Business?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Unisciti a centinaia di aziende che hanno già scelto Guardian AI CRM
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/login"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Prova Gratuita 14 Giorni
            </Link>
            <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
              Richiedi Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

