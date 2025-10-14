'use client';

import { useState } from 'react';
import EventModal from './EventModal';

export default function EventModalTest() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [eventData, setEventData] = useState<any>(null);

    const handleSave = async (data: any) => {
        console.log('💾 Saving event:', data);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setEventData(data);
    };

    const handleDelete = async (id: number) => {
        console.log('🗑️ Deleting event:', id);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        setEventData(null);
    };

    const sampleEvent = {
        id: 1,
        title: 'Riunione Cliente',
        description: 'Discussione su progetto Q1',
        event_type: 'meeting',
        priority: 'high',
        start_time: '2024-12-21T10:00',
        end_time: '2024-12-21T11:30',
        location: 'Ufficio Milano',
        location_type: 'physical',
        meeting_url: '',
        phone_number: '',
        is_all_day: false,
        is_recurring: false,
        recurrence_frequency: 'weekly',
        recurrence_interval: 1,
        recurrence_days: [],
        recurrence_end_date: '',
        reminder_minutes: [15, 60],
        color: 'blue',
        notes: 'Preparare presentazione',
        attendees: ['cliente@example.com'],
        status: 'scheduled'
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    🗓️ Test EventModal Avanzato
                </h1>

                <div className="space-y-4 mb-8">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        ➕ Nuovo Evento
                    </button>

                    <button
                        onClick={() => {
                            setIsModalOpen(true);
                        }}
                        className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                        ✏️ Modifica Evento Esempio
                    </button>
                </div>

                {/* Show saved data */}
                {eventData && (
                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">📋 Ultimo Evento Salvato:</h3>
                        <div className="space-y-2 text-sm">
                            <p><strong>Titolo:</strong> {eventData.title}</p>
                            <p><strong>Tipo:</strong> {eventData.event_type}</p>
                            <p><strong>Priorità:</strong> {eventData.priority}</p>
                            <p><strong>Inizio:</strong> {eventData.start_time}</p>
                            <p><strong>Fine:</strong> {eventData.end_time}</p>
                            <p><strong>Posizione:</strong> {eventData.location_type} - {eventData.location || eventData.meeting_url || eventData.phone_number}</p>
                            <p><strong>Ricorrente:</strong> {eventData.is_recurring ? 'Sì' : 'No'}</p>
                            <p><strong>Promemoria:</strong> {eventData.reminder_minutes.join(', ')} min</p>
                            <p><strong>Colore:</strong> {eventData.color}</p>
                        </div>
                    </div>
                )}

                <div className="text-center text-gray-500 text-sm">
                    <p>✨ Test completo con tutte le funzionalità Calendly-level</p>
                    <p>🎯 Tipi eventi • 🚨 Priorità • 📍 Location • 🔄 Ricorrenti • 🔔 Promemoria</p>
                </div>
            </div>

            <EventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                onDelete={handleDelete}
                initialData={eventData ? sampleEvent : undefined}
                selectedDate={new Date()}
            />
        </div>
    );
}