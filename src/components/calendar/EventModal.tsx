'use client';

import { Bell, Clock, MapPin, X } from 'lucide-react';
import { useState } from 'react';
import RecurringEventSettings from './RecurringEventSettings';

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: any) => Promise<void>;
    initialDate?: Date;
    event?: any;
}

const EVENT_TYPES = [
    { value: 'meeting', label: 'Riunione', icon: '💼' },
    { value: 'call', label: 'Chiamata', icon: '📞' },
    { value: 'task', label: 'Attività', icon: '✅' },
    { value: 'deadline', label: 'Scadenza', icon: '⏰' },
    { value: 'appointment', label: 'Appuntamento', icon: '📅' },
];

const PRIORITY_LEVELS = [
    { value: 'low', label: 'Bassa', color: 'bg-gray-100 text-gray-700' },
    { value: 'medium', label: 'Media', color: 'bg-blue-100 text-blue-700' },
    { value: 'high', label: 'Alta', color: 'bg-orange-100 text-orange-700' },
    { value: 'urgent', label: 'Urgente', color: 'bg-red-100 text-red-700' },
];

const REMINDER_OPTIONS = [
    { value: 15, label: '15 minuti prima' },
    { value: 30, label: '30 minuti prima' },
    { value: 60, label: '1 ora prima' },
    { value: 1440, label: '1 giorno prima' },
];

export default function EventModal({
    isOpen,
    onClose,
    onSave,
    initialDate,
    event
}: EventModalProps) {
    const [formData, setFormData] = useState({
        title: event?.title || '',
        description: event?.description || '',
        event_type: event?.event_type || 'meeting',
        start_time: event?.start_time || (initialDate ? initialDate.toISOString().slice(0, 16) : ''),
        end_time: event?.end_time || '',
        location: event?.location || '',
        location_type: event?.location_type || 'physical',
        meeting_url: event?.meeting_url || '',
        priority: event?.priority || 'medium',
        contact_id: event?.contact_id || '',
        notes: event?.notes || '',
        reminder_minutes: event?.reminder_minutes || [],
        color: event?.color || '#3b82f6'
    });

    // Recurring event settings
    const [isRecurring, setIsRecurring] = useState(event?.is_recurring || false);
    const [recurringSettings, setRecurringSettings] = useState<{
        frequency: 'daily' | 'weekly' | 'monthly';
        interval: number;
        daysOfWeek: number[];
        endDate?: string;
    }>({
        frequency: (event?.recurring_frequency as 'daily' | 'weekly' | 'monthly') || 'weekly',
        interval: event?.recurring_interval || 1,
        daysOfWeek: event?.recurring_days_of_week || [],
        endDate: event?.recurring_end_date || undefined
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const eventData = {
                ...formData,
                is_recurring: isRecurring,
                recurring_frequency: isRecurring ? recurringSettings.frequency : null,
                recurring_interval: isRecurring ? recurringSettings.interval : null,
                recurring_days_of_week: isRecurring ? recurringSettings.daysOfWeek : null,
                recurring_end_date: isRecurring ? recurringSettings.endDate : null
            };

            await onSave(eventData);
            onClose();
        } catch (error) {
            console.error('Save error:', error);
            alert('Errore durante il salvataggio');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {event ? 'Modifica Evento' : 'Nuovo Evento'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Titolo *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="es. Riunione con cliente"
                        />
                    </div>

                    {/* Event Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo Evento
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {EVENT_TYPES.map(type => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => handleChange('event_type', type.value)}
                                    className={`p-3 border rounded-lg text-center transition-colors ${formData.event_type === type.value
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="text-2xl mb-1">{type.icon}</div>
                                    <div className="text-xs font-medium">{type.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Clock className="w-4 h-4 inline mr-1" />
                                Inizio *
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.start_time}
                                onChange={(e) => handleChange('start_time', e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Clock className="w-4 h-4 inline mr-1" />
                                Fine *
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.end_time}
                                onChange={(e) => handleChange('end_time', e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <MapPin className="w-4 h-4 inline mr-1" />
                            Luogo
                        </label>
                        <div className="space-y-2">
                            <select
                                value={formData.location_type}
                                onChange={(e) => handleChange('location_type', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="physical">Fisico</option>
                                <option value="virtual">Virtuale (Video)</option>
                                <option value="phone">Telefono</option>
                                <option value="other">Altro</option>
                            </select>

                            {formData.location_type === 'physical' && (
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => handleChange('location', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    placeholder="Indirizzo o luogo"
                                />
                            )}

                            {formData.location_type === 'virtual' && (
                                <input
                                    type="url"
                                    value={formData.meeting_url}
                                    onChange={(e) => handleChange('meeting_url', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    placeholder="https://meet.google.com/..."
                                />
                            )}
                        </div>
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Priorità
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {PRIORITY_LEVELS.map(priority => (
                                <button
                                    key={priority.value}
                                    type="button"
                                    onClick={() => handleChange('priority', priority.value)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${formData.priority === priority.value
                                            ? priority.color + ' ring-2 ring-offset-2 ring-blue-500'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {priority.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Reminders */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Bell className="w-4 h-4 inline mr-1" />
                            Promemoria
                        </label>
                        <div className="space-y-2">
                            {REMINDER_OPTIONS.map(option => (
                                <label key={option.value} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.reminder_minutes.includes(option.value)}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            handleChange(
                                                'reminder_minutes',
                                                checked
                                                    ? [...formData.reminder_minutes, option.value]
                                                    : formData.reminder_minutes.filter((v: number) => v !== option.value)
                                            );
                                        }}
                                        className="mr-2 rounded"
                                    />
                                    <span className="text-sm">{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Descrizione
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Aggiungi dettagli sull'evento..."
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Note private
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            rows={2}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Note visibili solo a te..."
                        />
                    </div>

                    {/* Recurring Event Settings */}
                    <RecurringEventSettings
                        isRecurring={isRecurring}
                        onToggle={setIsRecurring}
                        settings={recurringSettings}
                        onSettingsChange={(settings) => setRecurringSettings({
                            ...settings,
                            daysOfWeek: settings.daysOfWeek || []
                        })}
                    />

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            {isSaving ? 'Salvataggio...' : event ? 'Salva Modifiche' : 'Crea Evento'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}