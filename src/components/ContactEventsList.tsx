// src/components/ContactEventsList.tsx
import React, { useState, useMemo } from 'react';
import { Contact, CrmEvent, EventReminder } from '../types';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { TrashIcon, ClockIcon, CheckCircleIcon, InfoIcon, WhatsAppIcon } from './ui/icons';

interface ContactEventsListProps {
    contact: Contact | null;
    events: CrmEvent[];
    organizationId?: string;
    onActionSuccess: () => void;
}

const ReminderStatus: React.FC<{ reminders?: EventReminder[] }> = ({ reminders }) => {
    if (!reminders || reminders.length === 0) {
        return null;
    }
    return (
        <div className="flex items-center space-x-2 mt-1.5">
            {reminders.map(r => {
                let icon;
                let colorClass;
                let title = `Promemoria via ${r.channel} - ${new Date(r.scheduled_at).toLocaleString('it-IT')}`;
                
                switch(r.status) {
                    case 'scheduled':
                        icon = <ClockIcon className="w-3.5 h-3.5" />;
                        colorClass = 'text-gray-500';
                        title += ' (In attesa)';
                        break;
                    case 'sent':
                        icon = <CheckCircleIcon className="w-3.5 h-3.5" />;
                        colorClass = 'text-green-600';
                        title += ' (Inviato)';
                        break;
                    case 'failed':
                        icon = <InfoIcon className="w-3.5 h-3.5" />;
                        colorClass = 'text-red-600';
                        title += ` (Fallito: ${r.error_message || 'Errore sconosciuto'})`;
                        break;
                }

                return (
                    <div key={r.id} title={title} className={`flex items-center space-x-1 p-1 bg-gray-100 rounded-md ${colorClass}`}>
                        {r.channel === 'WhatsApp' ? <WhatsAppIcon className="w-3.5 h-3.5"/> : '📧'}
                        {icon}
                    </div>
                );
            })}
        </div>
    );
}

const EventItem: React.FC<{ 
    event: CrmEvent; 
    isFuture: boolean; 
    onDelete: (event: CrmEvent) => Promise<void>;
    isDeleting: boolean;
}> = ({ event, isFuture, onDelete, isDeleting }) => {
    const startTime = new Date(event.event_start_time);

    return (
        <div className="p-3 rounded-md bg-gray-50 border">
            <div className="flex items-start justify-between">
                <div>
                    <p className="font-semibold text-gray-800">{event.event_summary}</p>
                    <p className="text-sm text-gray-600">
                        {startTime.toLocaleDateString('it-IT', { day: '2-digit', month: 'long' })}
                        {' alle '}
                        {startTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${event.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600 line-through'}`}>
                        {event.status === 'confirmed' ? 'Confermato' : 'Annullato'}
                    </span>
                    {isFuture && event.status === 'confirmed' && (
                         <button onClick={() => onDelete(event)} disabled={isDeleting} title="Annulla evento" className="p-1.5 text-red-500 rounded-md hover:bg-red-100 disabled:opacity-50">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
            <ReminderStatus reminders={event.event_reminders} />
        </div>
    );
};

export const ContactEventsList: React.FC<ContactEventsListProps> = ({ contact, events, organizationId, onActionSuccess }) => {
    const [isDeleting, setIsDeleting] = useState<number | null>(null);

    const contactEvents = useMemo(() => {
        if (!contact) return [];
        return events
            .filter(e => e.contact_id === contact.id)
            .sort((a, b) => new Date(b.event_start_time).getTime() - new Date(a.event_start_time).getTime());
    }, [contact, events]);

    const handleDeleteEvent = async (event: CrmEvent) => {
        if (!organizationId) { toast.error("ID organizzazione non trovato."); return; }
        if (!window.confirm(`Annullare l'evento "${event.event_summary}"? Sarà rimosso da Google Calendar.`)) return;

        setIsDeleting(event.id);
        const toastId = toast.loading('Annullamento evento...');
        try {
            const { error } = await supabase.functions.invoke('delete-google-event', {
                body: { organization_id: organizationId, google_event_id: event.google_event_id, crm_event_id: event.id }
            });
            if (error) throw new Error(error.message);
            toast.success('Evento annullato!', { id: toastId });
            onActionSuccess();
        } catch (err: any) {
            toast.error(`Errore: ${err.message}`, { id: toastId });
        } finally {
            setIsDeleting(null);
        }
    };

    if (!contact) return <div className="p-4">Seleziona un contatto.</div>;
    if (contactEvents.length === 0) return <div className="p-4 text-gray-500 text-center">Nessun evento per questo contatto.</div>;

    const now = new Date();
    const futureEvents = contactEvents.filter(e => new Date(e.event_start_time) > now);
    const pastEvents = contactEvents.filter(e => new Date(e.event_start_time) <= now);
    
    return (
        <div className="space-y-6 max-h-[60vh] overflow-y-auto p-1">
            {futureEvents.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Prossimi Eventi</h3>
                    <div className="space-y-2">
                        {futureEvents.map(e => <EventItem key={e.id} event={e} isFuture={true} onDelete={handleDeleteEvent} isDeleting={isDeleting === e.id} />)}
                    </div>
                </div>
            )}
             {pastEvents.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Eventi Passati</h3>
                    <div className="space-y-2">
                        {pastEvents.map(e => <EventItem key={e.id} event={e} isFuture={false} onDelete={handleDeleteEvent} isDeleting={false} />)}
                    </div>
                </div>
            )}
        </div>
    );
};