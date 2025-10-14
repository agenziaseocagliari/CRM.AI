'use client';

import { Bell, Calendar, Clock, MapPin, Palette, Repeat, Save, Tag, Trash2, Users, Video, X } from 'lucide-react';
import { useState } from 'react';

export interface EventData {
    id?: number;
    title: string;
    description: string;
    event_type: string;
    priority: string;
    start_time: string;
    end_time: string;
    location: string;
    location_type: string;
    meeting_url: string;
    phone_number: string;
    is_recurring: boolean;
    recurrence_frequency: string;
    recurrence_interval: number;
    recurrence_days: number[];
    recurrence_end_date: string;
    reminder_minutes: number[];
    notes: string;
    is_all_day: boolean;
    color: string;
    attendees: string[];
    status: string;
}

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (eventData: EventData) => Promise<void>;
    initialData?: Partial<EventData>;
    selectedDate?: Date;
    onDelete?: (id: number) => Promise<void>;
}

const EVENT_TYPES = [
    { value: 'meeting', label: 'Riunione', icon: '💼', color: 'blue', bgColor: 'bg-blue-50 border-blue-200', selectedBg: 'bg-blue-100 border-blue-400' },
    { value: 'call', label: 'Chiamata', icon: '📞', color: 'green', bgColor: 'bg-green-50 border-green-200', selectedBg: 'bg-green-100 border-green-400' },
    { value: 'task', label: 'Attività', icon: '✅', color: 'purple', bgColor: 'bg-purple-50 border-purple-200', selectedBg: 'bg-purple-100 border-purple-400' },
    { value: 'appointment', label: 'Appuntamento', icon: '📅', color: 'orange', bgColor: 'bg-orange-50 border-orange-200', selectedBg: 'bg-orange-100 border-orange-400' },
    { value: 'deadline', label: 'Scadenza', icon: '⏰', color: 'red', bgColor: 'bg-red-50 border-red-200', selectedBg: 'bg-red-100 border-red-400' },
];

const PRIORITY_LEVELS = [
    { value: 'low', label: 'Bassa', color: 'bg-green-100 text-green-800', selectedColor: 'bg-green-500', bgClass: 'bg-green-100', textClass: 'text-green-800' },
    { value: 'medium', label: 'Media', color: 'bg-yellow-100 text-yellow-800', selectedColor: 'bg-yellow-500', bgClass: 'bg-yellow-100', textClass: 'text-yellow-800' },
    { value: 'high', label: 'Alta', color: 'bg-orange-100 text-orange-800', selectedColor: 'bg-orange-500', bgClass: 'bg-orange-100', textClass: 'text-orange-800' },
    { value: 'urgent', label: 'Urgente', color: 'bg-red-100 text-red-800', selectedColor: 'bg-red-500', bgClass: 'bg-red-100', textClass: 'text-red-800' },
];

const REMINDER_OPTIONS = [
    { value: 5, label: '5 minuti prima' },
    { value: 15, label: '15 minuti prima' },
    { value: 30, label: '30 minuti prima' },
    { value: 60, label: '1 ora prima' },
    { value: 120, label: '2 ore prima' },
    { value: 1440, label: '1 giorno prima' },
];

const COLORS = [
    { value: 'blue', label: 'Blu', class: 'bg-blue-500' },
    { value: 'green', label: 'Verde', class: 'bg-green-500' },
    { value: 'purple', label: 'Viola', class: 'bg-purple-500' },
    { value: 'orange', label: 'Arancione', class: 'bg-orange-500' },
    { value: 'red', label: 'Rosso', class: 'bg-red-500' },
    { value: 'pink', label: 'Rosa', class: 'bg-pink-500' },
    { value: 'yellow', label: 'Giallo', class: 'bg-yellow-500' },
    { value: 'gray', label: 'Grigio', class: 'bg-gray-500' },
];

const DAYS_OF_WEEK = [
    { value: 1, label: 'L', fullName: 'Lunedì' },
    { value: 2, label: 'M', fullName: 'Martedì' },
    { value: 3, label: 'M', fullName: 'Mercoledì' },
    { value: 4, label: 'G', fullName: 'Giovedì' },
    { value: 5, label: 'V', fullName: 'Venerdì' },
    { value: 6, label: 'S', fullName: 'Sabato' },
    { value: 0, label: 'D', fullName: 'Domenica' },
];

