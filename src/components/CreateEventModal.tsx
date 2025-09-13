// src/components/CreateEventModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Contact, Organization, Reminder, EventFormData, ReminderChannel } from '../types';
import { TrashIcon, PlusIcon, SparklesIcon } from './ui/icons';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

// Props
interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    contact: Contact | null;
    organization: Organization | null;
    onSaveSuccess: () => void; // Callback per ricaricare i dati
}

// Valori predefiniti per i promemoria
const reminderOptions = [
    { label: '15 minuti prima', value: 15 },
    { label: '30 minuti prima', value: 30 },
    { label: '1 ora prima', value: 60 },
    { label: '1 giorno prima', value: 1440 },
];

const defaultMessage = (channel: ReminderChannel, title: string, contactName: string) => {
    if (channel === 'WhatsApp') {
        return `Ciao ${contactName.split(' ')[0]}! Ti ricordo del nostro appuntamento "${title}" tra poco. A presto!`;
    }
    return `Ciao ${contactName.split(' ')[0]},\n\nQuesto è un promemoria per il nostro appuntamento: "${title}".\n\nA presto!`;
};

// Componente
export const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, contact, organization, onSaveSuccess }) => {
    const [formData, setFormData] = useState<EventFormData>({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        duration: 30,
        location: '',
        description: '',
        addMeet: true,
        reminders: [],
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // Resetta e pre-compila il form quando il contatto cambia
    useEffect(() => {
        if (contact) {
            setFormData({
                title: `Incontro con ${contact.name}`,
                date: new Date().toISOString().split('T')[0],
                time: '10:00',
                duration: 30,
                location: '',
                description: `Discussione su opportunità di collaborazione.`,
                addMeet: true,
                reminders: [],
            });
        }
    }, [contact, isOpen]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: name === 'duration' ? parseInt(value) : value }));
        }
    };

    const handleReminderChange = (index: number, field: keyof Reminder, value: string | number) => {
        const newReminders = [...formData.reminders];
        (newReminders[index] as any)[field] = value;
        setFormData(prev => ({ ...prev, reminders: newReminders }));
    };

    const addReminder = () => {
        if (!contact) return;
        const newReminder: Reminder = {
            id: Date.now().toString(),
            minutesBefore: 15,
            channel: 'Email',
            message: defaultMessage('Email', formData.title, contact.name),
        };
        setFormData(prev => ({ ...prev, reminders: [...prev.reminders, newReminder] }));
    };
    
    const removeReminder = (index: number) => {
        setFormData(prev => ({ ...prev, reminders: prev.reminders.filter((_, i) => i !== index) }));
    };

    const handleGenerateMessage = async (index: number) => {
        if (!contact || !organization) return;
        setIsGenerating(true);
        const reminder = formData.reminders[index];
        const toastId = toast.loading('Genero il messaggio del promemoria...');

        try {
            const prompt = `Scrivi un breve e amichevole messaggio di promemoria per un appuntamento. Il canale è ${reminder.channel}. L'appuntamento è "${formData.title}".`;
            const functionName = reminder.channel === 'WhatsApp' ? 'generate-whatsapp-message' : 'generate-email-content';

            const { data, error } = await supabase.functions.invoke(functionName, {
                body: { prompt, contact, organization_id: organization.id }
            });
            if (error) throw error;
            if (data.error) throw new Error(data.error);

            const generatedText = data.message || data.email;
            handleReminderChange(index, 'message', generatedText);
            toast.success('Messaggio generato!', { id: toastId });

        } catch (err: any) {
            toast.error(`Errore: ${err.message}`, { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contact || !organization) return;
        
        setIsSaving(true);
        const toastId = toast.loading('Creazione evento in corso...');

        try {
            const { data, error } = await supabase.functions.invoke('create-google-event', {
                body: { 
                    eventDetails: formData, // L'intera struttura del form, inclusi i promemoria
                    contact: contact,
                    organization_id: organization.id
                },
            });

            if (error) throw new Error(error.message);
            if (data.error) throw new Error(data.error);

            toast.success('Evento creato con successo su Google Calendar!', { id: toastId });
            onSaveSuccess(); // Notifica il genitore per ricaricare i dati se necessario
            onClose();

        } catch (err: any) {
            toast.error(`Errore: ${err.message}`, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    if (!contact) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Pianifica incontro con ${contact.name}`}>
            <form onSubmit={handleSaveEvent} className="space-y-4">
                {/* Dettagli Evento */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Titolo Evento</label>
                    <input type="text" id="title" name="title" value={formData.title} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700">Data</label>
                        <input type="date" id="date" name="date" value={formData.date} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
                    </div>
                    <div>
                        <label htmlFor="time" className="block text-sm font-medium text-gray-700">Ora</label>
                        <input type="time" id="time" name="time" value={formData.time} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
                    </div>
                    <div>
                        <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Durata</label>
                        <select id="duration" name="duration" value={formData.duration} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                            <option value={15}>15 minuti</option>
                            <option value={30}>30 minuti</option>
                            <option value={45}>45 minuti</option>
                            <option value={60}>1 ora</option>
                            <option value={90}>1 ora e 30 min</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">Luogo</label>
                    <input type="text" id="location" name="location" value={formData.location} onChange={handleFormChange} placeholder="Es: Ufficio, Link Zoom, ecc." className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Note / Agenda</label>
                    <textarea id="description" name="description" value={formData.description} onChange={handleFormChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"></textarea>
                </div>
                <div className="flex items-center">
                    <input id="addMeet" name="addMeet" type="checkbox" checked={formData.addMeet} onChange={handleFormChange} className="focus:ring-primary h-4 w-4 text-primary border-gray-300 rounded"/>
                    <label htmlFor="addMeet" className="ml-2 block text-sm text-gray-900">Aggiungi videoconferenza Google Meet</label>
                </div>
                
                {/* Promemoria Smart */}
                <div className="pt-4 border-t">
                    <h3 className="text-lg font-medium text-gray-900">Promemoria Smart</h3>
                    <div className="space-y-4 mt-2">
                        {formData.reminders.map((reminder, index) => (
                            <div key={reminder.id} className="p-3 bg-gray-50 rounded-md border space-y-2">
                                <div className="flex justify-between items-center">
                                     <div className="flex items-center gap-2">
                                        <select value={reminder.minutesBefore} onChange={(e) => handleReminderChange(index, 'minutesBefore', parseInt(e.target.value))} className="w-48 px-2 py-1 border border-gray-300 rounded-md text-sm">
                                            {reminderOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                        <select value={reminder.channel} onChange={(e) => handleReminderChange(index, 'channel', e.target.value as ReminderChannel)} className="w-32 px-2 py-1 border border-gray-300 rounded-md text-sm">
                                            <option value="Email">via Email</option>
                                            <option value="WhatsApp">via WhatsApp</option>
                                        </select>
                                    </div>
                                    <button type="button" onClick={() => removeReminder(index)} className="p-1 text-red-500 hover:bg-red-100 rounded-full"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                                <textarea value={reminder.message} onChange={(e) => handleReminderChange(index, 'message', e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm" />
                                <div className="flex justify-end">
                                    <button type="button" onClick={() => handleGenerateMessage(index)} disabled={isGenerating} className="text-xs bg-indigo-100 text-primary px-2 py-1 rounded-md hover:bg-indigo-200 flex items-center gap-1">
                                        <SparklesIcon className="w-3 h-3"/> Genera con AI
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addReminder} className="mt-2 text-sm text-primary font-semibold hover:text-indigo-700 flex items-center gap-1">
                        <PlusIcon className="w-4 h-4"/> Aggiungi Promemoria
                    </button>
                </div>
                
                {/* Azioni */}
                <div className="flex justify-end pt-4 border-t mt-4">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 mr-2">Annulla</button>
                    <button type="submit" disabled={isSaving} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">{isSaving ? 'Creazione...' : 'Crea Evento'}</button>
                </div>
            </form>
        </Modal>
    );
};
