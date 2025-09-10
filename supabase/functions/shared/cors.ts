// supabase/functions/shared/cors.ts

// Definiamo gli header CORS in un unico posto per riutilizzarli in tutte le funzioni.
// Questo permette di gestire le policy di accesso da un'unica fonte di verità.
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Permette richieste da qualsiasi origine
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', // Header permessi
};
