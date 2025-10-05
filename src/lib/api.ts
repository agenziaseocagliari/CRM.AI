import React from 'react';
import { toast } from 'react-hot-toast';

import { diagnosticLogger } from './mockDiagnosticLogger';
// Unused security imports available for future features
// import { SecureLogger as _SecureLogger, SecureErrorHandler as _SecureErrorHandler } from './security/securityUtils';
import { diagnoseJWT } from './jwtUtils';
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
    rawErrorPayload: unknown,
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
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'start', gap: '12px', maxWidth: '500px' } },
                React.createElement('div', { className: 'w-full' },
                    // Split message by newlines and create separate paragraphs
                    ...message.split('\n').filter(line => line.trim()).map((line, idx) => 
                        React.createElement('p', { 
                            key: idx,
                            className: line.trim().startsWith('⚠️') || line.trim().startsWith('NOTA:') 
                                ? 'font-bold text-yellow-700 mb-2' 
                                : line.match(/^\d+\./) 
                                    ? 'text-sm ml-4 mb-1'
                                    : 'text-sm mb-2'
                        }, line.trim())
                    )
                ),
                needsReconnect && !isJwtError && React.createElement('p', { className: 'text-sm text-center w-full' },
                    'Potrebbe essere necessario riconnettere il tuo account Google. ',
                    React.createElement('span', { className: 'font-bold' }, 'Vai su Impostazioni -> Integrazioni.')
                ),
                React.createElement('div', { className: "flex items-center space-x-2 w-full justify-center mt-2" },
                    requiresLogout && React.createElement('button', {
                        onClick: async () => {
                            toast.dismiss(t.id);
                            await supabase.auth.signOut();
                            window.location.href = '/login';
                        },
                        className: 'bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 font-bold'
                    }, '🚪 Logout'),
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
export async function invokeSupabaseFunction(functionName: string, payload: object = {}, isRetry: boolean = false): Promise<unknown> {
    diagnosticLogger.info(`[API Helper] Invoking '${functionName}'...`, { isRetry });

    // 1. Pre-flight security check: Ensure a user is logged in.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        const errorMsg = "Utente non autenticato. Effettua nuovamente il login per continuare.";
        diagnosticLogger.error("[API Helper] Pre-flight check failed: User not authenticated.");
        const diagnosticReport = createDiagnosticReport(errorMsg, functionName, "Pre-flight check failed");
        showErrorToast(errorMsg, diagnosticReport, { requiresLogout: true });
        throw { error: errorMsg, requiresRelogin: true };
    }

    // 2. Prepare payload with organization_id.
    const finalPayload: Record<string, unknown> = { ...payload };
    
    const urlParams = new URLSearchParams(window.location.search);
    const isDebugMode = urlParams.get('debug_mode') === 'true';
    const debugOrgId = urlParams.get('debug_org_id');

    // Get session to check user role
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
        const errorMsg = 'Sessione utente non trovata o scaduta.';
        showErrorToast(errorMsg, createDiagnosticReport(errorMsg, functionName, sessionError || 'No session found'));
        throw new Error(sessionError?.message || 'Invalid session.');
    }

    // Check if user is super_admin
    const diagnostics = diagnoseJWT(session.access_token);
    const userRole = diagnostics.claims?.user_role;
    const isSuperAdmin = userRole === 'super_admin';

    if (isDebugMode && debugOrgId) {
        finalPayload.organization_id = debugOrgId;
        diagnosticLogger.warn(`[API Helper] DEBUG MODE: Overriding organization_id with '${debugOrgId}' for function '${functionName}'.`);
    } else if (!finalPayload.organization_id) {
        const orgId = getOrganizationIdFromStorage();
        // FIX: Skip organization_id validation for super_admin users
        if (!orgId && !isSuperAdmin) {
            const errorMsg = 'ID Organizzazione non impostato. Ricarica la pagina o effettua nuovamente il login.';
            diagnosticLogger.error(`[API Helper] CRITICAL: organization_id is missing for function '${functionName}'.`, { payload });
            showErrorToast(errorMsg, createDiagnosticReport(errorMsg, functionName, "organization_id missing from localStorage"));
            throw new Error(errorMsg);
        }
        if (orgId) {
            finalPayload.organization_id = orgId;
        } else if (isSuperAdmin) {
            // Super admin can make API calls without organization_id or with "ALL"
            diagnosticLogger.info(`[API Helper] Super Admin detected - organization_id validation skipped for '${functionName}'.`);
            finalPayload.organization_id = 'ALL';
        }
    }

    const supabaseUrl = (import.meta as unknown as { env: Record<string, string> }).env.VITE_SUPABASE_URL;
    const supabaseAnonKey = (import.meta as unknown as { env: Record<string, string> }).env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {throw new Error("Supabase URL or Anon Key not configured.");}
    
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
            let errorJson: unknown = null;
            try { errorJson = JSON.parse(errorText); } catch { /* ignore */ }
            
            diagnosticLogger.error(`[API Helper] Error from '${functionName}' (${response.status}). Full response:`, errorJson || errorText);

            // Check for JWT custom claim error specifically
            const errorMessage = (errorJson && typeof errorJson === 'object' && 'error' in errorJson && typeof errorJson.error === 'string') 
                ? errorJson.error 
                : errorText || '';
            const isJwtClaimError = (response.status === 403 || response.status === 401) && 
                                   /user_role not found|JWT custom claim|custom claim.*not found|logout and login again|Please logout and login|role was recently changed/i.test(errorMessage);
            
            if (isJwtClaimError) {
                diagnosticLogger.error(`[API Helper] JWT Custom Claim Error detected on '${functionName}'. Token is outdated or missing custom claims.`);
                diagnosticLogger.error(`[API Helper] IMPORTANT: Session refresh will NOT fix this issue. User must perform a FULL LOGOUT and LOGIN.`);
                
                diagnosticLogger.critical('api', `JWT Custom Claim Error on ${functionName}`, {
                    endpoint: functionName,
                    statusCode: response.status,
                    errorMessage: errorMessage,
                    userId: session?.user?.id,
                });
                
                const userMessage = '⚠️ Il tuo ruolo utente è stato modificato. Per continuare, devi:\n\n1. Cliccare sul pulsante "Logout" qui sotto\n2. Effettuare nuovamente il login\n\nNOTA: Semplicemente ricaricare la pagina o riaprire il browser NON risolverà il problema.';
                const diagnosticReport = createDiagnosticReport(
                    userMessage, 
                    functionName, 
                    errorJson || errorText
                );
                
                // Show error with logout button and clear instructions
                showErrorToast(userMessage, diagnosticReport, { 
                    requiresLogout: true,
                    isJwtError: true 
                });
                
                // Automatically clear auth state to force fresh login
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
                diagnosticLogger.warn(`[API Helper] Auth error on '${functionName}'. Attempting session refresh and one retry...`);
                const { error: refreshError } = await supabase.auth.refreshSession();
                
                if (refreshError) {
                    diagnosticLogger.error(`[API Helper] Session refresh failed:`, refreshError);
                    const userMessage = 'Sessione scaduta. Per favore, effettua nuovamente il login.';
                    const diagnosticReport = createDiagnosticReport(userMessage, functionName, refreshError);
                    showErrorToast(userMessage, diagnosticReport, { requiresLogout: true });
                    localStorage.removeItem('organization_id');
                    throw { error: userMessage, requiresRelogin: true };
                }
                
                return invokeSupabaseFunction(functionName, payload, true);
            }
            
            const userMessage = (errorJson && typeof errorJson === 'object' && 'error' in errorJson && typeof errorJson.error === 'string') 
                ? errorJson.error 
                : `Errore del server (${response.status})`;
            const diagnosticReport = createDiagnosticReport(userMessage, functionName, errorJson || errorText);
            
            diagnosticLogger.error('api', `API error on ${functionName}`, {
                endpoint: functionName,
                statusCode: response.status,
                errorMessage: userMessage,
            });
            
            showErrorToast(userMessage, diagnosticReport);
            // FIX: Throw the entire JSON object instead of just the message. This preserves
            // the rich diagnostic information from the backend, allowing the calling
            // component to display a more detailed and useful error message in the UI.
            throw errorJson || { error: userMessage, diagnostics: { details: errorText } };
        }
        
        const data = await response.json();
        diagnosticLogger.info(`[API Helper] OK response from '${functionName}'.`);
        console.dir(data);

        if (data.error) {
            diagnosticLogger.warn(`[API Helper] Function '${functionName}' returned 200 OK but with an error payload.`);
            const diagnosticReport = createDiagnosticReport(data.error, functionName, data);
            showErrorToast(data.error, diagnosticReport);
            // FIX: Also throw the full data object here to ensure components
            // can access the diagnostic details from a 200 OK error response.
            throw data;
        }

        return data;

    } catch (error: unknown) {
        // This catch block handles three types of errors:
        // 1. True network errors from `fetch` (e.g., DNS, CORS, no connection). These are typically TypeErrors.
        // 2. JSON parsing errors if the success response from the server is malformed.
        // 3. Application-level errors that were already processed and re-thrown from the `if (!response.ok)` block.
        
        // Our goal is to only generate a *new* generic diagnostic report and toast for case #1 and #2.
        // Case #3 errors already have a specific, useful message from the backend and have been toasted.
        
        // Check if this is a re-thrown error from our handling (has custom structure)
        if (error && typeof error === 'object' && ('isJwtError' in error || 'requiresRelogin' in error || 'error' in error)) {
            // This is an already-processed application error, just re-throw
            diagnosticLogger.info(`[API Helper] Re-throwing processed error from '${functionName}'`);
            throw error;
        }
        
        // If we reach here, it's a true network/fetch error
        if (error instanceof Error) {
            diagnosticLogger.error(`[API Helper] Network or Fetch Error calling '${functionName}':`, error);
            
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
