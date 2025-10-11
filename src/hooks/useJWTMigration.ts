/**
 * JWT Token Migration Hook
 * 
 * Hook per verificare e migrare JWT token con custom claims.
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

        // Diagnosi del JWT
        const diagnosis = diagnoseJWT(session.access_token);

        // Se non è valido, forza re-login
        if (!diagnosis.isValid) {
          console.warn('⚠️ JWT Migration Required:', {
            isValid: diagnosis.isValid,
            reason: diagnosis.errors.join(', ')
          });

          setIsMigrating(true);

          // Effettua logout
          await supabase.auth.signOut();

          // Notifica utente
          toast.error('Sessione scaduta. Effettua nuovamente il login.');

          // Redirect a login
          navigate('/login');
        }
      } catch (error) {
        console.error('❌ JWT Migration Error:', error);
      }
    };

    checkAndMigrateJWT();
  }, [navigate]);

  return { isMigrating };
}
