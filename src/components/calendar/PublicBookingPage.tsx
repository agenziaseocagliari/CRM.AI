'use client';

import { ArrowLeft, Calendar, Check, Clock, Globe, Mail, MessageSquare, Phone, User, Video } from 'lucide-react';
import { useState } from 'react';

interface Profile {
    id: string;
    full_name: string;
    username: string;
    avatar_url?: string;
    bio?: string;
    timezone?: string;
    organization?: {
        name: string;
        logo_url?: string;
    };
}

interface PublicBookingPageProps {
    profile: Profile;
    availability: any;
    bookedSlots: any[];
    eventType?: string | null;
}

interface BookingData {
    name: string;
    email: string;
    phone: string;
    notes: string;
}

export default function PublicBookingPage({
    profile,
    availability,
    bookedSlots,
    eventType
}: PublicBookingPageProps) {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [step, setStep] = useState<'date' | 'time' | 'details' | 'confirm'>('date');
    const [bookingData, setBookingData] = useState<BookingData>({
        name: '',
        email: '',
        phone: '',
        notes: ''
    });

    // Generate available time slots for selected date
    const getAvailableSlots = (date: Date): string[] => {
        // Professional business hours: 9 AM to 6 PM, 30 min slots
        // TODO: Integrate with user's availability settings and exclude booked slots
        const slots: string[] = [];
        for (let hour = 9; hour < 18; hour++) {
            for (const minute of [0, 30]) {
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                slots.push(timeString);
            }
        }
        return slots;
    };

    const handleBooking = async (): Promise<void> => {
        try {
            // TODO: Integrate with calendarService to create booking
            console.log('Creating booking:', {
                profile: profile.id,
                selectedDate,
                selectedTime,
                bookingData
            });

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            setStep('confirm');
        } catch (error) {
            console.error('Booking failed:', error);
            // TODO: Show error toast
        }
    };

    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('it-IT', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* Professional Header */}
            <div className="bg-white shadow-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center gap-6">
                        {profile.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt={profile.full_name}
                                className="w-16 h-16 rounded-full object-cover shadow-md"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                                <User className="w-8 h-8 text-white" />
                            </div>
                        )}
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                {profile.full_name}
                            </h1>
                            {profile.organization && (
                                <p className="text-lg text-gray-600 mt-1">{profile.organization.name}</p>
                            )}
                            <p className="text-sm text-gray-500 mt-1">
                                @{profile.username} • Calendly-Level Professional Booking
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Booking Interface */}
            <div className="max-w-6xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                    {/* Left Column: Event Information & Summary */}
                    <div className="space-y-8">

                        {/* Event Details Card */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                            <h2 className="text-2xl font-bold mb-6 text-gray-900">
                                Riunione di 30 minuti
                            </h2>

                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900">30 minuti</div>
                                        <div className="text-sm text-gray-600">Durata ottimale per incontri professionali</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                        <Video className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900">Video conferenza</div>
                                        <div className="text-sm text-gray-600">Link inviato automaticamente dopo la conferma</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                        <Globe className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900">Fuso orario</div>
                                        <div className="text-sm text-gray-600">{profile.timezone || 'Europe/Rome'}</div>
                                    </div>
                                </div>
                            </div>

                            {profile.bio && (
                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <h3 className="font-semibold text-gray-900 mb-2">Chi sono</h3>
                                    <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
                                </div>
                            )}
                        </div>

                        {/* Selected Booking Summary */}
                        {selectedDate && selectedTime && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 shadow-sm">
                                <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                                    <Check className="w-5 h-5" />
                                    Appuntamento Selezionato
                                </h3>
                                <div className="space-y-2">
                                    <div className="text-lg font-semibold text-blue-800">
                                        {formatDate(selectedDate)}
                                    </div>
                                    <div className="text-blue-700">
                                        {selectedTime} - {
                                            (() => {
                                                const [hour, minute] = selectedTime.split(':').map(Number);
                                                const endTime = new Date();
                                                endTime.setHours(hour, minute + 30);
                                                return endTime.toTimeString().substring(0, 5);
                                            })()
                                        } (30 minuti)
                                    </div>
                                    <div className="text-sm text-blue-600 mt-3">
                                        Con {profile.full_name}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Booking Flow */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

                        {/* Step Indicator */}
                        <div className="bg-gray-50 px-8 py-4 border-b border-gray-100">
                            <div className="flex items-center justify-between text-sm">
                                <div className={`flex items-center gap-2 ${step === 'date' ? 'text-blue-600 font-semibold' : step === 'time' || step === 'details' || step === 'confirm' ? 'text-green-600' : 'text-gray-400'}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'date' ? 'bg-blue-600 text-white' : step === 'time' || step === 'details' || step === 'confirm' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>1</div>
                                    Data
                                </div>
                                <div className={`flex items-center gap-2 ${step === 'time' ? 'text-blue-600 font-semibold' : step === 'details' || step === 'confirm' ? 'text-green-600' : 'text-gray-400'}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'time' ? 'bg-blue-600 text-white' : step === 'details' || step === 'confirm' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>2</div>
                                    Orario
                                </div>
                                <div className={`flex items-center gap-2 ${step === 'details' ? 'text-blue-600 font-semibold' : step === 'confirm' ? 'text-green-600' : 'text-gray-400'}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'details' ? 'bg-blue-600 text-white' : step === 'confirm' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>3</div>
                                    Dettagli
                                </div>
                                <div className={`flex items-center gap-2 ${step === 'confirm' ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'confirm' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>4</div>
                                    Conferma
                                </div>
                            </div>
                        </div>

                        <div className="p-8">

                            {/* Step 1: Date Selection */}
                            {step === 'date' && (
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-bold text-gray-900">Seleziona una data</h3>
                                    <p className="text-gray-600">Scegli il giorno perfetto per il tuo incontro</p>

                                    {/* Simplified Calendar - In production, use a proper calendar library */}
                                    <div className="bg-gray-50 rounded-xl p-8 text-center">
                                        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600 mb-6">
                                            Calendario interattivo disponibile
                                        </p>
                                        <div className="space-y-3">
                                            {/* Quick date options */}
                                            {[0, 1, 2, 3, 4].map(daysFromNow => {
                                                const date = new Date();
                                                date.setDate(date.getDate() + daysFromNow);
                                                const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                                                if (isWeekend) return null;

                                                return (
                                                    <button
                                                        key={daysFromNow}
                                                        onClick={() => {
                                                            setSelectedDate(date);
                                                            setStep('time');
                                                        }}
                                                        className="w-full px-6 py-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 text-left transition-all duration-200 group"
                                                    >
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <div className="font-semibold text-gray-900 group-hover:text-blue-700">
                                                                    {formatDate(date)}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {daysFromNow === 0 ? 'Oggi' : daysFromNow === 1 ? 'Domani' : `Fra ${daysFromNow} giorni`}
                                                                </div>
                                                            </div>
                                                            <ArrowLeft className="w-5 h-5 text-gray-400 transform rotate-180 group-hover:text-blue-600" />
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Time Selection */}
                            {step === 'time' && selectedDate && (
                                <div className="space-y-6">
                                    <div>
                                        <button
                                            onClick={() => setStep('date')}
                                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4 transition-colors"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            Cambia data
                                        </button>
                                        <h3 className="text-2xl font-bold text-gray-900">
                                            Seleziona un orario
                                        </h3>
                                        <p className="text-gray-600">
                                            {formatDate(selectedDate)}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                                        {getAvailableSlots(selectedDate).map(slot => (
                                            <button
                                                key={slot}
                                                onClick={() => {
                                                    setSelectedTime(slot);
                                                    setStep('details');
                                                }}
                                                className="px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 text-center font-medium transition-all duration-200 group"
                                            >
                                                <div className="text-lg text-gray-900 group-hover:text-blue-700">
                                                    {slot}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    30 min
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Contact Details */}
                            {step === 'details' && (
                                <div className="space-y-6">
                                    <div>
                                        <button
                                            onClick={() => setStep('time')}
                                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4 transition-colors"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            Cambia orario
                                        </button>
                                        <h3 className="text-2xl font-bold text-gray-900">
                                            I tuoi dettagli
                                        </h3>
                                        <p className="text-gray-600">
                                            Quasi finito! Inserisci i tuoi dati di contatto
                                        </p>
                                    </div>

                                    <form
                                        className="space-y-5"
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            handleBooking();
                                        }}
                                    >
                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                                <User className="w-4 h-4" />
                                                Nome completo *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={bookingData.name}
                                                onChange={(e) => setBookingData({ ...bookingData, name: e.target.value })}
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors"
                                                placeholder="Il tuo nome e cognome"
                                            />
                                        </div>

                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                                <Mail className="w-4 h-4" />
                                                Email *
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                value={bookingData.email}
                                                onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors"
                                                placeholder="la-tua-email@esempio.com"
                                            />
                                        </div>

                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                                <Phone className="w-4 h-4" />
                                                Telefono
                                            </label>
                                            <input
                                                type="tel"
                                                value={bookingData.phone}
                                                onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors"
                                                placeholder="+39 xxx xxx xxxx (opzionale)"
                                            />
                                        </div>

                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                                <MessageSquare className="w-4 h-4" />
                                                Note aggiuntive
                                            </label>
                                            <textarea
                                                value={bookingData.notes}
                                                onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                                                rows={4}
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors resize-none"
                                                placeholder="C'è qualcosa che dovrei sapere prima del nostro incontro? (opzionale)"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                                        >
                                            Conferma Prenotazione
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* Step 4: Confirmation */}
                            {step === 'confirm' && (
                                <div className="text-center py-8">
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Check className="w-12 h-12 text-green-600" />
                                    </div>

                                    <h3 className="text-3xl font-bold text-gray-900 mb-4">
                                        Prenotazione Confermata! 🎉
                                    </h3>

                                    <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                                        Perfetto! Ti abbiamo inviato un'email di conferma con tutti i dettagli e il link per la videochiamata.
                                    </p>

                                    {/* Booking Summary */}
                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 text-left mb-8">
                                        <h4 className="font-bold text-green-900 mb-4 text-lg">
                                            Dettagli Appuntamento
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-green-700 font-medium">Partecipanti:</span>
                                                <span className="text-green-800">{bookingData.name} & {profile.full_name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-green-700 font-medium">Data:</span>
                                                <span className="text-green-800">{selectedDate ? formatDate(selectedDate) : ''}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-green-700 font-medium">Orario:</span>
                                                <span className="text-green-800">{selectedTime} (30 minuti)</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-green-700 font-medium">Tipo:</span>
                                                <span className="text-green-800">Video conferenza</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-4">
                                        <button
                                            onClick={() => {
                                                // Add to calendar functionality
                                                console.log('Add to calendar clicked');
                                            }}
                                            className="w-full py-3 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
                                        >
                                            Aggiungi al Calendario
                                        </button>

                                        <button
                                            onClick={() => {
                                                // Reset form for new booking
                                                setStep('date');
                                                setSelectedDate(null);
                                                setSelectedTime(null);
                                                setBookingData({ name: '', email: '', phone: '', notes: '' });
                                            }}
                                            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                                        >
                                            Prenota un Altro Appuntamento
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Viral Growth Footer */}
            <div className="bg-white border-t border-gray-100">
                <div className="max-w-4xl mx-auto px-4 py-8 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-600 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold">Powered by CRM.AI</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                        Professional scheduling made simple. Unlimited bookings, no fees.
                    </p>
                    <a
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                        Crea il tuo calendario gratuito
                        <ArrowLeft className="w-4 h-4 transform rotate-180" />
                    </a>
                </div>
            </div>
        </div>
    );
}