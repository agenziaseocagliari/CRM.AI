'use client';

import { AlertTriangle, Crown, Star, User, Users, X } from 'lucide-react';
import { useState } from 'react';

interface TeamMember {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role?: string;
    availability?: 'available' | 'busy' | 'away';
    timezone?: string;
}

interface TeamSchedulingModalProps {
    isOpen: boolean;
    onClose: () => void;
    teamMembers: TeamMember[];
    onSchedule: (data: any) => void;
}

const SCHEDULING_MODES = [
    {
        id: 'collective',
        name: 'Riunione Collettiva',
        icon: '👥',
        description: 'Tutti i membri devono essere disponibili contemporaneamente',
        pros: ['Decisioni condivise', 'Massima collaborazione', 'Allineamento totale'],
        cons: ['Più difficile trovare slot', 'Coordinamento complesso'],
        bestFor: 'Decisioni strategiche, brainstorming, all-hands',
        color: 'blue'
    },
    {
        id: 'round-robin',
        name: 'Round Robin',
        icon: '🔄',
        description: 'Assegna automaticamente al primo membro disponibile',
        pros: ['Massima flessibilità', 'Carico distribuito', 'Risposta rapida'],
        cons: ['Meno coordinamento', 'Info frammentate'],
        bestFor: 'Support, sales calls, consulenze individuali',
        color: 'green'
    },
    {
        id: 'sequential',
        name: 'Sequenziale',
        icon: '📋',
        description: 'Gli invitati scelgono in ordine di priorità predefinito',
        pros: ['Controllo gerarchico', 'Processo strutturato', 'Escalation chiara'],
        cons: ['Meno flessibile', 'Possibili ritardi'],
        bestFor: 'Approvazioni, review process, escalation',
        color: 'purple'
    }
];

