// src/components/CalendarView.tsx
import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useCrmData } from '../hooks/useCrmData';
import { CrmEvent } from '../types';
// FIX: Corrected import path for DayEventsModal.
import { DayEventsModal } from './DayEventsModal';
import { PlusIcon } from './ui/icons';

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
                <button onClick={onPrevMonth} aria-label="Mese precedente" className="p-2 text-gray-500 rounded-md hover:bg-gray-100">
                    &lt;
                </button>
                <button onClick={onNextMonth} aria-label="Mese successivo" className="p-2 text-gray-500 rounded-md hover:bg-gray-100">
                    &gt;
                </button>
            </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-800">
            {currentDate.toLocaleString('it-IT', { month: 'long', year: 'numeric' })}
        </h2>
    </div>
);

export const CalendarView: React.FC = () => {
    const crmData = useOutletContext<ReturnType<typeof useCrmData>>();
    const { crmEvents, loading } = crmData;
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const handlePrevMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    const handleToday = () => setCurrentDate(new Date());

    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        
        const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; 
        
        const daysInMonth = lastDayOfMonth.getDate();
        const days: (Date | null)[] = [];

        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        while (days.length % 7 !== 0) {
            days.push(null);
        }

        return days;
    }, [currentDate]);

    const eventsByDate = useMemo(() => {
        return crmEvents.reduce((acc, event) => {
            if (event.status === 'cancelled' || !event.event_start_time) return acc;
            
            // **FIX CRITICO FUSO ORARIO**: Converte la stringa ISO (UTC) dal database
            // in un oggetto Date e poi costruisce la chiave YYYY-MM-DD usando
            // i metodi locali del browser (getFullYear, getMonth, getDate).
            // Questo risolve il bug per cui un evento creato nelle prime ore del mattino
            // (es. 01:00 in Italia) veniva visualizzato nel giorno precedente a causa
            // della conversione in UTC.
            const localDate = new Date(event.event_start_time);
            const year = localDate.getFullYear();
            const month = String(localDate.getMonth() + 1).padStart(2, '0'); // I mesi sono 0-based
            const day = String(localDate.getDate()).padStart(2, '0');
            const dateKey = `${year}-${month}-${day}`;

            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(event);
            // Ordina gli eventi per ora di inizio
            acc[dateKey].sort((a, b) => new Date(a.event_start_time).getTime() - new Date(b.event_start_time).getTime());
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
                            <div key={index} className="relative h-32 p-1.5 border-r border-b text-sm overflow-y-auto group">
                                {day && (
                                    <button
                                        onClick={() => setSelectedDate(day)}
                                        aria-label={`Eventi per il ${day.toLocaleDateString('it-IT')}`}
                                        className={`flex items-center justify-center h-7 w-7 rounded-full transition-colors ${
                                            isToday ? 'bg-primary text-white font-bold' : 'text-gray-700 hover:bg-gray-100'
                                        }`}>
                                        {day.getDate()}
                                    </button>
                                )}
                                <div className="mt-1 space-y-1">
                                    {dayEvents.slice(0, 2).map(event => (
                                        <button 
                                            key={event.id}
                                            onClick={() => setSelectedDate(new Date(event.event_start_time))}
                                            className="w-full text-left p-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded truncate hover:bg-indigo-200"
                                        >
                                            {new Date(event.event_start_time).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} {event.event_summary}
                                        </button>
                                    ))}
                                    {dayEvents.length > 2 && (
                                        <p className="text-xs text-gray-500 mt-1 pl-1">+ {dayEvents.length - 2} altri</p>
                                    )}
                                </div>
                                {day && (
                                     <button
                                        onClick={() => setSelectedDate(day)}
                                        aria-label={`Aggiungi evento per il ${day.toLocaleDateString('it-IT')}`}
                                        className="absolute bottom-2 right-2 w-6 h-6 flex items-center justify-center bg-primary text-white rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <DayEventsModal
                isOpen={!!selectedDate}
                onClose={() => setSelectedDate(null)}
                date={selectedDate}
                crmData={crmData}
            />
        </>
    );
};
