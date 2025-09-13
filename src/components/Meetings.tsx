import React from 'react';
import { VideoIcon } from './ui/icons';

export const Meetings: React.FC = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-text-primary">Modulo Meeting</h1>
            <div className="bg-white p-8 rounded-lg shadow text-center">
                <div className="mx-auto bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center">
                    <VideoIcon className="w-8 h-8 text-primary" />
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-text-primary">
                    Prossimamente: Link di Prenotazione Pubblici
                </h2>
                <p className="mt-2 text-text-secondary max-w-2xl mx-auto">
                    Questa sezione ti permetterà di creare e condividere pagine di prenotazione personalizzate, sincronizzate con la tua disponibilità su Google Calendar, per consentire ai tuoi contatti di fissare appuntamenti con te senza sforzo.
                </p>
            </div>
        </div>
    );
};