export default function TeamSchedulingModal({
    isOpen,
    onClose,
    teamMembers,
    onSchedule
}: TeamSchedulingModalProps) {
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [schedulingMode, setSchedulingMode] = useState<'collective' | 'round-robin' | 'sequential'>('collective');
    const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
    const [duration, setDuration] = useState(30);
    const [buffer, setBuffer] = useState(15);

    if (!isOpen) return null;

    const selectedMemberObjects = teamMembers.filter(member =>
        selectedMembers.includes(member.id)
    );

    const getAvailableMembers = () => {
        return teamMembers.filter(member =>
            member.availability === 'available' || !member.availability
        );
    };

    const estimateComplexity = () => {
        const memberCount = selectedMembers.length;
        const modeMultiplier = {
            'collective': memberCount * 1.5,
            'round-robin': memberCount * 0.5,
            'sequential': memberCount * 1.2
        };

        const complexity = modeMultiplier[schedulingMode];

        if (complexity < 3) return { level: 'Facile', color: 'green', time: '< 5 min' };
        if (complexity < 6) return { level: 'Medio', color: 'yellow', time: '5-15 min' };
        return { level: 'Complesso', color: 'red', time: '> 15 min' };
    };

    const complexity = estimateComplexity();

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                Team Scheduling
                            </h2>
                            <p className="text-gray-600">Coordina riunioni con più persone</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-8">

                    {/* Scheduling Mode Selection */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                            Modalità di Scheduling
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {SCHEDULING_MODES.map(mode => (
                                <button
                                    key={mode.id}
                                    onClick={() => setSchedulingMode(mode.id as any)}
                                    className={`p-6 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-lg ${schedulingMode === mode.id
                                            ? `border-${mode.color}-500 bg-${mode.color}-50 shadow-md`
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="text-2xl">{mode.icon}</div>
                                        <div>
                                            <div className={`font-bold text-sm ${schedulingMode === mode.id ? `text-${mode.color}-700` : 'text-gray-900'}`}>
                                                {mode.name}
                                            </div>
                                            {mode.id === 'collective' && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Crown className="w-3 h-3 text-yellow-500" />
                                                    <span className="text-xs text-yellow-600 font-medium">ENTERPRISE</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                                        {mode.description}
                                    </p>

                                    <div className="space-y-2">
                                        <div>
                                            <div className="text-xs font-semibold text-green-700 mb-1">✓ Vantaggi:</div>
                                            <ul className="text-xs text-gray-600 space-y-0.5">
                                                {mode.pros.slice(0, 2).map((pro, i) => (
                                                    <li key={i}>• {pro}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="pt-2 border-t border-gray-100">
                                            <div className="text-xs font-medium text-gray-500">
                                                Ideale per: {mode.bestFor}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Team Members Selection */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">
                                Seleziona Partecipanti
                            </h3>
                            <div className="text-sm text-gray-600">
                                {selectedMembers.length} di {teamMembers.length} membri
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 mb-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                                {teamMembers.map(member => {
                                    const isSelected = selectedMembers.includes(member.id);
                                    const isAvailable = member.availability !== 'busy';

                                    return (
                                        <label
                                            key={member.id}
                                            className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${isSelected
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : isAvailable
                                                        ? 'border-gray-200 bg-white hover:border-gray-300'
                                                        : 'border-red-200 bg-red-50 opacity-75'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedMembers([...selectedMembers, member.id]);
                                                    } else {
                                                        setSelectedMembers(selectedMembers.filter(id => id !== member.id));
                                                    }
                                                }}
                                                disabled={!isAvailable}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />

                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                {member.avatar ? (
                                                    <img
                                                        src={member.avatar}
                                                        alt={member.name}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                                        <User className="w-5 h-5 text-white" />
                                                    </div>
                                                )}

                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-sm text-gray-900 truncate">
                                                        {member.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500 truncate">
                                                        {member.email}
                                                    </div>
                                                    {member.role && (
                                                        <div className="text-xs text-blue-600 font-medium">
                                                            {member.role}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-shrink-0">
                                                    {member.availability === 'available' && (
                                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                    )}
                                                    {member.availability === 'busy' && (
                                                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                                    )}
                                                    {member.availability === 'away' && (
                                                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                                    )}
                                                </div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Advanced Options */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
                            <Star className="w-5 h-5" />
                            Opzioni Avanzate
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                            {/* Priority */}
                            <div>
                                <label className="block text-sm font-semibold text-purple-700 mb-2">
                                    Priorità Riunione
                                </label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as any)}
                                    className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="low">🟢 Bassa - Flessibile</option>
                                    <option value="medium">🟡 Media - Standard</option>
                                    <option value="high">🔴 Alta - Urgente</option>
                                </select>
                            </div>

                            {/* Duration */}
                            <div>
                                <label className="block text-sm font-semibold text-purple-700 mb-2">
                                    Durata (minuti)
                                </label>
                                <select
                                    value={duration}
                                    onChange={(e) => setDuration(parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value={15}>15 min - Quick sync</option>
                                    <option value={30}>30 min - Standard</option>
                                    <option value={45}>45 min - Approfondita</option>
                                    <option value={60}>60 min - Workshop</option>
                                    <option value={90}>90 min - Strategica</option>
                                </select>
                            </div>

                            {/* Buffer */}
                            <div>
                                <label className="block text-sm font-semibold text-purple-700 mb-2">
                                    Buffer tra riunioni
                                </label>
                                <select
                                    value={buffer}
                                    onChange={(e) => setBuffer(parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value={0}>Nessun buffer</option>
                                    <option value={5}>5 min</option>
                                    <option value={15}>15 min - Standard</option>
                                    <option value={30}>30 min - Rilassato</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Scheduling Complexity Indicator */}
                    {selectedMembers.length > 0 && (
                        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                            <h4 className="text-md font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <AlertTriangle className={`w-5 h-5 text-${complexity.color}-600`} />
                                Analisi Complessità
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="text-center">
                                    <div className={`text-2xl font-bold text-${complexity.color}-600`}>
                                        {complexity.level}
                                    </div>
                                    <div className="text-sm text-gray-600">Difficoltà</div>
                                </div>

                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {complexity.time}
                                    </div>
                                    <div className="text-sm text-gray-600">Tempo stimato</div>
                                </div>

                                <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {selectedMembers.length}
                                    </div>
                                    <div className="text-sm text-gray-600">Partecipanti</div>
                                </div>
                            </div>

                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                <div className="text-sm font-semibold text-gray-700 mb-2">
                                    Raccomandazioni AI:
                                </div>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    {schedulingMode === 'collective' && selectedMembers.length > 5 && (
                                        <li>• Considera di dividere in gruppi più piccoli per maggiore efficienza</li>
                                    )}
                                    {priority === 'high' && (
                                        <li>• Priorità alta: proporremo slot anche al di fuori degli orari preferiti</li>
                                    )}
                                    {duration > 60 && (
                                        <li>• Riunioni lunghe: suggeriremo pause automatiche ogni 45 minuti</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                        >
                            Annulla
                        </button>
                        <button
                            onClick={() => {
                                onSchedule({
                                    mode: schedulingMode,
                                    members: selectedMembers,
                                    priority,
                                    duration,
                                    buffer,
                                    complexity: complexity.level
                                });
                                onClose();
                            }}
                            disabled={selectedMembers.length === 0}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            {selectedMembers.length === 0
                                ? 'Seleziona Membri'
                                : `Continua con ${selectedMembers.length} ${selectedMembers.length === 1 ? 'Persona' : 'Persone'}`
                            }
                        </button>
                    </div>

                    {/* Enterprise Upsell */}
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <Crown className="w-6 h-6 text-yellow-600" />
                            <div>
                                <div className="font-bold text-yellow-900">Team Scheduling Pro</div>
                                <div className="text-sm text-yellow-700">Funzionalità Enterprise Avanzate</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                                <div className="font-semibold text-yellow-800">✨ Incluso:</div>
                                <ul className="space-y-1 text-yellow-700">
                                    <li>• Team illimitati</li>
                                    <li>• AI scheduling optimization</li>
                                    <li>• Recurring team meetings</li>
                                    <li>• Advanced analytics</li>
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <div className="font-semibold text-yellow-800">🚀 Plus:</div>
                                <ul className="space-y-1 text-yellow-700">
                                    <li>• Integrazione Slack/Teams</li>
                                    <li>• Room booking automation</li>
                                    <li>• Custom workflows</li>
                                    <li>• Priority support</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}