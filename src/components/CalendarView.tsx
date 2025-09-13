// src/components/CalendarView.tsx
import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useCrmData } from '../hooks/useCrmData';
import { CrmEvent } from '../types';
import { Modal } from './ui/Modal';

const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

const CalendarHeader: React.FC<{
    currentDate: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onToday: () => void;
}> = ({ currentDate, onPrevMonth, onNextMonth, onToday }) => (
    <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
            <button onClick={onToday} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50">
                Oggi
            </button>
            <div className="flex items-center space-x-1">
                <button onClick={onPrevMonth} className="p-2 text-gray-500 rounded-md hover:bg-gray-100">
                    &lt;
                </button>
                <button onClick={onNextMonth} className="p-2 text-gray-500 rounded-md hover:bg-gray-100">
                    &gt;
                </button>
            </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-800">
            {currentDate.toLocaleString('it-IT', { month: 'long', year: 'numeric' })}
        </h2>
    </div>
);

const EventDetailsModal: React.FC<{
    event: CrmEvent | null;
    onClose: () => void;
}> = ({ event, onClose }) => {
    if (!event) return null;
    
    const startTime = new Date(event.event_start_time).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    const endTime = new Date(event.event_end_time).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

    return (
        <Modal isOpen={!!event} onClose={onClose} title="Dettagli Evento">
            <div className="space-y-3 text-sm">
                <p><strong>Titolo:</strong> {event.event_summary}</p>
                <p><strong>Contatto:</strong> {event.contacts?.name} ({event.contacts?.email})</p>
                <p><strong>Data:</strong> {new Date(event.event_start_time).toLocaleDateString('it-IT')}</p>
                <p><strong>Orario:</strong> {startTime} - {endTime}</p>
                 <p><strong>Stato:</strong> 
                    <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${
                        event.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                        {event.status === 'confirmed' ? 'Confermato' : 'Annullato'}
                    </span>
                </p>
            </div>
        </Modal>
    );
};


export const CalendarView: React.FC = () => {
    const { crmEvents, loading } = useOutletContext<ReturnType<typeof useCrmData>>();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState<CrmEvent | null>(null);

    const handlePrevMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    const handleToday = () => setCurrentDate(new Date());

    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        
        // Offset per iniziare la settimana di Lunedì (0=Dom, 1=Lun, ..., 6=Sab)
        const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; 
        
        const daysInMonth = lastDayOfMonth.getDate();
        const days: (Date | null)[] = [];

        // Giorni del mese precedente per riempire l'inizio
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }
        // Giorni del mese corrente
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        // Giorni del mese successivo per completare la griglia
        while (days.length % 7 !== 0) {
            days.push(null);
        }

        return days;
    }, [currentDate]);

    const eventsByDate = useMemo(() => {
        return crmEvents.reduce((acc, event) => {
            if (event.status === 'cancelled') return acc;
            const dateKey = new Date(event.event_start_time).toISOString().split('T')[0];
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(event);
            return acc;
        }, {} as Record<string, CrmEvent[]>);
    }, [crmEvents]);
    
    if (loading) return <div className="text-center p-8">Caricamento calendario...</div>;

    return (
        <>
            <div className="p-4 bg-white rounded-lg shadow">
                <CalendarHeader 
                    currentDate={currentDate} 
                    onPrevMonth={handlePrevMonth}
                    onNextMonth={handleNextMonth}
                    onToday={handleToday}
                />
                <div className="grid grid-cols-7 border-t border-l">
                    {daysOfWeek.map(day => (
                        <div key={day} className="py-2 text-center text-sm font-semibold text-gray-600 border-r border-b bg-gray-50">
                            {day}
                        </div>
                    ))}
                    {calendarGrid.map((day, index) => {
                        const isToday = day && day.toDateString() === new Date().toDateString();
                        const dayKey = day?.toISOString().split('T')[0];
                        const dayEvents = dayKey ? eventsByDate[dayKey] || [] : [];
                        
                        return (
                            <div key={index} className="relative h-32 p-1.5 border-r border-b text-sm overflow-y-auto">
                                {day && (
                                    <span className={`flex items-center justify-center h-7 w-7 rounded-full ${
                                        isToday ? 'bg-primary text-white font-bold' : 'text-gray-700'
                                    }`}>
                                        {day.getDate()}
                                    </span>
                                )}
                                <div className="mt-1 space-y-1">
                                    {dayEvents.map(event => (
                                        <button 
                                            key={event.id}
                                            onClick={() => setSelectedEvent(event)}
                                            className="w-full text-left p-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded truncate hover:bg-indigo-200"
                                        >
                                            {new Date(event.event_start_time).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} {event.event_summary}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <EventDetailsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
        </>
    );
};