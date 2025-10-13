'use client';

import itLocale from '@fullcalendar/core/locales/it';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useRef } from 'react';

interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    backgroundColor?: string;
    borderColor?: string;
    extendedProps?: {
        event_type?: string;
        priority?: string;
        [key: string]: unknown;
    };
}

interface EventDropInfo {
    eventId: string;
    start: Date;
    end: Date;
}

interface CalendarViewProps {
    events: CalendarEvent[];
    onEventClick?: (event: CalendarEvent) => void;
    onDateClick?: (date: Date) => void;
    onEventDrop?: (event: EventDropInfo) => void;
    onEventResize?: (event: EventDropInfo) => void;
    currentView?: string;
}

export default function CalendarView({
    events,
    onEventClick,
    onDateClick,
    onEventDrop,
    onEventResize,
    currentView = 'week'
}: CalendarViewProps) {
    const calendarRef = useRef<FullCalendar>(null);

    // Map view names to FullCalendar view names
    const getFullCalendarView = (view: string) => {
        switch (view) {
            case 'month': return 'dayGridMonth';
            case 'week': return 'timeGridWeek';
            case 'day': return 'timeGridDay';
            default: return 'timeGridWeek';
        }
    };

    const handleEventClick = (clickInfo: { event: CalendarEvent }) => {
        if (onEventClick) {
            onEventClick(clickInfo.event);
        }
    };

    const handleDateClick = (dateInfo: { dateStr: string }) => {
        if (onDateClick) {
            onDateClick(new Date(dateInfo.dateStr));
        }
    };

    const handleEventDrop = (dropInfo: { event: { id: string; start: Date; end: Date } }) => {
        if (onEventDrop) {
            onEventDrop({
                eventId: dropInfo.event.id,
                start: dropInfo.event.start,
                end: dropInfo.event.end
            });
        }
    };

    const handleEventResize = (resizeInfo: { event: { id: string; start: Date; end: Date } }) => {
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
                initialView={getFullCalendarView(currentView)}
                key={currentView} // Force re-render when view changes
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: '' // Remove built-in view switcher since we have custom one
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