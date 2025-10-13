'use client';

import { useState } from 'react';
import DuplicateResolutionModal from './DuplicateResolutionModal';
import FieldMappingModal, { type FieldMapping as FieldMappingType } from './FieldMappingModal';

// Simple icon components to avoid external dependencies
const UploadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface CSVUploadButtonProps {
  onUploadSuccess?: () => void;
}

interface UploadResult {
  success: boolean;
  import_id?: string;
  field_mappings?: Array<{
    csv_field: string;
    detected_type: string;
    confidence: number;
    db_field: string | null;
  }>;
  preview_contacts?: Record<string, string>[];
  error?: string;
}

interface DuplicateApiResponse {
  results: Array<{
    index: number;
    contact: Record<string, string>;
    duplicates: Array<{
      contact_id: string;
      match_type: string;
      confidence: number;
      recommended_action: string;
      email?: string;
      phone?: string;
      name?: string;
      created_at?: string;
    }>;
    has_duplicates: boolean;
  }>;
  stats: {
    total_checked: number;
    duplicates_found: number;
    exact_matches: number;
    fuzzy_matches: number;
    unique_contacts: number;
  };
}

interface ImportResult {
  success: boolean;
  imported_count: number;
  results?: {
    imported: number;
    skipped: number;
    merged: number;
    replaced: number;
    errors: number;
  };
}

type WorkflowStep = 'upload' | 'mapping' | 'duplicates' | 'importing' | 'complete';

