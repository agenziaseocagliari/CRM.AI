'use client';

import { X, Users, Target, RotateCcw, Calendar, Clock, Settings } from 'lucide-react';
import { useState } from 'react';

interface TeamSchedulingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function TeamSchedulingModal({ isOpen, onClose }: TeamSchedulingModalProps) {
    const [selectedMode, setSelectedMode] = useState<'collective' | 'round-robin' | null>(null);
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl">
                {/* Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50">
                    <h2 className="text-2xl font-bold text-gray-900">👥 Team Scheduling</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Introduction */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <Users className="w-8 h-8 text-purple-600" />
                            <h3 className="font-semibold text-xl text-gray-900">Coordinamento Team</h3>
                        </div>
                        <p className="text-gray-600">
                            Gestisci le riunioni del tuo team con modalità di scheduling avanzate. 
                            Coordina automaticamente gli orari disponibili di tutti i membri.
                        </p>
                    </div>

                    {/* Scheduling Modes */}
                    <div>
                        <h3 className="font-semibold text-lg mb-4 text-gray-900">Seleziona Modalità di Scheduling</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Collective Mode */}
                            <button
                                onClick={() => setSelectedMode('collective')}
                                className={`p-6 border-2 rounded-xl transition-all text-left ${
                                    selectedMode === 'collective'
                                        ? 'border-purple-500 bg-purple-50 shadow-lg'
                                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                                }`}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <Target className="w-8 h-8 text-purple-600" />
                                    <h4 className="font-semibold text-lg">Riunione Collettiva</h4>
                                </div>
                                <p className="text-gray-600 mb-4">
                                    Tutti i membri del team devono essere disponibili contemporaneamente
                                </p>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span>Trova slot comuni per tutti</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span>Perfetto per meeting team</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span>Sincronizzazione calendari</span>
                                    </div>
                                </div>
                            </button>

                            {/* Round Robin Mode */}
                            <button
                                onClick={() => setSelectedMode('round-robin')}
                                className={`p-6 border-2 rounded-xl transition-all text-left ${
                                    selectedMode === 'round-robin'
                                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                }`}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <RotateCcw className="w-8 h-8 text-blue-600" />
                                    <h4 className="font-semibold text-lg">Round Robin</h4>
                                </div>
                                <p className="text-gray-600 mb-4">
                                    Assegna automaticamente al primo membro disponibile
                                </p>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span>Distribuzione equa del carico</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span>Assegnazione automatica</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span>Ideale per consulenze individuali</span>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Team Members Section */}
                    <div>
                        <h3 className="font-semibold text-lg mb-4 text-gray-900">Membri del Team</h3>
                        <div className="bg-gray-50 rounded-xl p-6">
                            <div className="space-y-4">
                                {/* Demo team members */}
                                {[
                                    { name: 'Mario Rossi', role: 'Team Lead', available: true },
                                    { name: 'Giulia Bianchi', role: 'Designer', available: true },
                                    { name: 'Luca Verdi', role: 'Developer', available: false },
                                ].map((member, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                                <span className="font-semibold text-gray-600">{member.name.charAt(0)}</span>
                                            </div>
                                            <div>
                                                <p className="font-semibold">{member.name}</p>
                                                <p className="text-sm text-gray-600">{member.role}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`w-3 h-3 rounded-full ${member.available ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            <span className="text-sm text-gray-600">
                                                {member.available ? 'Disponibile' : 'Occupato'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <button className="w-full mt-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:bg-gray-100 transition-colors">
                                + Aggiungi Membro del Team
                            </button>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
                            <Calendar className="w-6 h-6 text-green-600 mx-auto mb-2" />
                            <div className="text-xl font-bold text-green-700">0</div>
                            <div className="text-sm text-green-600">Meeting Programmati</div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                            <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                            <div className="text-xl font-bold text-blue-700">0</div>
                            <div className="text-sm text-blue-600">Ore Totali</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center">
                            <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                            <div className="text-xl font-bold text-purple-700">3</div>
                            <div className="text-sm text-purple-600">Membri Attivi</div>
                        </div>
                    </div>

                    {/* Coming Soon Notice */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Settings className="w-6 h-6 text-yellow-600" />
                            <h4 className="font-semibold text-yellow-800">Funzionalità in Sviluppo</h4>
                        </div>
                        <p className="text-yellow-700 text-sm">
                            <strong>Coming Soon:</strong> Configurazione completa del team scheduling con integrazione calendari,
                            notifiche automatiche e gestione delle disponibilità in tempo reale.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Chiudi
                    </button>
                    <button
                        disabled={!selectedMode}
                        className={`px-6 py-2 rounded-lg transition-colors ${
                            selectedMode
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        Configura Scheduling
                    </button>
                </div>
            </div>
        </div>
    );
}