// src/components/CreateEventModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
// FIX: Corrected the import for Link from 'react-router-dom' to resolve module export errors.
import { Link } from 'react-router-dom';

import { invokeSupabaseFunction } from '../lib/api';
import { generateTimeSlots, combineDateAndTime } from '../lib/eventUtils';
import { Contact, Organization, CrmEvent } from '../types';

import {
    GoogleIcon,
    InfoIcon,
    SaveIcon,
    TrashIcon,
    WhatsAppIcon
} from './ui/icons';
import { Modal } from './ui/Modal';

import { diagnosticLogger } from '../lib/mockDiagnosticLogger';
// Props for the component
interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    contact: Contact | null;
    organization: Organization | null;
    // FIX: Replaced `organizationSettings` with `isCalendarLinked` to use the correct state property for Google Calendar connection status. This resolves the type error.
    isCalendarLinked: boolean;
    onActionSuccess: () => void;
}

// State for the form
interface EventFormData {
    summary: string;
    description: string;
    date: string;
    startTime: string;
    endTime: string;
    createGoogleEvent: boolean;
    reminders: {
        channel: 'Email' | 'WhatsApp';
        minutesBefore: number;
        message: string;
    }[];
}

// Initial state for the form
const initialFormState: EventFormData = {
    summary: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    createGoogleEvent: true,
    reminders: [],
};

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
    isOpen,
    onClose,
    contact,
    organization,
    isCalendarLinked,
    onActionSuccess,
}) => {
    const [formData, setFormData] = useState<EventFormData>(initialFormState);
    const [isSaving, setIsSaving] = useState(false);
    const [busySlots, setBusySlots] = useState<{ start: string, end: string }[]>([]);
    const [isFetchingSlots, setIsFetchingSlots] = useState(false);
    const [isCalendarApiBlocked, setCalendarApiBlocked] = useState(false);
    const [googleConnectionError, setGoogleConnectionError] = useState<string | null>(null);

    const isGoogleConnected = isCalendarLinked;

    // Fetch busy slots from Google Calendar when the date changes
    useEffect(() => {
        if (isOpen) {
            setGoogleConnectionError(null);
        }
        
        if (!isOpen || !isGoogleConnected || !formData.date || googleConnectionError) {return;}
        
        if (isCalendarApiBlocked) {
            diagnosticLogger.warn("Chiamata a get-google-calendar-events bloccata a causa di un errore critico precedente.");
            return;
        }

        const fetchBusySlots = async () => {
            setIsFetchingSlots(true);
            try {
                const startOfDay = new Date(formData.date);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(formData.date);
                endOfDay.setHours(23, 59, 59, 999);

                const data = await invokeSupabaseFunction('get-google-calendar-events', {
                    timeMin: startOfDay.toISOString(),
                    timeMax: endOfDay.toISOString(),
                }) as { events: unknown[] };
                
                const slots = data.events.map((event: unknown) => {
                    const e = event as {start: {dateTime: string}, end: {dateTime: string}};
                    return {
                        start: e.start.dateTime,
                        end: e.end.dateTime,
                    };
                });
                setBusySlots(slots);
            } catch (err: unknown) {
                const errorMessage = (err as Error).message || '';
                if (/token|google|autenticazione|credential/i.test(errorMessage.toLowerCase())) {
                     diagnosticLogger.error("Errore di connessione Google rilevato:", err);
                     setGoogleConnectionError("La connessione con Google Calendar ha un problema.");
                     // The detailed error toast is already shown by the API helper.
                } else if (errorMessage.includes('obbligatori')) {
                     const errorMsg = "Errore critico dal backend: parametro mancante. Le chiamate al calendario sono state bloccate per questa sessione.";
                     diagnosticLogger.error(errorMsg, err);
                     toast.error("Errore di comunicazione col calendario. Ricarica la pagina.", { duration: 6000 });
                     setCalendarApiBlocked(true);
                 }
                setBusySlots([]);
            } finally {
                setIsFetchingSlots(false);
            }
        };

        fetchBusySlots();
    }, [isOpen, isGoogleConnected, formData.date, isCalendarApiBlocked, googleConnectionError]);

    // Reset form when the modal is opened or the contact changes
    useEffect(() => {
        if (isOpen) {
            setFormData({
                ...initialFormState,
                createGoogleEvent: isGoogleConnected && !googleConnectionError,
            });
            setCalendarApiBlocked(false);
            setGoogleConnectionError(null);
        }
    }, [isOpen, contact, isGoogleConnected, googleConnectionError]);


    // Generate time slots based on availability
    const timeSlots = useMemo(() => generateTimeSlots(new Date(formData.date), busySlots, 30), [formData.date, busySlots]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        
        if (name === 'startTime' && value) {
            const startIndex = timeSlots.findIndex(s => s.time === value);
            if (startIndex !== -1 && startIndex + 1 < timeSlots.length) {
                setFormData(prev => ({ ...prev, endTime: timeSlots[startIndex + 1].time }));
            } else {
                 setFormData(prev => ({ ...prev, endTime: '' }));
            }
        }
    };
    
    const addReminder = (channel: 'Email' | 'WhatsApp') => {
        setFormData(prev => ({
            ...prev,
            reminders: [...prev.reminders, { channel, minutesBefore: 60, message: '' }]
        }));
    };
    
    const updateReminder = (index: number, field: string, value: unknown) => {
         setFormData(prev => {
            const newReminders = [...prev.reminders];
            (newReminders[index] as any)[field] = value;
            return { ...prev, reminders: newReminders };
        });
    };
    
    const removeReminder = (index: number) => {
        setFormData(prev => ({
            ...prev,
            reminders: prev.reminders.filter((_, i) => i !== index),
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contact || !organization) {
            toast.error("Contatto o organizzazione non validi.");
            return;
        }
        if (!formData.startTime || !formData.endTime) {
            toast.error("Per favore, seleziona un orario di inizio e fine.");
            return;
        }

        setIsSaving(true);
        const toastId = toast.loading('Creazione evento...');
        
        try {
            const eventStartDate = combineDateAndTime(new Date(formData.date), formData.startTime);
            const eventEndDate = combineDateAndTime(new Date(formData.date), formData.endTime);

            let googleEventId: string | null = null;
            if (isGoogleConnected && formData.createGoogleEvent && !googleConnectionError) {
                 const googleEvent = await invokeSupabaseFunction('create-google-event', {
                    event_summary: formData.summary,
                    event_description: formData.description,
                    event_start_time: eventStartDate.toISOString(),
                    event_end_time: eventEndDate.toISOString(),
                    attendee_email: contact.email
                }) as { googleEventId: string | null };
                googleEventId = googleEvent.googleEventId;
            }

            const crmEventPayload = {
                contact_id: contact.id,
                event_summary: formData.summary,
                event_description: formData.description,
                event_start_time: eventStartDate.toISOString(),
                event_end_time: eventEndDate.toISOString(),
                google_event_id: googleEventId,
            };

            const { crmEvent } = await invokeSupabaseFunction('create-crm-event', crmEventPayload) as { crmEvent: CrmEvent };

            if (formData.reminders.length > 0) {
                 await invokeSupabaseFunction('schedule-event-reminders', {
                    crm_event_id: crmEvent.id,
                    event_start_time: eventStartDate.toISOString(),
                    reminders: formData.reminders
                });
            }

            toast.success('Evento creato con successo!', { id: toastId });
            onActionSuccess();
            onClose();

        } catch (err: unknown) {
            toast.dismiss(toastId); // The API helper shows a more detailed toast
            diagnosticLogger.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const inputStyle = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Crea Evento per ${contact?.name}`}>
            <form onSubmit={handleSave} className="space-y-4">
                <div>
                    <label htmlFor="summary" className="block text-sm font-medium text-gray-700">Oggetto *</label>
                    <input type="text" id="summary" name="summary" value={formData.summary} onChange={handleFormChange} required className={inputStyle} />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrizione</label>
                    <textarea id="description" name="description" rows={3} value={formData.description} onChange={handleFormChange} className={inputStyle} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700">Data *</label>
                        <input type="date" id="date" name="date" value={formData.date} onChange={handleFormChange} required className={inputStyle} />
                    </div>
                     <div>
                        <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">Ora Inizio *</label>
                        <select id="startTime" name="startTime" value={formData.startTime} onChange={handleFormChange} required className={inputStyle} disabled={!!googleConnectionError}>
                            <option value="" disabled>Seleziona...</option>
                            {isFetchingSlots ? <option>Caricamento...</option> : timeSlots.map(slot => (
                                <option key={slot.time} value={slot.time} disabled={!slot.available}>
                                    {slot.time} {!slot.available && '(Occupato)'}
                                </option>
                            ))}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">Ora Fine *</label>
                         <select id="endTime" name="endTime" value={formData.endTime} onChange={handleFormChange} required className={inputStyle} disabled={!!googleConnectionError}>
                             <option value="" disabled>Seleziona...</option>
                             {timeSlots.map(slot => ( <option key={slot.time} value={slot.time}>{slot.time}</option> ))}
                         </select>
                    </div>
                </div>
                
                {isGoogleConnected ? (
                    <div className="pt-2">
                        <div className="flex items-center space-x-2">
                            <input 
                                type="checkbox" 
                                id="createGoogleEvent" 
                                name="createGoogleEvent" 
                                checked={formData.createGoogleEvent} 
                                onChange={handleFormChange} 
                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                disabled={!!googleConnectionError}
                            />
                            <label 
                                htmlFor="createGoogleEvent" 
                                className={`text-sm flex items-center ${googleConnectionError ? 'text-gray-500' : 'text-gray-700'}`}
                            >
                                <GoogleIcon className="mr-2" /> 
                                Crea anche su Google Calendar
                            </label>
                        </div>
                        {googleConnectionError && (
                            <div className="mt-2 p-2 bg-red-50 text-red-700 text-sm rounded-md flex items-start space-x-2">
                                <InfoIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <span>
                                    {googleConnectionError}
                                    {' '}
                                    <Link to="/settings" className="font-bold underline hover:text-red-800" onClick={onClose}>
                                        Vai alle impostazioni per riconnettere.
                                    </Link>
                                </span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="pt-2 p-2 bg-yellow-50 text-yellow-800 text-sm rounded-md">
                        Per creare eventi direttamente sul tuo calendario, 
                        <Link to="/settings" className="font-bold underline hover:text-yellow-900" onClick={onClose}>
                            {' '}connetti il tuo account Google
                        </Link>
                        {' '}nelle impostazioni.
                    </div>
                )}
                 
                 <div className="pt-2">
                     <h4 className="text-sm font-medium text-gray-700 mb-2">Promemoria Automatici</h4>
                     <div className="space-y-3">
                         {formData.reminders.map((r, index) => (
                             <div key={index} className="p-3 bg-gray-50 rounded-md border flex items-start space-x-3">
                                 <div className="flex-grow space-y-2">
                                     <div className="flex items-center space-x-2">
                                         <span className="font-semibold text-sm flex items-center">{r.channel === 'Email' ? '📧 Email' : <><WhatsAppIcon className="w-4 h-4 text-green-600 mr-1"/> WhatsApp</>}</span>
                                         <select value={r.minutesBefore} onChange={(e) => updateReminder(index, 'minutesBefore', parseInt(e.target.value))} className={`${inputStyle} text-xs p-1 mt-0`}>
                                             <option value={10}>10 minuti prima</option>
                                             <option value={60}>1 ora prima</option>
                                             <option value={1440}>1 giorno prima</option>
                                         </select>
                                     </div>
                                      <textarea value={r.message} onChange={(e) => updateReminder(index, 'message', e.target.value)} rows={2} placeholder="Testo del promemoria (opzionale, usa template default se vuoto)" className={`${inputStyle} text-sm`}/>
                                 </div>
                                 <button type="button" onClick={() => removeReminder(index)} className="p-1 text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                             </div>
                         ))}
                     </div>
                      <div className="flex items-center space-x-2 mt-2">
                         <button type="button" onClick={() => addReminder('Email')} className="bg-gray-200 text-gray-800 px-3 py-1 rounded-lg hover:bg-gray-300 text-xs">Aggiungi Email</button>
                         <button type="button" onClick={() => addReminder('WhatsApp')} className="bg-gray-200 text-gray-800 px-3 py-1 rounded-lg hover:bg-gray-300 text-xs">Aggiungi WhatsApp</button>
                     </div>
                 </div>

                <div className="flex justify-end pt-4 border-t mt-4">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 mr-2">Annulla</button>
                    <button type="submit" disabled={isSaving} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 flex items-center">
                        {isSaving ? 'Salvataggio...' : <><SaveIcon className="w-5 h-5 mr-2" />Salva Evento</>}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

