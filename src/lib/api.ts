// This import section is managed in batch via AIStudio—do not add unused imports.
import React from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from './supabaseClient';

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
 * @returns Una Promise che si risolve con i dati della funzione in caso di successo.
 * @throws Un errore se l'autenticazione fallisce o la funzione restituisce un errore.
 */
export async function invokeSupabaseFunction(
    functionName: string,
    payload: object,
    requiresGoogleAuth: boolean
) {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
        throw new Error('Sessione utente non valida o scaduta. Effettua nuovamente il login.');
    }

    let finalPayload = { ...payload };
    
    if (requiresGoogleAuth) {
        const googleProviderToken = session.provider_token;
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
