import React from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from './supabaseClient';

/**
 * Retrieves the current organization ID from localStorage.
 * This is populated by the useCrmData hook after the user logs in.
 * @returns {string | null} The organization ID or null if not found.
 */
function getOrganizationIdFromStorage(): string | null {
    return localStorage.getItem('organization_id');
}

/**
 * Displays a detailed and actionable error toast.
 * @param message The main error message to display to the user.
 * @param diagnosticData The detailed diagnostic data to be copied.
 */
function showErrorToast(message: string, diagnosticData?: object | string) {
    const diagnosticString = diagnosticData 
        ? typeof diagnosticData === 'string' ? diagnosticData : JSON.stringify(diagnosticData, null, 2)
        : 'Nessun dato diagnostico disponibile.';
        
    toast.error(
        (t) => (
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', maxWidth: '400px' } },
                React.createElement('p', { className: 'font-semibold text-center' }, message),
                React.createElement('div', { className: "flex items-center space-x-2 mt-2" },
                    React.createElement('button', {
                        onClick: () => {
                            navigator.clipboard.writeText(diagnosticString);
                            toast.success('Diagnostica copiata!', { id: 'copy-toast', duration: 2000 });
                        },
                        className: 'bg-gray-200 text-gray-800 px-3 py-1 rounded-md text-sm hover:bg-gray-300'
                    }, 'Copia Diagnosi'),
                    React.createElement('button', {
                        onClick: () => toast.dismiss(t.id),
                        className: 'bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600'
                    }, 'Chiudi')
                )
            )
        ),
        { duration: 15000, id: `error-toast-${Date.now()}` }
    );
}

/**
 * Centralized helper to invoke Supabase Edge Functions with robust authentication,
 * retry logic, and advanced diagnostics.
 * @param functionName The name of the Edge Function to invoke.
 * @param payload The JSON payload to send to the function.
 * @param isRetry A flag to prevent infinite retry loops.
 * @returns {Promise<any>} A promise that resolves with the function's response data.
 */
export async function invokeSupabaseFunction(functionName: string, payload: object = {}, isRetry: boolean = false): Promise<any> {
    console.log(`[API Helper] Invoking '${functionName}'...`, { isRetry });

    // 1. Pre-flight security check: Ensure a user is logged in.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        const errorMsg = "Utente non autenticato. Effettua nuovamente il login per continuare.";
        console.error("[API Helper] Pre-flight check failed: User not authenticated.");
        showErrorToast(errorMsg);
        throw new Error(errorMsg);
    }

    // 2. Prepare payload with organization_id.
    const finalPayload: any = { ...payload };
    
    // QA Debug Mode: Allow overriding organization_id via URL parameters.
    const urlParams = new URLSearchParams(window.location.search);
    const isDebugMode = urlParams.get('debug_mode') === 'true';
    const debugOrgId = urlParams.get('debug_org_id');

    if (isDebugMode && debugOrgId) {
        finalPayload.organization_id = debugOrgId;
        console.warn(`[API Helper] DEBUG MODE: Overriding organization_id with '${debugOrgId}' for function '${functionName}'.`);
        toast.custom((t) => (
            React.createElement('div', { className: `${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-yellow-100 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4`},
              React.createElement('div', { className: 'flex-1 w-0' },
                  React.createElement('p', { className: 'text-sm font-medium text-yellow-800' }, 'Modalità Debug Attiva'),
                  React.createElement('p', { className: 'mt-1 text-sm text-yellow-700' }, '`organization_id` è stato forzato nel payload.')
              )
            )
        ), { id: 'debug-mode-toast' });
    } else if (!finalPayload.organization_id) { // Only add if not already present
        const orgId = getOrganizationIdFromStorage();
        if (!orgId) {
            const errorMsg = 'ID Organizzazione non impostato. Impossibile completare la richiesta. Ricarica la pagina o effettua nuovamente il login.';
            console.error(`[API Helper] CRITICAL: organization_id is missing for function '${functionName}'.`, { payload });
            showErrorToast(errorMsg);
            throw new Error(errorMsg);
        }
        finalPayload.organization_id = orgId;
    }
    
    // 3. Get session and prepare headers.
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
        showErrorToast('Sessione utente non trovata o scaduta.');
        throw new Error(sessionError?.message || 'Invalid session.');
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) throw new Error("Supabase URL or Anon Key not configured.");
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': supabaseAnonKey
    };
    
    // 4. Fetch logic with try/catch.
    try {
        const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(finalPayload),
        });

        // 5. Advanced response handling.
        if (!response.ok) {
            const errorText = await response.text();
            let errorJson: any = null;
            try { errorJson = JSON.parse(errorText); } catch (e) { /* ignore if not JSON */ }
            
            console.error(`[API Helper] Error from '${functionName}' (${response.status}). Full response:`);
            console.dir(errorJson || errorText);

            const isAuthError = response.status === 401 || response.status === 403 || (errorText && errorText.includes("organization_id"));
            
            // 6. Automatic Retry Logic.
            if (isAuthError && !isRetry) {
                console.warn(`[API Helper] Auth error on '${functionName}'. Attempting session refresh and one retry...`);
                await supabase.auth.refreshSession();
                return invokeSupabaseFunction(functionName, payload, true); // Recursive call for retry
            }
            
            // If retry fails or it's not an auth error, show toast and throw.
            const userMessage = errorJson?.error || `Errore del server (${response.status})`;
            showErrorToast(userMessage, errorJson?.diagnostic || errorJson || errorText);
            throw new Error(userMessage);
        }
        
        const data = await response.json();
        console.log(`[API Helper] OK response from '${functionName}'. Full response:`);
        console.dir(data); // Log success response as requested.

        // Handle cases where the backend returns 200 OK but with an error payload.
        if (data.error) {
            console.warn(`[API Helper] Function '${functionName}' returned 200 OK but with an error payload.`);
            showErrorToast(data.error, data.diagnostic || data);
            throw new Error(data.error);
        }

        return data;

    } catch (error) {
        console.error(`[API Helper] Network or unexpected error calling '${functionName}':`, error);
        // Re-throw the error so the calling component can handle its own state (e.g., stop loading spinners).
        throw error;
    }
}
