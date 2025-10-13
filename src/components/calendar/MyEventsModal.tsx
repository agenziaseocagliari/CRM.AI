'use client';

import { Calendar, Clock, MapPin, X } from 'lucide-react';
import { useState } from 'react';

interface CalendarEvent {
    id?: string;
    title: string;
    start: string;
    end?: string;
    extendedProps?: {
        event_type?: string;
        priority?: string;
        location?: string;
        description?: string;
    };
}

interface MyEventsModalProps {
    isOpen: boolean;
    onClose: () => void;
    events: CalendarEvent[];
}

export default function MyEventsModal({ isOpen, onClose, events }: MyEventsModalProps) {
    const [filter, setFilter] = useState('all');

    if (!isOpen) return null;

    // Sort events by date
    const sortedEvents = [...events].sort((a, b) =>
        new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    // Filter events based on selected filter
    const filteredEvents = sortedEvents.filter(event => {
        if (filter === 'all') return true;
        if (filter === 'upcoming') return new Date(event.start) > new Date();
        if (filter === 'past') return new Date(event.start) < new Date();
        return event.extendedProps?.event_type === filter;
    });

    const getEventTypeColor = (type: string) => {
        switch (type) {
            case 'meeting': return 'bg-blue-100 text-blue-700';
            case 'call': return 'bg-green-100 text-green-700';
            case 'task': return 'bg-purple-100 text-purple-700';
            case 'appointment': return 'bg-orange-100 text-orange-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                    <h2 className="text-2xl font-bold text-gray-900">📅 I Miei Eventi</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Filters */}
                <div className="px-6 py-4 border-b bg-gray-50">
                    <div className="flex gap-2 flex-wrap">
                        {[
                            { value: 'all', label: 'Tutti', count: sortedEvents.length },
                            { value: 'upcoming', label: 'Prossimi', count: sortedEvents.filter(e => new Date(e.start) > new Date()).length },
                            { value: 'past', label: 'Passati', count: sortedEvents.filter(e => new Date(e.start) < new Date()).length },
                            { value: 'meeting', label: 'Riunioni', count: sortedEvents.filter(e => e.extendedProps?.event_type === 'meeting').length },
                            { value: 'call', label: 'Chiamate', count: sortedEvents.filter(e => e.extendedProps?.event_type === 'call').length }
                        ].map(filterOption => (
                            <button
                                key={filterOption.value}
                                onClick={() => setFilter(filterOption.value)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === filterOption.value
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-white text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {filterOption.label} ({filterOption.count})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Events List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {filteredEvents.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">Nessun evento trovato</p>
                            <p className="text-gray-400 text-sm mt-2">
                                {filter === 'all' ? 'Non hai ancora eventi programmati' : 'Prova a cambiare il filtro'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredEvents.map((event, idx) => (
                                <div key={event.id || idx} className="p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-xl text-gray-900">{event.title}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.extendedProps?.event_type || 'other')}`}>
                                                    {event.extendedProps?.event_type || 'Evento'}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                                                <span className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    {new Date(event.start).toLocaleDateString('it-IT', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                                <span className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4" />
                                                    {new Date(event.start).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                                    {event.end && ` - ${new Date(event.end).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`}
                                                </span>
                                            </div>

                                            {event.extendedProps?.location && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                                    <MapPin className="w-4 h-4" />
                                                    {event.extendedProps.location}
                                                </div>
                                            )}

                                            {event.extendedProps?.description && (
                                                <p className="text-gray-600 text-sm mt-2">{event.extendedProps.description}</p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 ml-4">
                                            {event.extendedProps?.priority && (
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${event.extendedProps.priority === 'high' ? 'bg-red-100 text-red-700' :
                                                        event.extendedProps.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-green-100 text-green-700'
                                                    }`}>
                                                    {event.extendedProps.priority === 'high' ? 'Alta' :
                                                        event.extendedProps.priority === 'medium' ? 'Media' : 'Bassa'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-gray-50">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">
                            Mostrando {filteredEvents.length} di {sortedEvents.length} eventi
                        </p>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Chiudi
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}