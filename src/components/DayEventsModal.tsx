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
    const { 
        crmEvents = [], 
        contacts = [], 
        organization = null, 
        organizationSettings = null,
        refetch = async () => {} 
    } = crmData || {};

    const [view, setView] = useState<'list' | 'form'>('list');
    const [isSaving, setIsSaving] = useState(false);
    const [eventToEdit, setEventToEdit] = useState<CrmEvent | null>(null);
    const [formData, setFormData] = useState<EventFormData>(initialFormState);
    const [syncWithGoogle, setSyncWithGoogle] = useState(true);

    const googleConnectionStatus = useMemo(() => {
        const token = organizationSettings?.google_auth_token;
        if (typeof token !== 'string' || token.trim() === '') {
            return 'disconnected';
        }
        try {
            const parsedToken = JSON.parse(token);
            if (typeof parsedToken.access_token === 'string' && typeof parsedToken.refresh_token === 'string') {
                return 'connected';
            } else {
                return 'corrupted';
            }
        } catch (e) {
            console.error("[DayEventsModal] ERRORE: Impossibile analizzare `google_auth_token`. L'integrazione è corrotta.", e);
            return 'corrupted';
        }
    }, [organizationSettings]);
    
    useEffect(() => {
        if (isOpen) {
            // LOG 1: All'apertura della modale, logga tutti i dati ricevuti.
            console.log('[DEBUG] Event modal opened - crmData:', crmData);
            
            setView('list');
            setEventToEdit(null);
            setFormData(initialFormState);
            setSyncWithGoogle(true);
        }
    }, [isOpen, date, crmData]);
    
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
            description: '', // Descrizione non è salvata nel DB, quindi la resettiamo.
        });
        setView('form');
    };

    const handleDeleteEvent = async (event: CrmEvent) => {
        setIsSaving(true);
        const toastId = toast.loading('Eliminazione in corso...');
        try {
            if (event.google_event_id && organization) {
                if (!window.confirm(`Annullare l'evento "${event.event_summary}"? Sarà rimosso anche da Google Calendar.`)) {
                    setIsSaving(false);
                    toast.dismiss(toastId);
                    return;
                }
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) throw new Error('Utente non autenticato.');
                
                const { error } = await supabase.functions.invoke('delete-google-event', {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                    body: { organization_id: organization.id, google_event_id: event.google_event_id, crm_event_id: event.id }
                });
                if (error) throw new Error(error.message);
                toast.success('Evento annullato e sincronizzato!', { id: toastId });
            } else {
                if (!window.confirm(`Eliminare l'evento (solo CRM) "${event.event_summary}"?`)) {
                     setIsSaving(false);
                     toast.dismiss(toastId);
                     return;
                }
                const { error } = await supabase.from('crm_events').delete().eq('id', event.id);
                if (error) throw error;
                toast.success('Evento CRM eliminato!', { id: toastId });
            }
            await refetch();
        } catch (err: any) {
            const errorMessage = err.message || '';
            if (errorMessage.includes('Riconnetti il tuo account Google') || errorMessage.includes('Integrazione Google Calendar non trovata')) {
                toast.error(t => (
                    <span className="text-center">
                        La connessione Google è scaduta.
                        <a href="/settings" onClick={() => toast.dismiss(t.id)} className="block mt-2 font-bold underline text-indigo-600 hover:text-indigo-500">
                            Vai alle Impostazioni per riconnettere
                        </a>
                    </span>
                ), { id: toastId, duration: 8000 });
            } else {
                toast.error(`Errore: ${errorMessage}`, { id: toastId });
            }
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleSaveEvent = async (e: React.FormEvent) => {
        e.preventDefault();
    
        console.log('[DEBUG] Inizio salvataggio evento. Dati correnti:', {
            formData,
            organization,
            contact_id: formData.contact_id,
            googleStatus: googleConnectionStatus
        });
    
        if (!organization || !date || !formData.contact_id) {
            toast.error("Dati mancanti (organizzazione, data o contatto) per salvare l'evento.");
            console.error('[DEBUG] ERRORE: Uscita anticipata da handleSaveEvent. Dati mancanti:', {
                hasOrganization: !!organization, hasDate: !!date, hasContactId: !!formData.contact_id,
            });
            return;
        }
    
        setIsSaving(true);
        const toastId = toast.loading(eventToEdit ? "Modifica in corso..." : "Creazione evento...");
    
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const localDateString = `${year}-${month}-${day}`;
    
        const startDateTime = new Date(`${localDateString}T${formData.time}:00`);
        const endDateTime = new Date(startDateTime.getTime() + Number(formData.duration) * 60000);
    
        const saveCrmOnly = async (isUpdate: boolean) => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Utente non autenticato per il salvataggio CRM-only.');
    
            if (isUpdate && eventToEdit) {
                const updatePayload = {
                    event_summary: formData.title,
                    event_start_time: startDateTime.toISOString(),
                    event_end_time: endDateTime.toISOString(),
                };
                console.log('[DEBUG] Tentativo di AGGIORNAMENTO evento SOLO CRM. Payload:', updatePayload);
                const { error } = await supabase.from('crm_events').update(updatePayload).eq('id', eventToEdit.id);
                if (error) {
                    console.error('[DEBUG] Errore durante AGGIORNAMENTO SOLO CRM:', error);
                    throw error;
                }
            } else {
                const createPayload = {
                    organization_id: organization.id,
                    contact_id: formData.contact_id,
                    event_summary: formData.title,
                    event_start_time: startDateTime.toISOString(),
                    event_end_time: endDateTime.toISOString(),
                };
    
                console.log('[DEBUG] Chiamata a "create-crm-event". Payload:', createPayload);
                const { data, error } = await supabase.functions.invoke('create-crm-event', {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                    body: createPayload
                });
                console.log('[DEBUG] Risposta da "create-crm-event":', { data, error });
    
                if (error) throw new Error(error.message);
                if (data && data.error) throw new Error(data.error);
            }
        };
    
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Utente non autenticato.');
    
            if (eventToEdit) {
                // LOGICA DI MODIFICA
                if (googleConnectionStatus === 'connected' && eventToEdit.google_event_id) {
                    const eventDetails = { date: localDateString, time: formData.time, duration: Number(formData.duration), title: formData.title, description: formData.description };
                    const requestBody = { 
                        organization_id: organization.id, 
                        crm_event_id: eventToEdit.id, 
                        eventDetails,
                        ...eventDetails
                    };
    
                    console.log('[DEBUG] Chiamata a "update-google-event". Payload:', requestBody);
                    const { data, error } = await supabase.functions.invoke('update-google-event', {
                        headers: { Authorization: `Bearer ${session.access_token}` },
                        body: requestBody
                    });
                    console.log('[DEBUG] Risposta da "update-google-event":', { data, error });
                    if (error) throw new Error(error.message);
                    if (data && data.error) throw new Error(data.error);
    
                    toast.success("Evento modificato e sincronizzato!", { id: toastId });
                } else {
                    await saveCrmOnly(true);
                    toast.success("Evento CRM modificato!", { id: toastId });
                }
            } else {
                // LOGICA DI CREAZIONE
                if (googleConnectionStatus === 'connected' && syncWithGoogle) {
                    const selectedContact = contacts.find(c => c.id === formData.contact_id);
                    if (!selectedContact) throw new Error("Contatto selezionato non valido.");
                    const eventDetails = { date: localDateString, time: formData.time, duration: Number(formData.duration), title: formData.title, description: formData.description, addMeet: true, reminders: [] };
                    const requestBody = { 
                        ...eventDetails,
                        eventDetails, 
                        contact: selectedContact, 
                        organization_id: organization.id, 
                        contact_id: selectedContact.id 
                    };
    
                    console.log('[DEBUG] Chiamata a "create-google-event". Payload:', requestBody);
                    const { data, error } = await supabase.functions.invoke('create-google-event', {
                        headers: { Authorization: `Bearer ${session.access_token}` },
                        body: requestBody
                    });
                    console.log('[DEBUG] Risposta da "create-google-event":', { data, error });
    
                    if (error) throw new Error(error.message);
                    if (data && data.error) throw new Error(data.error);
    
                    toast.success("Evento creato e sincronizzato!", { id: toastId });
                } else {
                    await saveCrmOnly(false);
                    toast.success("Evento CRM creato!", { id: toastId });
                }
            }
            await refetch();
            setView('list');
        } catch (err: any) {
            console.error('[DEBUG] Errore CRITICO nel blocco catch principale:', err);
            const errorMessage = err.message || '';
            if (errorMessage.includes('Riconnetti il tuo account Google') || errorMessage.includes('Integrazione Google Calendar non trovata')) {
                toast.error(t => (
                    <span className="text-center">
                        La connessione Google è scaduta.
                        <a href="/settings" onClick={() => toast.dismiss(t.id)} className="block mt-2 font-bold underline text-indigo-600 hover:text-indigo-500">
                            Vai alle Impostazioni per riconnettere
                        </a>
                    </span>
                ), { id: toastId, duration: 8000 });
            } else {
                toast.error(`Operazione fallita: ${errorMessage}`, { id: toastId, duration: 5000 });
            }
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
                    {googleConnectionStatus === 'connected' && !eventToEdit && (
                        <div className="flex items-center pt-2">
                            <input type="checkbox" id="syncWithGoogle" name="syncWithGoogle" checked={syncWithGoogle} onChange={(e) => setSyncWithGoogle(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"/>
                            <label htmlFor="syncWithGoogle" className="ml-2 block text-sm text-gray-900">Sincronizza con Google Calendar</label>
                        </div>
                    )}
                    {googleConnectionStatus === 'corrupted' && (
                        <div className="p-3 my-2 bg-yellow-100 text-yellow-800 text-sm rounded-md border border-yellow-200">
                            <p><strong>Attenzione:</strong> L'integrazione con Google Calendar sembra corrotta. Vai su <a href="/settings" className="underline font-semibold">Impostazioni</a> per riconnettere il tuo account.</p>
                        </div>
                    )}
                    {googleConnectionStatus === 'disconnected' && !eventToEdit && (
                         <div className="p-3 my-2 bg-gray-100 text-gray-700 text-sm rounded-md border">
                            <p>Connetti il tuo account Google dalle <a href="/settings" className="underline font-semibold">Impostazioni</a> per sincronizzare questo evento.</p>
                        </div>
                    )}
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
