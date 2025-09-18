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
 * La funzione gestisce automaticamente l'invio del token JWT dell'utente per
 * l'autenticazione lato backend. La logica per ottenere e rinfrescare i token
 * di servizi esterni (es. Google) è gestita interamente dalla funzione Edge,
 * garantendo massima sicurezza.
 * 
 * @param functionName Il nome della funzione Edge da chiamare.
 * @param payload Il corpo della richiesta (body) da inviare alla funzione.
 * @returns Una Promise che si risolve con i dati della funzione in caso di successo.
 * @throws Un errore se l'autenticazione fallisce o la funzione restituisce un errore.
 */
export async function invokeSupabaseFunction(
    functionName: string,
    payload: object = {} // Il payload ora è opzionale
) {
    // Il metodo `invoke` del client Supabase si occupa automaticamente di:
    // 1. Recuperare la sessione utente corrente.
    // 2. Inserire l'header `Authorization: Bearer <token>` nella richiesta.
    // 3. Gestire il refresh del token JWT di Supabase se è scaduto.
    console.log(`[API Helper] Invocazione di '${functionName}'...`);
    
    const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload,
    });

    // Log per il debug della risposta, come richiesto
    console.log(`[API Helper] Risposta da '${functionName}':`, {
      data: data,
      error: error,
    });

    if (error) {
        // Errore di rete, CORS, o a livello di Supabase (es. funzione non trovata)
        throw new Error(`Errore di rete o del server: ${error.message}`);
    }

    if (data && data.error) {
        // Errore applicativo restituito dalla logica interna della funzione Edge.
        // Controlliamo se è un errore di autenticazione per fornire un feedback specifico.
        const errorMessage = data.error.toLowerCase();
        if (errorMessage.includes("authenticate") || errorMessage.includes("token") || errorMessage.includes("non autenticato") || errorMessage.includes("accesso negato")) {
            handleAuthErrorToast();
        }
        throw new Error(data.error);
    }
    
    return data;
}