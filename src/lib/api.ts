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
 * Creates a comprehensive diagnostic report string for debugging.
 * @param userMessage The user-facing error message.
 * @param functionName The name of the function that was called.
 * @param rawErrorPayload The raw response from the backend (JSON or text).
 * @param errorObject The caught JavaScript Error object.
 * @returns A formatted string with all diagnostic information.
 */
function createDiagnosticReport(
    userMessage: string,
    functionName: string,
    rawErrorPayload: any,
    errorObject?: Error
): string {
    let report = `==== Guardian AI CRM Diagnostic Report ====\n\n`;
    report += `Function: ${functionName}\n`;
    report += `Timestamp: ${new Date().toISOString()}\n`;
    report += `User Message: ${userMessage}\n\n`;
    
    if (errorObject) {
        report += `--- JAVASCRIPT ERROR ---\n`;
        report += `Name: ${errorObject.name}\n`;
        report += `Message: ${errorObject.message}\n`;
        report += `Stack: ${errorObject.stack}\n\n`;
    }

    report += `--- BACKEND RESPONSE ---\n`;
    report += `Type: ${typeof rawErrorPayload}\n`;
    report += `Raw Payload:\n${typeof rawErrorPayload === 'string' ? rawErrorPayload : JSON.stringify(rawErrorPayload, null, 2)}\n`;
    
    report += `\n=======================================\n`;
    return report;
}


/**
 * Displays a detailed and actionable error toast.
 * @param message The main error message to display to the user.
 * @param diagnosticReport The full diagnostic report to be copied.
 * @param options Optional configuration for the toast behavior.
 */
