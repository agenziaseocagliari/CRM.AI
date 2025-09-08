
import React from 'react';
import { FormsIcon, SparklesIcon } from './ui/icons';

export const Forms: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text-primary">Costruttore di Form AI</h1>
        <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2">
            <FormsIcon className="w-5 h-5" />
            <span>Crea Nuovo Form</span>
        </button>
      </div>

      <div className="bg-card p-8 rounded-lg shadow text-center">
        <div className="mx-auto bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center">
            <SparklesIcon className="w-8 h-8 text-primary" />
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-text-primary">
            Costruisci Form Intelligenti
        </h2>
        <p className="mt-2 text-text-secondary max-w-2xl mx-auto">
            Crea form dinamici che non si limitano a raccogliere dati. I nostri form potenziati dall'AI possono qualificare lead, pianificare follow-up e aggiornare il tuo CRM automaticamente, trasformando ogni invio in un'azione intelligente.
        </p>
        <div className="mt-6">
             <button className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-indigo-700 text-lg font-semibold">
                Inizia a Costruire il tuo Primo Form AI
            </button>
        </div>
      </div>
    </div>
  );
};