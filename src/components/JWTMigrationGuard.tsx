/**
 * JWT Token Migration Component
 * 
 * Questo componente verifica se il JWT dell'utente loggato contiene
 * i custom claims (user_role) e forza il re-login se necessario.
 */

import { ReactNode } from 'react';
import { useJWTMigration } from '../hooks/useJWTMigration';

interface JWTMigrationGuardProps {
  children: ReactNode;
}

export function JWTMigrationGuard({ children }: JWTMigrationGuardProps) {
  const { isMigrating } = useJWTMigration();

  if (isMigrating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
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
