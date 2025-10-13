'use client';

import itLocale from '@fullcalendar/core/locales/it';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useRef, useState } from 'react';

interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    backgroundColor?: string;
    borderColor?: string;
    extendedProps?: any;
}

interface CalendarViewProps {
    events: CalendarEvent[];
    onEventClick?: (event: any) => void;
    onDateClick?: (date: Date) => void;
    onEventDrop?: (event: any) => void;
    onEventResize?: (event: any) => void;
}

export default function CalendarView({
    events,
    onEventClick,
    onDateClick,
    onEventDrop,
    onEventResize
}: CalendarViewProps) {
    const calendarRef = useRef<FullCalendar>(null);
    const [currentView, setCurrentView] = useState('timeGridWeek');

    const handleEventClick = (clickInfo: any) => {
        if (onEventClick) {
            onEventClick(clickInfo.event);
        }
    };

    const handleDateClick = (dateInfo: any) => {
        if (onDateClick) {
            onDateClick(new Date(dateInfo.dateStr));
        }
    };

    const handleEventDrop = (dropInfo: any) => {
        if (onEventDrop) {
            onEventDrop({
                eventId: dropInfo.event.id,
                start: dropInfo.event.start,
                end: dropInfo.event.end
            });
        }
    };

    const handleEventResize = (resizeInfo: any) => {
        if (onEventResize) {
            onEventResize({
                eventId: resizeInfo.event.id,
                start: resizeInfo.event.start,
                end: resizeInfo.event.end
            });
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-4">
            <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView={currentView}
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                events={events}
                editable={true}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                locale={itLocale}
                timeZone='Europe/Rome'
                slotMinTime='07:00:00'
                slotMaxTime='22:00:00'
                slotDuration='00:15:00'
                height='auto'
                eventClick={handleEventClick}
                dateClick={handleDateClick}
                eventDrop={handleEventDrop}
                eventResize={handleEventResize}
                eventTimeFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    meridiem: false
                }}
                slotLabelFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    meridiem: false
                }}
                buttonText={{
                    today: 'Oggi',
                    month: 'Mese',
                    week: 'Settimana',
                    day: 'Giorno'
                }}
                eventColor='#3b82f6'
            />
        </div>
    );
}