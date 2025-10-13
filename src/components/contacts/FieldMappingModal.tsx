'use client';

import { useEffect, useState } from 'react';

// Simple icon components
const XIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// TypeScript interfaces
interface FieldMapping {
  csvColumn: string;
  dbField: string | null;
  confidence: number;
  sample: string[];
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
}

interface FieldMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  csvHeaders: string[];
  previewData: Record<string, string>[];
  detectedMappings: FieldMapping[];
  onSave: (mappings: FieldMapping[]) => void;
}

// Available DB fields
const DB_FIELDS = [
  { value: 'name', label: 'Nome', description: 'Nome completo o azienda' },
  { value: 'email', label: 'Email', description: 'Indirizzo email' },
  { value: 'phone', label: 'Telefono', description: 'Numero di telefono' },
  { value: 'company', label: 'Azienda', description: 'Nome azienda' },
  { value: 'address', label: 'Indirizzo', description: 'Indirizzo completo' },
  { value: 'city', label: 'Città', description: 'Città' },
  { value: 'state', label: 'Provincia', description: 'Provincia/Stato' },
  { value: 'zip', label: 'CAP', description: 'Codice postale' },
  { value: 'country', label: 'Paese', description: 'Paese' },
  { value: 'notes', label: 'Note', description: 'Note aggiuntive' },
];

export default function FieldMappingModal({
  isOpen,
  onClose,
  csvHeaders,
  previewData,
  detectedMappings,
  onSave
}: FieldMappingModalProps) {
  const [mappings, setMappings] = useState<FieldMapping[]>(detectedMappings);
  const [previewRows, setPreviewRows] = useState(5);

  useEffect(() => {
    setMappings(detectedMappings);
  }, [detectedMappings]);

  const handleMappingChange = (csvColumn: string, dbField: string | null) => {
    setMappings(prev => prev.map(m =>
      m.csvColumn === csvColumn
        ? { ...m, dbField, confidence: dbField ? (m.confidence > 0 ? m.confidence : 85) : 0 }
        : m
    ));
  };

  const handleSave = () => {
    onSave(mappings);
    onClose();
  };

  const handleReset = () => {
    setMappings(detectedMappings);
  };

  const mappedCount = mappings.filter(m => m.dbField).length;
  const totalColumns = csvHeaders.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              🎯 Mappa Campi CSV
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Collega le colonne del CSV ai campi del database ({mappedCount}/{totalColumns} mappati)
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XIcon />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Mapping Configuration */}
            <div className="grid gap-4">
              {mappings.map((mapping, _index) => (
                <div
                  key={mapping.csvColumn}
                  className="bg-gray-50 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-gray-100 transition-colors"
                >
                  {/* CSV Column Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      📋 {mapping.csvColumn}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Esempi: {mapping.sample.slice(0, 3).join(', ')}...
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="text-gray-400 text-lg hidden sm:block">
                    →
                  </div>

                  {/* DB Field Selection */}
                  <div className="flex-1 w-full sm:w-auto">
                    <select
                      value={mapping.dbField || ''}
                      onChange={(e) => handleMappingChange(
                        mapping.csvColumn,
                        e.target.value || null
                      )}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                      <option value="">-- Non mappare --</option>
                      {DB_FIELDS.map(field => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                    {mapping.dbField && (
                      <div className="text-xs text-gray-500 mt-1">
                        {DB_FIELDS.find(f => f.value === mapping.dbField)?.description}
                      </div>
                    )}
                  </div>

                  {/* Confidence Badge */}
                  <div className="w-full sm:w-24 text-center">
                    {mapping.dbField ? (
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${mapping.confidence >= 90
                        ? 'bg-green-100 text-green-800'
                        : mapping.confidence >= 70
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                        }`}>
                        <CheckIcon />
                        {mapping.confidence}%
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                        Non mappato
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
              <InfoIcon />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">💡 Suggerimento Intelligente</p>
                <p>
                  Le mappature sono state rilevate automaticamente dall'AI con alta confidenza.
                  Puoi modificarle o aggiungere nuove mappature dai menu a tendina sopra.
                </p>
              </div>
            </div>

            {/* Preview Table */}
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                <h3 className="font-semibold text-gray-900">
                  👀 Anteprima Dati Mappati
                </h3>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Mostra:</label>
                  <select
                    value={previewRows}
                    onChange={(e) => setPreviewRows(Number(e.target.value))}
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={5}>5 righe</option>
                    <option value={10}>10 righe</option>
                    <option value={20}>20 righe</option>
                  </select>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {mappings
                          .filter(m => m.dbField)
                          .map(mapping => (
                            <th
                              key={mapping.csvColumn}
                              className="px-4 py-3 text-left font-medium text-gray-700"
                            >
                              <div className="flex items-center gap-1">
                                {DB_FIELDS.find(f => f.value === mapping.dbField)?.label}
                                <span className={`inline-block w-2 h-2 rounded-full ${mapping.confidence >= 90 ? 'bg-green-400' :
                                  mapping.confidence >= 70 ? 'bg-yellow-400' : 'bg-blue-400'
                                  }`}></span>
                              </div>
                              <div className="text-xs font-normal text-gray-500 mt-1">
                                Da: "{mapping.csvColumn}"
                              </div>
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {previewData.slice(0, previewRows).map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                          {mappings
                            .filter(m => m.dbField)
                            .map(mapping => (
                              <td
                                key={mapping.csvColumn}
                                className="px-4 py-3 text-gray-900"
                              >
                                {row[mapping.csvColumn] ? (
                                  <span className="block truncate max-w-xs">
                                    {row[mapping.csvColumn]}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 italic text-xs">vuoto</span>
                                )}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                <p>
                  Mostrando {Math.min(previewRows, previewData.length)} di {previewData.length} righe totali
                </p>
                <p>
                  {mappings.filter(m => m.dbField).length} campi mappati
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors text-sm"
          >
            🔄 Ripristina Auto-rilevamento
          </button>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              disabled={mappedCount === 0}
              className={`px-6 py-2 rounded-lg font-medium text-white transition-colors ${mappedCount === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
              ✅ Salva Mappature ({mappedCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export type { FieldMapping, FieldMappingModalProps };
