import React from 'react';

export const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text-primary">Impostazioni</h1>
      <div className="bg-card p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Impostazioni Account</h2>
        <p className="text-gray-600">
          Questa sezione è in fase di sviluppo. Qui potrai gestire le impostazioni del tuo account,
          le preferenze di notifica e i dettagli della tua organizzazione.
        </p>
      </div>
    </div>
  );
};
