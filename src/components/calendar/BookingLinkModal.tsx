'use client';

import { Check, Copy, ExternalLink, Mail, MessageCircle, Share2, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface BookingLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId?: string;
}

export default function BookingLinkModal({ isOpen, onClose, userId }: BookingLinkModalProps) {
    const [copied, setCopied] = useState(false);
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchUserProfile();
        }
    }, [isOpen]);

    const fetchUserProfile = async () => {
        try {
            const response = await fetch('/api/user/profile');
            const data = await response.json();
            setUsername(data.username || `user-${Date.now().toString(36)}`);
            setLoading(false);
        } catch (error) {
            // Fallback to timestamp-based username
            setUsername(`user-${Date.now().toString(36)}`);
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const bookingUrl = `${window.location.origin}/book/${username}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(bookingUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

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
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
                {/* Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                    <h2 className="text-2xl font-bold text-gray-900">🔗 Link Prenotazione</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-600 mt-2">Generazione link...</p>
                        </div>
                    ) : (
                        <>
                            {/* URL Section */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                                <h3 className="font-semibold text-lg mb-3 text-gray-900">Il Tuo Link Pubblico</h3>
                                <p className="text-gray-600 text-sm mb-4">
                                    Condividi questo link per permettere ai tuoi contatti di prenotare appuntamenti direttamente nel tuo calendario.
                                </p>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={bookingUrl}
                                        readOnly
                                        className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg font-mono text-sm"
                                    />
                                    <button
                                        onClick={handleCopy}
                                        className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                                    >
                                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                        {copied ? 'Copiato!' : 'Copia'}
                                    </button>
                                </div>
                            </div>

                    {/* Sharing Options */}
                    <div>
                        <h3 className="font-semibold text-lg mb-4 text-gray-900">Condividi il Link</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <button
                                onClick={handleShareEmail}
                                className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-center group"
                            >
                                <Mail className="w-8 h-8 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                                <h4 className="font-semibold text-gray-900">Email</h4>
                                <p className="text-sm text-gray-600">Invia via email</p>
                            </button>

                            <button
                                onClick={handleShareWhatsApp}
                                className="p-4 bg-white border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all text-center group"
                            >
                                <MessageCircle className="w-8 h-8 text-green-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                                <h4 className="font-semibold text-gray-900">WhatsApp</h4>
                                <p className="text-sm text-gray-600">Condividi su WhatsApp</p>
                            </button>

                            <button
                                onClick={() => {
                                    if (navigator.share) {
                                        navigator.share({
                                            title: 'Prenota un appuntamento',
                                            url: bookingUrl
                                        });
                                    } else {
                                        handleCopy();
                                    }
                                }}
                                className="p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all text-center group"
                            >
                                <Share2 className="w-8 h-8 text-purple-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                                <h4 className="font-semibold text-gray-900">Altri</h4>
                                <p className="text-sm text-gray-600">Condividi ovunque</p>
                            </button>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="bg-gray-50 rounded-xl p-6">
                        <h3 className="font-semibold text-lg mb-3 text-gray-900">Anteprima Pagina</h3>
                        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                            <div className="text-center">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-blue-600 font-bold text-xl">U</span>
                                </div>
                                <h4 className="font-semibold text-lg">Prenota con me</h4>
                                <p className="text-gray-600 text-sm">Seleziona un orario per il nostro appuntamento</p>
                            </div>
                        </div>

                        <a
                            href={bookingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
                        >
                            <ExternalLink className="w-5 h-5" />
                            Apri Pagina di Prenotazione
                        </a>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">0</div>
                            <div className="text-sm text-gray-600">Prenotazioni Oggi</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">0</div>
                            <div className="text-sm text-gray-600">Questa Settimana</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">0</div>
                            <div className="text-sm text-gray-600">Totale Visite</div>
                        </div>
                    </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Chiudi
                    </button>
                </div>
            </div>
        </div>
    );
}