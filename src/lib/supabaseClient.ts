import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta as unknown as { env: Record<string, string> }).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as unknown as { env: Record<string, string> }).env.VITE_SUPABASE_ANON_KEY;

// Questo oggetto conterrà il client effettivo o un messaggio di errore.
const clientHolder: {
    client: SupabaseClient | null,
    error: string | null
} = {
    client: null,
    error: null
};

if (!supabaseUrl || !supabaseAnonKey) {
  // Se le variabili d'ambiente mancano, memorizziamo l'errore invece di bloccare l'app.
  clientHolder.error = 'Errore di Configurazione: Le variabili d\'ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY non sono state impostate nel tuo ambiente di produzione (Vercel).';
} else {
  // Altrimenti, creiamo il client normalmente.
  clientHolder.client = createClient(supabaseUrl, supabaseAnonKey);
}

// Creiamo un "proxy" per intercettare tutte le chiamate a 'supabase'.
// Questo previene un crash a livello di modulo e ci permette di gestire l'errore
// in modo controllato all'interno dei componenti React.
export const supabase = new Proxy({}, {
    get(_target, prop) {
        if (clientHolder.error) {
            // Se c'è un errore di inizializzazione, lo lanciamo solo quando una funzione
            // di 'supabase' viene chiamata (es. supabase.auth.getUser()).
            // L'errore verrà così catturato dai blocchi try/catch nell'app.
            throw new Error(clientHolder.error);
        }
        if (!clientHolder.client) {
            // Caso di fallback, non dovrebbe mai accadere se la logica sopra è corretta.
             throw new Error("Il client Supabase non è stato inizializzato correttamente.");
        }
        // Se tutto è a posto, inoltriamo la chiamata al client Supabase reale.
        return Reflect.get(clientHolder.client, prop);
    }
}) as SupabaseClient; // Diciamo a TypeScript che questo oggetto si comporterà come un SupabaseClient.
