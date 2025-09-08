
import React from 'react';
import { AutomationIcon, SparklesIcon } from './ui/icons';

export const Automations: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text-primary">Automazioni</h1>
         <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2">
            <AutomationIcon className="w-5 h-5" />
            <span>Nuovo Workflow</span>
        </button>
      </div>

      <div className="bg-card p-8 rounded-lg shadow">
        <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
                <img src="https://assets-global.website-files.com/63554faf18742c125a359b6c/635643666384813511b01c34_n8n-symbol-primary-rgb.svg" alt="N8N Logo" className="w-16 h-16" />
            </div>
            <div>
                <h2 className="text-2xl font-semibold text-text-primary">
                    Automatizza il tuo Business con Linguaggio Naturale
                </h2>
                <p className="mt-1 text-text-secondary">
                    Potenziato da <span className="font-semibold">N8N</span>, il nostro motore di automazione ti permette di connettere le tue app e costruire workflow complessi senza scrivere codice. Descrivi semplicemente cosa vuoi automatizzare, e il nostro agente AI lo costruirà per te.
                </p>
            </div>
        </div>
        
        <div className="mt-6">
            <label htmlFor="automation-prompt" className="block text-sm font-medium text-gray-700 mb-1">
                Descrivi il workflow che vuoi creare:
            </label>
             <textarea
                id="automation-prompt"
                rows={4}
                placeholder="Es: 'Quando un nuovo lead viene aggiunto nel CRM con un valore superiore a 5000€, invia una notifica al canale #vendite su Slack e crea un task di follow-up in Google Calendar tra 3 giorni.'"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
            <div className="mt-3 flex justify-end">
                 <button
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2 disabled:bg-gray-400"
                >
                    <SparklesIcon className="w-5 h-5" />
                    <span>Genera Workflow</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};