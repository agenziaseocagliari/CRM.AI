// src/components/CreateEventModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from './ui/Modal';
import { Contact, Organization, EventFormData, EventTemplate, BusySlot, Reminder, ReminderChannel } from '../types';
import { CalendarIcon, ClockIcon, VideoIcon, InfoIcon, SaveIcon, TrashIcon, SparklesIcon, WhatsAppIcon } from './ui/icons';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

// --- Props ---
interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    contact: Contact | null;
    organization: Organization | null;
    onSaveSuccess: () => void;
}

// --- Costanti e Valori di Default ---
const reminderOptions = [
    { label: '15 minuti prima', value: 15 }, { label: '30 minuti prima', value: 30 },
    { label: '1 ora prima', value: 60 }, { label: '2 ore prima', value: 120 },
    { label: '1 giorno prima', value: 1440 },
];

const getInitialFormData = (contactName = ''): EventFormData => ({
    title: contactName ? `Incontro con ${contactName}` : '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    duration: 30,
    location: '',
    description: contactName ? `Discussione su opportunità di collaborazione con ${contactName}.` : '',
    addMeet: true,
    reminders: [],
});

const getDefaultReminderMessage = (channel: ReminderChannel, eventTitle: string, eventTime: string): string => {
    const baseMessage = `Ciao ${channel === 'Email' ? '[Nome Contatto]' : ''}, ti ricordiamo del tuo appuntamento "${eventTitle}" programmato per oggi alle ${eventTime}. A presto!`;
    return baseMessage;
};


// --- Helper: Check if a slot is busy ---
const isSlotBusy = (slot: string, date: string, duration: number, busySlots: BusySlot[]): boolean => {
    if (!slot || busySlots.length === 0) return false;
    const slotStartTime = new Date(`${date}T${slot}:00`);
    const slotEndTime = new Date(slotStartTime.getTime() + duration * 60000);
    for (const busy of busySlots) {
        const busyStartTime = new Date(busy.start);
        const busyEndTime = new Date(busy.end);
        if (slotStartTime < busyEndTime && slotEndTime > busyStartTime) return true;
    }
    return false;
};

// --- Componente TimeSlotPicker ---
const TimeSlotPicker: React.FC<{ selectedTime: string; onTimeSelect: (time: string) => void; busySlots: BusySlot[]; isLoading: boolean; date: string; duration: number;}> = 
({ selectedTime, onTimeSelect, busySlots, isLoading, date, duration }) => {
    const timeSlots = Array.from({ length: 18 }, (_, i) => {
        const hour = Math.floor(i / 2) + 9;
        const minute = (i % 2) * 30;
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    });

    if (isLoading) {
        return <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-2 animate-pulse">{timeSlots.map(slot => <div key={slot} className="h-9 bg-gray-200 rounded-md"></div>)}</div>;
    }

    return (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-2">
            {timeSlots.map(slot => {
                const isBusy = isSlotBusy(slot, date, duration, busySlots);
                return (
                    <button type="button" key={slot} disabled={isBusy} onClick={() => onTimeSelect(slot)} title={isBusy ? "Orario occupato" : `Seleziona ${slot}`}
                        className={`py-2 px-1 text-sm rounded-md transition-all ${selectedTime === slot ? 'bg-primary text-white font-bold ring-2 ring-offset-1 ring-primary' : isBusy ? 'bg-gray-200 text-gray-400 line-through cursor-not-allowed' : 'bg-gray-100 hover:bg-indigo-100 text-gray-700'}`}>
                        {slot}
                    </button>
                );
            })}
        </div>
    );
};

