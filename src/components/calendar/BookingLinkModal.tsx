'use client';

import { X, Copy, Check, ExternalLink, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

interface Profile {
    id?: string;
    full_name?: string;
    job_title?: string;
    company?: string;
    bio?: string;
    username?: string;
    created_at?: string;
    updated_at?: string;
}

interface BookingLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId?: string;
}

export default function BookingLinkModal({ isOpen, onClose }: BookingLinkModalProps) {
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchProfile();
        }
    }, [isOpen]);

    const fetchProfile = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.user?.id) {
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profile && !error) {
                    setProfile(profile);
                } else {
                    // Fallback to basic profile
                    setProfile({
                        full_name: 'Nome Non Impostato',
                        username: session.user.id.substring(0, 8),
                        bio: null,
                        job_title: null
                    });
                }
            }
            setLoading(false);
        } catch (error) {
            console.error('Profile fetch error:', error);
            setProfile({
                full_name: 'Nome Non Impostato',
                username: 'user-' + Date.now().toString(36),
                bio: null,
                job_title: null
            });
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

    const handleShare = (method: 'email' | 'whatsapp' | 'linkedin') => {
        const text = `Prenota un appuntamento con me: ${bookingUrl}`;

        switch (method) {
            case 'email':
                window.location.href = `mailto:?subject=Prenota un appuntamento&body=${encodeURIComponent(text)}`;
                break;
            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                break;
            case 'linkedin':
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(bookingUrl)}`, '_blank');
                break;
        }
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
                        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-5">
                            <div className="flex items-start gap-3">
                                <div className="text-3xl">⚠️</div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-yellow-900 mb-2 text-lg">
                                        Completa il Tuo Profilo
                                    </h3>
                                    <p className="text-sm text-yellow-800 mb-4">
                                        La tua pagina di prenotazione non è ancora configurata. 
                                        Aggiungi nome, ruolo, azienda e descrizione per renderla professionale.
                                    </p>
                                    <button
                                        onClick={() => {
                                            onClose();
                                            navigate('/dashboard/settings/booking');
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-semibold"
                                    >
                                        <Settings className="w-4 h-4" />
                                        Configura Ora
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Link Section */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5">
                        <h3 className="font-semibold mb-3 text-lg">Il Tuo Link Pubblico</h3>
                        {loading ? (
                            <div className="text-center py-4 text-gray-500">Caricamento...</div>
                        ) : (
                            <>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={bookingUrl}
                                        readOnly
                                        className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-sm font-mono"
                                    />
                                    <button
                                        onClick={handleCopy}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap font-semibold"
                                    >
                                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                        {copied ? 'Copiato!' : 'Copia'}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-600">
                                    Condividi questo link per permettere alle persone di prenotare appuntamenti
                                </p>
                            </>
                        )}
                    </div>

                    {/* Share Options */}
                    <div>
                        <h3 className="font-semibold mb-3">Condividi su:</h3>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => handleShare('email')}
                                className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                            >
                                <div className="text-3xl mb-2">📧</div>
                                <div className="text-sm font-semibold">Email</div>
                            </button>
                            
                            <button
                                onClick={() => handleShare('whatsapp')}
                                className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
                            >
                                <div className="text-3xl mb-2">💬</div>
                                <div className="text-sm font-semibold">WhatsApp</div>
                            </button>
                            
                            <button
                                onClick={() => handleShare('linkedin')}
                                className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                            >
                                <div className="text-3xl mb-2">💼</div>
                                <div className="text-sm font-semibold">LinkedIn</div>
                            </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t">
                        {isProfileComplete && (
                            <button
                                onClick={() => {
                                    onClose();
                                    navigate('/dashboard/settings/booking');
                                }}
                                className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                            >
                                <Settings className="w-5 h-5" />
                                Modifica Impostazioni
                            </button>
                        )}
                        
                        <a
                            href={bookingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${isProfileComplete ? 'flex-1' : 'w-full'} flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg`}
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