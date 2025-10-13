'use client';

import { useState } from 'react';

interface FieldMapping {
    original_header: string;
    mapped_field: string;
    confidence_score: number;
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

interface UploadResult {
    success: boolean;
    import_id: string;
    summary: UploadSummary;
    field_mappings: FieldMapping[];
    validation_summary: ValidationSummary;
    preview_contacts: Record<string, string>[];
}

export default function CSVTestPage() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<UploadResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('csvFile', file);
            formData.append('organizationId', '00000000-0000-0000-0000-000000000001');

            const response = await fetch(
                'https://qjtaqrlpronohgpfdxsi.supabase.co/functions/v1/parse-csv-upload',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0'
                    },
                    body: formData
                }
            );

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Upload failed');

            setResult(data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Upload failed';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto min-h-screen bg-gray-50">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h1 className="text-3xl font-bold mb-6 text-center">🚀 CSV Upload Test</h1>
                <p className="text-gray-600 text-center mb-8">
                    Test CSV upload from Vercel → Supabase → Database
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select CSV File
                        </label>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {file && (
                            <p className="mt-2 text-sm text-gray-500">
                                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                            </p>
                        )}
                    </div>

                    <button
                        onClick={handleUpload}
                        disabled={!file || loading}
                        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg disabled:bg-gray-400 font-semibold hover:bg-blue-700 transition-colors"
                    >
                        {loading ? '⏳ Uploading...' : '📤 Upload CSV'}
                    </button>
                </div>

                {error && (
                    <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-lg">
                        <h2 className="font-bold mb-2">❌ Error</h2>
                        <p>{error}</p>
                    </div>
                )}

                {result && (
                    <div className="mt-4 p-4 bg-green-100 rounded-lg">
                        <h2 className="font-bold text-green-800 mb-3">✅ Upload Successful!</h2>

                        {result.import_id && (
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="font-medium">Import ID:</span>{' '}
                                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                                        {result.import_id}
                                    </code>
                                </div>

                                {result.summary && (
                                    <>
                                        <div><span className="font-medium">Filename:</span> {result.summary.filename}</div>
                                        <div><span className="font-medium">Total Rows:</span> {result.summary.total_rows}</div>
                                        <div><span className="font-medium">Valid Rows:</span> {result.summary.valid_rows}</div>
                                        <div><span className="font-medium">Contacts Created:</span> {result.summary.contacts_created}</div>
                                        <div><span className="font-medium">Processing Time:</span> {result.summary.processing_time_ms}ms</div>
                                    </>
                                )}

                                {result.field_mappings && (
                                    <div>
                                        <span className="font-medium">Fields Detected:</span> {result.field_mappings.length}
                                        <div className="mt-2 space-y-1">
                                            {result.field_mappings.slice(0, 4).map((mapping: FieldMapping, index: number) => (
                                                <div key={index} className="text-xs">
                                                    {mapping.original_header} → {mapping.mapped_field} ({(mapping.confidence_score * 100).toFixed(0)}%)
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <details className="mt-4">
                            <summary className="cursor-pointer text-sm font-medium">📊 View Full Response</summary>
                            <pre className="mt-2 text-xs bg-white p-3 rounded border overflow-auto max-h-40">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </details>
                    </div>
                )}

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">📋 How to Test:</h3>
                    <ol className="text-sm text-blue-700 space-y-1">
                        <li>1. Create CSV with headers: Name,Email,Phone,Company</li>
                        <li>2. Add some sample data rows</li>
                        <li>3. Upload and verify success message appears</li>
                        <li>4. Copy the Import ID to confirm it worked</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}