// --- Componente EventPreview ---
const EventPreview: React.FC<{ formData: EventFormData; contact: Contact }> = ({ formData, contact }) => {
    const eventDate = new Date(`${formData.date}T${formData.time}`);
    return (
        <div className="space-y-4 text-sm text-gray-700">
            <h3 className="text-xl font-bold text-gray-900 mb-2 border-b pb-2">Riepilogo Evento</h3>
            <p><strong><InfoIcon className="w-4 h-4 inline-block mr-2"/>Titolo:</strong> {formData.title}</p>
            <p><strong><CalendarIcon className="w-4 h-4 inline-block mr-2"/>Quando:</strong> {eventDate.toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} alle {formData.time}</p>
            <p><strong><ClockIcon className="w-4 h-4 inline-block mr-2"/>Durata:</strong> {formData.duration} minuti</p>
            <p><strong><VideoIcon className="w-4 h-4 inline-block mr-2"/>Videoconferenza:</strong> {formData.addMeet ? 'Sì, Google Meet' : 'No'}</p>
            {formData.location && <p><strong>Luogo:</strong> {formData.location}</p>}
            <p><strong>Partecipante:</strong> {contact.name} ({contact.email})</p>
            <div className="pt-2">
                <h4 className="font-bold text-gray-800">Promemoria automatici:</h4>
                {formData.reminders.length > 0 ? (
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        {formData.reminders.map(r => (
                            <li key={r.id}>{reminderOptions.find(o => o.value === r.minutesBefore)?.label} via <strong>{r.channel}</strong></li>
                        ))}
                    </ul>
                ) : <p className="text-gray-500 italic">Nessun promemoria impostato.</p>}
            </div>
        </div>
    );
};

