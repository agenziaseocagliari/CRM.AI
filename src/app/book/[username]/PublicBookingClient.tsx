'use client';

import { Calendar, CheckCircle, Clock, Mail, MessageSquare, Phone, User } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Profile {
    id?: string;
    full_name?: string;
    job_title?: string;
    company?: string;
    bio?: string;
    username?: string;
    event_type?: string;
    meeting_type?: string;
    default_duration?: number;
}

interface PublicBookingClientProps {
    username: string;
}

export default function PublicBookingClient({ username }: PublicBookingClientProps) {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [step, setStep] = useState<'date' | 'time' | 'details' | 'confirm'>('date');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        notes: '',
    });

    useEffect(() => {
        // For now, use mock profile
        setProfile({
            full_name: username.replace('user-', 'Utente ').toUpperCase(),
            bio: 'Esperto consulente disponibile per appuntamenti',
            username: username
        });
        setLoading(false);
    }, [username]);

    const availableTimeSlots = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
    ];

    const handleBooking = () => {
        // TODO: Save booking to database
        console.log('Booking:', { selectedDate, selectedTime, formData });
        setStep('confirm');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
            {/* Header */}
            <div className="bg-white border-b shadow-sm">
                <div className="max-w-4xl mx-auto px-6 py-8">
                    <div className="text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                            {profile?.full_name?.charAt(0) || 'U'}
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {profile?.full_name || 'Profilo utente'}
                        </h1>
                        <p className="text-gray-600">{profile?.bio || 'Consulenza professionale'}</p>
                    </div>
                </div>
            </div>

            {/* Booking Content */}
            <div className="max-w-5xl mx-auto px-6 py-12">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

                    {/* Progress Steps */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4">
                        <div className="flex items-center justify-center gap-8">
                            {[
                                { key: 'date', label: 'Data', icon: Calendar },
                                { key: 'time', label: 'Orario', icon: Clock },
                                { key: 'details', label: 'Dettagli', icon: User },
                                { key: 'confirm', label: 'Conferma', icon: CheckCircle },
                            ].map((s, idx) => {
                                const Icon = s.icon;
                                const isActive = step === s.key;
                                const isCompleted = ['date', 'time', 'details', 'confirm'].indexOf(step) > idx;

                                return (
                                    <div key={s.key} className="flex items-center">
                                        <div className={`flex items-center gap-2 ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                                            }`}>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-blue-600 text-white' :
                                                isCompleted ? 'bg-green-600 text-white' :
                                                    'bg-gray-200'
                                                }`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <span className="font-medium hidden sm:block">{s.label}</span>
                                        </div>
                                        {idx < 3 && (
                                            <div className={`w-12 h-0.5 mx-2 ${isCompleted ? 'bg-green-600' : 'bg-gray-300'
                                                }`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step Content */}
                    <div className="p-8">
                        {step === 'date' && (
                            <div className="max-w-md mx-auto">
                                <h2 className="text-2xl font-bold text-center mb-6">Seleziona una Data</h2>
                                <div className="space-y-3">
                                    {[1, 2, 3, 4, 5].map(offset => {
                                        const date = new Date();
                                        date.setDate(date.getDate() + offset);

                                        return (
                                            <button
                                                key={offset}
                                                onClick={() => {
                                                    setSelectedDate(date);
                                                    setStep('time');
                                                }}
                                                className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                                            >
                                                <div className="font-semibold text-lg">
                                                    {date.toLocaleDateString('it-IT', {
                                                        weekday: 'long',
                                                        day: 'numeric',
                                                        month: 'long'
                                                    })}
                                                </div>
                                                <div className="text-sm text-gray-500 mt-1">
                                                    {offset === 0 ? 'Oggi' : offset === 1 ? 'Domani' : ''}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {step === 'time' && selectedDate && (
                            <div className="max-w-2xl mx-auto">
                                <button
                                    onClick={() => setStep('date')}
                                    className="text-blue-600 hover:underline mb-4"
                                >
                                    ← Cambia data
                                </button>
                                <h2 className="text-2xl font-bold text-center mb-2">
                                    {selectedDate.toLocaleDateString('it-IT', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long'
                                    })}
                                </h2>
                                <p className="text-center text-gray-600 mb-6">Seleziona un orario disponibile</p>

                                <div className="grid grid-cols-3 gap-3">
                                    {availableTimeSlots.map(slot => (
                                        <button
                                            key={slot}
                                            onClick={() => {
                                                setSelectedTime(slot);
                                                setStep('details');
                                            }}
                                            className="px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all font-medium"
                                        >
                                            {slot}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 'details' && (
                            <div className="max-w-md mx-auto">
                                <button
                                    onClick={() => setStep('time')}
                                    className="text-blue-600 hover:underline mb-4"
                                >
                                    ← Cambia orario
                                </button>
                                <h2 className="text-2xl font-bold text-center mb-6">I Tuoi Dettagli</h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            <User className="w-4 h-4 inline mr-2" />
                                            Nome Completo *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Mario Rossi"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            <Mail className="w-4 h-4 inline mr-2" />
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="mario@esempio.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            <Phone className="w-4 h-4 inline mr-2" />
                                            Telefono (opzionale)
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="+39 123 456 7890"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            <MessageSquare className="w-4 h-4 inline mr-2" />
                                            Note Aggiuntive (opzionale)
                                        </label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            rows={3}
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Qualcosa che dovremmo sapere?"
                                        />
                                    </div>

                                    <button
                                        onClick={handleBooking}
                                        disabled={!formData.name || !formData.email}
                                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        Conferma Prenotazione
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 'confirm' && (
                            <div className="max-w-md mx-auto text-center py-8">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle className="w-12 h-12 text-green-600" />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                                    Prenotazione Confermata!
                                </h2>
                                <p className="text-gray-600 mb-8">
                                    Ti abbiamo inviato un'email di conferma con tutti i dettagli.
                                </p>

                                <div className="bg-gray-50 rounded-xl p-6 text-left mb-8">
                                    <h3 className="font-semibold mb-3">Dettagli Appuntamento:</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-gray-500" />
                                            <span>Con: <strong>{profile?.full_name || 'Profilo utente'}</strong></span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-500" />
                                            <span>{selectedDate?.toLocaleDateString('it-IT', {
                                                weekday: 'long',
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-gray-500" />
                                            <span>{selectedTime}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setStep('date');
                                        setSelectedDate(null);
                                        setSelectedTime(null);
                                        setFormData({ name: '', email: '', phone: '', notes: '' });
                                    }}
                                    className="text-blue-600 hover:underline"
                                >
                                    Prenota un altro appuntamento
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center py-8 text-sm text-gray-500">
                Powered by CRM.AI - <a href="/" className="text-blue-600 hover:underline">Crea il tuo calendario gratuito</a>
            </div>
        </div>
    );
}