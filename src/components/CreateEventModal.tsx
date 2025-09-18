// Gli import vanno sempre puliti e organizzati dopo ogni refactor o patch.
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import { invokeSupabaseFunction } from '../lib/api';
import { combineDateAndTime, generateTimeSlots, TimeSlot } from '../lib/eventUtils';
import { Contact, Organization, OrganizationSettings } from '../types';
import { Modal } from './ui/Modal';
import { SaveIcon, WhatsAppIcon } from './ui/icons';

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    contact: Contact | null;
    organization: Organization | null;
    organizationSettings: OrganizationSettings | null;
    onSaveSuccess: () => void;
}

const defaultReminders = [
    { minutesBefore: 1440, channel: 'Email', message: 'Questo è un promemoria per il tuo appuntamento di domani.', enabled: false },
    { minutesBefore: 60, channel: 'WhatsApp', message: 'Ciao! Ti ricordiamo il nostro appuntamento tra circa un\'ora. A presto!', enabled: false },
];

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
    isOpen,
    onClose,
    contact,
    organization,
    organizationSettings,
    onSaveSuccess
}) => {
    const [summary, setSummary] = useState('');
    const [description, setDescription] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [duration, setDuration] = useState(30);
    const [isFetchingSlots, setIsFetchingSlots] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [reminders, setReminders] = useState(defaultReminders);
    
    // Reset state when modal opens or contact changes
    useEffect(() => {
        if (isOpen && contact) {
            setSummary(`Appuntamento con ${contact.name}`);
            setDescription('');
            const today = new Date();
            today.setHours(0,0,0,0);
            setSelectedDate(today);
            setSelectedTime('');
            setTimeSlots([]);
            setReminders(defaultReminders);
        }
    }, [isOpen, contact]);

    // Fetch busy slots when date changes
    useEffect(() => {
        const fetchSlots = async () => {
            if (!isOpen || !organizationSettings?.google_auth_token) {
                setTimeSlots(generateTimeSlots(selectedDate, []));
                return;
            }
            setIsFetchingSlots(true);
            try {
                const dateString = selectedDate.toISOString().split('T')[0];
                const data = await invokeSupabaseFunction(
                    'get-google-calendar-events',
                    { organization_id: organization?.id, date: dateString },
                    true,
                    organizationSettings
                );
                setTimeSlots(generateTimeSlots(selectedDate, data.busySlots, duration));
            } catch (err: any) {
                toast.error(`Impossibile caricare disponibilità: ${err.message}`);
                setTimeSlots(generateTimeSlots(selectedDate, [])); // Mostra slot senza verifica
            } finally {
                setIsFetchingSlots(false);
            }
        };
        fetchSlots();
    }, [selectedDate, duration, isOpen, organization, organizationSettings]);

    const handleReminderChange = (index: number) => {
        setReminders(prev => prev.map((r, i) => i === index ? { ...r, enabled: !r.enabled } : r));
    };

    const handleSave = async () => {
        if (!contact || !organization || !selectedTime) {
            toast.error("Contatto, data e ora sono obbligatori.");
            return;
        }
        setIsSaving(true);
        const toastId = toast.loading('Creazione evento in corso...');

        try {
            const startTime = combineDateAndTime(selectedDate, selectedTime);
            const endTime = new Date(startTime.getTime() + duration * 60000);

            // Stampa del payload per il debug, come richiesto in precedenza
            console.log('[Guardian AI Debug] Payload per create-google-event:', {
                event: {
                    summary: summary,
                    startDateTime: startTime.toISOString(),
                    endDateTime: endTime.toISOString(),
                }
            });

            // 1. Crea l'evento su Google Calendar
            const { googleEventId } = await invokeSupabaseFunction(
                'create-google-event',
                {
                    event_summary: summary,
                    event_description: description,
                    event_start_time: startTime.toISOString(),
                    event_end_time: endTime.toISOString(),
                    attendee_email: contact.email,
                },
                true,
                organizationSettings
            );
            
            // 2. Salva l'evento nel CRM
            const { crmEvent } = await invokeSupabaseFunction(
                'create-crm-event',
                {
                    organization_id: organization.id,
                    contact_id: contact.id,
                    event_summary: summary,
                    event_description: description,
                    event_start_time: startTime.toISOString(),
                    event_end_time: endTime.toISOString(),
                    google_event_id: googleEventId,
                },
                false // Non serve il token google qui
            );
            
            // 3. Schedula i promemoria
            const activeReminders = reminders.filter(r => r.enabled);
            if (activeReminders.length > 0) {
                 await invokeSupabaseFunction(
                    'schedule-event-reminders',
                    {
                        organization_id: organization.id,
                        crm_event_id: crmEvent.id,
                        event_start_time: startTime.toISOString(),
                        reminders: activeReminders
                    },
                    false
                 );
            }

            toast.success('Evento creato con successo!', { id: toastId });
            onSaveSuccess();
            onClose();
        } catch (err: any) {
            toast.error(`Errore: ${err.message}`, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Nuovo Evento per ${contact?.name}`}>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div>
                    <label htmlFor="summary" className="block text-sm font-medium text-gray-700">Oggetto</label>
                    <input type="text" id="summary" value={summary} onChange={e => setSummary(e.target.value)} className="mt-1 w-full input-std" />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrizione</label>
                    <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 w-full input-std" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700">Data</label>
                        <input type="date" id="date" value={selectedDate.toISOString().split('T')[0]} onChange={e => setSelectedDate(new Date(e.target.value))} className="mt-1 w-full input-std" />
                    </div>
                    <div>
                        <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Durata</label>
                        <select id="duration" value={duration} onChange={e => setDuration(Number(e.target.value))} className="mt-1 w-full input-std">
                            <option value={15}>15 min</option>
                            <option value={30}>30 min</option>
                            <option value={45}>45 min</option>
                            <option value={60}>60 min</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Orario</label>
                     {isFetchingSlots ? <div className="text-center p-4">Caricamento disponibilità...</div> :
                        <div className="mt-2 grid grid-cols-4 gap-2">
                            {timeSlots.map(slot => (
                                <button key={slot.time} onClick={() => setSelectedTime(slot.time)} disabled={!slot.available}
                                    className={`px-3 py-2 rounded-md text-sm font-semibold text-center ${
                                        selectedTime === slot.time ? 'bg-primary text-white' : 
                                        slot.available ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' : 'bg-gray-50 text-gray-400 cursor-not-allowed line-through'
                                    }`}>
                                    {slot.time}
                                </button>
                            ))}
                        </div>
                     }
                </div>
                <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Promemoria Automatici</h4>
                    <div className="space-y-2">
                        {reminders.map((reminder, index) => (
                            <label key={index} className="flex items-center p-2 border rounded-md hover:bg-gray-50 cursor-pointer">
                                <input type="checkbox" checked={reminder.enabled} onChange={() => handleReminderChange(index)} className="h-4 w-4 rounded text-primary focus:ring-primary"/>
                                <span className="ml-3 text-sm text-gray-800">
                                    {reminder.channel === 'Email' ? '📧' : <WhatsAppIcon className="w-4 h-4 inline-block"/>} Invia {reminder.channel} {reminder.minutesBefore / 60}h prima
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex justify-end pt-4 border-t mt-4">
                <button type="button" onClick={onClose} className="btn-secondary mr-2">Annulla</button>
                <button onClick={handleSave} disabled={isSaving || !selectedTime} className="btn-primary flex items-center space-x-2">
                    <SaveIcon className="w-5 h-5"/>
                    <span>{isSaving ? 'Salvataggio...' : 'Salva Evento'}</span>
                </button>
            </div>
        </Modal>
    );
};