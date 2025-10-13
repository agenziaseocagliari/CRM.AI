import CSVUploadTest from '@/components/contacts/CSVUploadTest';

export default function TestCSVPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 CSV Upload Production Test
          </h1>
          <p className="text-gray-600">
            Verify complete flow: Frontend → Supabase Edge Function → Database
          </p>
        </div>
        
        <CSVUploadTest />
        
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">🎯 What This Tests:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium text-green-600">✅ Frontend</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• File upload component</li>
                <li>• FormData creation</li>
                <li>• API call handling</li>
                <li>• Response display</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-blue-600">✅ Backend</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Supabase Edge Function</li>
                <li>• CSV parsing engine</li>
                <li>• Field auto-detection</li>
                <li>• Database integration</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}