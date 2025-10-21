import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

const COMPONENT_VERSION = 'v2.0-WITH-DATA';

export default function RiskProfileViewNew() {
  console.log(`🎯 [NEW COMPONENT] RiskProfileViewNew loaded - ${COMPONENT_VERSION}`);
  
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('📍 [PARAMS] Profile ID:', profileId);

  useEffect(() => {
    async function fetchProfile() {
      try {
        console.log('📡 [FETCH] Starting fetch for profile:', profileId);
        
        const { data, error: fetchError } = await supabase
          .from('insurance_risk_profiles')
          .select(`
            *,
            contact:contacts!contact_id(name, email)
          `)
          .eq('id', profileId)
          .single();
        
        console.log('📡 [FETCH] Result:', { 
          success: !fetchError, 
          hasData: !!data,
          error: fetchError,
          dataKeys: data ? Object.keys(data) : []
        });
        
        if (fetchError) {
          console.error('❌ [FETCH ERROR] Supabase error:', fetchError);
          throw fetchError;
        }
        
        if (!data) {
          throw new Error('Profile not found');
        }
        
        console.log('✅ [FETCH SUCCESS] Profile loaded:', data.contact?.name);
        setProfile(data);
      } catch (err: any) {
        console.error('❌ [FETCH ERROR] Exception:', err);
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
        console.log('📡 [FETCH] Complete');
      }
    }
    
    if (profileId) {
      fetchProfile();
    } else {
      setError('No profile ID provided');
      setLoading(false);
    }
  }, [profileId]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-xl text-gray-700">⏳ Loading profile data...</p>
            <p className="text-sm text-gray-500 mt-2">Version: {COMPONENT_VERSION}</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Profile</h2>
              <p className="text-gray-700">{error}</p>
            </div>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => navigate('/dashboard/assicurazioni/valutazione-rischio')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                ← Torna alla Lista Profili
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold"
              >
                🔄 Riprova
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Profile Not Found</h2>
            <button
              onClick={() => navigate('/dashboard/assicurazioni/valutazione-rischio')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              ← Torna alla Lista Profili
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success - Display data (no chart yet)
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Success Banner */}
        <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="text-4xl">✅</div>
            <div>
              <p className="text-green-800 font-bold text-lg">Step 2: Data Fetch Successful!</p>
              <p className="text-green-700 text-sm">Version: {COMPONENT_VERSION}</p>
            </div>
          </div>
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Risk Profile: {profile.contact?.name || 'N/A'}
          </h1>
          <p className="text-gray-600">
            {profile.profession || 'Profession N/A'} • {profile.age || 'N/A'} anni
          </p>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>👤</span> Contact Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded">
              <p className="text-sm text-blue-600 font-semibold mb-1">Name</p>
              <p className="text-gray-900 font-medium">{profile.contact?.name || 'N/A'}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded">
              <p className="text-sm text-blue-600 font-semibold mb-1">Email</p>
              <p className="text-gray-900 font-medium">{profile.contact?.email || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Risk Scores */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📊</span> Risk Scores
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-red-50 p-4 rounded text-center">
              <p className="text-sm text-red-600 font-semibold mb-1">Health</p>
              <p className="text-3xl font-bold text-gray-900">{profile.health_score ?? 'N/A'}</p>
            </div>
            <div className="bg-green-50 p-4 rounded text-center">
              <p className="text-sm text-green-600 font-semibold mb-1">Financial</p>
              <p className="text-3xl font-bold text-gray-900">{profile.financial_score ?? 'N/A'}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded text-center">
              <p className="text-sm text-purple-600 font-semibold mb-1">Lifestyle</p>
              <p className="text-3xl font-bold text-gray-900">{profile.lifestyle_score ?? 'N/A'}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded text-center">
              <p className="text-sm text-blue-600 font-semibold mb-1">Total Risk</p>
              <p className="text-3xl font-bold text-gray-900">{profile.total_risk_score ?? 'N/A'}</p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <p className="text-sm text-gray-600 font-semibold mb-1">Risk Category</p>
            <p className="text-xl font-bold text-gray-900 uppercase">{profile.risk_category || 'N/A'}</p>
          </div>
        </div>

        {/* Raw Data (for debugging) */}
        <details className="bg-white rounded-lg shadow-lg p-6">
          <summary className="cursor-pointer font-bold text-gray-900 hover:text-blue-600 transition">
            🔍 Raw Data (JSON) - Click to Expand
          </summary>
          <pre className="mt-4 p-4 bg-gray-900 text-green-400 rounded text-xs overflow-auto max-h-96">
            {JSON.stringify(profile, null, 2)}
          </pre>
        </details>

        {/* Navigation */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/dashboard/assicurazioni/valutazione-rischio')}
            className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold"
          >
            ← Torna alla Lista Profili
          </button>
          <button
            onClick={() => navigate('/dashboard/assicurazioni')}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            🏠 Dashboard Assicurazioni
          </button>
        </div>
      </div>
    </div>
  );
}
