/**
 * JWT Token Migration Component
 * 
 * Questo componente verifica se il JWT dell'utente loggato contiene
 * i custom claims (user_role) e forza il re-login se necessario.
 * 
 * Inserire questo codice in AuthContext.tsx o in un componente
 * che viene caricato all'avvio dell'applicazione.
 */

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { diagnoseJWT } from '../lib/jwtUtils';
import { supabase } from '../lib/supabaseClient';

export function useJWTMigration() {
  const navigate = useNavigate();
  const [isMigrating, setIsMigrating] = useState(false);

  useEffect(() => {
    const checkAndMigrateJWT = async () => {
      try {
        // Ottieni sessione corrente
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          // Nessuna sessione attiva, niente da migrare
          return;
        }

        // Diagnostica JWT
        const diagnostics = diagnoseJWT(session.access_token);

        if (!diagnostics.hasUserRole) {
          console.warn('🔄 [JWT Migration] Token obsoleto rilevato - user_role mancante');
          console.warn('🔄 [JWT Migration] Forzando logout e re-login...');

          setIsMigrating(true);

          // Mostra toast informativo
          toast.loading(
            'Il tuo token di autenticazione deve essere aggiornato. Rieffettua il login...',
            { duration: 4000, id: 'jwt-migration' }
          );

          // Attendi 2 secondi per far vedere il messaggio
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Forza logout
          await supabase.auth.signOut();

          // Pulisci localStorage
          localStorage.removeItem('organization_id');

          // Redirect a login con messaggio
          toast.success(
            'Per favore, effettua nuovamente il login per completare l\'aggiornamento.',
            { id: 'jwt-migration' }
          );

          navigate('/login', {
            state: {
              message: 'Il sistema è stato aggiornato. Per favore, effettua nuovamente il login.',
              reason: 'jwt_migration'
            }
          });

        } else {
          console.log('✅ [JWT Migration] Token valido con user_role:', diagnostics.claims?.user_role);
        }

      } catch (error) {
        console.error('❌ [JWT Migration] Errore durante la migrazione JWT:', error);
        // Non bloccare l'app in caso di errore
      } finally {
        setIsMigrating(false);
      }
    };

    // Esegui check al mount
    checkAndMigrateJWT();

    // Opzionale: ri-esegui check ogni 60 secondi
    const interval = setInterval(checkAndMigrateJWT, 60000);

    return () => clearInterval(interval);
  }, [navigate]);

  return { isMigrating };
}

// ====================================================================
// INTEGRAZIONE IN AuthContext.tsx
// ====================================================================
// Aggiungi questo codice nel componente AuthProvider:
//
// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const { isMigrating } = useJWTMigration();
//   
//   // ... resto del codice
//   
//   if (isMigrating) {
//     return <div>Aggiornamento autenticazione in corso...</div>;
//   }
//   
//   return (
//     <AuthContext.Provider value={{ ... }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }
// ====================================================================

// ====================================================================
// ALTERNATIVA: Componente Standalone
// ====================================================================
// Se preferisci un componente separato, crea questo file:
// src/components/JWTMigrationGuard.tsx

export function JWTMigrationGuard({ children }: { children: React.ReactNode }) {
  const { isMigrating } = useJWTMigration();

  if (isMigrating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Aggiornamento in corso...
          </h2>
          <p className="text-gray-600">
            Stiamo aggiornando le tue credenziali di accesso.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Poi in App.tsx o index.tsx:
// <JWTMigrationGuard>
//   <App />
// </JWTMigrationGuard>
// ====================================================================