function showErrorToast(message: string, diagnosticReport: string, options?: { 
    requiresLogout?: boolean;
    isJwtError?: boolean;
}) {
    // Check if the error suggests a Google reconnection is needed.
    const needsReconnect = /token|google|autenticazione|connetti|credential/i.test(diagnosticReport.toLowerCase());
    const requiresLogout = options?.requiresLogout || false;
    const isJwtError = options?.isJwtError || false;
    
    toast.error(
        (t) => (
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'start', gap: '12px', maxWidth: '400px' } },
                React.createElement('p', { className: 'font-semibold text-center w-full' }, message),
                needsReconnect && !isJwtError && React.createElement('p', { className: 'text-sm text-center w-full' },
                    'Potrebbe essere necessario riconnettere il tuo account Google. ',
                    React.createElement('span', { className: 'font-bold' }, 'Vai su Impostazioni -> Integrazioni.')
                ),
                isJwtError && React.createElement('p', { className: 'text-sm text-center w-full text-yellow-700' },
                    '⚠️ La tua sessione è scaduta o è stata aggiornata. È necessario effettuare nuovamente il login.'
                ),
                React.createElement('div', { className: "flex items-center space-x-2 w-full justify-center" },
                    requiresLogout && React.createElement('button', {
                        onClick: async () => {
                            toast.dismiss(t.id);
                            await supabase.auth.signOut();
                            window.location.href = '/login';
                        },
                        className: 'bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600 font-semibold'
                    }, 'Vai al Login'),
                    React.createElement('button', {
                        onClick: () => {
                            navigator.clipboard.writeText(diagnosticReport);
                            toast.success('Diagnostica copiata!', { id: 'copy-toast', duration: 2000 });
                        },
                        className: 'bg-gray-200 text-gray-800 px-3 py-1 rounded-md text-sm hover:bg-gray-300'
                    }, 'Copia Diagnosi'),
                    !requiresLogout && React.createElement('button', {
                        onClick: () => toast.dismiss(t.id),
                        className: 'bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600'
                    }, 'Chiudi')
                )
            )
        ),
        { duration: requiresLogout ? Infinity : 15000, id: `error-toast-${Date.now()}` }
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
        const diagnosticReport = createDiagnosticReport(errorMsg, functionName, "Pre-flight check failed");
        showErrorToast(errorMsg, diagnosticReport, { requiresLogout: true });
        throw { error: errorMsg, requiresRelogin: true };
    }

    // 2. Prepare payload with organization_id.
    const finalPayload: any = { ...payload };
    
    const urlParams = new URLSearchParams(window.location.search);
    const isDebugMode = urlParams.get('debug_mode') === 'true';
    const debugOrgId = urlParams.get('debug_org_id');

    if (isDebugMode && debugOrgId) {
        finalPayload.organization_id = debugOrgId;
        console.warn(`[API Helper] DEBUG MODE: Overriding organization_id with '${debugOrgId}' for function '${functionName}'.`);
    } else if (!finalPayload.organization_id) {
        const orgId = getOrganizationIdFromStorage();
        if (!orgId) {
            const errorMsg = 'ID Organizzazione non impostato. Ricarica la pagina o effettua nuovamente il login.';
            console.error(`[API Helper] CRITICAL: organization_id is missing for function '${functionName}'.`, { payload });
            showErrorToast(errorMsg, createDiagnosticReport(errorMsg, functionName, "organization_id missing from localStorage"));
            throw new Error(errorMsg);
        }
        finalPayload.organization_id = orgId;
    }
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
        const errorMsg = 'Sessione utente non trovata o scaduta.';
        showErrorToast(errorMsg, createDiagnosticReport(errorMsg, functionName, sessionError || 'No session found'));
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
    
    try {
        const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(finalPayload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorJson: any = null;
            try { errorJson = JSON.parse(errorText); } catch (e) { /* ignore */ }
            
            console.error(`[API Helper] Error from '${functionName}' (${response.status}). Full response:`, errorJson || errorText);

            // Check for JWT custom claim error specifically
            const errorMessage = errorJson?.error || errorText || '';
            const isJwtClaimError = (response.status === 403 || response.status === 401) && 
                                   /user_role not found|JWT custom claim|custom claim.*not found|logout and login again|Please logout and login|role was recently changed/i.test(errorMessage);
            
            if (isJwtClaimError) {
                console.error(`[API Helper] JWT Custom Claim Error detected on '${functionName}'. Token is outdated or missing custom claims.`);
                const userMessage = 'La sessione è scaduta o aggiornata. Per favore, effettua nuovamente il login.';
                const diagnosticReport = createDiagnosticReport(
                    userMessage, 
                    functionName, 
                    errorJson || errorText
                );
                
                // Show error with logout button
                showErrorToast(userMessage, diagnosticReport, { 
                    requiresLogout: true,
                    isJwtError: true 
                });
                
                // Automatically clear auth state
                localStorage.removeItem('organization_id');
                
                throw { 
                    error: userMessage, 
                    isJwtError: true,
                    requiresRelogin: true,
                    diagnostics: errorJson 
                };
            }

            const isAuthError = response.status === 401 || response.status === 403 || (errorText && /organization_id|jwt|token/i.test(errorText));
            
            if (isAuthError && !isRetry) {
                console.warn(`[API Helper] Auth error on '${functionName}'. Attempting session refresh and one retry...`);
                const { error: refreshError } = await supabase.auth.refreshSession();
                
                if (refreshError) {
                    console.error(`[API Helper] Session refresh failed:`, refreshError);
                    const userMessage = 'Sessione scaduta. Per favore, effettua nuovamente il login.';
                    const diagnosticReport = createDiagnosticReport(userMessage, functionName, refreshError);
                    showErrorToast(userMessage, diagnosticReport, { requiresLogout: true });
                    localStorage.removeItem('organization_id');
                    throw { error: userMessage, requiresRelogin: true };
                }
                
                return invokeSupabaseFunction(functionName, payload, true);
            }
            
            const userMessage = errorJson?.error || `Errore del server (${response.status})`;
            const diagnosticReport = createDiagnosticReport(userMessage, functionName, errorJson || errorText);
            showErrorToast(userMessage, diagnosticReport);
            // FIX: Throw the entire JSON object instead of just the message. This preserves
            // the rich diagnostic information from the backend, allowing the calling
            // component to display a more detailed and useful error message in the UI.
            throw errorJson || { error: userMessage, diagnostics: { details: errorText } };
        }
        
        const data = await response.json();
        console.log(`[API Helper] OK response from '${functionName}'.`);
        console.dir(data);

        if (data.error) {
            console.warn(`[API Helper] Function '${functionName}' returned 200 OK but with an error payload.`);
            const diagnosticReport = createDiagnosticReport(data.error, functionName, data);
            showErrorToast(data.error, diagnosticReport);
            // FIX: Also throw the full data object here to ensure components
            // can access the diagnostic details from a 200 OK error response.
            throw data;
        }

        return data;

    } catch (error: any) {
        // This catch block handles three types of errors:
        // 1. True network errors from `fetch` (e.g., DNS, CORS, no connection). These are typically TypeErrors.
        // 2. JSON parsing errors if the success response from the server is malformed.
        // 3. Application-level errors that were already processed and re-thrown from the `if (!response.ok)` block.
        
        // Our goal is to only generate a *new* generic diagnostic report and toast for case #1 and #2.
        // Case #3 errors already have a specific, useful message from the backend and have been toasted.
        
        // Check if this is a re-thrown error from our handling (has custom structure)
        if (error.isJwtError || error.requiresRelogin || typeof error.error !== 'undefined') {
            // This is an already-processed application error, just re-throw
            console.log(`[API Helper] Re-throwing processed error from '${functionName}'`);
            throw error;
        }
        
        // If we reach here, it's a true network/fetch error
        if (error instanceof Error) {
            console.error(`[API Helper] Network or Fetch Error calling '${functionName}':`, error);
            
            // Try to determine if this is a true network error vs. a CORS/backend issue
            const isNetworkError = error.name === 'TypeError' && 
                                  (error.message.includes('Failed to fetch') || 
                                   error.message.includes('NetworkError') ||
                                   error.message.includes('Network request failed'));
            
            const userMessage = isNetworkError 
                ? 'Errore di rete. Controlla la connessione e riprova.'
                : 'Errore di comunicazione con il server. Riprova più tardi.';
                
            const diagnosticReport = createDiagnosticReport(
                userMessage,
                functionName,
                "La richiesta non ha raggiunto il server o la risposta non era valida.",
                error
            );
            showErrorToast(userMessage, diagnosticReport);
        }
        
        // In all cases, we re-throw the error so the calling component's own try/catch block
        // can handle it and update the UI state accordingly (e.g., show an error message in the component).
        throw error;
    }
}