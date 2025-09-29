import React from 'react';
import toast from 'react-hot-toast';
import { SparklesIcon, TrendingDownIcon, TemplateIcon } from '../ui/icons';

const WorkflowCard: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    action: () => void;
}> = ({ title, description, icon, action }) => (
    <div className="bg-card dark:bg-dark-card p-6 rounded-lg shadow-md border dark:border-gray-600 flex flex-col">
        <div className="flex items-center mb-4">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-full mr-4">
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">{title}</h3>
        </div>
        <p className="text-text-secondary dark:text-dark-text-secondary flex-grow mb-6">{description}</p>
        <button 
            onClick={action}
            className="w-full mt-auto bg-primary dark:bg-dark-primary text-white font-semibold py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
        >
            Avvia Processo
        </button>
    </div>
);

export const AiWorkflows: React.FC = () => {

    const handleTriggerWorkflow = (workflowName: string) => {
        const promise = new Promise((resolve) => setTimeout(resolve, 1500));
        toast.promise(promise, {
            loading: `Avvio del workflow "${workflowName}"...`,
            success: `Workflow "${workflowName}" avviato con successo!`,
            error: `Errore nell'avvio del workflow.`,
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-3">
                <SparklesIcon className="w-8 h-8 text-primary dark:text-dark-primary" />
                <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">Workflow AI & Operazioni</h1>
            </div>
            <p className="text-text-secondary dark:text-dark-text-secondary max-w-3xl">
                Avvia manualmente i processi AI di back-end per l'analisi dei dati, la manutenzione della piattaforma e le comunicazioni programmate.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                <WorkflowCard 
                    title="Analisi Rischio Churn"
                    description="Esegue un'analisi su tutti i clienti attivi per identificare quelli a rischio di abbandono basandosi su pattern di utilizzo e interazione."
                    icon={<TrendingDownIcon className="w-6 h-6 text-primary dark:text-dark-primary" />}
                    action={() => handleTriggerWorkflow('Analisi Churn')}
                />
                <WorkflowCard 
                    title="Invio Email Programmate"
                    description="Forza l'invio immediato di tutte le email e i promemoria in coda, bypassando la normale schedulazione."
                    icon={<TemplateIcon className="w-6 h-6 text-primary dark:text-dark-primary" />}
                    action={() => handleTriggerWorkflow('Invio Email')}
                />
                <WorkflowCard 
                    title="Riclassificazione Lead"
                    description="Riesegue l'algoritmo di lead scoring su tutti i contatti che non hanno un'opportunità associata per aggiornare la loro priorità."
                    icon={<SparklesIcon className="w-6 h-6 text-primary dark:text-dark-primary" />}
                    action={() => handleTriggerWorkflow('Riclassificazione Lead')}
                />
            </div>
        </div>
    );
};
