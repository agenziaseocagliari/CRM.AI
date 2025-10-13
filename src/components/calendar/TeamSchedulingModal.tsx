'use client';

import { Calendar, Clock, Plus, RotateCcw, Settings, Target, Users, X } from 'lucide-react';
import { useState } from 'react';

interface TeamSchedulingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function TeamSchedulingModal({ isOpen, onClose }: TeamSchedulingModalProps) {
    const [selectedMode, setSelectedMode] = useState<'collective' | 'round-robin' | null>(null);
    const [teamMembers, setTeamMembers] = useState<string[]>([]);
    const [showAddMember, setShowAddMember] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8">
                {/* Header - Fixed */}
                <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
                    <h2 className="text-2xl font-bold">👥 Team Scheduling</h2>
                    <button onClick={onClose} className="hover:bg-white/50 rounded p-1">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                    <div className="space-y-6">
                        {/* Description */}
                        <div className="bg-blue-50 rounded-lg p-4">
                            <Users className="w-10 h-10 text-blue-600 mb-3" />
                            <h3 className="font-semibold text-lg mb-2">Riunioni di Team</h3>
                            <p className="text-gray-600 text-sm">
                                Coordina gli orari del tuo team per trovare il momento perfetto per riunioni di gruppo.
                            </p>
                        </div>

                        {/* Mode Selection */}
                        <div>
                            <label className="block font-semibold mb-3">Seleziona Modalità</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setSelectedMode('collective')}
                                    className={`p-4 border-2 rounded-lg hover:border-blue-500 transition-all text-left ${
                                        selectedMode === 'collective' 
                                            ? 'border-blue-500 bg-blue-50' 
                                            : 'border-gray-200'
                                    }`}
                            >
                                                                >
                                    <div className="text-3xl mb-3">🎯</div>
                                    <h4 className="font-semibold mb-2">Collettiva</h4>
                                    <p className="text-sm text-gray-600">Tutti i membri devono essere disponibili contemporaneamente</p>
                                </button>

                                <button 
                                    onClick={() => setSelectedMode('round-robin')}
                                    className={`p-4 border-2 rounded-lg hover:border-blue-500 transition-all text-left ${
                                        selectedMode === 'round-robin' 
                                            ? 'border-blue-500 bg-blue-50' 
                                            : 'border-gray-200'
                                    }`}
                                >
                                    <div className="text-3xl mb-3">🔄</div>
                                    <h4 className="font-semibold mb-2">Round Robin</h4>
                                    <p className="text-sm text-gray-600">Assegna automaticamente al primo membro disponibile</p>
                                </button>
                            </div>
                        </div>

                        {/* Team Members */}
                        {selectedMode && (
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="font-semibold">Membri del Team</label>
                                    <button
                                        onClick={() => setShowAddMember(!showAddMember)}
                                        className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Aggiungi
                                    </button>
                                </div>

                                {showAddMember && (
                                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                        <input
                                            type="email"
                                            placeholder="email@esempio.com"
                                            value={newMemberEmail}
                                            onChange={(e) => setNewMemberEmail(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg mb-2"
                                        />
                                        <button
                                            onClick={() => {
                                                if (newMemberEmail.trim()) {
                                                    setTeamMembers([...teamMembers, newMemberEmail.trim()]);
                                                    setNewMemberEmail('');
                                                    setShowAddMember(false);
                                                }
                                            }}
                                            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            Conferma
                                        </button>
                                    </div>
                                )}

                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {teamMembers.length === 0 ? (
                                        <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                                            Nessun membro aggiunto. Clicca "Aggiungi" per iniziare.
                                        </div>
                                    ) : (
                                        teamMembers.map((member, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                                                        {member.charAt(0)}
                                                    </div>
                                                    <span className="font-medium">{member}</span>
                                                </div>
                                                <button
                                                    onClick={() => setTeamMembers(teamMembers.filter((_, i) => i !== idx))}
                                                    className="text-red-600 hover:bg-red-50 p-1 rounded"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Info */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-sm text-yellow-800">
                                💡 <strong>Coming Soon:</strong> Coordinamento automatico degli orari disponibili e notifiche ai membri del team.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer - Fixed */}
                <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                    >
                        Chiudi
                    </button>
                </div>
            </div>
        </div>
    );
}