// --- Componente ReminderManager ---
const ReminderManager: React.FC<{ reminders: Reminder[]; onRemindersChange: (reminders: Reminder[]) => void; eventTitle: string; eventTime: string;}> = 
({ reminders, onRemindersChange, eventTitle, eventTime }) => {
    const [newReminder, setNewReminder] = useState({ minutesBefore: 15, channel: 'Email' as ReminderChannel });

    const handleAddReminder = () => {
        const reminderToAdd: Reminder = {
            ...newReminder,
            id: Date.now().toString(),
            message: getDefaultReminderMessage(newReminder.channel, eventTitle, eventTime),
        };
        onRemindersChange([...reminders, reminderToAdd]);
    };

    const handleRemoveReminder = (id: string) => { onRemindersChange(reminders.filter(r => r.id !== id)); };

    const handleUpdateMessage = (id: string, message: string) => {
        onRemindersChange(reminders.map(r => (r.id === id ? { ...r, message } : r)));
    };

    return (
        <div className="p-4 bg-gray-50 rounded-lg border">
            <label className="block text-sm font-semibold text-gray-800 mb-3">Promemoria Automatici</label>
            <div className="space-y-3">
                {reminders.map(r => (
                    <div key={r.id} className="p-3 bg-white border rounded-md">
                        <div className="flex justify-between items-start">
                             <p className="text-sm font-medium text-gray-700">
                                {r.channel === 'Email' ? '📧' : <WhatsAppIcon className="w-4 h-4 inline mr-1 text-green-600"/>}
                                {reminderOptions.find(o => o.value === r.minutesBefore)?.label}
                            </p>
                            <button type="button" onClick={() => handleRemoveReminder(r.id)}><TrashIcon className="w-4 h-4 text-red-500"/></button>
                        </div>
                        <textarea value={r.message} onChange={(e) => handleUpdateMessage(r.id, e.target.value)} rows={2} className="mt-2 w-full text-xs p-2 border rounded-md focus:ring-primary focus:border-primary"/>
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <select value={newReminder.minutesBefore} onChange={e => setNewReminder(p => ({...p, minutesBefore: parseInt(e.target.value)}))} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"><option value={15}>15 min prima</option><option value={60}>1 ora prima</option><option value={1440}>1 giorno prima</option></select>
                <select value={newReminder.channel} onChange={e => setNewReminder(p => ({...p, channel: e.target.value as ReminderChannel}))} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"><option value="Email">via Email</option><option value="WhatsApp">via WhatsApp</option></select>
                <button type="button" onClick={handleAddReminder} className="bg-primary text-white px-3 py-2 text-sm rounded-md hover:bg-indigo-700">Aggiungi</button>
            </div>
        </div>
    );
};


// --- Componente Principale ---
export const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, contact, organization, onSaveSuccess }) => {
    const [formData, setFormData] = useState<EventFormData>(getInitialFormData());
    const [view, setView] = useState<'form' | 'preview'>('form');
    const [errors, setErrors] = useState<Partial<Record<keyof EventFormData, string>>>({});
    const [templates, setTemplates] = useState<EventTemplate[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [busySlots, setBusySlots] = useState<BusySlot[]>([]);
    const [areSlotsLoading, setAreSlotsLoading] = useState(false);
    const [slotError, setSlotError] = useState<string | null>(null);

    useEffect(() => {
        try { const saved = localStorage.getItem('guardian-event-templates'); if (saved) setTemplates(JSON.parse(saved)); } catch (e) { console.error(e); }
    }, []);

    useEffect(() => { if (isOpen && contact) { setFormData(getInitialFormData(contact.name)); setErrors({}); setView('form'); } }, [contact, isOpen]);
    
    useEffect(() => {
        const fetchBusySlots = async () => {
            if (!organization || !isOpen) return;
            setAreSlotsLoading(true); setSlotError(null); setBusySlots([]);
            try {
                const { data, error } = await supabase.functions.invoke('get-google-calendar-events', { body: { organization_id: organization.id, date: formData.date } });
                if (error) throw new Error(error.message); if (data.error) throw new Error(data.error);
                setBusySlots(data.busySlots || []); if (data.message) setSlotError(data.message);
            } catch (err: any) { setSlotError("Impossibile verificare la disponibilità."); } 
            finally { setAreSlotsLoading(false); }
        };
        fetchBusySlots();
    }, [formData.date, organization, isOpen]);

    const validateField = useCallback((name: keyof EventFormData, value: any): string => {
        if (name === 'title' && !value.trim()) return "Il titolo è obbligatorio.";
        if (name === 'time' && !value) return "Seleziona un orario.";
        if (name === 'date' || name === 'time') {
            const date = name === 'date' ? value : formData.date; const time = name === 'time' ? value : formData.time;
            if (!time) return "Seleziona un orario.";
            if (new Date(`${date}T${time}`) < new Date()) return "L'evento non può essere nel passato.";
        }
        return '';
    }, [formData.date, formData.time]);
    
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : name === 'duration' ? parseInt(value) : value;
        setFormData(p => ({ ...p, [name]: val }));
        setErrors(p => ({...p, [name]: validateField(name as keyof EventFormData, val) }));
    };

    const handleTimeSelect = (time: string) => {
        setFormData(p => ({ ...p, time }));
        const error = validateField('time', time); setErrors(p => ({ ...p, time: error, date: error }));
    };

    const handleSaveTemplate = () => {
        const name = prompt("Nome del template:");
        if (name?.trim()) {
            const newTpl: EventTemplate = { id: Date.now().toString(), name: name.trim(), data: (({ title, duration, location, description, addMeet, reminders }) => ({ title, duration, location, description, addMeet, reminders }))(formData) };
            const updated = [...templates, newTpl]; setTemplates(updated);
            localStorage.setItem('guardian-event-templates', JSON.stringify(updated));
            toast.success(`Template "${name}" salvato!`);
        }
    };

    const handleLoadTemplate = (id: string) => {
        const tpl = templates.find(t => t.id === id);
        if (tpl && contact) {
            setFormData(p => ({ ...p, ...tpl.data, title: tpl.data.title.replace(/\${contact\.name}/g, contact.name) }));
            toast.success(`Template "${tpl.name}" caricato.`);
        }
    };
    
    const handleProceedToPreview = (e: React.FormEvent) => {
        e.preventDefault();
        const vErrors = { title: validateField('title', formData.title), time: validateField('time', formData.time) };
        if (Object.values(vErrors).some(err => err)) { setErrors(p => ({ ...p, ...vErrors })); toast.error("Correggi gli errori."); return; }
        setView('preview');
    };

    const handleSaveEvent = async () => {
        if (!contact || !organization) return;
        setIsSaving(true);
        const toastId = toast.loading('Creazione evento...');

        try {
            const { data, error } = await supabase.functions.invoke('create-google-event', {
                body: { eventDetails: formData, contact, contact_id: contact.id, organization_id: organization.id }
            });
            if (error) throw new Error(error.message);
            if (data.error) throw new Error(data.error);
            
            const crmEventId = data.crmEventId;
            const eventStartTime = data.event.start.dateTime;

            if (crmEventId && formData.reminders.length > 0) {
                toast.loading('Schedulazione promemoria...', { id: toastId });
                const { error: reminderError } = await supabase.functions.invoke('schedule-event-reminders', {
                    body: { organization_id: organization.id, crm_event_id: crmEventId, event_start_time: eventStartTime, reminders: formData.reminders }
                });
                if (reminderError) toast.error(`Evento creato, ma errore nei promemoria: ${reminderError.message}`);
            }

            toast.success('Evento e promemoria salvati!', { id: toastId });
            onSaveSuccess(); onClose();
        } catch (err: any) {
            toast.error(`Errore: ${err.message}`, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    if (!contact) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={view === 'form' ? `Pianifica con ${contact.name}` : 'Conferma Dettagli'}>
            <div className="relative overflow-hidden">
                <div className={`transition-transform duration-300 ease-in-out ${view === 'preview' ? '-translate-x-full' : 'translate-x-0'}`}>
                    <form onSubmit={handleProceedToPreview} className="space-y-4">
                         <div className="flex items-center gap-2">
                            <select onChange={(e) => handleLoadTemplate(e.target.value)} defaultValue="" className="flex-grow block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"><option value="" disabled>Carica un template...</option>{templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
                            <button type="button" onClick={handleSaveTemplate} title="Salva come template" className="p-2 bg-white border rounded-md hover:bg-gray-100"><SaveIcon className="w-5 h-5 text-primary"/></button>
                         </div>
                        <div><label htmlFor="title" className="block text-sm font-medium text-gray-700">Titolo Evento</label><input type="text" id="title" name="title" value={formData.title} onChange={handleFormChange} required className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${errors.title ? 'border-red-500' : ''}`}/>{errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}</div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label htmlFor="date" className="block text-sm font-medium text-gray-700">Data</label><input type="date" id="date" name="date" value={formData.date} onChange={handleFormChange} required className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${errors.date ? 'border-red-500' : ''}`}/></div>
                            <div><label className="block text-sm font-medium text-gray-700">Orario</label><TimeSlotPicker selectedTime={formData.time} onTimeSelect={handleTimeSelect} busySlots={busySlots} isLoading={areSlotsLoading} date={formData.date} duration={formData.duration}/>{errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}{errors.time && !errors.date && <p className="text-xs text-red-600 mt-1">{errors.time}</p>}{slotError && <p className="text-xs text-yellow-800 bg-yellow-50 p-2 rounded-md mt-2 flex items-center"><InfoIcon className="w-4 h-4 mr-1"/> {slotError}</p>}</div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label htmlFor="duration" className="block text-sm font-medium text-gray-700">Durata</label><select id="duration" name="duration" value={formData.duration} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"><option value={15}>15 min</option><option value={30}>30 min</option><option value={45}>45 min</option><option value={60}>1 ora</option></select></div>
                            <div><label htmlFor="location" className="block text-sm font-medium text-gray-700">Luogo (opzionale)</label><input type="text" id="location" name="location" value={formData.location} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"/></div>
                        </div>
                        <div><label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrizione</label><textarea id="description" name="description" rows={2} value={formData.description} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"/></div>
                        <div className="flex items-center justify-between"><label htmlFor="addMeet" className="block text-sm font-medium text-gray-700 flex items-center gap-2"><input type="checkbox" id="addMeet" name="addMeet" checked={formData.addMeet} onChange={handleFormChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"/>Aggiungi Google Meet</label></div>
                        <ReminderManager reminders={formData.reminders} onRemindersChange={r => setFormData(p => ({...p, reminders: r}))} eventTitle={formData.title} eventTime={formData.time} />
                        <div className="flex justify-end pt-4 border-t mt-4"><button type="submit" className="bg-primary text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 disabled:bg-gray-400">Vai al Riepilogo</button></div>
                    </form>
                </div>
                <div className={`absolute top-0 left-0 w-full h-full transition-transform duration-300 ease-in-out ${view === 'preview' ? 'translate-x-0' : 'translate-x-full'}`}>
                    <EventPreview formData={formData} contact={contact} />
                    <div className="flex justify-between items-center pt-4 border-t mt-4">
                        <button type="button" onClick={() => setView('form')} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md font-medium hover:bg-gray-300">Indietro</button>
                        <button onClick={handleSaveEvent} disabled={isSaving} className="bg-primary text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 disabled:bg-gray-400">{isSaving ? 'Salvataggio...' : 'Conferma e Crea Evento'}</button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
