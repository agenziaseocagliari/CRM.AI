'use client';

import { Calendar as CalendarIcon, Clock, Plus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CalendarOptimizer } from '../../lib/calendar/performance-optimizations';
import { CalendarService, type FullCalendarEvent } from '../../services/calendarService';
import CalendarView from './CalendarView';
import EventModal from './EventModal';
import MyEventsModal from './MyEventsModal';
import BookingLinkModal from './BookingLinkModal';
import TeamSchedulingModal from './TeamSchedulingModal';
import AnalyticsModal from './AnalyticsModal';

export default function CalendarContainer() {
    const [events, setEvents] = useState<FullCalendarEvent[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentView, setCurrentView] = useState('week');
    
    // Modal states for all quick actions
    const [showMyEvents, setShowMyEvents] = useState(false);
    const [showBookingLink, setShowBookingLink] = useState(false);
    const [showTeamScheduling, setShowTeamScheduling] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);

    useEffect(() => {
        // Performance optimization: preload data
        const initializeCalendar = async () => {
            try {
                // TODO: Get actual user ID from auth context
                const userId = 'current-user-id';

                // Preload critical calendar data for optimal UX
                await CalendarOptimizer.preloadCalendarData(userId);

                // Enable mobile optimizations if needed
                CalendarOptimizer.enableMobileOptimizations();

                // Fetch events with performance monitoring
                const monitor = CalendarOptimizer.startPerformanceMonitoring();
                await fetchEvents();

                const metrics = monitor.end();
                console.log('📊 Calendar initialization performance:', metrics);

            } catch (error) {
                console.error('Calendar initialization failed:', error);
                fetchEvents(); // Fallback to basic fetch
            }
        };

        initializeCalendar();
    }, []);

    const fetchEvents = async () => {
        try {
            const fetchedEvents = await CalendarService.fetchEvents();
            setEvents(fetchedEvents);
            setIsLoading(false);
        } catch (error) {
            console.error('Fetch events error:', error);
            // Fallback to demo data on error
            const mockEvents = [
                {
                    id: 'demo-1',
                    title: 'Demo: Riunione Team',
                    start: new Date(Date.now() + 86400000).toISOString(),
                    end: new Date(Date.now() + 86400000 + 3600000).toISOString(),
                    backgroundColor: '#3b82f6',
                    borderColor: '#2563eb',
                    extendedProps: { event_type: 'meeting', priority: 'high' }
                },
                {
                    id: 'demo-2',
                    title: 'Demo: Chiamata Cliente',
                    start: new Date(Date.now() + 172800000).toISOString(),
                    end: new Date(Date.now() + 172800000 + 1800000).toISOString(),
                    backgroundColor: '#10b981',
                    borderColor: '#059669',
                    extendedProps: { event_type: 'call', priority: 'medium' }
                }
            ];
            setEvents(mockEvents);
            setIsLoading(false);
        }
    };

    const handleDateClick = (date: Date) => {
        setSelectedDate(date);
        setSelectedEvent(null);
        setShowModal(true);
    };

    const handleEventClick = (event: any) => {
        setSelectedEvent(event);
        setShowModal(true);
    };

    const handleSaveEvent = async (eventData: any) => {
        try {
            const newEvent = await CalendarService.createEvent(eventData);
            setEvents(prev => [...prev, newEvent]);
        } catch (error) {
            console.error('Save event error:', error);
            throw error;
        }
    };

    const handleUpdateEvent = async (eventData: any) => {
        try {
            await CalendarService.updateEventTiming(eventData.eventId, eventData.start, eventData.end);

            setEvents(prev => prev.map(event =>
                event.id === eventData.eventId
                    ? { ...event, start: eventData.start.toISOString(), end: eventData.end.toISOString() }
                    : event
            ));
        } catch (error) {
            console.error('Update event error:', error);
            // Update local state anyway for better UX
            setEvents(prev => prev.map(event =>
                event.id === eventData.eventId
                    ? { ...event, start: eventData.start.toISOString(), end: eventData.end.toISOString() }
                    : event
            ));
        }
    };

    const stats = [
        {
            title: 'Eventi Oggi',
            value: events.filter(e => new Date(e.start).toDateString() === new Date().toDateString()).length,
            icon: CalendarIcon,
            color: 'text-blue-600 bg-blue-100'
        },
        {
            title: 'Questa Settimana',
            value: events.filter(e => {
                const eventDate = new Date(e.start);
                const now = new Date();
                const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
                const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
                return eventDate >= weekStart && eventDate <= weekEnd;
            }).length,
            icon: Clock,
            color: 'text-green-600 bg-green-100'
        },
        {
            title: 'Riunioni',
            value: events.filter(e => e.extendedProps?.event_type === 'meeting').length,
            icon: Users,
            color: 'text-purple-600 bg-purple-100'
        }
    ];

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Calendario</h1>
                    <p className="text-gray-600 mt-1">Gestisci i tuoi appuntamenti e attività</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* View Toggles */}
                    <div className="flex items-center gap-2 bg-white rounded-lg shadow p-1">
                        <button
                            onClick={() => setCurrentView('month')}
                            className={`px-4 py-2 rounded ${currentView === 'month' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                                }`}
                        >
                            Mese
                        </button>
                        <button
                            onClick={() => setCurrentView('week')}
                            className={`px-4 py-2 rounded ${currentView === 'week' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                                }`}
                        >
                            Settimana
                        </button>
                        <button
                            onClick={() => setCurrentView('day')}
                            className={`px-4 py-2 rounded ${currentView === 'day' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                                }`}
                        >
                            Giorno
                        </button>
                    </div>

                    <button
                        onClick={() => {
                            setSelectedDate(new Date());
                            setSelectedEvent(null);
                            setShowModal(true);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
                    >
                        <Plus className="w-5 h-5" />
                        Nuovo Evento
                    </button>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <button 
                    onClick={() => setShowMyEvents(true)}
                    className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition-all text-left group"
                >
                    <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📅</div>
                    <div className="font-semibold">I Miei Eventi</div>
                    <div className="text-sm text-gray-500">Visualizza tutti</div>
                </button>

                <button 
                    onClick={() => setShowBookingLink(true)}
                    className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition-all text-left group"
                >
                    <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">🔗</div>
                    <div className="font-semibold">Link Prenotazione</div>
                    <div className="text-sm text-gray-500">Condividi calendario</div>
                </button>

                <button 
                    onClick={() => setShowTeamScheduling(true)}
                    className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition-all text-left group"
                >
                    <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">👥</div>
                    <div className="font-semibold">Team Scheduling</div>
                    <div className="text-sm text-gray-500">Riunioni di gruppo</div>
                </button>

                <button 
                    onClick={() => setShowAnalytics(true)}
                    className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition-all text-left group"
                >
                    <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📊</div>
                    <div className="font-semibold">Analytics</div>
                    <div className="text-sm text-gray-500">Statistiche eventi</div>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="flex items-center">
                            <div className={`p-3 rounded-lg ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Calendar */}
            {isLoading ? (
                <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Caricamento calendario...</p>
                </div>
            ) : (
                <CalendarView
                    events={events}
                    onDateClick={handleDateClick}
                    onEventClick={handleEventClick}
                    onEventDrop={handleUpdateEvent}
                    onEventResize={handleUpdateEvent}
                    currentView={currentView}
                />
            )}

            {/* Event Modal */}
            <EventModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setSelectedEvent(null);
                    setSelectedDate(null);
                }}
                onSave={handleSaveEvent}
                initialData={selectedEvent}
                selectedDate={selectedDate || undefined}
            />

            {/* My Events Modal */}
            <MyEventsModal
                isOpen={showMyEvents}
                onClose={() => setShowMyEvents(false)}
                events={events}
            />

            {/* Booking Link Modal */}
            <BookingLinkModal
                isOpen={showBookingLink}
                onClose={() => setShowBookingLink(false)}
                userId="current-user-id"
            />

            {/* Team Scheduling Modal */}
            <TeamSchedulingModal
                isOpen={showTeamScheduling}
                onClose={() => setShowTeamScheduling(false)}
            />

            {/* Analytics Modal */}
            <AnalyticsModal
                isOpen={showAnalytics}
                onClose={() => setShowAnalytics(false)}
                events={events}
            />
        </div>
    );
}