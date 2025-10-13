'use client';

import { useState } from 'react';

export default function CSVUploadTest() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('csvFile', file);
      formData.append('organizationId', '00000000-0000-0000-0000-000000000001');

      // Call Supabase Edge Function
      const response = await fetch(
        'https://qjtaqrlpronohgpfdxsi.supabase.co/functions/v1/parse-csv-upload',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0'
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      setResult(data);
      console.log('✅ Upload successful:', data);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      console.error('❌ Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">🚀 CSV Upload Test</h2>
        <p className="text-gray-600 mb-6">
          Test CSV upload from Vercel → Supabase Edge Function → Database
        </p>

        {/* File Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select CSV File
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          {file && (
            <p className="mt-2 text-sm text-gray-500">
              Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className={`w-full py-2 px-4 rounded-md font-semibold text-white transition-colors
            ${loading || !file 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
            }`}
        >
          {loading ? 'Uploading...' : 'Upload CSV'}
        </button>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 font-semibold">❌ Error:</p>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Success Display */}
        {result && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800 font-semibold mb-2">✅ Upload Successful!</p>
            
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Import ID:</span>{' '}
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                  {result.import_id}
                </code>
              </div>
              
              {result.summary && (
                <>
                  <div>
                    <span className="font-medium">Filename:</span> {result.summary.filename}
                  </div>
                  <div>
                    <span className="font-medium">Total Rows:</span> {result.summary.total_rows}
                  </div>
                  <div>
                    <span className="font-medium">Valid Rows:</span> {result.summary.valid_rows}
                  </div>
                  <div>
                    <span className="font-medium">Invalid Rows:</span> {result.summary.invalid_rows}
                  </div>
                  <div>
                    <span className="font-medium">Contacts Created:</span> {result.summary.contacts_created}
                  </div>
                  <div>
                    <span className="font-medium">Processing Time:</span> {result.summary.processing_time_ms}ms
                  </div>
                </>
              )}
              
              {result.field_mappings && (
                <div>
                  <span className="font-medium">Fields Detected:</span> {result.field_mappings.length}
                </div>
              )}
              
              {/* Field Mappings Preview */}
              {result.field_mappings && (
                <div className="mt-4">
                  <p className="font-medium mb-2">Field Mappings:</p>
                  <div className="bg-white p-3 rounded border overflow-x-auto">
                    <div className="grid grid-cols-1 gap-2">
                      {result.field_mappings.map((mapping: any, index: number) => (
                        <div key={index} className="flex justify-between items-center text-xs">
                          <span className="font-medium">{mapping.original_header}</span>
                          <span className="text-gray-500">→</span>
                          <span className="text-blue-600">{mapping.mapped_field}</span>
                          <span className="text-gray-400">({(mapping.confidence_score * 100).toFixed(0)}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="font-semibold text-blue-800 mb-2">📋 Test Instructions:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>1. Select a CSV file with columns like: Name, Email, Phone, Company</li>
            <li>2. Click "Upload CSV" to test the complete flow</li>
            <li>3. Verify you see success message with Import ID</li>
            <li>4. Report results to confirm production functionality</li>
          </ul>
        </div>
      </div>
    </div>
  );
}