import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SparklesIcon, PlusIcon } from './ui/icons';

// Esempio di dati per un template di automazione
const automationTemplates = [
    {
        title: "Benvenuto Nuovo Lead",
        description: "Quando un contatto viene creato da un form, invia un'email di benvenuto e una notifica al team di vendita.",
        tags: ["Onboarding", "Email", "Notifiche"],
        comingSoon: false,
    },
    {
        title: "Scoring Lead AI",
        description: "Analizza automaticamente ogni nuovo contatto con l'AI per assegnare uno score e qualificarlo come Hot, Warm o Cold.",
        tags: ["Lead Scoring", "AI", "Qualificazione"],
        comingSoon: false,
    },
    {
        title: "Sincronizzazione Calendario",
        description: "Quando un'opportunità entra nello stadio 'Proposal Sent', crea un evento nel calendario per il follow-up.",
        tags: ["Calendario", "Produttività"],
        comingSoon: true,
    },
    {
        title: "Notifica WhatsApp per Lead 'Hot'",
        description: "Invia un messaggio WhatsApp istantaneo al team quando un lead viene qualificato come 'Hot' dall'AI.",
        tags: ["WhatsApp", "Vendite", "Notifiche"],
        comingSoon: true,
    }
];

const AutomationCard: React.FC<{ title: string; description: string; tags: string[]; comingSoon: boolean }> = ({ title, description, tags, comingSoon }) => (
    <div className="bg-white p-6 rounded-lg shadow border flex flex-col justify-between relative overflow-hidden">
        {comingSoon && (
            <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-bl-lg">
                IN ARRIVO
            </div>
        )}
        <div>
            <h3 className="font-bold text-lg text-text-primary mb-2">{title}</h3>
            <p className="text-sm text-text-secondary mb-4 h-20">{description}</p>
            <div className="flex flex-wrap gap-2 mb-4">
                {tags.map(tag => (
                    <span key={tag} className="bg-indigo-100 text-primary text-xs font-semibold px-2.5 py-0.5 rounded-full">{tag}</span>
                ))}
            </div>
        </div>
        <div className="flex justify-end pt-4 border-t">
            <button 
                disabled={comingSoon}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
                <PlusIcon className="w-5 h-5" />
                <span>{comingSoon ? 'Prossimamente' : 'Attiva Automazione'}</span>
            </button>
        </div>
    </div>
);


export const Automations: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-text-primary">Catalogo Automazioni</h1>
                 <button onClick={() => navigate('/settings')} className="text-primary hover:text-indigo-800 font-medium">
                    Configura le tue integrazioni &rarr;
                </button>
            </div>

            <div className="bg-card p-6 rounded-lg shadow text-center border-2 border-dashed border-gray-200">
                <div className="mx-auto bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center">
                    <SparklesIcon className="w-8 h-8 text-primary" />
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-text-primary">
                    Il tuo CRM, con i superpoteri.
                </h2>
                <p className="mt-2 text-text-secondary max-w-3xl mx-auto">
                   Scegli un'automazione dal nostro catalogo, attivala con un click e lascia che il CRM lavori per te. Per iniziare, assicurati di aver inserito le tue credenziali API nella pagina delle impostazioni.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {automationTemplates.map(template => (
                    <AutomationCard key={template.title} {...template} />
                ))}
            </div>
        </div>
    );
};
