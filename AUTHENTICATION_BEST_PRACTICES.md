# 🔐 Authentication & Profile Lookup - Best Practices

## 📋 Sommario

Questo documento descrive le best practices per l'autenticazione JWT e il lookup del profilo utente nel progetto CRM-AI, con particolare attenzione alla prevenzione del bug "Impossibile trovare il profilo dell'utente o l'organizzazione associata".

---

## 🎯 Principi Fondamentali

### 1. **SEMPRE usare il JWT come fonte di verità per l'identità utente**

```typescript
// ✅ CORRETTO - Frontend
const { data: { session } } = await supabase.auth.getSession();
const user = session?.user;
const userId = user.id; // Questo è il 'sub' claim dal JWT

// ✅ CORRETTO - Edge Functions
const userId = await getUserIdFromJWT(req); // Helper che verifica il JWT
```

```typescript
// ❌ SBAGLIATO - Mai prendere l'ID da parametri esterni
const userId = req.body.user_id; // Può essere manipolato!
const userId = localStorage.getItem('user_id'); // Può essere alterato!
const userId = new URLSearchParams(window.location.search).get('user_id'); // Mai!
```

### 2. **Query del profilo deve usare l'ID dal JWT**

```typescript
// ✅ CORRETTO - Frontend
const { data: profileData, error: profileError } = await supabase
  .from('profiles')
  .select('organization_id')
  .eq('id', user.id) // user.id viene dal JWT verificato
  .single();
```

### 3. **Logging completo per debug rapido**

```typescript
// ✅ SEMPRE loggare questi dettagli
console.log('[Function] User authenticated:', {
  userId: user.id,
  email: user.email,
  jwtSub: user.id,
  timestamp: new Date().toISOString()
});

console.log('[Function] Profile query:', {
  query: `SELECT * FROM profiles WHERE id = '${userId}'`,
  result: data,
  error: error
});
```

---

## 🔧 Implementazione Frontend (React)

### useCrmData Hook - Pattern Robusto

```typescript
const fetchData = useCallback(async () => {
  try {
    // Step 1: Ottieni sessione JWT
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('[useCrmData] Session error:', sessionError);
      throw sessionError;
    }
    
    const user = session?.user;
    if (!user) {
      // Gestisci caso no-auth
      return;
    }

    // Step 2: Log dettagliato per debug
    console.log('[useCrmData] User authenticated from JWT:', {
      userId: user.id,
      email: user.email,
      jwtSub: user.id,
      timestamp: new Date().toISOString()
    });

    // Step 3: Query profilo usando JWT user.id
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id) // ⚠️ CRITICO: usa user.id dal JWT
      .single();
    
    // Step 4: Error handling dettagliato
    if (profileError || !profileData) {
      console.error('[useCrmData] Profile lookup failed:', {
        error: profileError,
        queriedUserId: user.id,
        userEmail: user.email,
        errorCode: profileError?.code,
        errorMessage: profileError?.message
      });
      
      const errorMsg = `Impossibile trovare il profilo dell'utente.\n\n` +
        `Debug Info:\n` +
        `- User ID (da JWT): ${user.id}\n` +
        `- Email: ${user.email}\n` +
        `- Errore DB: ${profileError?.message || 'Profilo non trovato'}\n\n` +
        `Azione: Contattare il supporto o ricaricare la pagina.`;
      
      throw new Error(errorMsg);
    }

    const { organization_id } = profileData;
    console.log('[useCrmData] Profile found:', { userId: user.id, organizationId: organization_id });

    // Step 5: Fetch dati organizzazione usando organization_id
    // ...
  } catch (err: any) {
    console.error('[useCrmData] Error:', err);
    setError(err.message);
  }
}, []);
```

---

## 🌐 Implementazione Edge Functions

### Pattern per Edge Functions con Auth

```typescript
// File: supabase/functions/my-function/index.ts

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getUserIdFromJWT, getOrganizationId } from '../_shared/supabase.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Step 1: Estrai userId dal JWT (con validazione)
    const userId = await getUserIdFromJWT(req);
    console.log('[my-function] Authenticated user:', userId);

    // Step 2: Ottieni organization_id per l'utente
    const organizationId = await getOrganizationId(userId);
    console.log('[my-function] Organization:', organizationId);

    // Step 3: Esegui logica business
    // ... usa organizationId per query RLS-aware

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[my-function] Error:', error.message);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        diagnostics: {
          function: 'my-function',
          timestamp: new Date().toISOString()
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
```

### Helper Functions (_shared/supabase.ts)

```typescript
/**
 * Estrae user ID dal JWT token.
 * @throws Error se token mancante/invalido
 */
