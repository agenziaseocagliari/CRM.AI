# 🔧 GUIDA COMPLETA: Fix "Profile Lookup Failed" Error

## 🎯 Problema Identificato

### Sintomo
Durante il login, l'applicazione mostra l'errore:
```
Profile lookup failed
```

### Causa Radice
La policy RLS `profiles_select_policy` contiene una **dipendenza circolare**:

```sql
-- ❌ POLICY PROBLEMATICA
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT
  TO public
  USING (
    id = auth.uid() 
    OR 
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()  -- 💥 CIRCULAR!
    )
  );
```

**Cosa succede:**
1. User fa login → JWT generato con `auth.uid()`
2. `useVertical.tsx` esegue: `SELECT * FROM profiles WHERE id = auth.uid()`
3. RLS valuta la policy USING clause
4. La subquery prova a fare: `SELECT FROM profiles WHERE id = auth.uid()`
5. Questa SELECT attiva di nuovo la stessa policy RLS
6. **Risultato**: Ricorsione infinita o negazione permesso → LOGIN FALLITO ❌

---

## ✅ Soluzione

### Strategia
Dividere la policy in DUE policy separate:
1. **Accesso diretto al proprio profilo** (senza subquery)
2. **Visibilità membri organizzazione** (usando JWT claims)

### Perché funziona?
- Il JWT contiene già `organization_id` nei metadata (grazie a `sync_auth_metadata_trigger`)
- Leggere dal JWT è **INSTANTANEO** (no query al DB)
- Nessuna dipendenza circolare ✅

---

## 📋 STEP 1: Esegui la Migrazione SQL

### Opzione A: Via Supabase Dashboard (CONSIGLIATO)

1. **Apri Supabase SQL Editor:**
   - URL: https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi
   - Vai a: `Database` → `SQL Editor` → `New Query`

2. **Copia e incolla il contenuto del file:**
   ```
   EXECUTE_IN_SUPABASE_SQL_EDITOR.sql
   ```

3. **Clicca "RUN" e verifica l'output:**
   ```
   ✅ Query executed successfully
   ✅ 9 total policies on profiles table
   ```

### Opzione B: Via Supabase CLI (se credenziali DB configurate)

```powershell
# Se hai accesso diretto al database
npx supabase db push
```

---

## 📋 STEP 2: Verifica la Fix

### 2.1 Verifica le Policy RLS

Esegui nel SQL Editor:

```sql
SELECT 
  polname, 
  polcmd::text as command,
  pg_get_expr(polqual, polrelid) as using_clause
FROM pg_policy 
WHERE polrelid = 'profiles'::regclass 
ORDER BY polname;
```

**Output Atteso:**

| polname | command | using_clause |
|---------|---------|--------------|
| Super admins can delete profiles | DELETE | (user_role = 'super_admin'::text) |
| Super admins can insert profiles | INSERT | ... |
| Super admins can update all profiles | UPDATE | ... |
| profiles_delete_policy | DELETE | (id = auth.uid()) |
| profiles_insert_policy | INSERT | ... |
| **profiles_select_organization** | SELECT | **(organization_id = ((auth.jwt() -> 'user_metadata'::text) ->> 'organization_id'::text)::uuid)** |
| **profiles_select_own** | SELECT | **(id = auth.uid())** |
| profiles_update_policy | UPDATE | ... |

**✅ Verifica:** Devono esserci 9 policy totali, con `profiles_select_own` e `profiles_select_organization`

---

### 2.2 Testa il Login Flow

1. **Apri l'applicazione in produzione:**
   ```
   https://crm-zr8dwugho-seo-cagliaris-projects-a561cd5b.vercel.app
   ```

2. **Fai login con un utente Insurance:**
   - Email: `user@insurance.example`
   - Password: `[usa password test]`

3. **Verifica la console del browser (F12):**
   ```
   ✅ [loadVerticalConfig] Profile query result: {vertical: "insurance", ...}
   ✅ [loadVerticalConfig] Profilo recuperato con successo
   ```

4. **Verifica che il dashboard si carichi senza errori**

---

### 2.3 Verifica JWT Metadata

Esegui nel SQL Editor (mentre sei loggato):

```sql
SELECT 
  auth.uid() as user_id,
  auth.jwt() -> 'user_metadata' ->> 'organization_id' as org_id_from_jwt,
  auth.jwt() -> 'user_metadata' ->> 'vertical' as vertical_from_jwt,
  p.organization_id as org_id_from_table,
  p.vertical as vertical_from_table
FROM profiles p
WHERE p.id = auth.uid();
```

**Output Atteso:**
```
user_id                              | org_id_from_jwt                    | vertical_from_jwt | ...
-------------------------------------|------------------------------------|--------------------|
9e5c4d3e-7b2a-4f1c-8d6e-3a9b7c5d2e1f | 1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p | insurance          | ...
```

✅ Conferma: `org_id_from_jwt` e `org_id_from_table` devono corrispondere

---

## 📋 STEP 3: Aggiorna il Codice Frontend (Opzionale)

