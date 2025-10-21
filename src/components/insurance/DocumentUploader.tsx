/**
 * DocumentUploader Component
 * Drag & drop file uploader with validation and progress tracking
 * 
 * Features:
 * - Drag & drop interface
 * - File validation (type, size)
 * - Upload progress indicator
 * - Multiple file support
 * - Category selection (policy, claim, contact, general)
 * - Description and tags
 * 
 * @component
 * @created October 21, 2025
 */

import React, { useState, useRef, DragEvent } from 'react';
import { storageService, UploadOptions, UploadResult } from '@/services/storageService';

interface DocumentUploaderProps {
  organizationId: string;
  category: 'policy' | 'claim' | 'contact' | 'general';
  entityType?: string;
  entityId?: string;
  onUploadComplete?: (result: UploadResult) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  showMetadataForm?: boolean;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  documentId?: string;
}

export default function DocumentUploader({
  organizationId,
  category,
  entityType,
  entityId,
  onUploadComplete,
  onUploadError,
  maxFiles = 5,
  showMetadataForm = true
}: DocumentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [description, setDescription] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [tags, setTags] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    // Limit number of files
    const filesToUpload = files.slice(0, maxFiles);

    // Validate each file
    const validFiles: UploadingFile[] = [];
    for (const file of filesToUpload) {
      const validation = storageService.validateFile(file);
      if (validation.valid) {
        validFiles.push({
          file,
          progress: 0,
          status: 'pending'
        });
      } else {
        validFiles.push({
          file,
          progress: 0,
          status: 'error',
          error: validation.error
        });
      }
    }

    setUploadingFiles(validFiles);

    // Upload valid files
    for (let i = 0; i < validFiles.length; i++) {
      if (validFiles[i].status === 'error') continue;

      // Update status to uploading
      setUploadingFiles(prev => {
        const updated = [...prev];
        updated[i] = { ...updated[i], status: 'uploading', progress: 0 };
        return updated;
      });

      // Prepare upload options
      const uploadOptions: UploadOptions = {
        organizationId,
        category,
        entityType,
        entityId,
        documentType: documentType || undefined,
        description: description || undefined,
        tags: tags ? tags.split(',').map(t => t.trim()) : undefined
      };

      // Simulate progress (real implementation would use upload progress events)
      const progressInterval = setInterval(() => {
        setUploadingFiles(prev => {
          const updated = [...prev];
          if (updated[i].progress < 90) {
            updated[i] = { ...updated[i], progress: updated[i].progress + 10 };
          }
          return updated;
        });
      }, 200);

      // Upload file
      const result = await storageService.uploadDocument(
        validFiles[i].file,
        uploadOptions
      );

      clearInterval(progressInterval);

      // Update status
      setUploadingFiles(prev => {
        const updated = [...prev];
        updated[i] = {
          ...updated[i],
          progress: 100,
          status: result.success ? 'success' : 'error',
          error: result.error,
          documentId: result.documentId
        };
        return updated;
      });

      // Callbacks
      if (result.success && onUploadComplete) {
        onUploadComplete(result);
      } else if (!result.success && onUploadError) {
        onUploadError(result.error || 'Upload failed');
      }
    }
  };

  const removeFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setUploadingFiles([]);
    setDescription('');
    setDocumentType('');
    setTags('');
  };

  const getCategoryLabel = () => {
    switch (category) {
      case 'policy': return 'Polizza';
      case 'claim': return 'Sinistro';
      case 'contact': return 'Contatto';
      case 'general': return 'Generale';
    }
  };

  return (
    <div className="space-y-4">
      {/* Metadata Form */}
      {showMetadataForm && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <h4 className="font-semibold text-gray-900">Informazioni Documento</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria
            </label>
            <input
              type="text"
              value={getCategoryLabel()}
              disabled
              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo Documento (opzionale)
            </label>
            <input
              type="text"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              placeholder="es: Contratto, Fattura, Foto danno..."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrizione (opzionale)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrizione del documento..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tag (opzionale, separati da virgola)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="contratto, 2025, importante..."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Drag & Drop Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 bg-white'
          }
        `}
      >
        <div className="space-y-3">
          <div className="text-6xl">📎</div>
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {isDragging ? 'Rilascia i file qui' : 'Trascina i file qui'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              oppure clicca per selezionare
            </p>
          </div>
          <div className="text-xs text-gray-500">
            <p>Formati supportati: JPG, PNG, PDF, Word, Excel</p>
            <p>Dimensione massima: 10 MB per file</p>
            <p>Massimo {maxFiles} file alla volta</p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-gray-900">
              File in Caricamento ({uploadingFiles.length})
            </h4>
            <button
              onClick={clearAll}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Cancella Tutto
            </button>
          </div>

          {uploadingFiles.map((uploadFile, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-2xl">
                    {uploadFile.status === 'success' ? '✅' :
                     uploadFile.status === 'error' ? '❌' :
                     uploadFile.status === 'uploading' ? '⏳' : '📎'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {uploadFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {storageService.formatFileSize(uploadFile.file.size)}
                    </p>
                  </div>
                </div>
                {uploadFile.status !== 'uploading' && (
                  <button
                    onClick={() => removeFile(index)}
                    className="text-gray-400 hover:text-gray-600 ml-2"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              {uploadFile.status === 'uploading' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadFile.progress}%` }}
                  />
                </div>
              )}

              {/* Error Message */}
              {uploadFile.status === 'error' && uploadFile.error && (
                <p className="text-xs text-red-600">
                  ❌ {uploadFile.error}
                </p>
              )}

              {/* Success Message */}
              {uploadFile.status === 'success' && (
                <p className="text-xs text-green-600">
                  ✅ Caricamento completato
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
