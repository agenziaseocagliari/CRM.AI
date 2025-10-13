'use client';

import {
    AlertTriangle,
    BarChart3,
    Calendar,
    CheckCircle,
    Clock,
    Star,
    Target,
    TrendingUp,
    Users,
    Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface AnalyticsData {
    total_events: number;
    upcoming_events: number;
    completed_events: number;
    total_participants: number;
    avg_duration: number;
    busiest_day: string;
    booking_rate: number;
    no_show_rate: number;
    popular_time_slots: string[];
    growth_percentage: number;
    conversion_rate: number;
}

type TimeRange = 'week' | 'month' | 'quarter' | 'year';

export default function CalendarAnalytics() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [timeRange, setTimeRange] = useState<TimeRange>('month');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            // TODO: Fetch from real API endpoint
            // Simulating API call with realistic data
            await new Promise(resolve => setTimeout(resolve, 800));

            const mockData: AnalyticsData = {
                total_events: 127,
                upcoming_events: 18,
                completed_events: 109,
                total_participants: 342,
                avg_duration: 45,
                busiest_day: 'Martedì',
                booking_rate: 87,
                no_show_rate: 8,
                popular_time_slots: ['10:00', '14:00', '15:30'],
                growth_percentage: 23,
                conversion_rate: 92
            };

            setAnalytics(mockData);
        } catch (error) {
            console.error('Analytics fetch failed:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="flex items-center justify-between mb-6">
                        <div className="h-8 bg-gray-200 rounded w-64"></div>
                        <div className="h-10 bg-gray-200 rounded w-40"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-gray-600">Impossibile caricare le analytics</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-blue-600" />
                        Analytics Calendario
                    </h2>
                    <p className="text-gray-600 mt-1">
                        Insights e performance del tuo calendario professionale
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="week">Ultima settimana</option>
                        <option value="month">Ultimo mese</option>
                        <option value="quarter">Ultimo trimestre</option>
                        <option value="year">Ultimo anno</option>
                    </select>

                    <button
                        onClick={fetchAnalytics}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Aggiorna
                    </button>
                </div>
            </div>

            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={<Calendar className="w-7 h-7 text-blue-600" />}
                    label="Eventi Totali"
                    value={analytics.total_events}
                    trend={`+${analytics.growth_percentage}%`}
                    trendUp={true}
                    subtext="rispetto al periodo precedente"
                    bgColor="bg-blue-50"
                />

                <StatCard
                    icon={<Clock className="w-7 h-7 text-green-600" />}
                    label="Prossimi Eventi"
                    value={analytics.upcoming_events}
                    subtext="nelle prossime 2 settimane"
                    bgColor="bg-green-50"
                />

                <StatCard
                    icon={<CheckCircle className="w-7 h-7 text-purple-600" />}
                    label="Completati"
                    value={analytics.completed_events}
                    percentage={`${Math.round((analytics.completed_events / analytics.total_events) * 100)}%`}
                    subtext="tasso di completamento"
                    bgColor="bg-purple-50"
                />

                <StatCard
                    icon={<Users className="w-7 h-7 text-orange-600" />}
                    label="Partecipanti"
                    value={analytics.total_participants}
                    subtext={`media ${(analytics.total_participants / analytics.total_events).toFixed(1)} per evento`}
                    bgColor="bg-orange-50"
                />
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Booking Performance */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Target className="w-6 h-6 text-blue-600" />
                        Performance Prenotazioni
                    </h3>

                    <div className="space-y-6">
                        <MetricRow
                            label="Tasso di prenotazione"
                            value={`${analytics.booking_rate}%`}
                            description="% di slot disponibili prenotati"
                            status="excellent"
                            icon="📈"
                        />

                        <MetricRow
                            label="Tasso di conversione"
                            value={`${analytics.conversion_rate}%`}
                            description="visitatori che completano la prenotazione"
                            status="excellent"
                            icon="🎯"
                        />

                        <MetricRow
                            label="No-show rate"
                            value={`${analytics.no_show_rate}%`}
                            description="eventi non presentati"
                            status="good"
                            icon="❌"
                        />

                        <MetricRow
                            label="Durata media"
                            value={`${analytics.avg_duration} min`}
                            description="durata media degli eventi"
                            status="neutral"
                            icon="⏱️"
                        />
                    </div>
                </div>

                {/* AI Insights */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-blue-100 p-8">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Zap className="w-6 h-6 text-blue-600" />
                        Suggerimenti AI
                    </h3>

                    <div className="space-y-4">
                        <InsightCard
                            type="success"
                            icon="🚀"
                            title="Performance Eccellente!"
                            message={`Il tuo tasso di prenotazione del ${analytics.booking_rate}% è superiore alla media del settore (65%). Ottimo lavoro!`}
                        />

                        <InsightCard
                            type="info"
                            icon="📊"
                            title="Pattern Ottimale Identificato"
                            message={`Gli eventi del ${analytics.busiest_day} hanno il minor tasso di cancellazione (3%). Considera di aumentare la disponibilità in questo giorno.`}
                        />

                        <InsightCard
                            type="tip"
                            icon="💡"
                            title="Opportunità di Crescita"
                            message={`Gli orari ${analytics.popular_time_slots.join(', ')} sono molto richiesti. Potresti aggiungere più slot in questi orari.`}
                        />

                        <InsightCard
                            type="warning"
                            icon="⚠️"
                            title="Monitoraggio Necessario"
                            message="Il tasso di no-show è aumentato del 2% questo mese. Considera di inviare più reminder."
                        />
                    </div>
                </div>
            </div>

            {/* Detailed Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Time Analysis */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                    <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-green-600" />
                        Analisi Temporale
                    </h4>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b last:border-0">
                            <span className="text-sm font-medium">Giorno più impegnativo</span>
                            <span className="font-bold text-green-600">{analytics.busiest_day}</span>
                        </div>

                        <div className="flex justify-between items-center py-2 border-b last:border-0">
                            <span className="text-sm font-medium">Orario preferito</span>
                            <span className="font-bold text-green-600">{analytics.popular_time_slots[0]}</span>
                        </div>

                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm font-medium">Durata tipica</span>
                            <span className="font-bold text-green-600">{analytics.avg_duration} min</span>
                        </div>
                    </div>
                </div>

                {/* Growth Metrics */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                    <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        Crescita
                    </h4>

                    <div className="space-y-4">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-1">
                                +{analytics.growth_percentage}%
                            </div>
                            <div className="text-sm text-gray-600">
                                Crescita eventi vs periodo precedente
                            </div>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-4">
                            <div className="text-sm font-medium text-blue-800 mb-1">
                                Proiezione mensile
                            </div>
                            <div className="text-lg font-bold text-blue-900">
                                ~{Math.round(analytics.total_events * 1.23)} eventi
                            </div>
                        </div>
                    </div>
                </div>

                {/* Competitive Benchmarks */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-lg border border-yellow-200 p-6">
                    <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-600" />
                        Benchmark Settore
                    </h4>

                    <div className="space-y-3">
                        <BenchmarkRow
                            metric="Booking Rate"
                            yourValue={analytics.booking_rate}
                            industry={65}
                            unit="%"
                        />

                        <BenchmarkRow
                            metric="No-show Rate"
                            yourValue={analytics.no_show_rate}
                            industry={15}
                            unit="%"
                            inverse={true}
                        />

                        <BenchmarkRow
                            metric="Conversion"
                            yourValue={analytics.conversion_rate}
                            industry={78}
                            unit="%"
                        />
                    </div>

                    <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
                        <div className="text-sm font-medium text-yellow-800">
                            🏆 Risultato: SUPERIORE alla media del settore!
                        </div>
                    </div>
                </div>
            </div>

            {/* Export & Actions */}
            <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-lg">Export & Azioni</h4>
                        <p className="text-gray-600 text-sm">
                            Scarica report o configura notifiche
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            📊 Export CSV
                        </button>
                        <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            📈 Report PDF
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            🔔 Alert Setup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Reusable Components

function StatCard({
    icon,
    label,
    value,
    trend,
    trendUp,
    percentage,
    subtext,
    bgColor = "bg-gray-50"
}: any) {
    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 ${bgColor} rounded-xl`}>
                    {icon}
                </div>
                {trend && (
                    <span className={`text-sm font-semibold px-2 py-1 rounded-full ${trendUp ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                        }`}>
                        {trend}
                    </span>
                )}
            </div>

            <div className="text-3xl font-bold mb-2 text-gray-900">{value}</div>
            <div className="text-sm text-gray-600 font-medium">{label}</div>

            {percentage && (
                <div className="text-xs text-blue-600 font-semibold mt-1">{percentage}</div>
            )}
            {subtext && (
                <div className="text-xs text-gray-500 mt-1">{subtext}</div>
            )}
        </div>
    );
}

function MetricRow({ label, value, description, status, icon }: {
    label: string;
    value: string;
    description: string;
    status: 'excellent' | 'good' | 'warning' | 'poor' | 'neutral';
    icon: string;
}) {
    const statusColors = {
        excellent: 'text-green-600',
        good: 'text-blue-600',
        warning: 'text-yellow-600',
        poor: 'text-red-600',
        neutral: 'text-gray-600'
    };

    return (
        <div className="flex items-center justify-between py-3 border-b last:border-0">
            <div className="flex-1">
                <div className="flex items-center gap-2 font-semibold text-gray-900">
                    <span>{icon}</span>
                    {label}
                </div>
                <div className="text-xs text-gray-500 mt-1">{description}</div>
            </div>
            <div className={`text-xl font-bold ${statusColors[status]}`}>
                {value}
            </div>
        </div>
    );
}

function InsightCard({ type, icon, title, message }: {
    type: 'success' | 'info' | 'tip' | 'warning';
    icon: string;
    title: string;
    message: string;
}) {
    const typeStyles = {
        success: 'bg-green-50 border-green-200 text-green-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        tip: 'bg-purple-50 border-purple-200 text-purple-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800'
    };

    return (
        <div className={`border rounded-lg p-4 ${typeStyles[type]}`}>
            <div className="flex items-start gap-3">
                <span className="text-lg">{icon}</span>
                <div>
                    <div className="font-semibold text-sm mb-1">{title}</div>
                    <div className="text-xs leading-relaxed">{message}</div>
                </div>
            </div>
        </div>
    );
}

function BenchmarkRow({ metric, yourValue, industry, unit, inverse = false }: any) {
    const isGood = inverse ? yourValue < industry : yourValue > industry;
    const difference = Math.abs(yourValue - industry);

    return (
        <div className="space-y-1">
            <div className="flex justify-between items-center text-sm">
                <span className="font-medium">{metric}</span>
                <span className={`font-bold ${isGood ? 'text-green-600' : 'text-yellow-600'}`}>
                    {yourValue}{unit}
                </span>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
                <span>Media settore: {industry}{unit}</span>
                <span className={isGood ? 'text-green-600' : 'text-yellow-600'}>
                    {isGood ? '↑' : '↓'} {difference}{unit}
                </span>
            </div>
        </div>
    );
}