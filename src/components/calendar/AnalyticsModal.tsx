'use client';

import { X, Calendar, TrendingUp, Clock, Users, Target, BarChart3, PieChart } from 'lucide-react';

interface AnalyticsModalProps {
    isOpen: boolean;
    onClose: () => void;
    events: any[];
}

export default function AnalyticsModal({ isOpen, onClose, events }: AnalyticsModalProps) {
    if (!isOpen) return null;

    // Calculate analytics
    const totalEvents = events.length;
    const today = new Date();
    const thisWeekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const upcomingEvents = events.filter(e => new Date(e.start) > today).length;
    const completedEvents = events.filter(e => new Date(e.start) < today).length;
    const thisWeekEvents = events.filter(e => {
        const eventDate = new Date(e.start);
        return eventDate >= thisWeekStart && eventDate <= today;
    }).length;
    const thisMonthEvents = events.filter(e => {
        const eventDate = new Date(e.start);
        return eventDate >= thisMonthStart && eventDate <= today;
    }).length;

    // Event type distribution
    const eventTypes = events.reduce((acc, event) => {
        const type = event.extendedProps?.event_type || 'other';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});

    const eventTypeData = Object.entries(eventTypes).map(([type, count]) => ({
        type,
        count,
        percentage: totalEvents > 0 ? ((count as number) / totalEvents * 100).toFixed(1) : 0
    }));

    // Priority distribution  
    const priorities = events.reduce((acc, event) => {
        const priority = event.extendedProps?.priority || 'medium';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
    }, {});

    // Get average events per week
    const avgEventsPerWeek = totalEvents > 0 ? (totalEvents / 4).toFixed(1) : '0';

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-y-auto">
                {/* Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 sticky top-0">
                    <div className="flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-blue-600" />
                        <h2 className="text-2xl font-bold text-gray-900">📊 Analytics Calendario</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Main Stats Grid */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                            <Calendar className="w-8 h-8 text-blue-600 mb-3" />
                            <div className="text-3xl font-bold text-blue-700">{totalEvents}</div>
                            <div className="text-sm text-blue-600 mt-1">Eventi Totali</div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                            <TrendingUp className="w-8 h-8 text-green-600 mb-3" />
                            <div className="text-3xl font-bold text-green-700">{upcomingEvents}</div>
                            <div className="text-sm text-green-600 mt-1">Prossimi Eventi</div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                            <Clock className="w-8 h-8 text-purple-600 mb-3" />
                            <div className="text-3xl font-bold text-purple-700">{completedEvents}</div>
                            <div className="text-sm text-purple-600 mt-1">Completati</div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6">
                            <Target className="w-8 h-8 text-orange-600 mb-3" />
                            <div className="text-3xl font-bold text-orange-700">{avgEventsPerWeek}</div>
                            <div className="text-sm text-orange-600 mt-1">Media/Settimana</div>
                        </div>
                    </div>

                    {/* Time Period Stats */}
                    <div className="grid grid-cols-2 gap-6">
                        {/* This Week/Month */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <h3 className="font-semibold text-lg mb-4 text-gray-900">Periodo Corrente</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Questa Settimana</span>
                                    <span className="font-semibold text-lg">{thisWeekEvents}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-blue-600 h-2 rounded-full" 
                                        style={{ width: `${totalEvents > 0 ? (thisWeekEvents / totalEvents) * 100 : 0}%` }}
                                    ></div>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Questo Mese</span>
                                    <span className="font-semibold text-lg">{thisMonthEvents}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-green-600 h-2 rounded-full" 
                                        style={{ width: `${totalEvents > 0 ? (thisMonthEvents / totalEvents) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Event Types */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <h3 className="font-semibold text-lg mb-4 text-gray-900 flex items-center gap-2">
                                <PieChart className="w-5 h-5" />
                                Distribuzione Tipologie
                            </h3>
                            <div className="space-y-3">
                                {eventTypeData.length > 0 ? eventTypeData.map(({ type, count, percentage }, idx) => (
                                    <div key={type} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${
                                                type === 'meeting' ? 'bg-blue-500' :
                                                type === 'call' ? 'bg-green-500' :
                                                type === 'task' ? 'bg-purple-500' :
                                                type === 'appointment' ? 'bg-orange-500' :
                                                'bg-gray-500'
                                            }`}></div>
                                            <span className="text-gray-700 capitalize">
                                                {type === 'meeting' ? 'Riunioni' :
                                                 type === 'call' ? 'Chiamate' :
                                                 type === 'task' ? 'Attività' :
                                                 type === 'appointment' ? 'Appuntamenti' :
                                                 'Altri'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">{String(count)}</span>
                                            <span className="text-sm text-gray-500">({percentage}%)</span>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-gray-500 text-center py-4">Nessun dato disponibile</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Priority Analysis */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h3 className="font-semibold text-lg mb-4 text-gray-900">Analisi Priorità</h3>
                        <div className="grid grid-cols-4 gap-4">
                            {Object.entries(priorities).map(([priority, count]) => (
                                <div key={priority} className={`p-4 rounded-lg ${
                                    priority === 'urgent' ? 'bg-red-50 border border-red-200' :
                                    priority === 'high' ? 'bg-orange-50 border border-orange-200' :
                                    priority === 'medium' ? 'bg-blue-50 border border-blue-200' :
                                    'bg-gray-50 border border-gray-200'
                                }`}>
                                    <div className={`text-2xl font-bold ${
                                        priority === 'urgent' ? 'text-red-600' :
                                        priority === 'high' ? 'text-orange-600' :
                                        priority === 'medium' ? 'text-blue-600' :
                                        'text-gray-600'
                                    }`}>
                                        {count as number}
                                    </div>
                                    <div className={`text-sm ${
                                        priority === 'urgent' ? 'text-red-600' :
                                        priority === 'high' ? 'text-orange-600' :
                                        priority === 'medium' ? 'text-blue-600' :
                                        'text-gray-600'
                                    }`}>
                                        {priority === 'urgent' ? 'Urgenti' :
                                         priority === 'high' ? 'Alta' :
                                         priority === 'medium' ? 'Media' :
                                         'Bassa'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Insights */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                        <h3 className="font-semibold text-lg mb-4 text-gray-900">💡 Insight e Suggerimenti</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                    <div>
                                        <p className="font-medium text-gray-900">Gestione del Tempo</p>
                                        <p className="text-sm text-gray-600">
                                            {totalEvents > 0 
                                                ? `Hai programmato ${totalEvents} eventi. Ottima organizzazione!`
                                                : 'Inizia a programmare i tuoi eventi per una migliore organizzazione.'
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                    <div>
                                        <p className="font-medium text-gray-900">Bilanciamento</p>
                                        <p className="text-sm text-gray-600">
                                            {upcomingEvents > completedEvents
                                                ? 'Hai più eventi futuri che passati. Buona pianificazione!'
                                                : 'Considera di programmare più eventi futuri.'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                                    <div>
                                        <p className="font-medium text-gray-900">Produttività</p>
                                        <p className="text-sm text-gray-600">
                                            Media di {avgEventsPerWeek} eventi per settimana. 
                                            {parseFloat(avgEventsPerWeek) > 5 ? ' Ritmo sostenuto!' : ' Considera di aumentare la frequenza.'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                                    <div>
                                        <p className="font-medium text-gray-900">Tipologie</p>
                                        <p className="text-sm text-gray-600">
                                            {eventTypeData.length > 0
                                                ? `${eventTypeData.length} diverse tipologie di eventi. Buona varietà!`
                                                : 'Diversifica le tipologie di eventi per una migliore organizzazione.'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                        Dati aggiornati in tempo reale
                    </p>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Chiudi
                    </button>
                </div>
            </div>
        </div>
    );
}