Il file `useVertical.tsx` ha già retry logic e fallback. **Non richiede modifiche immediate**, ma puoi migliorare l'UX:

### 3.1 Aggiungi Error Boundary

Crea `src/components/ProfileErrorBoundary.tsx`:

```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';
import toast from 'react-hot-toast';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ProfileErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Profile Error Boundary:', error, errorInfo);
    toast.error('Errore di autenticazione. Riprova.');
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">Errore di Autenticazione</h2>
            <p className="mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Riprova
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 3.2 Wrappa l'App in App.tsx

```typescript
import { ProfileErrorBoundary } from '@/components/ProfileErrorBoundary';

function App() {
  return (
    <ProfileErrorBoundary>
      <VerticalProvider>
        {/* resto dell'app */}
      </VerticalProvider>
    </ProfileErrorBoundary>
  );
}
```

---

## 📋 STEP 4: Deploy (se hai fatto modifiche frontend)

```powershell
# Build production
npm run build

# Deploy to Vercel
npx vercel --prod
```

---

## ✅ Checklist Finale

- [ ] Migrazione SQL eseguita con successo
- [ ] 9 policy RLS su profiles table
- [ ] `profiles_select_own` presente
- [ ] `profiles_select_organization` presente
- [ ] JWT contiene `organization_id` in user_metadata
- [ ] Login utente funziona senza errori
- [ ] Console browser mostra "Profilo recuperato con successo"
- [ ] Dashboard carica correttamente
- [ ] (Opzionale) ProfileErrorBoundary aggiunto
- [ ] (Opzionale) Frontend ribuildata e deployata

---

## 🐛 Troubleshooting

### Errore persiste dopo migrazione

**1. Verifica che la policy vecchia sia stata rimossa:**
```sql
SELECT polname FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles' 
AND polname = 'profiles_select_policy';
```
Deve ritornare **0 rows**.

**2. Verifica che il trigger sync_auth_metadata sia attivo:**
```sql
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgrelid = 'profiles'::regclass 
AND tgname = 'sync_auth_metadata_trigger';
```
Deve mostrare `tgenabled = O` (Origin).

**3. Verifica il JWT durante una sessione attiva:**
- Login
- Apri console browser
- Cerca i log: `🔑 [JWT] Complete JWT Payload`
- Verifica che `user_metadata.organization_id` sia presente

**4. Forza refresh del token JWT:**
```typescript
// Nel browser console durante sessione attiva
await supabase.auth.refreshSession()
```

---

## 📊 Impatto della Fix

### Before (BROKEN ❌)
```
User Login → SELECT profiles → RLS Policy → SELECT profiles → RLS Policy → LOOP ∞
↓
Profile Lookup Failed ❌
```

### After (WORKING ✅)
```
User Login → JWT contains organization_id
            ↓
            SELECT profiles → RLS checks JWT (instant) → SUCCESS ✅
            ↓
            useVertical loads vertical config
            ↓
            Dashboard renders with correct vertical
```

---

## 📚 Riferimenti Tecnici

### File Modificati
- `supabase/migrations/20251020_fix_profiles_select_circular_policy.sql` - Migrazione SQL
- `EXECUTE_IN_SUPABASE_SQL_EDITOR.sql` - Script semplificato per dashboard

### File Analizzati (no modifiche richieste)
- `src/hooks/useVertical.tsx` - Ha già retry logic e fallback
- `src/lib/auth/jwtValidator.ts` - Gestisce JWT validation
- Database trigger: `sync_auth_metadata_trigger` - Sincronizza organization_id nel JWT

### Pattern RLS Moderno (Supabase Best Practice)
```sql
-- ✅ CORRECT: Simple, fast, no circular dependency
CREATE POLICY "policy_name" ON table_name
  FOR SELECT
  TO public  -- Modern pattern (not 'authenticated')
  USING (
    id = auth.uid()  -- Direct check
    OR
    organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid  -- JWT check
  );

-- ❌ WRONG: Circular dependency
CREATE POLICY "bad_policy" ON table_name
  FOR SELECT
  TO public
  USING (
    id IN (SELECT id FROM table_name WHERE ...)  -- CIRCULAR!
  );
```

---

## 🚀 Prossimi Passi

Dopo aver applicato questa fix:

1. **Verifica completa del login flow** per tutti i vertical (insurance, real_estate, standard)
2. **Test delle altre feature** che dipendono da profiles (calendar, automation, forms)
3. **Commit delle modifiche** (se hai aggiunto ProfileErrorBoundary)
4. **Documentazione aggiornamento** nel CHANGELOG

---

## 📞 Supporto

Se l'errore persiste dopo aver seguito tutti gli step:

1. Controlla i log della console browser (F12)
2. Controlla i log Supabase: https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi/logs
3. Verifica che tutte le 9 policy RLS siano attive
4. Verifica che il trigger `sync_auth_metadata_trigger` sia abilitato

---

**Autore**: AI Agent
**Data**: 2025-01-20
**Versione**: 1.0
**Status**: ✅ READY TO DEPLOY
