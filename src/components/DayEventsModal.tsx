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
    // FIX: Aggiunta una destrutturazione sicura con valori di default.
    // Questo previene crash se crmData o le sue proprietà non sono disponibili,
    // garantendo che `contacts` e `crmEvents` siano sempre array.
    const { 
        crmEvents = [], 
        contacts = [], 
        organization = null, 
        refetch = async () => {} 
    } = crmData || {};

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
        return crmEvents
            .filter(e => e.event_start_time && e.event_start_time.startsWith(dateKey) && e.status !== 'cancelled')
            .sort((a,b) => new Date(a.event_start_time).getTime() - new Date(b.event_start_time).getTime());
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
        
        const startTime = new Date(event.event_start_time);
        const endTime = new Date(event.event_end_time);
        const duration = (endTime.getTime() - startTime.getTime()) / 60000;
        
        setFormData({
            title: event.event_summary,
            contact_id: event.contact_id,
            time: startTime.toTimeString().substring(0, 5),
            duration: duration,
            description: '', // Description is not stored in crm_events currently
        });
        setView('form');
    };

    const handleDeleteEvent = async (event: CrmEvent) => {
        // Se non c'è un google_event_id, è un evento solo CRM e possiamo cancellarlo direttamente
        if (!event.google_event_id) {
            if (!window.confirm(`Eliminare l'evento (solo CRM) "${event.event_summary}"?`)) return;
             setIsSaving(true);
             const toastId = toast.loading('Eliminazione evento...');
            try {
                const { error } = await supabase.from('crm_events').delete().eq('id', event.id);
                if (error) throw error;
                toast.success('Evento CRM eliminato!', { id: toastId });
                await refetch();
            } catch (err: any) {
                toast.error(`Errore: ${err.message}`, { id: toastId });
            } finally {
                setIsSaving(false);
            }
            return;
        }

        // Se c'è un google_event_id, è un evento sincronizzato
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
            await refetch();
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
        
        setIsSaving(true);
        const toastId = toast.loading(eventToEdit ? "Modifica in corso..." : "Creazione evento...");

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Utente non autenticato.');

            const eventDetails = {
                date: date.toISOString().split('T')[0],
                time: formData.time,
                duration: Number(formData.duration),
                title: formData.title,
                description: formData.description,
            };

            if (eventToEdit) {
                 const { error } = await supabase.functions.invoke('update-google-event', {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                    body: { organization_id: organization.id, crm_event_id: eventToEdit.id, eventDetails }
                });
                if (error) throw new Error(error.message);
                toast.success("Evento modificato!", { id: toastId });

            } else {
                const selectedContact = contacts.find(c => c.id === formData.contact_id);
                if (!selectedContact) throw new Error("Contatto selezionato non valido.");

                const { data, error } = await supabase.functions.invoke('create-google-event', {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                    body: { 
                        eventDetails: { ...eventDetails, addMeet: true, reminders: [] }, 
                        contact: selectedContact, 
                        organization_id: organization.id, 
                        contact_id: selectedContact.id 
                    }
                });
                if (error) throw new Error(error.message);
                if (data.error) throw new Error(data.error);
                toast.success("Evento creato!", { id: toastId });
            }

            await refetch();
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
            title={view === 'form' ? (eventToEdit ? 'Modifica Evento' : 'Nuovo Evento') : `Eventi del ${date?.toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
        >
            {view === 'list' ? (
                <div className="space-y-3">
                    {dayEvents.length > 0 ? (
                        dayEvents.map(event => {
                            const contact = contacts.find(c => c.id === event.contact_id);
                            return (
                                <div key={event.id} className="p-3 rounded-md bg-gray-50 border flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold">{event.event_summary}</p>
                                        <p className="text-sm text-gray-600">
                                            {new Date(event.event_start_time).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} - {contact?.name || 'Contatto non trovato'}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button onClick={() => handleEditEventClick(event)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-md" title="Modifica"><EditIcon className="w-4 h-4"/></button>
                                        <button onClick={() => handleDeleteEvent(event)} disabled={isSaving} className="p-2 text-red-500 hover:bg-red-100 rounded-md" title="Annulla"><TrashIcon className="w-4 h-4"/></button>
                                    </div>
                                </div>
                            );
                        })
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
                        <select id="contact_id" name="contact_id" value={formData.contact_id} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 border rounded-md bg-white" disabled={!!eventToEdit}>
                            <option value="" disabled>Seleziona un contatto</option>
                            {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                         {eventToEdit && <p className="text-xs text-gray-500 mt-1">Il contatto non può essere modificato per un evento esistente.</p>}
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
                        <textarea id="description" name="description" value={formData.description} onChange={handleFormChange} rows={3} className="mt-1 block w-full px-3 py-2 border rounded-md" placeholder="Note per l'evento, visibili in Google Calendar"></textarea>
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