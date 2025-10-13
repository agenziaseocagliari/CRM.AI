'use client';

import { AlertTriangle, Check, Users, X } from 'lucide-react';
import { useState } from 'react';

interface DuplicateMatch {
  contact_id: string;
  match_type: 'email' | 'phone' | 'name';
  confidence: number;
  email?: string;
  phone?: string;
  name: string;
  created_at: string;
  recommended_action: 'skip' | 'merge' | 'replace' | 'keep_both';
}

interface DuplicateResult {
  index: number;
  contact: {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    [key: string]: unknown;
  };
  duplicates: DuplicateMatch[];
  has_duplicates: boolean;
  recommended_action: string;
}

interface DuplicateStats {
  total_checked: number;
  duplicates_found: number;
  exact_matches: number;
  fuzzy_matches: number;
  unique_contacts: number;
}

interface DuplicateResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicateResults: DuplicateResult[];
  stats: DuplicateStats;
  onResolve: (resolutions: Record<number, string>) => void;
}

export default function DuplicateResolutionModal({
  isOpen,
  onClose,
  duplicateResults,
  stats,
  onResolve
}: DuplicateResolutionModalProps) {
  const [resolutions, setResolutions] = useState<Record<number, string>>(() => {
    // Initialize with recommended actions
    const initial: Record<number, string> = {};
    duplicateResults.forEach(result => {
      if (result.has_duplicates) {
        initial[result.index] = result.recommended_action;
      }
    });
    return initial;
  });

  const handleActionChange = (index: number, action: string) => {
    setResolutions(prev => ({
      ...prev,
      [index]: action
    }));
  };

  const handleResolve = () => {
    onResolve(resolutions);
    onClose();
  };

  const duplicatesWithMatches = duplicateResults.filter(r => r.has_duplicates);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-amber-50">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Duplicati Rilevati
              </h2>
              <p className="text-sm text-gray-600">
                {duplicatesWithMatches.length} possibili duplicati trovati, {stats.unique_contacts} contatti unici
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Summary */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.total_checked}</div>
              <div className="text-xs text-gray-500">Totali Verificati</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">{stats.duplicates_found}</div>
              <div className="text-xs text-gray-500">Duplicati Trovati</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{stats.exact_matches}</div>
              <div className="text-xs text-gray-500">Corrispondenze Esatte</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.unique_contacts}</div>
              <div className="text-xs text-gray-500">Contatti Unici</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {duplicatesWithMatches.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nessun Duplicato Trovato
              </h3>
              <p className="text-gray-600">
                Tutti i {stats.total_checked} contatti sono unici e pronti per l'importazione.
              </p>
            </div>
          ) : (
            duplicatesWithMatches.map(result => (
              <div
                key={result.index}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                {/* New Contact Info */}
                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    Nuovo Contatto da Importare:
                  </div>
                  <div className="font-semibold text-gray-900">
                    {result.contact.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {result.contact.email && `📧 ${result.contact.email}`}
                    {result.contact.phone && ` - 📞 ${result.contact.phone}`}
                  </div>
                </div>

                {/* Matching Contacts */}
                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-500 mb-2">
                    Possibili Duplicati ({result.duplicates.length}):
                  </div>
                  {result.duplicates.map((dup, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded border border-gray-200 p-3 mb-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{dup.name}</div>
                          <div className="text-sm text-gray-600">
                            {dup.email && `📧 ${dup.email}`}
                            {dup.phone && ` - 📞 ${dup.phone}`}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Creato: {new Date(dup.created_at).toLocaleDateString('it-IT')}
                          </div>
                        </div>
                        <div className="ml-3">
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded ${dup.confidence >= 0.95
                                ? 'bg-red-100 text-red-800'
                                : dup.confidence >= 0.85
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                          >
                            {Math.round(dup.confidence * 100)}% {dup.match_type}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Selection */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Azione:
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleActionChange(result.index, 'skip')}
                      className={`p-2 rounded border text-sm font-medium transition-colors ${resolutions[result.index] === 'skip'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      ⏭️ Salta (Già Esiste)
                    </button>
                    <button
                      onClick={() => handleActionChange(result.index, 'merge')}
                      className={`p-2 rounded border text-sm font-medium transition-colors ${resolutions[result.index] === 'merge'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      🔗 Unisci Dati
                    </button>
                    <button
                      onClick={() => handleActionChange(result.index, 'replace')}
                      className={`p-2 rounded border text-sm font-medium transition-colors ${resolutions[result.index] === 'replace'
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      🔄 Sostituisci
                    </button>
                    <button
                      onClick={() => handleActionChange(result.index, 'keep_both')}
                      className={`p-2 rounded border text-sm font-medium transition-colors ${resolutions[result.index] === 'keep_both'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      ➕ Mantieni Entrambi
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {Object.values(resolutions).filter(a => a === 'skip').length} da saltare,{' '}
            {Object.values(resolutions).filter(a => a === 'merge').length} da unire,{' '}
            {Object.values(resolutions).filter(a => a === 'replace').length} da sostituire,{' '}
            {stats.unique_contacts} unici
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
            >
              Annulla
            </button>
            <button
              onClick={handleResolve}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Procedi con Importazione
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}