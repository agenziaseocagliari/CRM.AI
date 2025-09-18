import React from 'react'
import { toast } from 'react-hot-toast'
import { supabase } from './supabaseClient'

/**
 * Creates a detailed diagnostic string for debugging purposes.
 * @param functionName The name of the Edge Function.
 * @param payload The request payload.
 * @param headers The request headers.
 * @param response The fetch Response object.
 * @param errorText The error text from the response body.
 * @returns A formatted JSON string with diagnostic data.
 */
const createDiagnosticData = (functionName: string, payload: object, headers: HeadersInit, response: Response, errorText: string) => {
    const diagnostic = {
        timestamp: new Date().toISOString(),
        functionName,
        request: {
            url: response.url,
            payload,
            headers: {
                'Content-Type': (headers as Record<string, string>)['Content-Type'],
                // Sanitize sensitive headers for logging
                'Authorization': (headers as Record<string, string>)['Authorization'] ? 'Bearer [REDACTED]' : undefined,
                'apikey': (headers as Record<string, string>)['apikey'] ? '[REDACTED]' : undefined,
            }
        },
        response: {
            status: response.status,
            statusText: response.statusText,
            body: errorText,
        },
    };
    return JSON.stringify(diagnostic, null, 2);
};


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
        React.createElement('span', null, "La tua sessione o la connessione sono scadute."),
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
        const isAuthError = response.status === 401 || response.status === 403 || (errorText && (errorText.includes("MISSING_ORGANIZATION_ID") || errorText.includes("organization_id is required")));

        if (isAuthError && !isRetry) {
            console.warn(`[API Helper] Errore di autenticazione (${response.status}) su '${functionName}'. Tento un nuovo tentativo automatico...`);
            return invokeSupabaseFunction(functionName, payload, true); // Esegui il retry
        }
        
        // Se il retry fallisce o non è un errore di auth, procedi con l'errore finale.
        const diagnosticData = createDiagnosticData(functionName, finalPayload, headers, response, errorText);
        console.error(`[API Helper] Errore HTTP da '${functionName}' (${response.status}). Diagnostica:`, diagnosticData);

        if (isAuthError) {
             handleAuthErrorToast('final-auth-error-toast', diagnosticData);
        }

        try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.error || errorJson.message || `Errore del server (${response.status})`);
        } catch (e) {
            throw new Error(`Errore del server (${response.status}): ${errorText}`);
        }
    }

    const responseData = await response.json();
    console.log(`[API Helper] Risposta OK da '${functionName}'.`);
    
    // Controlla anche le risposte 200 OK che potrebbero contenere errori logici di autenticazione
    if (responseData && responseData.error) {
        const errorMessage = responseData.error.toString().toLowerCase();
        if (
        errorMessage.includes("authenticate") ||
        errorMessage.includes("token") ||
        errorMessage.includes("non autenticato") ||
        errorMessage.includes("accesso negato")
        ) {
            const diagnosticData = createDiagnosticData(functionName, finalPayload, headers, response, JSON.stringify(responseData));
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
