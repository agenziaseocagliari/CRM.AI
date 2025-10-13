'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, User, Mail, Phone, MessageSquare,
  CheckCircle, ChevronLeft, ChevronRight, Video
} from 'lucide-react';

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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });

  const fetchProfile = useCallback(async () => {
    try {
      setProfile({
        full_name: 'Mario Rossi',
        job_title: 'Consulente Marketing Digitale', 
        company: 'Agenzia SEO Cagliari',
        bio: 'Esperto in strategie SEO e marketing digitale con oltre 10 anni di esperienza. Offro consulenze personalizzate per aiutare le aziende a crescere online.',
        username: username,
        event_duration: 30,
        event_type: 'Consulenza Strategica',
        meeting_type: 'Video chiamata',
      });
      setLoading(false);
    } catch (error) {
      console.error('Profile fetch error:', error);
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const isDateAvailable = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return date >= today && date <= maxDate;
  };

  const availableTimeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

  const handleBooking = () => {
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

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {profile.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {profile.full_name}
              </h1>
              <p className="text-gray-600">
                {profile.job_title} {profile.company && `@ ${profile.company}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {profile.event_type}
              </h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-gray-700">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>{profile.event_duration} minuti</span>
                </div>
                
                <div className="flex items-center gap-3 text-gray-700">
                  <Video className="w-5 h-5 text-blue-600" />
                  <span>{profile.meeting_type}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-2">Cosa Aspettarsi</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {profile.bio}
                </p>
              </div>

              {selectedDate && selectedTime && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Orario Selezionato</h4>
                  <div className="text-sm text-blue-800">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4" />
                      {selectedDate.toLocaleDateString('it-IT', {
                        weekday: 'long',
                        day: 'numeric', 
                        month: 'long'
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {selectedTime}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              
              {/* Progress */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4">
                <div className="flex items-center justify-between max-w-md mx-auto">
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
                      <div key={s.key} className={`flex items-center ${
                        isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isActive ? 'bg-blue-600 text-white' : 
                          isCompleted ? 'bg-green-600 text-white' : 
                          'bg-gray-200'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        {idx < 3 && (
                          <div className={`w-8 h-0.5 ${
                            isCompleted ? 'bg-green-600' : 'bg-gray-300'
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                
                {/* Date Selection */}
                {step === 'date' && (
                  <div>
                    <h2 className="text-2xl font-bold text-center mb-6">Seleziona una Data</h2>
                    
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => {
                          const prev = new Date(currentMonth);
                          prev.setMonth(prev.getMonth() - 1);
                          setCurrentMonth(prev);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <h3 className="text-lg font-semibold">
                        {currentMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                      </h3>
                      <button
                        onClick={() => {
                          const next = new Date(currentMonth);
                          next.setMonth(next.getMonth() + 1);
                          setCurrentMonth(next);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                      {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map(day => (
                        <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                          {day}
                        </div>
                      ))}
                      
                      {days.map((date, idx) => {
                        const available = isDateAvailable(date);
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              if (available && date) {
                                setSelectedDate(date);
                                setStep('time');
                              }
                            }}
                            disabled={!available}
                            className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                              available
                                ? 'hover:bg-blue-100 hover:text-blue-700 cursor-pointer border border-gray-200'
                                : 'text-gray-300 cursor-not-allowed'
                            } ${!date ? 'invisible' : ''}`}
                          >
                            {date?.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Time Selection */}
                {step === 'time' && (
                  <div>
                    <button onClick={() => setStep('date')} className="text-blue-600 hover:underline mb-4">
                      ← Cambia data
                    </button>
                    <h2 className="text-2xl font-bold text-center mb-2">
                      {selectedDate?.toLocaleDateString('it-IT', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })}
                    </h2>
                    <p className="text-center text-gray-600 mb-6">Seleziona un orario disponibile</p>
                    
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
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

                {/* Details Form */}
                {step === 'details' && (
                  <div className="max-w-md mx-auto">
                    <button onClick={() => setStep('time')} className="text-blue-600 hover:underline mb-4">
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
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                      >
                        Conferma Prenotazione
                      </button>
                    </div>
                  </div>
                )}

                {/* Confirmation */}
                {step === 'confirm' && (
                  <div className="max-w-md mx-auto text-center py-8">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">
                      Prenotazione Confermata!
                    </h2>
                    <p className="text-gray-600 mb-8">
                      Ti abbiamo inviato una email di conferma con tutti i dettagli.
                    </p>

                    <div className="bg-gray-50 rounded-xl p-6 text-left mb-8">
                      <h3 className="font-semibold mb-3">Dettagli Appuntamento:</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span>Con: <strong>{profile.full_name}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>Data prenotazione</span>
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
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-sm text-gray-500">
        Powered by CRM.AI
      </div>
    </div>
  );
}