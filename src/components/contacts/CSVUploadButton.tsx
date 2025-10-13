'use client';

import React, { useState } from 'react';

// Simple icon components to avoid external dependencies
const UploadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const FileSpreadsheetIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface FieldMapping {
  csv_field: string;
  detected_type: string;
  confidence: number;
  db_field: string | null;
}

interface ValidationSummary {
  email_issues: number;
  phone_issues: number;
  missing_required: number;
  duplicate_emails: number;
}

interface UploadSummary {
  filename: string;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  contacts_created: number;
  processing_time_ms: number;
}

interface CSVUploadResult {
  success: boolean;
  import_id?: string;
  summary?: UploadSummary;
  field_mappings?: FieldMapping[];
  validation_summary?: ValidationSummary;
  preview_contacts?: Record<string, string>[];
  error?: string;
  details?: any;
}

interface CSVUploadButtonProps {
  onUploadSuccess?: () => void;
}

export default function CSVUploadButton({ onUploadSuccess }: CSVUploadButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CSVUploadResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        'https://qjtaqrlpronohgpfdxsi.supabase.co/functions/v1/parse-csv-upload',
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      setResult(data);

      if (data.success) {
        // Call success callback if provided
        if (onUploadSuccess) {
          onUploadSuccess();
        }
        
        // Auto-close modal and refresh after success
        setTimeout(() => {
          setIsOpen(false);
          window.location.reload();
        }, 3000);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setResult({
        success: false,
        error: message
      });
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setResult(null);
    setLoading(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    resetModal();
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors"
      >
        <UploadIcon />
        <span>Importa CSV</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <FileSpreadsheetIcon />
                <h2 className="text-xl font-bold text-gray-900">Importa Contatti da CSV</h2>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XIcon />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {!result ? (
                <>
                  {/* Instructions */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-2">
                      📋 Formato File CSV
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• File CSV con intestazioni (Nome, Email, Telefono, Azienda)</li>
                      <li>• Dimensione massima: 10MB</li>
                      <li>• Supporto caratteri speciali e accenti italiani</li>
                      <li>• Riconoscimento automatico campi (bilingue IT/EN)</li>
                      <li>• Auto-correzione errori di encoding</li>
                    </ul>
                  </div>

                  {/* File Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seleziona File CSV
                    </label>
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100
                        cursor-pointer border border-gray-300 rounded-lg p-2"
                    />
                    {file && (
                      <p className="mt-2 text-sm text-gray-600">
                        File selezionato: <span className="font-medium">{file.name}</span>
                        <span className="text-gray-400 ml-2">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Upload Button */}
                  <button
                    onClick={handleUpload}
                    disabled={!file || loading}
                    className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors
                      ${loading || !file
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                      }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⏳</span>
                        Elaborazione in corso...
                      </span>
                    ) : (
                      '📤 Carica e Analizza CSV'
                    )}
                  </button>
                </>
              ) : result.success ? (
                /* Success Result */
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="text-green-900 font-bold text-lg mb-2">
                      ✅ Importazione Completata!
                    </h3>
                    <p className="text-green-700">
                      {result.summary?.total_rows || 0} contatti importati con successo
                    </p>
                    <p className="text-green-600 text-sm mt-1">
                      Elaborazione completata in {result.summary?.processing_time_ms}ms
                    </p>
                  </div>

                  {/* Data Quality */}
                  {result.summary && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">
                        📊 Qualità Dati
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-700">Contatti totali:</span>
                          <span className="font-bold text-blue-900">{result.summary.total_rows}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Righe valide:</span>
                          <span className="font-bold text-blue-900">{result.summary.valid_rows}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Righe scartate:</span>
                          <span className="font-bold text-blue-900">{result.summary.invalid_rows}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Tempo elaborazione:</span>
                          <span className="font-bold text-blue-900">{result.summary.processing_time_ms}ms</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Field Mappings */}
                  {result.field_mappings && result.field_mappings.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        🎯 Campi Rilevati Automaticamente
                      </h4>
                      <div className="space-y-2 text-sm">
                        {result.field_mappings
                          .filter((m: FieldMapping) => m.db_field)
                          .map((mapping: FieldMapping, i: number) => (
                            <div key={i} className="flex items-center justify-between bg-white p-2 rounded border">
                              <div className="flex items-center">
                                <span className="font-medium text-gray-900 min-w-0">
                                  "{mapping.csv_field}"
                                </span>
                                <span className="mx-2 text-gray-400">→</span>
                                <span className="text-blue-600 font-medium">
                                  {mapping.detected_type}
                                </span>
                              </div>
                              <div className={`px-2 py-1 rounded text-xs font-medium ${
                                mapping.confidence >= 90 
                                  ? 'bg-green-100 text-green-800' 
                                  : mapping.confidence >= 70 
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {mapping.confidence}%
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Validation Summary */}
                  {result.validation_summary && (
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <h4 className="font-semibold text-purple-900 mb-2">
                        🔍 Validazione Automatica
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-purple-700">Email problematiche:</span>
                          <span className="font-medium">{result.validation_summary.email_issues}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-700">Telefoni problematici:</span>
                          <span className="font-medium">{result.validation_summary.phone_issues}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-700">Campi mancanti:</span>
                          <span className="font-medium">{result.validation_summary.missing_required}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-700">Email duplicate:</span>
                          <span className="font-medium">{result.validation_summary.duplicate_emails}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">
                      🔄 La pagina verrà ricaricata automaticamente tra 3 secondi...
                    </p>
                    <button
                      onClick={handleClose}
                      className="text-sm text-blue-600 hover:text-blue-700 underline"
                    >
                      Chiudi ora
                    </button>
                  </div>
                </div>
              ) : (
                /* Error Result */
                <div className="space-y-4">
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h3 className="text-red-900 font-bold mb-2">
                      ❌ Errore Importazione
                    </h3>
                    <p className="text-red-700 mb-2">{result.error}</p>
                    
                    {/* Additional error details */}
                    {result.details && (
                      <div className="mt-3 text-xs">
                        <details className="text-red-600">
                          <summary className="cursor-pointer font-medium">
                            📋 Dettagli Tecnici
                          </summary>
                          <pre className="mt-2 bg-red-100 p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={resetModal}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                    >
                      🔄 Riprova
                    </button>
                    <button
                      onClick={handleClose}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Chiudi
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}