export async function getUserIdFromJWT(req: Request): Promise<string> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Authorization header is required');
  }

  const token = authHeader.replace('Bearer ', '');
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error } = await supabaseClient.auth.getUser(token);

  if (error || !user) {
    throw new Error(`Invalid JWT: ${error?.message}`);
  }

  console.log('[getUserIdFromJWT] User verified:', { userId: user.id, email: user.email });
  return user.id;
}

/**
 * Ottiene organization_id per un utente.
 * Usa service role per bypassare RLS.
 */
export async function getOrganizationId(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', userId);
  
  if (error || !data || data.length === 0) {
    throw new Error(`Profile not found for user: ${userId}`);
  }
  
  if (!data[0].organization_id) {
    throw new Error(`Profile incomplete (no organization_id) for user: ${userId}`);
  }
  
  return data[0].organization_id;
}
```

---

## 🔍 Debug e Troubleshooting

### Checklist quando "Profilo non trovato"

1. **Verificare il JWT è valido**
   ```bash
   # In browser console
   const { data: { session } } = await supabase.auth.getSession()
   console.log('User ID from JWT:', session?.user?.id)
   console.log('User email:', session?.user?.email)
   ```

2. **Verificare il profilo esiste nel DB**
   ```sql
   -- In Supabase SQL Editor
   SELECT id, organization_id FROM profiles WHERE id = 'USER_ID_FROM_JWT';
   ```

3. **Verificare le RLS Policies**
   ```sql
   -- Verifica policy SELECT su profiles
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```

4. **Controllare i log dettagliati**
   - Frontend: Browser DevTools Console
   - Backend: Supabase Functions Logs
   - Look for: `[useCrmData]`, `[getUserIdFromJWT]`, `[getOrganizationId]`

### Messaggi di Errore Comuni

| Errore | Causa Probabile | Soluzione |
|--------|----------------|-----------|
| `Authorization header is required` | JWT non inviato nella richiesta | Verificare che `Authorization: Bearer {token}` sia nell'header |
| `Invalid JWT` | Token scaduto o malformato | Fare refresh del token o re-login |
| `User profile not found` | Profilo non creato per l'utente | Verificare trigger/hook di creazione profilo |
| `Profile incomplete (no organization_id)` | organization_id è NULL | Assegnare manualmente o tramite migration |

---

## 🛡️ Row Level Security (RLS) Best Practices

### Policy per la tabella `profiles`

```sql
-- Policy SELECT: Un utente può vedere solo il proprio profilo
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Policy UPDATE: Un utente può modificare solo il proprio profilo
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
```

### Policy per tabelle organization-scoped

```sql
-- Esempio: tabella contacts
CREATE POLICY "Users can view contacts in their organization"
ON contacts FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);
```

---

## 📊 Strategia di Logging Completa

### Livelli di Log

1. **INFO** - Flusso normale
   ```typescript
   console.log('[Function] User authenticated:', { userId, email });
   ```

2. **WARNING** - Situazioni anomale ma gestibili
   ```typescript
   console.warn('[Function] No data found, returning empty array');
   ```

3. **ERROR** - Errori che impediscono il completamento
   ```typescript
   console.error('[Function] Database error:', { error, userId, query });
   ```

### Struttura Log Consigliata

```typescript
// Include sempre:
{
  function: 'function-name',        // Nome della funzione/componente
  action: 'fetch-profile',          // Azione in corso
  userId: 'uuid',                   // ID utente dal JWT
  organizationId: 'uuid',           // ID organizzazione (se disponibile)
  timestamp: '2025-01-01T12:00:00', // Timestamp ISO
  result: 'success' | 'error',      // Esito
  details: { /* ... */ }            // Dettagli aggiuntivi
}
```

---

## 🚀 Migration e Setup Iniziale

### Verifica Trigger di Creazione Profilo

Assicurati che esista un trigger che crea automaticamente un profilo quando un utente si registra:

```sql
-- Trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, organization_id)
  VALUES (
    NEW.id,
    -- Crea una nuova organizzazione o assegna una esistente
    (INSERT INTO organizations (name) VALUES ('New Organization') RETURNING id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## 📝 Checklist Finale per Developer

Prima di committare codice che tocca auth/profili:

- [ ] Il JWT è l'unica fonte di user ID?
- [ ] Tutti i log necessari sono presenti?
- [ ] Gli errori includono dati diagnostici (userId, organizationId)?
- [ ] Le RLS policies sono corrette?
- [ ] Il codice gestisce il caso "profilo non trovato"?
- [ ] Il fallback UI/UX è user-friendly?
- [ ] La documentazione è aggiornata?

---

## 🔗 Riferimenti

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

**Ultimo aggiornamento:** 2025-01-01  
**Maintainer:** CRM-AI Dev Team
