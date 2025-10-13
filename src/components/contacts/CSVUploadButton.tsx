'use client';

import React, { useState } from 'react';
import FieldMappingModal, { type FieldMapping as FieldMappingType } from './FieldMappingModal';
import DuplicateResolutionModal from './DuplicateResolutionModal';

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

type WorkflowStep = 'upload' | 'mapping' | 'duplicates' | 'importing' | 'complete';

export default function CSVUploadButton({ onUploadSuccess }: CSVUploadButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Step data
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [mappingResult, setMappingResult] = useState<any>(null);
  const [duplicateResults, setDuplicateResults] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);

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
      
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
      setCurrentStep('upload');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Save field mappings and proceed to duplicate check
  const handleMappingSave = async (mappings: any[]) => {
    setLoading(true);
    setCurrentStep('duplicates');
    
    try {
      setMappingResult(mappings);
      
      // Prepare contacts from CSV with mappings applied
      const contacts = uploadResult.preview_contacts?.map((row: any) => {
        const contact: any = {};
        mappings.forEach((mapping: any) => {
          if (mapping.dbField) {
            contact[mapping.dbField] = row[mapping.csvColumn] || null;
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
      
    } catch (err: any) {
      alert(`Duplicate check error: ${err.message}`);
      setCurrentStep('mapping');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Resolve duplicates and import
  const handleDuplicateResolve = async (resolutions: Record<number, string>) => {
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
      
    } catch (err: any) {
      alert(`Import error: ${err.message}`);
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
          csvHeaders={uploadResult.field_mappings?.map((fm: any) => fm.csv_field) || []}
          previewData={uploadResult.preview_contacts || []}
          detectedMappings={uploadResult.field_mappings || []}
          onSave={handleMappingSave}
        />
      )}

      {/* Duplicate Resolution Modal */}
      {currentStep === 'duplicates' && duplicateResults && (
        <DuplicateResolutionModal
          isOpen={true}
          onClose={() => setIsOpen(false)}
          duplicateResults={duplicateResults.results || []}
          stats={duplicateResults.stats || {}}
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