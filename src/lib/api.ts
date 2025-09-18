import React from 'react'
import { toast } from 'react-hot-toast'
import { supabase } from './supabaseClient'

/**
 * Displays a detailed authentication error toast with an option to copy diagnostic data.
 * @param toastId A unique ID for the toast.
 * @param diagnosticData A string containing diagnostic information.
 */
const handleAuthErrorToast = (toastId?: string, diagnosticData?: string) => {
  const options = { id: toastId, duration: 15000 };
  toast.error(
    t =>
      React.createElement(
        'div',
        { className: 'text-center flex flex-col items-center' },
        React.createElement('span', { className: 'font-semibold' }, "La tua sessione o la connessione sono scadute."),
        React.createElement(
          'a',
          {
            href: '/settings',
            onClick: () => toast.dismiss(t.id),
            className: 'block mt-2 font-bold underline text-indigo-600 hover:text-indigo-500'
          },
          "Verifica nelle Impostazioni"
        ),
        diagnosticData && React.createElement(
            'button',
            { 
                onClick: () => {
                    navigator.clipboard.writeText(diagnosticData);
                    toast.success('Dettagli errore copiati negli appunti!', { id: 'copy-toast', duration: 3000 });
                },
                className: 'block mt-3 w-full text-xs bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-300'
            },
            "Copia Dettagli per Supporto"
        )
      ),
    options
  )
}

/**
 * Helper centralizzato per chiamare le Supabase Edge Function con autenticazione solida,
 * logica di retry e diagnostica avanzata.
 * Invocare sempre questa funzione e MAI fetch nativo o wrapper non documentati.
 */
export async function invokeSupabaseFunction(functionName: string, payload: object = {}, isRetry: boolean = false) {
  console.log(`[API Helper] Invocazione di '${functionName}'...`, { isRetry, payload });

  // Pre-flight check: Assicurati che l'utente sia loggato prima di procedere.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("[API Helper] Pre-flight check fallito: Utente non autenticato.");
    handleAuthErrorToast('unauthenticated-user-toast');
    throw new Error("Utente non autenticato. Effettua nuovamente il login per continuare.");
  }
  console.log(`[API Helper] Pre-flight check superato per l'utente: ${user.id}`);


  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Le variabili d'ambiente VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY non sono configurate.")
  }

  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw new Error(`Errore nel recupero della sessione: ${sessionError.message}`)

  if (!session) {
    handleAuthErrorToast('no-session-toast')
    throw new Error("Sessione utente non trovata. Effettua nuovamente il login.")
  }

  const functionUrl = `${supabaseUrl}/functions/v1/${functionName}`
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    'apikey': supabaseAnonKey
  }
  
  console.log(`[API Helper] Headers per '${functionName}':`, {
        'Content-Type': headers['Content-Type'],
        'Authorization': headers['Authorization'] ? 'Bearer [REDACTED]' : 'N/A',
        'apikey': headers['apikey'] ? '[REDACTED]' : 'N/A',
    });
    
  // (QA ONLY) Fallback per organization_id nel body se in modalità debug
  let finalPayload = { ...payload };
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('debug_mode') === 'true') {
      const debugOrgId = urlParams.get('debug_org_id');
      if (debugOrgId) {
          (finalPayload as any).organization_id = debugOrgId;
          console.warn(`[API Helper] MODO DEBUG ATTIVO: Aggiunto organization_id=${debugOrgId} al payload per '${functionName}'.`);
          // FIX: Replaced JSX with React.createElement to resolve parsing errors in a .ts file.
          // This ensures the code is valid TypeScript and avoids cascading scope-related errors.
          toast.custom((t) => (
              React.createElement('div', { className: `${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-yellow-100 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4`},
                React.createElement('div', { className: 'flex-1 w-0' },
                    React.createElement('p', { className: 'text-sm font-medium text-yellow-800' }, 'Modalità Debug Attiva'),
                    React.createElement('p', { className: 'mt-1 text-sm text-yellow-700' }, '`organization_id` è stato forzato nel payload.')
                )
              )
          ), { id: 'debug-org-id-toast' });
      }
  }


  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(finalPayload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorJson: any = null;
        let diagnosticDataForToast: string | undefined = undefined;

        // Logga la risposta di errore completa in modo strutturato.
        try {
            errorJson = JSON.parse(errorText);
            console.error(`[API Helper] Errore da '${functionName}' (${response.status}). Risposta completa:`);
            // Usiamo console.dir per un output navigabile nell'inspector del browser.
            console.dir(errorJson);
        } catch (e) {
            console.error(`[API Helper] Errore non-JSON da '${functionName}' (${response.status}):`, errorText);
        }
        
        // Prepara i dati diagnostici da mostrare all'utente, dando priorità al campo 'diagnostic' del backend.
        if (errorJson) {
            if (errorJson.diagnostic) {
                diagnosticDataForToast = JSON.stringify(errorJson.diagnostic, null, 2);
            } else {
                diagnosticDataForToast = JSON.stringify(errorJson, null, 2);
            }
        } else {
            diagnosticDataForToast = errorText;
        }

        const isAuthError = response.status === 401 || response.status === 403 || (errorText && (errorText.includes("MISSING_ORGANIZATION_ID") || errorText.includes("organization_id is required") || errorText.includes("non autenticato")));

        if (isAuthError && !isRetry) {
            console.warn(`[API Helper] Errore di autenticazione (${response.status}) su '${functionName}'. Tento un nuovo tentativo automatico...`);
            return invokeSupabaseFunction(functionName, payload, true); // Esegui il retry
        }
        
        if (isAuthError || functionName.includes('calendar')) {
             handleAuthErrorToast('final-error-toast', diagnosticDataForToast);
        }

        throw new Error(errorJson?.error || errorJson?.message || `Errore del server (${response.status}): ${errorText}`);
    }

    const responseData = await response.json();
    console.log(`[API Helper] Risposta OK da '${functionName}'.`);
    
    if (responseData && responseData.error) {
        const errorMessage = responseData.error.toString().toLowerCase();
        if (
            errorMessage.includes("authenticate") ||
            errorMessage.includes("token") ||
            errorMessage.includes("non autenticato") ||
            errorMessage.includes("accesso negato")
        ) {
            const diagnosticData = JSON.stringify(responseData.diagnostic || responseData, null, 2);
            handleAuthErrorToast('logic-auth-error-toast', diagnosticData);
        }
        throw new Error(responseData.error);
    }
    
    return responseData;

  } catch(error) {
      console.error(`[API Helper] Errore di rete o imprevisto durante la chiamata a '${functionName}':`, error);
      throw error; // Rilancia l'errore per essere gestito dal componente chiamante
  }
}
