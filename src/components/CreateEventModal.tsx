// src/components/CreateEventModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from './ui/Modal';
import { Contact, Organization, EventFormData, EventTemplate } from '../types';
import { CalendarIcon, ClockIcon, VideoIcon, InfoIcon, SaveIcon } from './ui/icons'; // Assumendo che le nuove icone siano in ui/icons.tsx
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

// Stato iniziale del form, usato per reset e creazione.
const getInitialFormData = (contactName = ''): EventFormData => ({
    title: contactName ? `Incontro con ${contactName}` : '',
    date: new Date().toISOString().split('T')[0],
    time: '', // L'ora ora viene scelta visualmente
    duration: 30,
    location: '',
    description: contactName ? `Discussione su opportunità di collaborazione con ${contactName}.` : '',
    addMeet: true,
    reminders: [],
});

// --- Componente TimeSlotPicker ---
const TimeSlotPicker: React.FC<{ selectedTime: string; onTimeSelect: (time: string) => void; }> = ({ selectedTime, onTimeSelect }) => {
    // ROADMAP: Questi dati dovrebbero provenire da un fetch a Google Calendar. Per ora sono mockati.
    const busySlots = ['10:00', '11:30', '15:00']; 
    const timeSlots = Array.from({ length: 18 }, (_, i) => {
        const hour = Math.floor(i / 2) + 9; // Dalle 9:00 alle 17:30
        const minute = (i % 2) * 30;
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    });

    return (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-2">
            {timeSlots.map(slot => {
                const isBusy = busySlots.includes(slot);
                const isSelected = selectedTime === slot;
                return (
                    <button
                        type="button"
                        key={slot}
                        disabled={isBusy}
                        onClick={() => onTimeSelect(slot)}
                        className={`py-2 px-1 text-sm rounded-md transition-all duration-150
                            ${isSelected ? 'bg-primary text-white font-bold ring-2 ring-offset-1 ring-primary' : ''}
                            ${isBusy ? 'bg-gray-200 text-gray-400 line-through cursor-not-allowed' : ''}
                            ${!isSelected && !isBusy ? 'bg-gray-100 hover:bg-indigo-100 text-gray-700' : ''}
                        `}
                    >
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
                            <li key={r.id}>
                                {reminderOptions.find(o => o.value === r.minutesBefore)?.label} via <strong>{r.channel}</strong>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-gray-500 italic">Nessun promemoria impostato.</p>}
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

    // Carica i template da localStorage all'avvio
    useEffect(() => {
        try {
            const savedTemplates = localStorage.getItem('guardian-event-templates');
            if (savedTemplates) setTemplates(JSON.parse(savedTemplates));
        } catch (error) {
            console.error("Impossibile caricare i template.", error);
        }
    }, []);

    // Reset del form e della vista quando il modale viene aperto/chiuso o il contatto cambia
    useEffect(() => {
        if (isOpen && contact) {
            setFormData(getInitialFormData(contact.name));
            setErrors({});
            setView('form'); // Assicura che si parta sempre dalla form
        }
    }, [contact, isOpen]);

    // Funzione di validazione
    const validateField = useCallback((name: keyof EventFormData, value: any): string => {
        if (name === 'title' && !value.trim()) return "Il titolo è obbligatorio.";
        if (name === 'date' || name === 'time') {
            const date = name === 'date' ? value : formData.date;
            const time = name === 'time' ? value : formData.time;
            if (!time) return "Seleziona un orario.";
            const eventDateTime = new Date(`${date}T${time}`);
            if (eventDateTime < new Date()) return "L'evento non può essere nel passato.";
        }
        return '';
    }, [formData.date, formData.time]);
    
    // Gestione cambiamenti nel form con validazione live
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const fieldValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : name === 'duration' ? parseInt(value) : value;
        
        setFormData(prev => ({ ...prev, [name]: fieldValue }));
        // Validazione in tempo reale
        const error = validateField(name as keyof EventFormData, fieldValue);
        setErrors(prev => ({...prev, [name]: error }));
    };

    const handleTimeSelect = (time: string) => {
        setFormData(prev => ({ ...prev, time }));
        const error = validateField('time', time);
        setErrors(prev => ({ ...prev, time: error, date: error })); // L'errore di data/ora è combinato
    };

    // --- Gestione Template ---
    const handleSaveTemplate = () => {
        const name = prompt("Inserisci un nome per questo template:");
        if (name && name.trim()) {
            const newTemplate: EventTemplate = {
                id: Date.now().toString(),
                name: name.trim(),
                data: {
                    title: formData.title,
                    duration: formData.duration,
                    location: formData.location,
                    description: formData.description,
                    addMeet: formData.addMeet,
                    reminders: formData.reminders
                }
            };
            const updatedTemplates = [...templates, newTemplate];
            setTemplates(updatedTemplates);
            localStorage.setItem('guardian-event-templates', JSON.stringify(updatedTemplates));
            toast.success(`Template "${name}" salvato!`);
        }
    };

    const handleLoadTemplate = (id: string) => {
        const template = templates.find(t => t.id === id);
        if (template) {
            // Applica il template mantenendo la data e l'ora attuali
            setFormData(prev => ({
                ...prev,
                title: template.data.title.replace('${contact.name}', contact?.name || ''),
                duration: template.data.duration,
                location: template.data.location,
                description: template.data.description,
                addMeet: template.data.addMeet,
                reminders: template.data.reminders
            }));
            toast.success(`Template "${template.name}" caricato.`);
        }
    };
    
    // Passa alla vista di anteprima se il form è valido
    const handleProceedToPreview = (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = {
            title: validateField('title', formData.title),
            time: validateField('time', formData.time)
        };
        
        if (Object.values(validationErrors).some(err => err)) {
            setErrors(prev => ({ ...prev, ...validationErrors }));
            toast.error("Per favore, correggi gli errori nel form.");
            return;
        }
        setView('preview');
    };

    const handleSaveEvent = async () => {
        if (!contact || !organization) return;
        setIsSaving(true);
        const toastId = toast.loading('Creazione evento in corso...');

        try {
            const { data, error } = await supabase.functions.invoke('create-google-event', { body: { eventDetails: formData, contact, organization_id: organization.id } });
            if (error) throw new Error(error.message);
            if (data.error) throw new Error(data.error);
            toast.success('Evento creato con successo!', { id: toastId });
            onSaveSuccess();
            onClose();
        } catch (err: any) {
            toast.error(`Errore: ${err.message}`, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };


    if (!contact) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={view === 'form' ? `Pianifica incontro con ${contact.name}` : 'Conferma Dettagli Evento'}>
            <div className="relative overflow-hidden">
                {/* Contenitore per la transizione */}
                <div className={`transition-transform duration-300 ease-in-out ${view === 'preview' ? '-translate-x-full' : 'translate-x-0'}`}>
                    {/* --- VISTA FORM --- */}
                    <form onSubmit={handleProceedToPreview} className="space-y-4">
                         {/* Sezione Template */}
                        <div className="p-3 bg-indigo-50 rounded-md border border-indigo-200">
                             <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
                             <div className="flex items-center gap-2">
                                <select onChange={(e) => handleLoadTemplate(e.target.value)} defaultValue="" className="flex-grow mt-0 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm">
                                    <option value="" disabled>Carica un preferito...</option>
                                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                                <button type="button" onClick={handleSaveTemplate} title="Salva evento corrente come template" className="p-2 bg-white border rounded-md hover:bg-gray-100"><SaveIcon className="w-5 h-5 text-primary"/></button>
                             </div>
                        </div>

                        {/* Titolo e Data */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Titolo Evento</label>
                            <input type="text" id="title" name="title" value={formData.title} onChange={handleFormChange} required className={`mt-1 block w-full input-field ${errors.title ? 'border-red-500' : ''}`}/>
                            {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="date" className="block text-sm font-medium text-gray-700">Data</label>
                                <input type="date" id="date" name="date" value={formData.date} onChange={handleFormChange} required className={`mt-1 block w-full input-field ${errors.date ? 'border-red-500' : ''}`}/>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Orario</label>
                                <TimeSlotPicker selectedTime={formData.time} onTimeSelect={handleTimeSelect} />
                                 {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
                                 {errors.time && !errors.date && <p className="text-xs text-red-600 mt-1">{errors.time}</p>}
                            </div>
                        </div>
                        {/* Altri campi... (Durata, Luogo, Descrizione, Meet) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Durata (minuti)</label>
                                <select id="duration" name="duration" value={formData.duration} onChange={handleFormChange} className="mt-1 block w-full input-field">
                                    <option value={15}>15 minuti</option>
                                    <option value={30}>30 minuti</option>
                                    <option value={45}>45 minuti</option>
                                    <option value={60}>1 ora</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="location" className="block text-sm font-medium text-gray-700">Luogo (opzionale)</label>
                                <input type="text" id="location" name="location" value={formData.location} onChange={handleFormChange} className="mt-1 block w-full input-field"/>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrizione / Note</label>
                            <textarea id="description" name="description" rows={3} value={formData.description} onChange={handleFormChange} className="mt-1 block w-full input-field"/>
                        </div>
                        <div className="flex items-center">
                            <input id="addMeet" name="addMeet" type="checkbox" checked={formData.addMeet} onChange={handleFormChange} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                            <label htmlFor="addMeet" className="ml-2 block text-sm text-gray-900">Aggiungi videoconferenza Google Meet</label>
                        </div>


                        <div className="flex justify-end pt-4 border-t mt-4">
                            <button type="button" onClick={onClose} className="btn-secondary mr-2">Annulla</button>
                            <button type="submit" disabled={isSaving} className="btn-primary">{isSaving ? 'Salvataggio...' : 'Vai all\'Anteprima'}</button>
                        </div>
                    </form>
                </div>
                 {/* Contenitore per la transizione */}
                 <div className={`absolute top-0 left-0 w-full h-full transition-transform duration-300 ease-in-out ${view === 'form' ? 'translate-x-full' : 'translate-x-0'}`}>
                    {/* --- VISTA PREVIEW --- */}
                    <div className="p-1">
                        <EventPreview formData={formData} contact={contact} />
                        <div className="flex justify-end pt-4 border-t mt-4">
                            <button type="button" onClick={() => setView('form')} className="btn-secondary mr-2">Modifica</button>
                            <button onClick={handleSaveEvent} disabled={isSaving} className="btn-primary">{isSaving ? 'Creazione...' : 'Conferma e Crea Evento'}</button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

// Aggiungi stili CSS se non già presenti globalmente
const styles = `
.input-field {
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    outline: none;
}
.input-field:focus {
    ring: 1px solid #4f46e5;
    border-color: #4f46e5;
}
.btn-primary {
    background-color: #4f46e5;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-weight: 600;
}
.btn-primary:hover {
    background-color: #4338ca;
}
.btn-primary:disabled {
    background-color: #a5b4fc;
    cursor: not-allowed;
}
.btn-secondary {
    background-color: #e5e7eb;
    color: #1f2937;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-weight: 600;
}
.btn-secondary:hover {
    background-color: #d1d5db;
}
`;
// In un'app reale, questi stili sarebbero in un file CSS. Per questo contesto, è un modo per assicurarci che siano disponibili.
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);