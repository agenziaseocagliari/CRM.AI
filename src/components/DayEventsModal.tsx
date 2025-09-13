import React, { useState, useMemo, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useCrmData } from '../hooks/useCrmData';
import { supabase } from '../lib/supabaseClient';
import { CrmEvent } from '../types';
import { Modal } from './ui/Modal';
import { PlusIcon, TrashIcon, EditIcon } from './ui/icons';

interface DayEventsModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date | null;
    crmData: ReturnType<typeof useCrmData>;
}

const initialFormState = {
    title: '',
    contact_id: '',
    time: '09:00',
    duration: 30,
    description: '',
};

type EventFormData = typeof initialFormState;

export const DayEventsModal: React.FC<DayEventsModalProps> = ({ isOpen, onClose, date, crmData }) => {
    const { crmEvents, contacts, organization, refetch } = crmData;
    const [view, setView] = useState<'list' | 'form'>('list');
    const [isSaving, setIsSaving] = useState(false);
    const [eventToEdit, setEventToEdit] = useState<CrmEvent | null>(null);
    const [formData, setFormData] = useState<EventFormData>(initialFormState);
    
    useEffect(() => {
        // Reset state when modal is opened or date changes
        if (isOpen) {
            setView('list');
            setEventToEdit(null);
            setFormData(initialFormState);
        }
    }, [isOpen, date]);
    
    const dayEvents = useMemo(() => {
        if (!date) return [];
        const dateKey = date.toISOString().split('T')[0];
        return crmEvents.filter(e => e.event_start_time.startsWith(dateKey));
    }, [date, crmEvents]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNewEventClick = () => {
        setEventToEdit(null);
        setFormData({ ...initialFormState, contact_id: contacts[0]?.id || '' });
        setView('form');
    };
    
    const handleEditEventClick = (event: CrmEvent) => {
        setEventToEdit(event);
        // Pre-fill form data...
        // ... (this part is left as a placeholder for future implementation)
        toast.error("La modifica degli eventi non è ancora implementata.");
        // setFormData({ ... });
        // setView('form');
    };

    const handleDeleteEvent = async (event: CrmEvent) => {
        if (!organization) { toast.error("ID organizzazione non trovato."); return; }
        if (!window.confirm(`Annullare l'evento "${event.event_summary}"? Sarà rimosso da Google Calendar.`)) return;

        setIsSaving(true);
        const toastId = toast.loading('Annullamento evento...');
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Utente non autenticato.');
            
            const { error } = await supabase.functions.invoke('delete-google-event', {
                headers: { Authorization: `Bearer ${session.access_token}` },
                body: { organization_id: organization.id, google_event_id: event.google_event_id, crm_event_id: event.id }
            });
            if (error) throw new Error(error.message);
            toast.success('Evento annullato!', { id: toastId });
            refetch();
        } catch (err: any) {
            toast.error(`Errore: ${err.message}`, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleSaveEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!organization || !date || !formData.contact_id) {
            toast.error("Dati mancanti per creare l'evento.");
            return;
        }

        if (eventToEdit) {
            // --- EDIT LOGIC (FUTURE) ---
            toast.error("La funzione backend 'update-google-event' non è ancora implementata.");
            // Here you would call supabase.functions.invoke('update-google-event', ...)
            return;
        }

        // --- CREATE LOGIC ---
        setIsSaving(true);
        const toastId = toast.loading("Creazione evento...");
        try {
            const selectedContact = contacts.find(c => c.id === formData.contact_id);
            if (!selectedContact) throw new Error("Contatto selezionato non valido.");

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Utente non autenticato.');

            const eventDetails = {
                date: date.toISOString().split('T')[0],
                time: formData.time,
                duration: Number(formData.duration),
                title: formData.title,
                description: formData.description,
                addMeet: true,
                reminders: [] // Reminders can be added here in the future
            };

            const { data, error } = await supabase.functions.invoke('create-google-event', {
                headers: { Authorization: `Bearer ${session.access_token}` },
                body: { eventDetails, contact: selectedContact, organization_id: organization.id, contact_id: selectedContact.id }
            });

            if (error) throw new Error(error.message);
            if (data.error) throw new Error(data.error);

            toast.success("Evento creato!", { id: toastId });
            refetch();
            setView('list');

        } catch (err: any) {
            toast.error(`Errore: ${err.message}`, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={view === 'form' ? (eventToEdit ? 'Modifica Evento' : 'Nuovo Evento') : `Eventi del ${date?.toLocaleDateString('it-IT')}`}
        >
            {view === 'list' ? (
                <div className="space-y-3">
                    {dayEvents.length > 0 ? (
                        dayEvents.map(event => (
                            <div key={event.id} className="p-3 rounded-md bg-gray-50 border flex items-center justify-between">
                                <div>
                                    <p className="font-semibold">{event.event_summary}</p>
                                    <p className="text-sm text-gray-600">
                                        {new Date(event.event_start_time).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} - {event.contacts?.name}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => handleEditEventClick(event)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-md" title="Modifica"><EditIcon className="w-4 h-4"/></button>
                                    <button onClick={() => handleDeleteEvent(event)} disabled={isSaving} className="p-2 text-red-500 hover:bg-red-100 rounded-md" title="Annulla"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-4">Nessun evento per questo giorno.</p>
                    )}
                    <div className="flex justify-end pt-4 border-t">
                        <button onClick={handleNewEventClick} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2">
                            <PlusIcon className="w-5 h-5" />
                            <span>Nuovo Evento</span>
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSaveEvent} className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Titolo *</label>
                        <input type="text" id="title" name="title" value={formData.title} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 border rounded-md" />
                    </div>
                     <div>
                        <label htmlFor="contact_id" className="block text-sm font-medium text-gray-700">Contatto *</label>
                        <select id="contact_id" name="contact_id" value={formData.contact_id} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 border rounded-md bg-white">
                            <option value="" disabled>Seleziona un contatto</option>
                            {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="time" className="block text-sm font-medium text-gray-700">Ora *</label>
                            <input type="time" id="time" name="time" value={formData.time} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 border rounded-md"/>
                        </div>
                        <div>
                            <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Durata (min) *</label>
                            <input type="number" id="duration" name="duration" value={formData.duration} onChange={handleFormChange} required step="5" min="5" className="mt-1 block w-full px-3 py-2 border rounded-md"/>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrizione</label>
                        <textarea id="description" name="description" value={formData.description} onChange={handleFormChange} rows={3} className="mt-1 block w-full px-3 py-2 border rounded-md"></textarea>
                    </div>
                     <div className="flex justify-end items-center pt-4 border-t space-x-3">
                        <button type="button" onClick={() => setView('list')} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Annulla</button>
                        <button type="submit" disabled={isSaving} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">
                            {isSaving ? 'Salvataggio...' : 'Salva Evento'}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
};
