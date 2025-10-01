import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { diagnoseJWT, formatJWTDiagnostics, JWTDiagnostics } from '../lib/jwtUtils';
import toast from 'react-hot-toast';

interface JWTViewerProps {
  onClose?: () => void;
}

export const JWTViewer: React.FC<JWTViewerProps> = ({ onClose }) => {
  const [diagnostics, setDiagnostics] = useState<JWTDiagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRawToken, setShowRawToken] = useState(false);

  useEffect(() => {
    loadJWTData();
  }, []);

  const loadJWTData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const diag = diagnoseJWT(session.access_token);
        setDiagnostics(diag);
      } else {
        setDiagnostics({
          isValid: false,
          hasUserRole: false,
          claims: null,
          rawToken: '',
          errors: ['No active session found'],
          warnings: [],
        });
      }
    } catch (error) {
      console.error('Error loading JWT:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiato negli appunti!', { duration: 2000 });
  };

  const copyFullDiagnostics = () => {
    if (diagnostics) {
      const report = formatJWTDiagnostics(diagnostics);
      copyToClipboard(report);
    }
  };

  const handleDeepLogout = async () => {
    // Clear all local storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    toast.success('Logout completo effettuato. Ricaricare la pagina per continuare.', {
      duration: 5000,
    });
    
    // Reload page after a short delay
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl">
        <p className="text-center">Caricamento JWT...</p>
      </div>
    );
  }

  if (!diagnostics) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl">
        <p className="text-center text-red-600">Errore nel caricamento dei dati JWT</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">🔐 JWT Token Viewer</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        )}
      </div>

      {/* Current Role Display */}
      {diagnostics.claims?.user_role && (
        <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-600 mb-1">Ruolo Corrente</div>
              <div className="text-2xl font-bold text-indigo-900">
                {diagnostics.claims.user_role === 'super_admin' && '🔐 Super Admin'}
                {diagnostics.claims.user_role === 'admin' && '⚙️ Admin'}
                {diagnostics.claims.user_role === 'user' && '👤 Utente Standard'}
                {!['super_admin', 'admin', 'user'].includes(diagnostics.claims.user_role) && `📋 ${diagnostics.claims.user_role}`}
              </div>
              {diagnostics.claims.email && (
                <div className="text-sm text-gray-600 mt-1">
                  Account: <span className="font-mono">{diagnostics.claims.email}</span>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">Per cambiare ruolo:</div>
              <div className="text-xs text-gray-700">
                Logout → Login con account diverso
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className={`p-4 rounded-lg border-2 ${diagnostics.isValid ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
          <div className="text-sm font-semibold mb-1">Token Valido</div>
          <div className="text-2xl">{diagnostics.isValid ? '✅ Sì' : '❌ No'}</div>
        </div>
        
        <div className={`p-4 rounded-lg border-2 ${diagnostics.hasUserRole ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
          <div className="text-sm font-semibold mb-1">user_role Presente</div>
          <div className="text-2xl">{diagnostics.hasUserRole ? '✅ Sì' : '❌ No'}</div>
        </div>
      </div>

      {/* TOKEN DEFECT Warning */}
      {!diagnostics.hasUserRole && diagnostics.isValid && (
        <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-500 rounded-lg">
          <h3 className="text-xl font-bold text-yellow-800 mb-2">⚠️ TOKEN DEFECT RILEVATO</h3>
          <p className="text-yellow-900 mb-3">
            Il tuo JWT non contiene il claim <code className="bg-yellow-200 px-2 py-1 rounded">user_role</code>.
            Questo significa che il token è stato generato prima della configurazione del custom_access_token_hook.
          </p>
          <div className="bg-white p-3 rounded border border-yellow-300 mb-3">
            <h4 className="font-semibold mb-2">📝 Azioni Consigliate:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Effettua un <strong>logout profondo</strong> (pulsante sotto)</li>
              <li>Pulizia completa di storage e cookie (già inclusa nel logout profondo)</li>
              <li>Effettua nuovamente il login <strong>SOLO tramite form email + password</strong></li>
              <li>Non usare magic link o reset password fino a risoluzione</li>
            </ol>
          </div>
          <button
            onClick={handleDeepLogout}
            className="w-full bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600"
          >
            🔄 Esegui Logout Profondo e Pulizia
          </button>
        </div>
      )}

      {/* Backend Update Warning */}
      <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-500 rounded-lg">
        <h3 className="text-lg font-bold text-blue-800 mb-2">ℹ️ Importante: Aggiornamenti Backend</h3>
        <p className="text-blue-900 text-sm">
          Dopo ogni aggiornamento backend o delle policy di autenticazione, è <strong>indispensabile rigenerare il JWT</strong>.
          Per farlo, effettua logout e login nuovamente.
        </p>
      </div>

      {/* Errors */}
      {diagnostics.errors.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
          <h3 className="font-bold text-red-800 mb-2">🚨 Errori</h3>
          <ul className="list-disc list-inside space-y-1">
            {diagnostics.errors.map((error, idx) => (
              <li key={idx} className="text-red-700 text-sm">{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {diagnostics.warnings.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
          <h3 className="font-bold text-yellow-800 mb-2">⚠️ Avvisi</h3>
          <ul className="list-disc list-inside space-y-1">
            {diagnostics.warnings.map((warning, idx) => (
              <li key={idx} className="text-yellow-700 text-sm">{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Claims Display */}
      {diagnostics.claims && (
        <div className="mb-4">
          <h3 className="font-bold mb-2">📋 JWT Claims</h3>
          <div className="bg-gray-50 p-4 rounded border border-gray-300 font-mono text-sm overflow-x-auto">
            <table className="w-full">
              <tbody>
                {Object.entries(diagnostics.claims).map(([key, value]) => (
                  <tr key={key} className="border-b border-gray-200">
                    <td className="py-2 pr-4 font-semibold text-gray-700">{key}:</td>
                    <td className="py-2">
                      {key === 'user_role' ? (
                        <span className={`px-2 py-1 rounded ${diagnostics.hasUserRole ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                          {JSON.stringify(value)}
                        </span>
                      ) : (
                        <span className="text-gray-900">{JSON.stringify(value)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Raw Token */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold">🔑 Token Raw</h3>
          <button
            onClick={() => setShowRawToken(!showRawToken)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showRawToken ? 'Nascondi' : 'Mostra'}
          </button>
        </div>
        {showRawToken && (
          <div className="bg-gray-50 p-4 rounded border border-gray-300 font-mono text-xs break-all">
            {diagnostics.rawToken}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={copyFullDiagnostics}
          className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          📋 Copia Report Completo
        </button>
        <button
          onClick={loadJWTData}
          className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
        >
          🔄 Ricarica
        </button>
      </div>
    </div>
  );
};
