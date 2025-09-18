// Gli import vanno sempre puliti e organizzati dopo ogni refactor o patch.
import React from 'react';
import { toast } from 'react-hot-toast';

import { supabase } from './supabaseClient';

/**
 * Gestisce la visualizzazione di un toast di errore per problemi di autenticazione.
 * @param toastId L'ID di un toast di caricamento esistente da aggiornare.
 */
const handleAuthErrorToast = (toastId?: string) => {
    const options = { id: toastId, duration: 8000 };
    // FIX: Replaced JSX with React.createElement to be compatible with a .ts file.
    // This creates a custom toast component programmatically without needing TSX syntax.
    toast.error(t => (
        React.createElement('span', { className: "text-center" },
            "La tua sessione o la connessione a Google sono scadute.",
            React.createElement('a', {
                href: "/settings",
                onClick: () => toast.dismiss(t.id),
                className: "block mt-2 font-bold underline text-indigo-600 hover:text-indigo-500"
            }, "Verifica nelle Impostazioni")
        )
    ), options);
};

/**
 * Helper centralizzato e sicuro per invocare le Supabase Functions.
 * Questa versione utilizza `fetch` in modo esplicito per garantire che l'header
 * di autorizzazione JWT sia sempre inviato, come richiesto per le funzioni Edge sicure.
 * 
 * @param functionName Il nome della funzione Edge da chiamare.
 * @param payload Il corpo della richiesta (body) da inviare alla funzione.
 * @returns Una Promise che si risolve con i dati della funzione in caso di successo.
 * @throws Un errore se l'autenticazione fallisce o la funzione restituisce un errore.
 */
export async function invokeSupabaseFunction(
    functionName: string,
    payload: object = {}
) {
    console.log(`[API Helper] Invocazione di '${functionName}' con fetch esplicito...`);
    console.log(`[API Helper] Payload inviato a '${functionName}':`, payload);

    // 1. Recupera l'URL di Supabase e la sessione utente
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Le variabili d'ambiente VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY non sono configurate.");
    }
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
        throw new Error(`Errore nel recupero della sessione: ${sessionError.message}`);
    }
    if (!session) {
        handleAuthErrorToast();
        throw new Error("Sessione utente non trovata. Effettua nuovamente il login.");
    }

    // 2. Costruisce l'URL della funzione e gli header
    const functionUrl = `${supabaseUrl}/functions/v1/${functionName}`;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': supabaseAnonKey,
    };

    // 3. Esegue la chiamata fetch
    const response = await fetch(functionUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
    });

    // 4. Gestisce la risposta
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[API Helper] Errore HTTP da '${functionName}' (${response.status}):`, errorText);
        
        if (response.status === 401 || response.status === 403) {
            handleAuthErrorToast();
        }
        
        try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.error || errorJson.message || `Errore del server (${response.status})`);
        } catch (e) {
            throw new Error(`Errore del server (${response.status}): ${errorText}`);
        }
    }
    
    const responseData = await response.json();

    console.log(`[API Helper] Risposta da '${functionName}':`, { data: responseData });

    // Gestisce errori applicativi restituiti in una risposta 200 OK
    if (responseData && responseData.error) {
        const errorMessage = responseData.error.toString().toLowerCase();
        if (errorMessage.includes("authenticate") || errorMessage.includes("token") || errorMessage.includes("non autenticato") || errorMessage.includes("accesso negato")) {
            handleAuthErrorToast();
        }
        throw new Error(responseData.error);
    }
    
    return responseData;
}