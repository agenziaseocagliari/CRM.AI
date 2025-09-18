// Gli import vanno sempre puliti e organizzati dopo ogni refactor o patch.
import React from 'react';
import { toast } from 'react-hot-toast';

import { supabase } from './supabaseClient';
import { OrganizationSettings } from '../types';

/**
 * Gestisce la visualizzazione di un toast di errore per la ri-autenticazione Google.
 * @param toastId L'ID di un toast di caricamento esistente da aggiornare.
 */
const handleAuthErrorToast = (toastId?: string) => {
    const options = { id: toastId, duration: 8000 };
    // FIX: Replaced JSX with React.createElement to be compatible with a .ts file.
    // This creates a custom toast component programmatically without needing TSX syntax.
    toast.error(t => (
        React.createElement('span', { className: "text-center" },
            "La connessione a Google è scaduta o non è valida.",
            React.createElement('a', {
                href: "/settings",
                onClick: () => toast.dismiss(t.id),
                className: "block mt-2 font-bold underline text-indigo-600 hover:text-indigo-500"
            }, "Riconnetti il tuo account")
        )
    ), options);
};

/**
 * Helper centralizzato per invocare le Supabase Functions, gestendo automaticamente
 * l'autenticazione della sessione e l'inclusione del token Google nel payload.
 * 
 * @param functionName Il nome della funzione Edge da chiamare.
 * @param payload Il corpo della richiesta (body) da inviare alla funzione.
 * @param requiresGoogleAuth Se true, la funzione tenterà di aggiungere il provider_token di Google al payload.
 * @param organizationSettings Obbligatorio se requiresGoogleAuth è true. Contiene il token Google.
 * @returns Una Promise che si risolve con i dati della funzione in caso di successo.
 * @throws Un errore se l'autenticazione fallisce o la funzione restituisce un errore.
 */
export async function invokeSupabaseFunction(
    functionName: string,
    payload: object,
    requiresGoogleAuth: boolean,
    organizationSettings?: OrganizationSettings | null
) {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
        throw new Error('Sessione utente non valida o scaduta. Effettua nuovamente il login.');
    }

    let finalPayload = { ...payload };
    
    if (requiresGoogleAuth) {
        let googleProviderToken: string | null = null;

        if (organizationSettings?.google_auth_token) {
            try {
                // Il token è salvato come stringa JSON nel DB, quindi va analizzato
                const tokenData = JSON.parse(organizationSettings.google_auth_token);
                googleProviderToken = tokenData.access_token || null;
            } catch (e) {
                console.error("Errore critico nel parsing del google_auth_token:", e);
                // Il token è corrotto, forziamo l'errore di autenticazione
                googleProviderToken = null; 
            }
        }
        
        // --- STEP DI DEBUG RICHIESTO ---
        // Questo log stampa lo stato del token prima di ogni chiamata critica.
        // Rimuovere in produzione per non esporre dati sensibili in console.
        console.log(
            `[Guardian AI Debug] Chiamata a '${functionName}'. ` +
            `Token Google richiesto: SI. ` +
            `Token trovato e valido: ${googleProviderToken ? `SÌ (Lunghezza: ${googleProviderToken.length})` : 'NO'}`
        );
        // --- FINE STEP DI DEBUG ---

        if (!googleProviderToken) {
            handleAuthErrorToast();
            throw new Error('Token di accesso Google non trovato. L\'utente deve autenticarsi nuovamente.');
        }
        
        finalPayload = { ...finalPayload, googleProviderToken };
    }

    const { data, error } = await supabase.functions.invoke(functionName, {
        body: finalPayload,
    });

    if (error) {
        // Errore di rete o a livello di Supabase
        throw new Error(error.message);
    }

    if (data && data.error) {
        // Errore restituito dalla logica interna della funzione
        if (data.error.includes("re-authenticate") || data.error.includes("token")) {
            handleAuthErrorToast();
        }
        throw new Error(data.error);
    }
    
    return data;
}