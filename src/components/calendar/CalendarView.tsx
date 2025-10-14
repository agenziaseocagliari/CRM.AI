'use client';

import type { EventClickArg, EventDropArg } from '@fullcalendar/core';
import itLocale from '@fullcalendar/core/locales/it';
import dayGridPlugin from '@fullcalendar/daygrid';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';
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
        is_recurring?: boolean;
        [key: string]: unknown;
    };
}

interface CalendarViewProps {
    events: CalendarEvent[];
    onEventClick?: (event: CalendarEvent) => void;
    onDateClick?: (date: Date) => void;
    onEventDrop?: (info: EventDropArg) => void;
    onEventResize?: (info: EventResizeDoneArg) => void;
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

    const handleEventClick = (clickInfo: EventClickArg) => {
        if (onEventClick) {
            // Convert FullCalendar event to our CalendarEvent format
            const event: CalendarEvent = {
                id: clickInfo.event.id,
                title: clickInfo.event.title,
                start: clickInfo.event.startStr,
                end: clickInfo.event.endStr || '',
                backgroundColor: clickInfo.event.backgroundColor || '',
                borderColor: clickInfo.event.borderColor || '',
                extendedProps: clickInfo.event.extendedProps
            };
            onEventClick(event);
        }
    };

    const handleDateClick = (dateInfo: { dateStr: string }) => {
        if (onDateClick) {
            onDateClick(new Date(dateInfo.dateStr));
        }
    };

    const handleEventDrop = (dropInfo: EventDropArg) => {
        if (onEventDrop) {
            onEventDrop(dropInfo);
        }
    };

    const handleEventResize = (resizeInfo: EventResizeDoneArg) => {
        if (onEventResize) {
            onEventResize(resizeInfo);
        }
    };

    const renderEventContent = (eventInfo: { event: { title: string; extendedProps?: { is_recurring?: boolean } } }) => {
        const isRecurring = eventInfo.event.extendedProps?.is_recurring;

        return (
            <div className="flex items-center gap-1 p-1">
                {isRecurring && (
                    <span className="text-xs">🔄</span>
                )}
                <span className="text-xs font-medium truncate">
                    {eventInfo.event.title}
                </span>
            </div>
        );
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
                eventContent={renderEventContent}
            />
        </div>
    );
}