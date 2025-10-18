import React, { useEffect } from 'react';
import { diagnostics } from '../utils/diagnostics';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description }) => {
  useEffect(() => {
    diagnostics.log('component', `PlaceholderPage:${title}`, {
      title,
      description,
      mounted: true,
      timestamp: new Date().toISOString(),
      location: window.location.pathname
    });
  }, [title, description]);

  diagnostics.log('render', `PlaceholderPage:${title}`, { rendering: true });

  return (
    <div className="p-8">
      <div style={{ display: 'none' }} data-diagnostic={`PlaceholderPage-${title}`}>
        PlaceholderPage: {title}
      </div>
      <h1 className="text-3xl font-bold mb-4">{title}</h1>
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
        <p className="text-blue-700">
          Il modulo <strong>{title}</strong> sarà disponibile nelle prossime fasi di sviluppo.
        </p>
        {description && (
          <p className="text-blue-600 text-sm mt-2">{description}</p>
        )}
        <p className="text-blue-600 text-sm mt-2">
          Fase corrente: 1.1 (Polizze Management)
        </p>
      </div>
      
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Funzionalità pianificate:</h2>
        <ul className="space-y-2">
          <li className="flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
            <span>Gestione completa {title.toLowerCase()}</span>
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
            <span>Dashboard con statistiche</span>
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
            <span>Export e reportistica</span>
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
            <span>Automazioni integrate</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default PlaceholderPage;