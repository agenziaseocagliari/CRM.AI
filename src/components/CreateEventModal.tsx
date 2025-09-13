import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { Modal } from './ui/Modal';
import { Contact, Organization, EventFormData, Reminder, BusySlot, EventTemplate } from '../types';
import { PlusIcon, TrashIcon, ClockIcon, VideoIcon, TemplateIcon, SaveIcon } from './ui/icons';

const initialEventState: EventFormData = {
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    duration: 30,
    location: '',
    description: '',
    addMeet: false,
    reminders: [],
};

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];
const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
    const hours = Math.floor(i / 2);
    const minutes = (i % 2) * 30;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
});

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    contact: Contact | null;
    organization: Organization | null;
    onSaveSuccess: () => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, contact, organization, onSaveSuccess }) => {
    const [formData, setFormData] = useState<EventFormData>(initialEventState);
    const [busySlots, setBusySlots] = useState<BusySlot[]>([]);
    const [templates, setTemplates] = useState<EventTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingSlots, setIsFetchingSlots] = useState(false);

    const resetState = useCallback(() => {
        setFormData(initialEventState);
        setBusySlots([]);
        setIsLoading(false);
        setIsFetchingSlots(false);
    }, []);

    useEffect(() => {
        if (isOpen && contact) {
            // FIX: Rimosso il parametro 'prev' non utilizzato.
            // Il nuovo stato non dipende da quello precedente, quindi possiamo impostarlo direttamente.
            setFormData({ ...initialEventState, title: `Incontro con ${contact.name}` });
            const savedTemplates = organization ? JSON.parse(localStorage.getItem(`event_templates_${organization.id}`) || '[]') : [];
            setTemplates(savedTemplates);
        } else if (!isOpen) {
            resetState();
        }
    }, [isOpen, contact, organization, resetState]);

    const fetchBusySlots = useCallback(async (date: string) => {
        if (!organization || !date) return;
        setIsFetchingSlots(true);
        try {
            const { data, error } = await supabase.functions.invoke('get-google-calendar-events', {
                body: { organization_id: organization.id, date },
            });
            if (error) throw new Error(error.message);
            if (data.error) throw new Error(data.error);
            setBusySlots(data.busySlots || []);
        } catch (err: any) {
            toast.error(`Impossibile caricare disponibilità: ${err.message}`);
            setBusySlots([]);
        } finally {
            setIsFetchingSlots(false);
        }
    }, [organization]);

    useEffect(() => {
        if (isOpen && formData.date) {
            fetchBusySlots(formData.date);
        }
    }, [isOpen, formData.date, fetchBusySlots]);

    const availableTimeSlots = useMemo(() => {
        return TIME_SLOTS.filter(slot => {
            const slotStart = new Date(`${formData.date}T${slot}:00`);
            return !busySlots.some(busy => {
                const busyStart = new Date(busy.start);
                const busyEnd = new Date(busy.end);
                return slotStart >= busyStart && slotStart < busyEnd;
            });
        });
    }, [formData.date, busySlots]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (name === 'duration' ? parseInt(value) : value),
        }));
    };
    
    const addReminder = () => setFormData(prev => ({ ...prev, reminders: [...prev.reminders, { id: Date.now().toString(), minutesBefore: 10, channel: 'Email', message: `Promemoria: ${prev.title}` }] }));
    const removeReminder = (id: string) => setFormData(prev => ({ ...prev, reminders: prev.reminders.filter(r => r.id !== id) }));
    const handleReminderChange = (id: string, field: keyof Omit<Reminder, 'id'| 'message'>, value: string | number) => {
        setFormData(prev => ({ ...prev, reminders: prev.reminders.map(r => r.id === id ? { ...r, [field]: value } : r) }));
    };

    const handleSaveTemplate = () => {
      const name = window.prompt("Nome del template:");
      if (!name || !organization) return;
      const newTemplate: EventTemplate = {
        id: Date.now().toString(), name,
        data: { title: `Appuntamento con ${contact?.name || ''}`, duration: formData.duration, location: formData.location, description: formData.description, addMeet: formData.addMeet, reminders: formData.reminders }
      };
      const updatedTemplates = [...templates, newTemplate];
      setTemplates(updatedTemplates);
      localStorage.setItem(`event_templates_${organization.id}`, JSON.stringify(updatedTemplates));
      toast.success("Template salvato!");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!organization || !contact) return;
        setIsLoading(true);
        const toastId = toast.loading("Creazione evento...");
        try {
            const { data, error } = await supabase.functions.invoke('create-google-event', {
                body: { eventDetails: formData, contact, organization_id: organization.id, contact_id: contact.id }
            });

            if (error) throw new Error(error.message);
            if (data.error) throw new Error(data.error);

            if (formData.reminders.length > 0 && data.crmEventId) {
                await supabase.functions.invoke('schedule-event-reminders', {
                    body: { organization_id: organization.id, crm_event_id: data.crmEventId, event_start_time: data.event.start.dateTime, reminders: formData.reminders }
                });
            }

            toast.success("Evento creato e sincronizzato!", { id: toastId });
            onSaveSuccess();
            onClose();
        } catch (err: any) {
            toast.error(`Errore: ${err.message}`, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Crea Evento per ${contact?.name}`}>
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Titolo evento" required className="w-full p-2 border rounded-md" />
                    <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Luogo o link" className="w-full p-2 border rounded-md" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="date" name="date" value={formData.date} onChange={handleChange} required className="w-full p-2 border rounded-md" />
                     <select name="time" value={formData.time} onChange={handleChange} required className="w-full p-2 border rounded-md">
                        {isFetchingSlots ? <option>Caricamento...</option> : availableTimeSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                    </select>
                    <div className="flex items-center space-x-2"><ClockIcon className="w-5 h-5 text-gray-400" /><select name="duration" value={formData.duration} onChange={handleChange} required className="w-full p-2 border rounded-md">
                        {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d} min</option>)}
                    </select></div>
                </div>
                 <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Descrizione e note" rows={3} className="w-full p-2 border rounded-md"></textarea>
                 <div className="flex items-center"><input type="checkbox" id="addMeet" name="addMeet" checked={formData.addMeet} onChange={handleChange} className="mr-2" /><label htmlFor="addMeet" className="flex items-center"><VideoIcon className="w-5 h-5 mr-1" />Aggiungi Google Meet</label></div>
                <div>
                    <h4 className="font-medium text-gray-800">Promemoria</h4>
                    <div className="space-y-2 mt-1">
                        {formData.reminders.map(r => (
                            <div key={r.id} className="flex items-center space-x-2 bg-gray-50 p-2 rounded-md">
                                <input type="number" value={r.minutesBefore} onChange={e => handleReminderChange(r.id, 'minutesBefore', parseInt(e.target.value))} className="w-20 p-1 border rounded-md" />
                                <span>minuti prima via</span>
                                <select value={r.channel} onChange={e => handleReminderChange(r.id, 'channel', e.target.value)} className="p-1 border rounded-md">
                                    <option value="Email">Email</option>
                                    <option value="WhatsApp">WhatsApp</option>
                                </select>
                                <button type="button" onClick={() => removeReminder(r.id)}><TrashIcon className="w-4 h-4 text-red-500 hover:text-red-700" /></button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addReminder} className="text-primary hover:underline mt-2 flex items-center space-x-1"><PlusIcon className="w-4 h-4" /><span>Aggiungi promemoria</span></button>
                </div>
                <div className="flex justify-between items-center pt-4 border-t mt-4">
                    <div className="flex items-center space-x-2">
                        <button type="button" onClick={handleSaveTemplate} title="Salva come Template" className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"><SaveIcon className="w-5 h-5"/></button>
                        <button type="button" title="Carica da Template" className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"><TemplateIcon className="w-5 h-5"/></button>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Annulla</button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">{isLoading ? 'Salvataggio...' : 'Crea Evento'}</button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};