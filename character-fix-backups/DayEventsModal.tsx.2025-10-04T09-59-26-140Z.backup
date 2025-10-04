// Gli import vanno sempre puliti e organizzati dopo ogni refactor o patch.
import React, { useState } from 'react';

import { useCrmData } from '../hooks/useCrmData';
import { Contact, CrmEvent } from '../types';

import { CreateEventModal } from './CreateEventModal';
import { PlusIcon } from './ui/icons';
import { Modal } from './ui/Modal';

interface DayEventsModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date | null;
    crmData: ReturnType<typeof useCrmData>;
}

const EventListItem: React.FC<{ event: CrmEvent, contacts: Contact[] }> = ({ event, contacts }) => {
    const contact = contacts.find(c => c.id === event.contact_id);
    const startTime = new Date(event.event_start_time);
    const endTime = new Date(event.event_end_time);

    return (
        <div className="p-3 rounded-md bg-indigo-50 border border-indigo-200">
            <p className="font-bold text-indigo-800">{event.event_summary}</p>
            <p className="text-sm text-indigo-700">
                {startTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
            </p>
            {contact && <p className="text-xs text-gray-600 mt-1">Con: {contact.name}</p>}
        </div>
    );
};


export const DayEventsModal: React.FC<DayEventsModalProps> = ({ isOpen, onClose, date, crmData }) => {
    const { crmEvents, contacts, organization, refetch, isCalendarLinked } = crmData;

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

    const dayEvents = date ? crmEvents.filter(e => {
        if (e.status === 'cancelled') {return false;}
        const eventDate = new Date(e.event_start_time);
        return eventDate.getFullYear() === date.getFullYear() &&
               eventDate.getMonth() === date.getMonth() &&
               eventDate.getDate() === date.getDate();
    }) : [];

    const handleOpenCreateModal = () => {
        // Se c'è un solo evento, pre-seleziona quel contatto, altrimenti apri senza contatto
        if (dayEvents.length === 1) {
            const contact = contacts.find(c => c.id === dayEvents[0].contact_id);
            if(contact) {setSelectedContact(contact);}
        } else {
            setSelectedContact(null); // Permette di scegliere il contatto nel modale
        }
        setIsCreateModalOpen(true);
    };

    const handleSaveSuccess = () => {
        refetch(); // Ricarica tutti i dati del CRM
        setIsCreateModalOpen(false); // Chiude il modale di creazione
        // Non chiudiamo il modale del giorno, così l'utente vede l'evento aggiunto
    };
    
    // Un hack per "nascondere" il modale del giorno mentre quello di creazione è aperto
    const isVisible = isOpen && !isCreateModalOpen;

    return (
        <>
            <Modal isOpen={isVisible} onClose={onClose} title={`Eventi del ${date?.toLocaleDateString('it-IT')}`}>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {dayEvents.length > 0 ? (
                        dayEvents.map(event => <EventListItem key={event.id} event={event} contacts={contacts} />)
                    ) : (
                        <p className="text-gray-500 text-center py-8">Nessun evento per questa data.</p>
                    )}
                </div>
                <div className="flex justify-end pt-4 border-t mt-4">
                     <button onClick={handleOpenCreateModal} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2">
                        <PlusIcon className="w-5 h-5"/>
                        <span>Crea Evento</span>
                    </button>
                </div>
            </Modal>
            
            {/* Il modale di creazione evento viene gestito qui */}
            {date && <CreateEventModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                contact={selectedContact}
                organization={organization}
                isCalendarLinked={isCalendarLinked}
                onActionSuccess={handleSaveSuccess}
                // Potremmo passare la data preselezionata in futuro
            />}
        </>
    );
};
