import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

// Questo controllo è critico. Se le variabili d'ambiente mancano (es. in Vercel),
// l'app si fermerà qui con un errore chiaro invece di andare in crash in modo misterioso.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Errore di Configurazione: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devono essere definiti. Controlla le tue "Environment Variables" nelle impostazioni del progetto su Vercel.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)