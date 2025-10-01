import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { SuperAdminSidebar } from './SuperAdminSidebar';
import { SuperAdminHeader } from './SuperAdminHeader';
import { supabase } from '../../lib/supabaseClient';
import { diagnoseJWT } from '../../lib/jwtUtils';
import toast from 'react-hot-toast';

export const SuperAdminLayout: React.FC = () => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkAuthorization = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const diagnostics = diagnoseJWT(session.access_token);
        const role = diagnostics.claims?.user_role;
        setCurrentRole(role || null);
        
        if (role === 'super_admin') {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
          toast.error(
            (t) => (
              <div className="space-y-2">
                <p className="font-semibold">🚫 Accesso Negato</p>
                <p className="text-sm">
                  Il tuo ruolo attuale è: <strong>{role || 'non definito'}</strong>
                </p>
                <p className="text-xs text-gray-600">
                  Per accedere alla dashboard Super Admin devi:
                </p>
                <ol className="text-xs text-gray-600 list-decimal list-inside">
                  <li>Effettuare logout completo</li>
                  <li>Effettuare login con account Super Admin</li>
                </ol>
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    navigate('/dashboard');
                  }}
                  className="mt-2 text-xs bg-primary text-white px-3 py-1 rounded hover:bg-indigo-700"
                >
                  Vai alla Dashboard
                </button>
              </div>
            ),
            { duration: 10000 }
          );
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        }
      } else {
        setIsAuthorized(false);
        navigate('/login');
      }
    };
    
    checkAuthorization();
  }, [navigate]);
  
  if (isAuthorized === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Verifica autorizzazioni...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-lg">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Accesso Negato</h2>
            <p className="text-gray-600 mb-4">
              Il tuo ruolo attuale (<strong>{currentRole || 'non definito'}</strong>) non ha accesso a questa sezione.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left mb-4">
              <p className="text-sm font-semibold text-yellow-800 mb-2">📋 Come accedere:</p>
              <ol className="text-xs text-yellow-700 list-decimal list-inside space-y-1">
                <li>Effettua logout completo dall'account corrente</li>
                <li>Nella schermata di login, seleziona "Super Admin"</li>
                <li>Accedi con le credenziali di amministratore</li>
              </ol>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-primary text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              Torna alla Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-background text-text-primary dark:bg-dark-background dark:text-dark-text-primary">
      <SuperAdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <SuperAdminHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};