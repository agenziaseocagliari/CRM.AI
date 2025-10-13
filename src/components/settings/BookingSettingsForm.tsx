'use client';

import { Briefcase, Calendar, Clock, Link as LinkIcon, Save, User } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface BookingSettingsFormProps {
    profile: any;
    userId: string;
}

export default function BookingSettingsForm({ profile, userId }: BookingSettingsFormProps) {
    const [formData, setFormData] = useState({
        full_name: profile?.full_name || '',
        job_title: profile?.job_title || '',
        company: profile?.company || '',
        bio: profile?.bio || '',
        booking_url: profile?.username || userId?.substring(0, 8) || '',
        default_duration: profile?.default_duration || 30,
        buffer_before: profile?.buffer_before || 0,
        buffer_after: profile?.buffer_after || 0,
        days_ahead: profile?.days_ahead || 30,
        event_type: profile?.event_type || 'Consulenza Strategica',
        meeting_type: profile?.meeting_type || 'Video chiamata',
    });

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Save profile to Supabase
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user?.id) throw new Error('Utente non autenticato');

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: session.user.id,
                    full_name: formData.full_name,
                    job_title: formData.job_title,
                    company: formData.company,
                    bio: formData.bio,
                    username: formData.booking_url,
                    default_duration: formData.default_duration,
                    buffer_before: formData.buffer_before,
                    buffer_after: formData.buffer_after,
                    days_ahead: formData.days_ahead,
                    event_type: formData.event_type,
                    meeting_type: formData.meeting_type,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Save error:', error);
            alert('Errore durante il salvataggio');
        } finally {
            setSaving(false);
        }
    };

    const bookingUrl = `${window.location.origin}/book/${formData.booking_url}`;

    return (
        <div className="space-y-8">

            {/* Preview Link */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <LinkIcon className="w-4 h-4 inline mr-2" />
                    Il Tuo Link di Prenotazione
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={bookingUrl}
                        readOnly
                        className="flex-1 px-4 py-2 bg-white border rounded-lg text-sm"
                    />
                    <button
                        onClick={() => window.open(bookingUrl, '_blank')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
                    >
                        Anteprima
                    </button>
                </div>
            </div>

            {/* Profile Information */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                <h2 className="text-xl font-bold mb-4">Informazioni Profilo</h2>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <User className="w-4 h-4 inline mr-2" />
                                Nome Completo *
                            </label>
                            <input
                                type="text"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Mario Rossi"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Briefcase className="w-4 h-4 inline mr-2" />
                                Ruolo/Titolo
                            </label>
                            <input
                                type="text"
                                value={formData.job_title}
                                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="es. Consulente Marketing, Direttore Vendite"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Briefcase className="w-4 h-4 inline mr-2" />
                            Azienda
                        </label>
                        <input
                            type="text"
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="es. Agenzia SEO Cagliari"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo di Evento
                        </label>
                        <input
                            type="text"
                            value={formData.event_type}
                            onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="es. Consulenza Strategica, Sessione di Coaching"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Modalità Meeting
                        </label>
                        <select
                            value={formData.meeting_type}
                            onChange={(e) => setFormData({ ...formData, meeting_type: e.target.value })}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="Video chiamata">Video chiamata</option>
                            <option value="Chiamata telefonica">Chiamata telefonica</option>
                            <option value="Incontro di persona">Incontro di persona</option>
                            <option value="Da definire">Da definire</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bio / Descrizione
                        </label>
                        <textarea
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Racconta chi sei e cosa offri nella consulenza..."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Questa descrizione apparirà nella tua pagina di prenotazione
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <LinkIcon className="w-4 h-4 inline mr-2" />
                            URL Personalizzato
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500">{window.location.origin}/book/</span>
                            <input
                                type="text"
                                value={formData.booking_url}
                                onChange={(e) => setFormData({ ...formData, booking_url: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="nome-cognome"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Solo lettere minuscole, numeri e trattini
                        </p>
                    </div>
                </div>
            </div>

            {/* Booking Settings */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                <h2 className="text-xl font-bold mb-4">Impostazioni Appuntamenti</h2>

                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Clock className="w-4 h-4 inline mr-2" />
                                Durata Predefinita
                            </label>
                            <select
                                value={formData.default_duration}
                                onChange={(e) => setFormData({ ...formData, default_duration: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={15}>15 minuti</option>
                                <option value={30}>30 minuti</option>
                                <option value={45}>45 minuti</option>
                                <option value={60}>1 ora</option>
                                <option value={90}>1.5 ore</option>
                                <option value={120}>2 ore</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Buffer Prima
                            </label>
                            <select
                                value={formData.buffer_before}
                                onChange={(e) => setFormData({ ...formData, buffer_before: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={0}>Nessuno</option>
                                <option value={5}>5 min</option>
                                <option value={10}>10 min</option>
                                <option value={15}>15 min</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Buffer Dopo
                            </label>
                            <select
                                value={formData.buffer_after}
                                onChange={(e) => setFormData({ ...formData, buffer_after: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={0}>Nessuno</option>
                                <option value={5}>5 min</option>
                                <option value={10}>10 min</option>
                                <option value={15}>15 min</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Calendar className="w-4 h-4 inline mr-2" />
                            Giorni Prenotabili in Anticipo
                        </label>
                        <select
                            value={formData.days_ahead}
                            onChange={(e) => setFormData({ ...formData, days_ahead: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={7}>1 settimana</option>
                            <option value={14}>2 settimane</option>
                            <option value={30}>1 mese</option>
                            <option value={60}>2 mesi</option>
                            <option value={90}>3 mesi</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-4">
                {saved && (
                    <span className="text-green-600 font-medium">
                        ✓ Salvato con successo!
                    </span>
                )}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
                >
                    <Save className="w-5 h-5" />
                    {saving ? 'Salvataggio...' : 'Salva Impostazioni'}
                </button>
            </div>
        </div>
    );
}