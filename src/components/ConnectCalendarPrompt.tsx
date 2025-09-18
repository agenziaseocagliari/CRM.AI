// src/components/ConnectCalendarPrompt.tsx
import React from 'react';
import { GoogleIcon } from './ui/icons';

interface ConnectCalendarPromptProps {
  onConnect: () => void;
  isLoading?: boolean;
}

export const ConnectCalendarPrompt: React.FC<ConnectCalendarPromptProps> = ({ onConnect, isLoading }) => {
  return (
    <div className="bg-white p-8 rounded-lg shadow text-center border-t-4 border-primary">
      <div className="mx-auto bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center">
        <GoogleIcon className="w-8 h-8" />
      </div>
      <h2 className="mt-4 text-2xl font-semibold text-text-primary">
        Collega il tuo Google Calendar
      </h2>
      <p className="mt-2 text-text-secondary max-w-xl mx-auto">
        Per utilizzare il calendario, visualizzare la tua disponibilità e creare eventi, devi prima collegare il tuo account Google in modo sicuro.
      </p>
      <div className="mt-6">
        <button
          onClick={onConnect}
          disabled={isLoading}
          className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-indigo-700 text-lg font-semibold flex items-center space-x-3 mx-auto disabled:bg-gray-400"
        >
          <GoogleIcon className="w-5 h-5" />
          <span>{isLoading ? 'Avvio connessione...' : 'Collega Google Calendar'}</span>
        </button>
      </div>
    </div>
  );
};