import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from './ui/Modal';
import { Contact, Organization, EventFormData, Reminder, ReminderChannel, EventTemplate, BusySlot } from '../types';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { PlusIcon, TrashIcon, TemplateIcon, SaveIcon, ClockIcon, VideoIcon, InfoIcon } from './ui/icons';

const initialEventState: EventFormData = {
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    duration: 30,
    location: '',
    description: '',
    addMeet: true,
    reminders: [],
};

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    contact: Contact | null;
    organization: Organization | null;
    onSaveSuccess: () => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, contact, organization, onSaveSuccess }) => {
    const [formData, setFormData] = useState<EventFormData>(initialEventState);
    const [isSaving, setIsSaving] = useState(false);
    
    const [templates, setTemplates] = useState<EventTemplate[]>([]);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [isSaveTemplateModalOpen, setSaveTemplateModalOpen] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    
    const [busySlots, setBusySlots] = useState<BusySlot[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);

    const isGoogleConnected = useMemo(() => {
        // Logica per determinare se Google Calendar è connesso (da implementare con i dati reali)
        // Per ora, assumiamo sia connesso se ci sono le info dell'organizzazione
        return !!organization; 
    }, [organization]);

    // Carica i template salvati al mount della modale
    useEffect(() => {
        const storedTemplates = localStorage.getItem('eventTemplates');
        if (storedTemplates) {
            setTemplates(JSON.parse(storedTemplates));
        }
    }, []);

    // Popola i dati del contatto e resetta il form quando la modale si apre
    useEffect(() => {
        if (isOpen && contact) {
            setFormData({
                ...initialEventState,
                title: `Incontro con ${contact.name}`,
                date: new Date().toISOString().split('T')[0],
                reminders: [
                    { id: Date.now().toString(), minutesBefore: 60, channel: 'Email', message: `Promemoria: il tuo incontro con ${contact.name} è tra un'ora.` },
                ]
            });
        }
    }, [isOpen, contact]);

    // Carica gli impegni dal calendario di Google quando la data cambia
    useEffect(() => {
        const fetchBusySlots = async () => {
            if (!isOpen || !isGoogleConnected || !organization || !formData.date) return;
            setIsLoadingSlots(true);
            try {
                const { data, error } = await supabase.functions.invoke('get-google-calendar-events', {
                    body: { organization_id: organization.id, date: formData.date }
                });
                if (error) throw new Error(error.message);
                if (data.error) throw new Error(data.error);
                setBusySlots(data.busySlots || []);
            } catch (err: any) {
                console.error("Errore nel recuperare gli eventi di Google Calendar:", err);
                toast.error("Impossibile caricare gli impegni da Google Calendar.");
            } finally {
                setIsLoadingSlots(false);
            }
        };

        fetchBusySlots();
    }, [isOpen, isGoogleConnected, organization, formData.date]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value, 10) : value }));
        }
    };

    const handleReminderChange = (id: string, field: keyof Reminder, value: any) => {
        setFormData(prev => ({
            ...prev,
            reminders: prev.reminders.map(r => r.id === id ? { ...r, [field]: value } : r),
        }));
    };
    
    const handleAddReminder = () => {
        setFormData(prev => ({
            ...prev,
            reminders: [
                ...prev.reminders,
                { id: Date.now().toString(), minutesBefore: 10, channel: 'Email', message: `Promemoria: il tuo incontro sta per iniziare.` }
            ]
        }));
    };

    const handleRemoveReminder = (id: string) => {
        setFormData(prev => ({
            ...prev,
            reminders: prev.reminders.filter(r => r.id !== id),
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contact || !organization) {
            toast.error("Dati del contatto o dell'organizzazione mancanti.");
            return;
        }
        setIsSaving(true);
        const toastId = toast.loading('Creazione evento in corso...');

        try {
            // Step 1: Crea l'evento su Google Calendar
            const { data: googleEventData, error: googleError } = await supabase.functions.invoke('create-google-event', {
                body: { 
                    eventDetails: formData,
                    contact: contact,
                    organization_id: organization.id,
                    contact_id: contact.id
                },
            });

            if (googleError) throw new Error(googleError.message);
            if (googleEventData.error) throw new Error(googleEventData.error);
            toast.success('Evento creato su Google Calendar!', { id: toastId });

            // Step 2: Schedula i promemoria tramite un'altra funzione
            if (formData.reminders.length > 0 && googleEventData.crmEventId) {
                 await supabase.functions.invoke('schedule-event-reminders', {
                    body: {
                        organization_id: organization.id,
                        crm_event_id: googleEventData.crmEventId,
                        event_start_time: googleEventData.event.start.dateTime,
                        reminders: formData.reminders,
                    }
                });
                toast.success('Promemoria schedulati!');
            }

            onSaveSuccess(); // Aggiorna la lista eventi principale
            onClose();

        } catch (err: any) {
            toast.error(`Errore: ${err.message}`, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleSaveTemplate = () => {
        if (!newTemplateName) {
            toast.error("Inserisci un nome per il template.");
            return;
        }
        const newTemplate: EventTemplate = {
            id: Date.now().toString(),
            name: newTemplateName,
            data: {
                title: formData.title,
                duration: formData.duration,
                location: formData.location,
                description: formData.description,
                addMeet: formData.addMeet,
                reminders: formData.reminders.map(r => ({ ...r, id: Date.now().toString() + Math.random() })),
            }
        };
        const updatedTemplates = [...templates, newTemplate];
        setTemplates(updatedTemplates);
        localStorage.setItem('eventTemplates', JSON.stringify(updatedTemplates));
        toast.success(`Template "${newTemplateName}" salvato!`);
        setNewTemplateName('');
        setSaveTemplateModalOpen(false);
    };
    
    const handleLoadTemplate = (template: EventTemplate) => {
        setFormData(prev => ({
            ...prev,
            title: template.data.title,
            duration: template.data.duration,
            location: template.data.location,
            description: template.data.description,
            addMeet: template.data.addMeet,
            reminders: template.data.reminders.map(r => ({...r, id: Date.now().toString() + Math.random()})),
        }));
        setIsTemplateModalOpen(false);
        toast.success(`Template "${template.name}" caricato.`);
    };

    const handleOpenSaveTemplateModal = () => {
        setNewTemplateName(formData.title); // Pre-compila con il titolo dell'evento
        setSaveTemplateModalOpen(true);
    };

    const suggestedSlots = useMemo(() => {
        const slots: string[] = [];
        const workDayStart = 9; // 9:00
        const workDayEnd = 18;  // 18:00
        const slotDuration = 30; // 30 minuti
        const eventDuration = formData.duration;
        const now = new Date();
        const selectedDate = new Date(`${formData.date}T00:00:00`);

        for (let hour = workDayStart; hour < workDayEnd; hour++) {
            for (let minute = 0; minute < 60; minute += slotDuration) {
                const slotStart = new Date(selectedDate);
                slotStart.setHours(hour, minute, 0, 0);

                // Ignora slot nel passato
                if (slotStart < now) continue;
                
                const slotEnd = new Date(slotStart.getTime() + eventDuration * 60000);
                
                // Controlla se lo slot è libero
                const isBusy = busySlots.some(busy => {
                    const busyStart = new Date(busy.start);
                    const busyEnd = new Date(busy.end);
                    return (slotStart < busyEnd && slotEnd > busyStart);
                });

                if (!isBusy) {
                    slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
                }
            }
        }
        return slots.slice(0, 5); // Mostra solo i primi 5 slot liberi
    }, [formData.date, formData.duration, busySlots]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="">
            <div className="flex items-center space-x-2">
                 <h3 className="text-lg font-semibold text-gray-800">Crea Evento</h3>
                {isGoogleConnected && (
                    <div className="relative group">
                        <InfoIcon className="w-4 h-4 text-gray-400 cursor-pointer" />
                         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max p-2 bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            Suggerimenti e template sono disponibili grazie alla connessione con Google Calendar.
                        </div>
                    </div>
                )}
            </div>
            <p className="text-sm text-gray-500 mb-4">per {contact?.name}</p>

            <form onSubmit={handleSave} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Titolo Evento</label>
                    <input type="text" id="title" name="title" value={formData.title} onChange={handleFormChange} required className="mt-1 block w-full input-style"/>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700">Data</label>
                        <input type="date" id="date" name="date" value={formData.date} onChange={handleFormChange} required className="mt-1 block w-full input-style"/>
                    </div>
                     <div>
                        <label htmlFor="time" className="block text-sm font-medium text-gray-700">Ora</label>
                        <input type="time" id="time" name="time" value={formData.time} onChange={handleFormChange} required className="mt-1 block w-full input-style"/>
                    </div>
                     <div>
                        <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Durata (min)</label>
                        <select id="duration" name="duration" value={formData.duration} onChange={handleFormChange} required className="mt-1 block w-full input-style">
                            <option value={15}>15</option>
                            <option value={30}>30</option>
                            <option value={45}>45</option>
                            <option value={60}>60</option>
                        </select>
                    </div>
                </div>

                {isGoogleConnected && (
                    <div className="p-3 bg-indigo-50 rounded-lg">
                        <h4 className="text-sm font-semibold text-indigo-800 mb-2">Orari suggeriti per il {new Date(formData.date).toLocaleDateString('it-IT')}:</h4>
                        {isLoadingSlots ? (
                            <p className="text-xs text-gray-600">Caricamento disponibilità...</p>
                        ) : suggestedSlots.length > 0 ? (
                             <div className="flex flex-wrap gap-2">
                                {suggestedSlots.map((slot, index) => (
                                    <button key={index} type="button" onClick={() => setFormData(p => ({ ...p, time: slot }))} className="px-3 py-1.5 text-xs font-medium bg-white border rounded-full hover:bg-gray-100 flex items-center">
                                        <ClockIcon className="w-4 h-4 mr-2"/>
                                        {slot}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-600">Nessun orario libero trovato. Controlla Google Calendar.</p>
                        )}
                    </div>
                )}

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrizione/Agenda</label>
                    <textarea id="description" name="description" value={formData.description} onChange={handleFormChange} rows={3} className="mt-1 block w-full input-style"></textarea>
                </div>

                <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                    <div className="flex items-center space-x-2">
                        <VideoIcon className="w-5 h-5 text-blue-500" />
                        <span>Aggiungi link Google Meet</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="addMeet" checked={formData.addMeet} onChange={handleFormChange} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                {/* Sezione Promemoria */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Promemoria</h4>
                    <div className="space-y-2">
                        {formData.reminders.map(r => (
                            <div key={r.id} className="grid grid-cols-12 gap-2 items-center">
                                <div className="col-span-1">Invia</div>
                                <select value={r.channel} onChange={(e) => handleReminderChange(r.id, 'channel', e.target.value)} className="col-span-3 input-style-sm">
                                    <option value="Email">Email</option>
                                    <option value="WhatsApp">WhatsApp</option>
                                </select>
                                <input type="number" value={r.minutesBefore} onChange={(e) => handleReminderChange(r.id, 'minutesBefore', parseInt(e.target.value))} className="col-span-2 input-style-sm"/>
                                <div className="col-span-2">minuti prima</div>
                                <div className="col-span-3">
                                    <button type="button" onClick={() => handleRemoveReminder(r.id)} className="p-1 text-red-500 hover:bg-red-100 rounded">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={handleAddReminder} className="mt-2 text-sm font-medium text-primary hover:underline flex items-center">
                        <PlusIcon className="w-4 h-4 mr-1" />
                        Aggiungi promemoria
                    </button>
                </div>

                <div className="flex justify-between items-center pt-4 mt-4">
                    <div>
                        <button type="button" onClick={() => setIsTemplateModalOpen(true)} className="text-sm font-medium text-indigo-600 hover:underline flex items-center">
                             <TemplateIcon className="w-4 h-4 mr-1" />
                            Carica template
                        </button>
                    </div>
                     <div>
                        <button type="button" onClick={handleOpenSaveTemplateModal} className="text-sm font-medium text-indigo-600 hover:underline flex items-center">
                            <SaveIcon className="w-4 h-4 mr-1" />
                            Salva come template
                        </button>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t mt-4">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 mr-2">Annulla</button>
                    <button type="submit" disabled={isSaving} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">{isSaving ? 'Creazione...' : 'Crea Evento'}</button>
                </div>
            </form>
            
            <Modal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} title="Carica Template Evento">
                <div className="space-y-2">
                    {templates.length > 0 ? templates.map(t => (
                        <button key={t.id} onClick={() => handleLoadTemplate(t)} className="w-full text-left p-2 rounded hover:bg-gray-100">{t.name}</button>
                    )) : <p className="text-gray-500">Nessun template salvato.</p>}
                </div>
            </Modal>

            <Modal isOpen={isSaveTemplateModalOpen} onClose={() => setSaveTemplateModalOpen(false)} title="Salva come Template">
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">Salva le impostazioni attuali (titolo, durata, descrizione, promemoria) per un uso futuro.</p>
                     <div>
                        <label htmlFor="template-name" className="block text-sm font-medium text-gray-700">Nome Template</label>
                        <input type="text" id="template-name" value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} className="mt-1 block w-full input-style"/>
                    </div>
                    <div className="flex justify-end">
                        <button onClick={handleSaveTemplate} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Salva Template</button>
                    </div>
                </div>
            </Modal>
        </Modal>
    );
};