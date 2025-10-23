// =====================================================
// FILE UPLOAD SECTION COMPONENT
// =====================================================

import { Upload, X } from 'lucide-react';
import React from 'react';

interface FileUploadSectionProps {
  selectedFiles: File[];
  onFilesChange: (files: File[]) => void;
  onUpload: () => void;
  uploading: boolean;
}

export function FileUploadSection({ 
  selectedFiles, 
  onFilesChange, 
  onUpload, 
  uploading 
}: FileUploadSectionProps) {
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onFilesChange([...selectedFiles, ...files]);
  };

  const removeFile = (index: number) => {
    onFilesChange(selectedFiles.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Formati supportati:</strong> PDF, DOC, DOCX, PPT, PPTX, TXT<br />
          <strong>Dimensione massima:</strong> 10 MB per file
        </p>
      </div>

      {/* File Input */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors">
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            Clicca per selezionare i file
          </p>
          <p className="text-sm text-gray-500">
            o trascina qui i tuoi documenti
          </p>
        </label>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-gray-900">File selezionati:</h3>
          {selectedFiles.map((file, index) => (
            <div 
              key={index}
              className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
            >
              <div className="flex items-center space-x-3">
                <Upload className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={onUpload}
        disabled={selectedFiles.length === 0 || uploading}
        className={`
          w-full py-3 px-6 rounded-lg font-medium text-white
          ${selectedFiles.length === 0 || uploading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700'
          }
        `}
      >
        {uploading ? 'Caricamento in corso...' : `Carica ${selectedFiles.length} file`}
      </button>
    </div>
  );
}

// =====================================================
// URL INPUT SECTION COMPONENT
// =====================================================

import { Facebook, Globe, Linkedin, LinkIcon } from 'lucide-react';

interface URLInputSectionProps {
  urlInput: string;
  urlType: 'website' | 'facebook' | 'linkedin';
  onUrlChange: (url: string) => void;
  onTypeChange: (type: 'website' | 'facebook' | 'linkedin') => void;
  onSubmit: () => void;
  uploading: boolean;
}

export function URLInputSection({
  urlInput,
  urlType,
  onUrlChange,
  onTypeChange,
  onSubmit,
  uploading
}: URLInputSectionProps) {
  
  const urlTypes = [
    { id: 'website', label: 'Sito Web', icon: <Globe className="w-4 h-4" />, placeholder: 'https://www.tuaagenzia.it' },
    { id: 'facebook', label: 'Facebook', icon: <Facebook className="w-4 h-4" />, placeholder: 'https://www.facebook.com/tuaagenzia' },
    { id: 'linkedin', label: 'LinkedIn', icon: <Linkedin className="w-4 h-4" />, placeholder: 'https://www.linkedin.com/company/tuaagenzia' },
  ];

  return (
    <div className="space-y-4">
      {/* Info Box */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-900">
          Aggiungi URL dei tuoi canali online. Il sistema scaricherà automaticamente 
          il contenuto per creare il profilo aziendale.
        </p>
      </div>

      {/* URL Type Selector */}
      <div className="flex space-x-2">
        {urlTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => onTypeChange(type.id as 'website' | 'facebook' | 'linkedin')}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium
              ${urlType === type.id
                ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500'
                : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
              }
            `}
          >
            {type.icon}
            <span>{type.label}</span>
          </button>
        ))}
      </div>

      {/* URL Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          URL {urlTypes.find(t => t.id === urlType)?.label}
        </label>
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <LinkIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="url"
              value={urlInput}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder={urlTypes.find(t => t.id === urlType)?.placeholder}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={onSubmit}
        disabled={!urlInput.trim() || uploading}
        className={`
          w-full py-3 px-6 rounded-lg font-medium text-white
          ${!urlInput.trim() || uploading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700'
          }
        `}
      >
        {uploading ? 'Aggiunta in corso...' : 'Aggiungi URL'}
      </button>
    </div>
  );
}

// =====================================================
// TEXT INPUT SECTION COMPONENT
// =====================================================

interface TextInputSectionProps {
  title: string;
  text: string;
  onTitleChange: (title: string) => void;
  onTextChange: (text: string) => void;
  onSubmit: () => void;
  uploading: boolean;
}

export function TextInputSection({
  title,
  text,
  onTitleChange,
  onTextChange,
  onSubmit,
  uploading
}: TextInputSectionProps) {
  
  const examples = [
    'Valori aziendali e mission',
    'Specializzazioni e prodotti offerti',
    'Storia dell\'agenzia',
    'Differenziatori competitivi',
    'Target clienti ideali',
  ];

  return (
    <div className="space-y-4">
      {/* Info Box */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <p className="text-sm text-purple-900 mb-2">
          <strong>Esempi di informazioni utili:</strong>
        </p>
        <ul className="text-sm text-purple-800 list-disc list-inside space-y-1">
          {examples.map((example, index) => (
            <li key={index}>{example}</li>
          ))}
        </ul>
      </div>

      {/* Title Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Titolo
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="es. Valori Aziendali"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Text Area */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contenuto
        </label>
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          rows={10}
          placeholder="Inserisci informazioni sulla tua agenzia..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
        />
        <p className="text-sm text-gray-500 mt-2">
          {text.length} caratteri
        </p>
      </div>

      {/* Submit Button */}
      <button
        onClick={onSubmit}
        disabled={!title.trim() || !text.trim() || uploading}
        className={`
          w-full py-3 px-6 rounded-lg font-medium text-white
          ${!title.trim() || !text.trim() || uploading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700'
          }
        `}
      >
        {uploading ? 'Salvataggio in corso...' : 'Salva Testo'}
      </button>
    </div>
  );
}
