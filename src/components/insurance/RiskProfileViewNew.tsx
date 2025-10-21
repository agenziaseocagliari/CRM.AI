import { useParams, useNavigate } from 'react-router-dom';

const COMPONENT_VERSION = 'v1.0-MINIMAL';

export default function RiskProfileViewNew() {
  console.log(`🎯 [NEW COMPONENT] RiskProfileViewNew loaded - ${COMPONENT_VERSION}`);
  
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();

  console.log('📍 [PARAMS] Profile ID:', profileId);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold text-green-600 mb-2">
              NEW Component Working!
            </h1>
            <p className="text-gray-600 text-lg">
              Version: {COMPONENT_VERSION}
            </p>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <p className="font-semibold text-blue-800">Profile ID:</p>
            <p className="text-blue-700 font-mono">{profileId}</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/dashboard/assicurazioni/valutazione-rischio')}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              ← Torna alla Lista Profili
            </button>
            <button
              onClick={() => navigate('/dashboard/assicurazioni')}
              className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold"
            >
              🏠 Dashboard Assicurazioni
            </button>
          </div>

          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-800">
              <strong>✅ Success:</strong> This is a brand new component built from scratch.
              If you see this, the minimal version works perfectly!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
