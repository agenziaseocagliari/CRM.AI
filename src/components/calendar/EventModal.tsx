'use client';

import { useState } from 'react';
import { X, Calendar, Clock, MapPin, Users, Video, Bell, Repeat, Tag } from 'lucide-react';

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: any) => Promise<void>;
    initialData?: any;
    selectedDate?: Date;
}

const EVENT_TYPES = [
    { value: 'meeting', label: 'Riunione', icon: '💼', color: 'blue' },
    { value: 'call', label: 'Chiamata', icon: '📞', color: 'green' },
    { value: 'task', label: 'Attività', icon: '✅', color: 'purple' },
    { value: 'appointment', label: 'Appuntamento', icon: '📅', color: 'orange' },
    { value: 'deadline', label: 'Scadenza', icon: '⏰', color: 'red' },
];

const PRIORITY_LEVELS = [
    { value: 'low', label: 'Bassa', color: 'bg-gray-100 text-gray-700' },
    { value: 'medium', label: 'Media', color: 'bg-blue-100 text-blue-700' },
    { value: 'high', label: 'Alta', color: 'bg-orange-100 text-orange-700' },
    { value: 'urgent', label: 'Urgente', color: 'bg-red-100 text-red-700' },
];

export default function EventModal({ isOpen, onClose, onSave, initialData, selectedDate }: EventModalProps) {
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        event_type: initialData?.event_type || 'meeting',
        priority: initialData?.priority || 'medium',
        start_time: initialData?.start_time || (selectedDate ? new Date(selectedDate).toISOString().slice(0, 16) : ''),
        end_time: initialData?.end_time || '',
        location: initialData?.location || '',
        location_type: initialData?.location_type || 'physical',
        meeting_url: initialData?.meeting_url || '',
        is_recurring: initialData?.is_recurring || false,
        recurrence_frequency: 'weekly',
        reminder_minutes: initialData?.reminder_minutes || [],
        notes: initialData?.notes || '',
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {initialData ? 'Modifica Evento' : 'Nuovo Evento'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Titolo Evento *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="es. Riunione con cliente"
                        />
                    </div>

                    {/* Event Type Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            <Tag className="w-4 h-4 inline mr-1" />
                            Tipo di Evento
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {EVENT_TYPES.map(type => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setFormData({...formData, event_type: type.value})}
                                    className={`p-4 border-2 rounded-lg text-center transition-all hover:scale-105 ${
                                        formData.event_type === type.value
                                            ? `border-${type.color}-500 bg-${type.color}-50 shadow-md`
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="text-3xl mb-1">{type.icon}</div>
                                    <div className="text-xs font-medium">{type.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <Clock className="w-4 h-4 inline mr-1" />
                                Inizio *
                            </label>
                            <input
                                type="datetime-local"
                                required
                                value={formData.start_time}
                                onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <Clock className="w-4 h-4 inline mr-1" />
                                Fine *
                            </label>
                            <input
                                type="datetime-local"
                                required
                                value={formData.end_time}
                                onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Priorità
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {PRIORITY_LEVELS.map(priority => (
                                <button
                                    key={priority.value}
                                    type="button"
                                    onClick={() => setFormData({...formData, priority: priority.value})}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                        formData.priority === priority.value
                                            ? priority.color + ' ring-2 ring-offset-2 ring-blue-500'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {priority.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <MapPin className="w-4 h-4 inline mr-1" />
                            Luogo / Link
                        </label>
                        <div className="space-y-2">
                            <select
                                value={formData.location_type}
                                onChange={(e) => setFormData({...formData, location_type: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="physical">📍 Luogo Fisico</option>
                                <option value="virtual">🎥 Video Conferenza</option>
                                <option value="phone">📞 Telefonata</option>
                            </select>

                            {formData.location_type === 'physical' && (
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                                    placeholder="Via Roma 123, Milano"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                />
                            )}

                            {formData.location_type === 'virtual' && (
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={formData.meeting_url}
                                        onChange={(e) => setFormData({...formData, meeting_url: e.target.value})}
                                        placeholder="https://meet.google.com/..."
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const meetId = Math.random().toString(36).substring(2, 15);
                                            setFormData({...formData, meeting_url: `https://meet.google.com/${meetId}`});
                                        }}
                                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                                    >
                                        <Video className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recurring */}
                    <div className="border-t pt-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_recurring}
                                onChange={(e) => setFormData({...formData, is_recurring: e.target.checked})}
                                className="rounded"
                            />
                            <div className="flex items-center gap-2">
                                <Repeat className="w-4 h-4" />
                                <span className="font-semibold">Evento Ricorrente</span>
                            </div>
                        </label>

                        {formData.is_recurring && (
                            <div className="mt-4 ml-7 space-y-3">
                                <select
                                    value={formData.recurrence_frequency}
                                    onChange={(e) => setFormData({...formData, recurrence_frequency: e.target.value})}
                                    className="px-4 py-2 border rounded-lg"
                                >
                                    <option value="daily">Ogni giorno</option>
                                    <option value="weekly">Ogni settimana</option>
                                    <option value="monthly">Ogni mese</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Reminders */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <Bell className="w-4 h-4 inline mr-1" />
                            Promemoria
                        </label>
                        <div className="space-y-2">
                            {[
                                { value: 15, label: '15 minuti prima' },
                                { value: 60, label: '1 ora prima' },
                                { value: 1440, label: '1 giorno prima' }
                            ].map(reminder => (
                                <label key={reminder.value} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.reminder_minutes.includes(reminder.value)}
                                        onChange={(e) => {
                                            const updated = e.target.checked
                                                ? [...formData.reminder_minutes, reminder.value]
                                                : formData.reminder_minutes.filter((v: number) => v !== reminder.value);
                                            setFormData({...formData, reminder_minutes: updated});
                                        }}
                                        className="rounded"
                                    />
                                    <span className="text-sm">{reminder.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Descrizione
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            rows={2}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Note visibili solo a te..."
                        />
                    </div>
                </form>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t bg-gray-50 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                    >
                        Annulla
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-lg"
                    >
                        {initialData ? 'Salva Modifiche' : 'Crea Evento'}
                    </button>
                </div>
            </div>
        </div>
    );
}