export default function CSVUploadButton({ onUploadSuccess: _onUploadSuccess }: CSVUploadButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Step data
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [mappingResult, setMappingResult] = useState<FieldMappingType[] | null>(null);
  const [duplicateResults, setDuplicateResults] = useState<DuplicateApiResponse | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Step 1: Upload CSV
  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setCurrentStep('upload');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        'https://qjtaqrlpronohgpfdxsi.supabase.co/functions/v1/parse-csv-upload',
        { method: 'POST', body: formData }
      );

      const data = await response.json();

      if (!data.success) throw new Error(data.error || 'Upload failed');

      setUploadResult(data);
      setCurrentStep('mapping');

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      alert(`Upload error: ${errorMessage}`);
      setCurrentStep('upload');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Save field mappings and proceed to duplicate check
  const handleMappingSave = async (mappings: FieldMappingType[]) => {
    if (!uploadResult) return;

    setLoading(true);
    setCurrentStep('duplicates');

    try {
      setMappingResult(mappings);

      // Prepare contacts from CSV with mappings applied
      const contacts = uploadResult.preview_contacts?.map((row: Record<string, string>) => {
        const contact: Record<string, string> = {};
        mappings.forEach((mapping: FieldMappingType) => {
          if (mapping.dbField) {
            contact[mapping.dbField] = row[mapping.csvColumn] || '';
          }
        });
        return contact;
      }) || [];

      // Check for duplicates
      const dupResponse = await fetch(
        'https://qjtaqrlpronohgpfdxsi.supabase.co/functions/v1/check-duplicates',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contacts,
            import_id: uploadResult.import_id,
            organization_id: 'default-org-id' // TODO: Get from session
          })
        }
      );

      const dupData = await dupResponse.json();

      if (!dupData.success) throw new Error('Duplicate check failed');

      setDuplicateResults(dupData);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Duplicate check failed';
      alert(`Duplicate check error: ${errorMessage}`);
      setCurrentStep('mapping');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Resolve duplicates and import
  const handleDuplicateResolve = async (resolutions: Record<number, string>) => {
    if (!uploadResult || !mappingResult) return;

    setLoading(true);
    setCurrentStep('importing');

    try {
      // Prepare final import with resolutions
      const importData = {
        import_id: uploadResult.import_id,
        mappings: mappingResult,
        duplicateResolutions: resolutions,
        contacts: uploadResult.preview_contacts || []
      };

      // Final import
      const importResponse = await fetch(
        'https://qjtaqrlpronohgpfdxsi.supabase.co/functions/v1/import-contacts',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(importData)
        }
      );

      const importData2 = await importResponse.json();

      if (!importData2.success) throw new Error('Import failed');

      setImportResult(importData2);
      setCurrentStep('complete');

      // Refresh page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Import failed';
      alert(`Import error: ${errorMessage}`);
      setCurrentStep('duplicates');
    } finally {
      setLoading(false);
    }
  };

  const resetWorkflow = () => {
    setCurrentStep('upload');
    setFile(null);
    setUploadResult(null);
    setMappingResult(null);
    setDuplicateResults(null);
    setImportResult(null);
  };

  return (
    <>
      {/* Upload Button */}
      <button
        onClick={() => {
          resetWorkflow();
          setIsOpen(true);
        }}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        <UploadIcon />
        Importa CSV
      </button>

      {/* Upload Modal */}
      {isOpen && currentStep === 'upload' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Importa CSV</h2>
              <button onClick={() => setIsOpen(false)}>
                <XIcon />
              </button>
            </div>

            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mb-4 w-full"
            />

            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="w-full py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400"
            >
              {loading ? 'Caricamento...' : 'Carica CSV'}
            </button>
          </div>
        </div>
      )}

      {/* Field Mapping Modal */}
      {currentStep === 'mapping' && uploadResult && (
        <FieldMappingModal
          isOpen={true}
          onClose={() => setIsOpen(false)}
          csvHeaders={uploadResult.field_mappings?.map((fm) => fm.csv_field) || []}
          previewData={uploadResult.preview_contacts || []}
          detectedMappings={uploadResult.field_mappings?.map((fm) => ({
            csvColumn: fm.csv_field,
            dbField: fm.db_field,
            confidence: fm.confidence,
            sample: [],
            validation: { valid: true, errors: [], warnings: [] }
          })) || []}
          onSave={handleMappingSave}
        />
      )}

      {/* Duplicate Resolution Modal */}
      {currentStep === 'duplicates' && duplicateResults && (
        <DuplicateResolutionModal
          isOpen={true}
          onClose={() => setIsOpen(false)}
          duplicateResults={duplicateResults.results?.map((result: {
            index: number;
            contact: Record<string, string>;
            duplicates: Array<{
              contact_id: string;
              match_type: string;
              confidence: number;
              recommended_action: string;
              email?: string;
              phone?: string;
              name?: string;
              created_at?: string;
            }>;
            has_duplicates: boolean;
          }) => ({
            index: result.index,
            contact: {
              name: result.contact.name || '',
              email: result.contact.email,
              phone: result.contact.phone,
              company: result.contact.company,
              ...result.contact
            },
            duplicates: result.duplicates?.map((dup) => ({
              contact_id: dup.contact_id,
              match_type: dup.match_type as 'email' | 'phone' | 'name',
              confidence: dup.confidence,
              email: dup.email || '',
              phone: dup.phone || '',
              name: dup.name || '',
              created_at: dup.created_at || new Date().toISOString(),
              recommended_action: dup.recommended_action as 'skip' | 'merge' | 'replace' | 'keep_both'
            })) || [],
            has_duplicates: result.has_duplicates,
            recommended_action: result.duplicates?.length > 0 ? 'merge' : 'import'
          })) || []}
          stats={duplicateResults.stats || { total_checked: 0, duplicates_found: 0, exact_matches: 0, fuzzy_matches: 0, unique_contacts: 0 }}
          onResolve={handleDuplicateResolve}
        />
      )}

      {/* Import Progress */}
      {currentStep === 'importing' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-lg font-semibold">Importazione in corso...</p>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {currentStep === 'complete' && importResult && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md text-center">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-xl font-bold mb-2">Importazione Completata!</h3>
            <p className="text-gray-600 mb-4">
              {importResult.imported_count || 0} contatti importati con successo
            </p>
            <p className="text-sm text-gray-500">
              La pagina verrà ricaricata automaticamente...
            </p>
          </div>
        </div>
      )}
    </>
  );
}