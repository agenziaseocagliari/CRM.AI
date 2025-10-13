'use client';

import { X, Copy, Check, ExternalLink, Settings, User, Briefcase, FileText, Mail, MessageCircle, Share2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface BookingLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId?: string;
}

export default function BookingLinkModal({ isOpen, onClose, userId }: BookingLinkModalProps) {
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && userId) {
            fetchProfile();
        }
    }, [isOpen, userId]);

    const fetchProfile = async () => {
        try {
            // TODO: Fetch from Supabase API
            // For now use mock data
            setProfile({
                full_name: 'Nome Non Impostato',
                job_title: null,
                company: null,
                bio: null,
                username: userId ? userId.substring(0, 8) : 'user-' + Date.now().toString(36),
            });
            setLoading(false);
        } catch (error) {
            console.error('Profile fetch error:', error);
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const bookingUrl = profile ? `${window.location.origin}/book/${profile.username}` : '';

    const handleCopy = () => {
        navigator.clipboard.writeText(bookingUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isProfileComplete = profile?.full_name !== 'Nome Non Impostato' &&
        profile?.bio &&
        profile?.job_title;

    const handleShareEmail = () => {
        const subject = encodeURIComponent('Prenota un appuntamento con me');
        const body = encodeURIComponent(`Ciao!\n\nPuoi prenotare un appuntamento con me usando questo link:\n\n${bookingUrl}\n\nGrazie!`);
        window.open(`mailto:?subject=${subject}&body=${body}`);
    };

    const handleShareWhatsApp = () => {
        const text = encodeURIComponent(`Prenota un appuntamento con me: ${bookingUrl}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                    <h2 className="text-2xl font-bold">🔗 Link Prenotazione</h2>
                    <button onClick={onClose} className="hover:bg-white/50 rounded p-1">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    
                    {/* Warning if profile incomplete */}
                    {!isProfileComplete && (
                        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="text-2xl">⚠️</div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-yellow-900 mb-1">
                                        Completa il Tuo Profilo
                                    </h3>
                                    <p className="text-sm text-yellow-800 mb-3">
                                        La tua pagina di prenotazione non è ancora configurata. Completa le informazioni 
                                        per rendere la tua pagina professionale e accattivante.
                                    </p>
                                    <button
                                        onClick={() => {
                                            onClose();
                                            navigate('/dashboard/settings/booking');
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium text-sm"
                                    >
                                        <Settings className="w-4 h-4" />
                                        Vai alle Impostazioni
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Current Profile Preview */}
                    <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Anteprima Profilo
                        </h3>
                        
                        {loading ? (
                            <div className="text-center py-4 text-gray-500">Caricamento...</div>
                        ) : (
                            <div className="space-y-2 text-sm">
                                <div className="flex items-start gap-2">
                                    <User className="w-4 h-4 text-gray-500 mt-0.5" />
                                    <div>
                                        <span className="text-gray-600">Nome:</span>{' '}
                                        <span className={`font-medium ${!profile?.full_name ? 'text-red-600' : ''}`}>
                                            {profile?.full_name || 'Non impostato'}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="flex items-start gap-2">
                                    <Briefcase className="w-4 h-4 text-gray-500 mt-0.5" />
                                    <div>
                                        <span className="text-gray-600">Ruolo:</span>{' '}
                                        <span className={`font-medium ${!profile?.job_title ? 'text-gray-400' : ''}`}>
                                            {profile?.job_title || 'Non impostato'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2">
                                    <Briefcase className="w-4 h-4 text-gray-500 mt-0.5" />
                                    <div>
                                        <span className="text-gray-600">Azienda:</span>{' '}
                                        <span className={`font-medium ${!profile?.company ? 'text-gray-400' : ''}`}>
                                            {profile?.company || 'Non impostato'}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="flex items-start gap-2">
                                    <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                                    <div className="flex-1">
                                        <span className="text-gray-600">Bio:</span>{' '}
                                        <span className={`font-medium ${!profile?.bio ? 'text-gray-400' : ''}`}>
                                            {profile?.bio ? (
                                                <span className="text-xs block mt-1">{profile.bio.substring(0, 100)}...</span>
                                            ) : (
                                                'Non impostata'
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                onClose();
                                navigate('/dashboard/settings/booking');
                            }}
                            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 font-medium text-sm transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                            Modifica Informazioni Profilo
                        </button>
                    </div>

                    {/* Link Section */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5">
                        <h3 className="font-semibold mb-3">Il Tuo Link Pubblico</h3>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={bookingUrl}
                                readOnly
                                className="flex-1 px-4 py-3 bg-white border rounded-lg text-sm font-mono"
                            />
                            <button
                                onClick={handleCopy}
                                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
                            >
                                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                {copied ? 'Copiato!' : 'Copia'}
                            </button>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                            Condividi questo link per permettere alle persone di prenotare appuntamenti con te
                        </p>
                    </div>

                    {/* Share Options */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                            <div className="text-3xl mb-2">📧</div>
                            <h4 className="font-semibold mb-1">Email</h4>
                            <p className="text-sm text-gray-600">Invia il link via email ai tuoi contatti</p>
                        </div>
                        <div className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                            <div className="text-3xl mb-2">💬</div>
                            <h4 className="font-semibold mb-1">Social</h4>
                            <p className="text-sm text-gray-600">Condividi su WhatsApp, LinkedIn</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                onClose();
                                navigate('/dashboard/settings/booking');
                            }}
                            className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                        >
                            <Settings className="w-5 h-5" />
                            Personalizza Pagina
                        </button>
                        
                        <a
                            href={bookingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg"
                        >
                            <ExternalLink className="w-5 h-5" />
                            Apri Pagina
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}