export default function EventModal({ isOpen, onClose, onSave, initialData, selectedDate, onDelete }: EventModalProps) {
    const [formData, setFormData] = useState<EventData>({
        title: initialData?.title || '',
        description: initialData?.description || '',
        event_type: initialData?.event_type || 'meeting',
        priority: initialData?.priority || 'medium',
        start_time: initialData?.start_time || (selectedDate ? new Date(selectedDate).toISOString().slice(0, 16) : ''),
        end_time: initialData?.end_time || '',
        location: initialData?.location || '',
        location_type: initialData?.location_type || 'physical',
        meeting_url: initialData?.meeting_url || '',
        phone_number: initialData?.phone_number || '',
        is_all_day: initialData?.is_all_day || false,
        is_recurring: initialData?.is_recurring || false,
        recurrence_frequency: initialData?.recurrence_frequency || 'weekly',
        recurrence_interval: initialData?.recurrence_interval || 1,
        recurrence_days: initialData?.recurrence_days || [],
        recurrence_end_date: initialData?.recurrence_end_date || '',
        reminder_minutes: initialData?.reminder_minutes || [15],
        color: initialData?.color || 'blue',
        notes: initialData?.notes || '',
        attendees: initialData?.attendees || [],
        status: initialData?.status || 'scheduled',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Auto-generate meeting URL for virtual meetings
    const generateMeetingUrl = (): string => {
        // Google Meet uses format: xxx-yyyy-zzz (3-4-3 characters)
        const random = () => Math.random().toString(36).substring(2, 15);
        const part1 = random().substring(0, 3); // 3 chars
        const part2 = random().substring(0, 4); // 4 chars  
        const part3 = random().substring(0, 3); // 3 chars

        return `https://meet.google.com/${part1}-${part2}-${part3}`;
    };

    // URL validation for meeting platforms
    const isValidMeetingUrl = (url: string): boolean => {
        if (!url) return true; // Empty is OK

        try {
            const urlObj = new URL(url);
            // Accept common meeting platforms
            const validDomains = [
                'meet.google.com',
                'zoom.us',
                'teams.microsoft.com',
                'whereby.com',
                'webex.com'
            ];

            return validDomains.some(domain => urlObj.hostname.includes(domain)) ||
                urlObj.protocol.startsWith('http');
        } catch {
            return false;
        }
    };

    // Calculate end time automatically (1 hour after start)
    const updateEndTime = (startTime: string) => {
        const start = new Date(startTime);
        const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 hour
        return end.toISOString().slice(0, 16);
    };

    const handleFieldChange = (field: keyof EventData, value: string | boolean | number | string[] | number[]) => {
        setFormData(prev => {
            const updated = { ...prev, [field]: value };

            // Auto-update end time when start time changes
            if (field === 'start_time' && typeof value === 'string' && value && !prev.end_time) {
                updated.end_time = updateEndTime(value);
            }

            // Clear meeting URL if changing from virtual location
            if (field === 'location_type' && value !== 'virtual') {
                updated.meeting_url = '';
                updated.phone_number = '';
            }

            return updated;
        });

        // Clear field-specific errors
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Il titolo è obbligatorio';
        }

        if (!formData.start_time) {
            newErrors.start_time = 'Data e ora di inizio sono obbligatori';
        }

        if (!formData.end_time) {
            newErrors.end_time = 'Data e ora di fine sono obbligatori';
        }

        if (formData.start_time && formData.end_time) {
            const start = new Date(formData.start_time);
            const end = new Date(formData.end_time);
            if (end <= start) {
                newErrors.end_time = 'La fine deve essere dopo l\'inizio';
            }
        }

        if (formData.location_type === 'virtual' && !formData.meeting_url.trim()) {
            newErrors.meeting_url = 'URL meeting richiesto per eventi virtuali';
        }

        if (formData.location_type === 'virtual' &&
            formData.meeting_url &&
            !isValidMeetingUrl(formData.meeting_url)) {
            newErrors.meeting_url = 'URL meeting non valido';
        }

        if (formData.location_type === 'phone' && !formData.phone_number.trim()) {
            newErrors.phone_number = 'Numero di telefono richiesto per chiamate';
        }

        if (formData.is_recurring && formData.recurrence_frequency === 'weekly' && formData.recurrence_days.length === 0) {
            newErrors.recurrence_days = 'Seleziona almeno un giorno per eventi settimanali ricorrenti';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Errore durante il salvataggio dell\'evento:', error);
            setErrors({ general: 'Errore durante il salvataggio. Riprova.' });
        }
    };

    const handleDelete = async () => {
        if (onDelete && initialData?.id) {
            try {
                await onDelete(initialData.id);
                onClose();
            } catch (error) {
                console.error('Errore durante l\'eliminazione dell\'evento:', error);
                setErrors({ general: 'Errore durante l\'eliminazione. Riprova.' });
            }
        }
    };

    const toggleRecurrenceDay = (dayValue: number) => {
        setFormData(prev => ({
            ...prev,
            recurrence_days: prev.recurrence_days.includes(dayValue)
                ? prev.recurrence_days.filter(d => d !== dayValue)
                : [...prev.recurrence_days, dayValue]
        }));
    };

    const toggleReminder = (minutes: number) => {
        setFormData(prev => ({
            ...prev,
            reminder_minutes: prev.reminder_minutes.includes(minutes)
                ? prev.reminder_minutes.filter(m => m !== minutes)
                : [...prev.reminder_minutes, minutes]
        }));
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Calendar className="w-6 h-6 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {initialData ? 'Modifica Evento' : 'Nuovo Evento'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Error Message */}
                    {errors.general && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                            {errors.general}
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Titolo Evento *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => handleFieldChange('title', e.target.value)}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                            placeholder="es. Riunione con cliente"
                        />
                        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                    </div>

                    {/* Event Type Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Tipo di Evento
                        </label>
                        <div className="grid grid-cols-5 gap-3">
                            {EVENT_TYPES.map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => handleFieldChange('event_type', type.value)}
                                    className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${formData.event_type === type.value
                                        ? `border-${type.color}-500 bg-${type.color}-50 text-${type.color}-700`
                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                        }`}
                                >
                                    <div className="text-2xl mb-2">{type.icon}</div>
                                    <div className="text-sm font-medium">{type.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Priority and Color Row */}
                    <div className="grid grid-cols-2 gap-6">
                        {/* Priority */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Priorità
                            </label>
                            <div className="space-y-2">
                                {PRIORITY_LEVELS.map((priority) => (
                                    <label key={priority.value} className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="priority"
                                            value={priority.value}
                                            checked={formData.priority === priority.value}
                                            onChange={(e) => handleFieldChange('priority', e.target.value)}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${priority.bgClass} ${priority.textClass}`}>
                                            {priority.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Color */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                <Palette className="w-4 h-4 inline mr-2" />
                                Colore Evento
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {COLORS.map((color) => (
                                    <button
                                        key={color.value}
                                        type="button"
                                        onClick={() => handleFieldChange('color', color.value)}
                                        className={`w-10 h-10 rounded-lg ${color.class} border-2 transition-all hover:scale-110 ${formData.color === color.value ? 'border-gray-800 ring-2 ring-gray-300' : 'border-gray-300'
                                            }`}
                                        title={color.label}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Date and Time Row */}
                    <div className="grid grid-cols-3 gap-4">
                        {/* All Day Toggle */}
                        <div className="col-span-1">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_all_day}
                                    onChange={(e) => handleFieldChange('is_all_day', e.target.checked)}
                                    className="w-5 h-5 text-blue-600 rounded"
                                />
                                <span className="text-sm font-semibold text-gray-700">Tutto il giorno</span>
                            </label>
                        </div>

                        {/* Start Time */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <Clock className="w-4 h-4 inline mr-2" />
                                Inizio *
                            </label>
                            <input
                                type={formData.is_all_day ? 'date' : 'datetime-local'}
                                required
                                value={formData.is_all_day ? formData.start_time.split('T')[0] : formData.start_time}
                                onChange={(e) => handleFieldChange('start_time', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.start_time ? 'border-red-300' : 'border-gray-300'
                                    }`}
                            />
                            {errors.start_time && <p className="mt-1 text-sm text-red-600">{errors.start_time}</p>}
                        </div>

                        {/* End Time */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Fine *
                            </label>
                            <input
                                type={formData.is_all_day ? 'date' : 'datetime-local'}
                                required
                                value={formData.is_all_day ? formData.end_time.split('T')[0] : formData.end_time}
                                onChange={(e) => handleFieldChange('end_time', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.end_time ? 'border-red-300' : 'border-gray-300'
                                    }`}
                            />
                            {errors.end_time && <p className="mt-1 text-sm text-red-600">{errors.end_time}</p>}
                        </div>
                    </div>

                    {/* Location Section */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            <MapPin className="w-4 h-4 inline mr-2" />
                            Posizione
                        </label>

                        {/* Location Type Tabs */}
                        <div className="flex border-b mb-4">
                            {[
                                { value: 'physical', label: 'Fisico', icon: MapPin },
                                { value: 'virtual', label: 'Virtuale', icon: Video },
                                { value: 'phone', label: 'Telefono', icon: Bell }
                            ].map(({ value, label, icon: Icon }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => handleFieldChange('location_type', value)}
                                    className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${formData.location_type === value
                                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                                        : 'border-transparent text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Location Fields */}
                        {formData.location_type === 'physical' && (
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => handleFieldChange('location', e.target.value)}
                                placeholder="es. Ufficio, Indirizzo completo"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        )}

                        {formData.location_type === 'virtual' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Meeting URL
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="url"
                                            value={formData.meeting_url}
                                            onChange={(e) => handleFieldChange('meeting_url', e.target.value)}
                                            placeholder="https://meet.google.com/... o incolla il tuo link"
                                            className={`flex-1 px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.meeting_url ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                        />
                                        {formData.meeting_url && (
                                            <button
                                                type="button"
                                                onClick={() => handleFieldChange('meeting_url', '')}
                                                className="px-3 py-2 text-gray-500 hover:text-red-600 border-2 border-gray-300 rounded-lg transition-colors"
                                                title="Cancella URL"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                    {errors.meeting_url && <p className="text-sm text-red-600 mt-1">{errors.meeting_url}</p>}
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newUrl = generateMeetingUrl();
                                            handleFieldChange('meeting_url', newUrl);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                                    >
                                        <Video className="w-4 h-4" />
                                        Genera Google Meet
                                    </button>

                                    <span className="text-sm text-gray-500">oppure incolla il tuo link</span>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-xs text-blue-800">
                                        <strong>💡 Consiglio Pro:</strong> Per meeting importanti con controlli host (mute, remove, recording),
                                        crea il meeting manualmente su{' '}
                                        <a href="https://meet.google.com" target="_blank" rel="noopener" className="underline hover:text-blue-900">
                                            meet.google.com
                                        </a>
                                        {' '}e incolla qui il link.
                                    </p>
                                </div>

                                {formData.meeting_url && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                                        <span className="text-green-600 mt-0.5">✓</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-green-800 font-medium">Meeting URL configurato</p>
                                            <a
                                                href={formData.meeting_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-green-600 hover:underline break-all block mt-1"
                                            >
                                                {formData.meeting_url}
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {formData.location_type === 'phone' && (
                            <input
                                type="tel"
                                value={formData.phone_number}
                                onChange={(e) => handleFieldChange('phone_number', e.target.value)}
                                placeholder="+39 123 456 7890"
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.phone_number ? 'border-red-300' : 'border-gray-300'
                                    }`}
                            />
                        )}
                        {errors.phone_number && <p className="mt-1 text-sm text-red-600">{errors.phone_number}</p>}
                    </div>

                    {/* Advanced Options Toggle */}
                    <div>
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                        >
                            <Tag className="w-4 h-4" />
                            {showAdvanced ? 'Nascondi opzioni avanzate' : 'Mostra opzioni avanzate'}
                        </button>
                    </div>

                    {/* Advanced Options */}
                    {showAdvanced && (
                        <div className="space-y-6 bg-gray-50 p-6 rounded-lg border">
                            {/* Recurring Events */}
                            <div>
                                <label className="flex items-center gap-3 cursor-pointer mb-4">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_recurring}
                                        onChange={(e) => handleFieldChange('is_recurring', e.target.checked)}
                                        className="w-5 h-5 text-blue-600 rounded"
                                    />
                                    <span className="text-sm font-semibold text-gray-700">
                                        <Repeat className="w-4 h-4 inline mr-2" />
                                        Evento Ricorrente
                                    </span>
                                </label>

                                {formData.is_recurring && (
                                    <div className="space-y-4 ml-8">
                                        {/* Frequency */}
                                        <div className="grid grid-cols-3 gap-3">
                                            <select
                                                value={formData.recurrence_frequency}
                                                onChange={(e) => handleFieldChange('recurrence_frequency', e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-lg"
                                            >
                                                <option value="daily">Giornaliero</option>
                                                <option value="weekly">Settimanale</option>
                                                <option value="monthly">Mensile</option>
                                            </select>

                                            <input
                                                type="number"
                                                min="1"
                                                max="52"
                                                value={formData.recurrence_interval}
                                                onChange={(e) => handleFieldChange('recurrence_interval', parseInt(e.target.value))}
                                                className="px-3 py-2 border border-gray-300 rounded-lg"
                                                placeholder="Intervallo"
                                            />

                                            <input
                                                type="date"
                                                value={formData.recurrence_end_date}
                                                onChange={(e) => handleFieldChange('recurrence_end_date', e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-lg"
                                                placeholder="Fine ricorrenza"
                                            />
                                        </div>

                                        {/* Weekly Days Selection */}
                                        {formData.recurrence_frequency === 'weekly' && (
                                            <div>
                                                <p className="text-sm text-gray-600 mb-2">Giorni della settimana:</p>
                                                <div className="flex gap-2">
                                                    {DAYS_OF_WEEK.map((day) => (
                                                        <button
                                                            key={day.value}
                                                            type="button"
                                                            onClick={() => toggleRecurrenceDay(day.value)}
                                                            className={`w-10 h-10 rounded-full border-2 text-sm font-medium transition-all ${formData.recurrence_days.includes(day.value)
                                                                ? 'border-blue-500 bg-blue-500 text-white'
                                                                : 'border-gray-300 hover:border-gray-400 bg-white text-gray-700'
                                                                }`}
                                                            title={day.fullName}
                                                        >
                                                            {day.label}
                                                        </button>
                                                    ))}
                                                </div>
                                                {errors.recurrence_days && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.recurrence_days}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Reminders */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    <Bell className="w-4 h-4 inline mr-2" />
                                    Promemoria
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {REMINDER_OPTIONS.map((reminder) => (
                                        <label key={reminder.value} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.reminder_minutes.includes(reminder.value)}
                                                onChange={() => toggleReminder(reminder.value)}
                                                className="w-4 h-4 text-blue-600 rounded"
                                            />
                                            <span className="text-sm">{reminder.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Attendees */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <Users className="w-4 h-4 inline mr-2" />
                                    Partecipanti
                                </label>
                                <input
                                    type="text"
                                    value={formData.attendees.join(', ')}
                                    onChange={(e) => handleFieldChange('attendees', e.target.value.split(', ').filter(email => email.trim()))}
                                    placeholder="email1@example.com, email2@example.com"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="mt-1 text-sm text-gray-500">Inserisci gli indirizzi email separati da virgola</p>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Descrizione
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleFieldChange('description', e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            placeholder="Aggiungi dettagli sull'evento..."
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Note Private
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => handleFieldChange('notes', e.target.value)}
                            rows={2}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            placeholder="Note personali non visibili agli altri..."
                        />
                    </div>
                </form>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
                    <div>
                        {initialData && onDelete && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Elimina Evento
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            <Save className="w-4 h-4" />
                            {initialData ? 'Aggiorna Evento' : 'Crea Evento'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}