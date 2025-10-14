import React, { memo, useCallback, useMemo } from 'react';
import { 
  UsersIcon, 
  DollarSignIcon, 
  CalendarIcon, 
  PlusIcon,
  ClipboardDataIcon,
  EmailIcon
} from '../ui/icons';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}

interface QuickActionsProps {
  onAddContact?: () => void;
  onCreateDeal?: () => void;
  onScheduleEvent?: () => void;
  onCreateForm?: () => void;
  onSendEmail?: () => void;
  onViewPipeline?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = memo(({
  onAddContact,
  onCreateDeal,
  onScheduleEvent,
  onCreateForm,
  onSendEmail,
  onViewPipeline
}) => {
  const actions: QuickAction[] = useMemo(() => [
    {
      id: 'add-contact',
      title: 'Nuovo Contatto',
      description: 'Aggiungi un nuovo contatto al CRM',
      icon: <UsersIcon className="w-6 h-6 text-white" />,
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: onAddContact || (() => {})
    },
    {
      id: 'create-deal',
      title: 'Nuova Opportunità',
      description: 'Crea una nuova opportunità di vendita',
      icon: <DollarSignIcon className="w-6 h-6 text-white" />,
      color: 'bg-green-500 hover:bg-green-600',
      onClick: onCreateDeal || (() => {})
    },
    {
      id: 'schedule-event',
      title: 'Programma Evento',
      description: 'Aggiungi un nuovo evento al calendario',
      icon: <CalendarIcon className="w-6 h-6 text-white" />,
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: onScheduleEvent || (() => {})
    },
    {
      id: 'create-form',
      title: 'Nuovo Form',
      description: 'Crea un form per raccogliere lead',
      icon: <ClipboardDataIcon className="w-6 h-6 text-white" />,
      color: 'bg-orange-500 hover:bg-orange-600',
      onClick: onCreateForm || (() => {})
    },
    {
      id: 'send-email',
      title: 'Campagna Email',
      description: 'Invia una campagna email marketing',
      icon: <EmailIcon className="w-6 h-6 text-white" />,
      color: 'bg-red-500 hover:bg-red-600',
      onClick: onSendEmail || (() => {})
    },
    {
      id: 'view-pipeline',
      title: 'Vedi Pipeline',
      description: 'Gestisci le tue opportunità',
      icon: <PlusIcon className="w-6 h-6 text-white" />,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      onClick: onViewPipeline || (() => {})
    }
  ], [onAddContact, onCreateDeal, onScheduleEvent, onCreateForm, onSendEmail, onViewPipeline]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Azioni Rapide
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Accedi rapidamente alle funzioni principali del CRM
        </p>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className={`
                ${action.color} rounded-lg p-4 text-left transition-all duration-200
                hover:scale-105 active:scale-95 shadow-sm hover:shadow-md
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              `}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {action.title}
                  </p>
                  <p className="text-xs text-white opacity-80 truncate">
                    {action.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});