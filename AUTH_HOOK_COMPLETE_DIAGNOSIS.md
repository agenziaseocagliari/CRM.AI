# 🔍 DIAGNOSI COMPLETA AUTH HOOK PROBLEM

## Data: 10 Ottobre 2025
## Progetto: CRM.AI - qjtaqrlpronohgpfdxsi.supabase.co

---

## ✅ STATO ATTUALE VERIFICATO

### 1. Funzione SQL ✅ FUNZIONA
- **Nome**: `public.custom_access_token_hook(jsonb)`
- **Firma**: STABLE (senza SECURITY DEFINER)
- **Test**: ✅ PASSATI (user_role='super_admin' e user_role='enterprise')
- **Permessi**: Grant a `supabase_auth_admin`, `postgres`, `service_role`

### 2. Configurazione Hook ✅ ATTIVA
```json
{
  "hook_custom_access_token_enabled": true,
  "hook_custom_access_token_uri": "pg-functions://postgres/public/custom_access_token_hook"
}
```
- Verificato via Management API
- Persistenza confermata (non si disabilita automaticamente)
- Toggle test eseguito con successo

### 3. Deploy Frontend ✅ COMPLETATO
- Vercel deploy: https://crm-bmkcy7b18-seo-cagliaris-projects-a561cd5b.vercel.app
- Routes Super Admin riabilitate
- Commit: 3ea409a

---

## ❌ PROBLEMA PERSISTENTE

**Sintomo**: JWT non contiene custom claims dopo il login
```
⚠️ TOKEN DEFECT: user_role mancante (Login method: password)
```

**Verifica Frontend**:
- `diagnoseJWT()` controlla `claims.user_role`
- Il claim non è presente nel JWT ricevuto
- Errore 403 su tutte le Edge Functions

---

## 🔬 ROOT CAUSE ANALYSIS

### Scenario Confermato:
1. ✅ Funzione SQL esiste e funziona (test manuali OK)
2. ✅ Hook configurato nell'API Management
3. ✅ Permessi corretti (supabase_auth_admin)
4. ❌ **Hook NON viene chiamato durante il login**

### Possibili Cause Residue:

#### A) GoTrue Cache (Più Probabile)
Il servizio GoTrue (Supabase Auth Server) ha una cache della configurazione che non si aggiorna in tempo reale quando modifichi via API Management.

**Evidenza**:
- Hook enabled=true nell'API
- Funzione SQL funziona
- Ma JWT non ha custom claims

#### B) Formato URI Ambiguo
Supabase potrebbe interpretare male il formato:
- Attuale: `pg-functions://postgres/public/custom_access_token_hook`
- Potrebbe servire: `pg-functions://postgres/custom_access_token_hook`

#### C) Ruolo `supabase_auth_admin` Non Esiste
Se il ruolo non esiste nel database, i permessi non vengono applicati.

**Test da eseguire** (SQL):
```sql
SELECT rolname FROM pg_roles WHERE rolname = 'supabase_auth_admin';
```

---

## 🛠️ SOLUZIONI TENTATE

1. ✅ Ricreata funzione senza SECURITY DEFINER
2. ✅ Grant a supabase_auth_admin
3. ✅ Hook abilitato via API
4. ✅ Sessioni invalidate
5. ✅ Toggle hook (disable → enable)
6. ✅ Cache browser pulita
7. ✅ Logout/Login completo
8. ✅ Browser chiuso e riaperto

---

## 🎯 SOLUZIONE DEFINITIVA

### STEP 1: Verifica Ruolo supabase_auth_admin
```sql
SELECT rolname, rolsuper, rolcanlogin 
FROM pg_roles 
WHERE rolname = 'supabase_auth_admin';
```

Se **NON esiste**, il problema è questo. Soluzione:
```sql
-- Crea il ruolo se non esiste
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    CREATE ROLE supabase_auth_admin;
  END IF;
END $$;

-- Re-grant permessi
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
```

### STEP 2: Force Reload GoTrue via Dashboard
L'unico modo garantito per forzare GoTrue a ricaricare la configurazione:

1. **Vai su**: https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi/auth/hooks
2. **Custom Access Token Hook**:
   - Se è ENABLED → Clicca "Disable"
   - Aspetta 10 secondi
   - Clicca "Enable"
   - Schema: `public`
   - Function: `custom_access_token_hook`
   - **SAVE**
3. **Aspetta 30 secondi** (GoTrue reload time)

### STEP 3: Invalidazione Sessioni Post-Reload
```sql
DELETE FROM auth.sessions;
DELETE FROM auth.refresh_tokens;
```

### STEP 4: Test Login Pulito
1. Chiudi **TUTTI i browser**
2. Riapri **nuovo browser** (in incognito è meglio)
3. Vai su app
4. Login con `agenziaseocagliari@gmail.com`
5. Console browser:
```javascript
const session = await supabase.auth.getSession();
const token = session.data.session.access_token;
const claims = JSON.parse(atob(token.split('.')[1]));
console.log('user_role:', claims.user_role);
```

---

## 📊 CHECKLIST FINALE

Prima del test login:
- [ ] TEST 1-9 di COMPREHENSIVE_AUTH_DIAGNOSIS.sql eseguiti
- [ ] Ruolo `supabase_auth_admin` verificato (esiste)
- [ ] Hook disabilitato e ri-abilitato nel Dashboard Supabase
- [ ] Aspettati 30 secondi dopo ri-abilitazione
- [ ] Sessioni invalidate con DELETE FROM auth.sessions
- [ ] Browser chiuso completamente

Durante il test:
- [ ] Nuovo browser (incognito consigliato)
- [ ] Login effettuato
- [ ] JWT verificato in console
- [ ] Claims `user_role` presente

---

## 🚨 SE ANCORA NON FUNZIONA

Se dopo tutti questi step il problema persiste, allora c'è un **BUG in Supabase GoTrue** o una configurazione nascosta.

### Fallback Strategy:
Implementare i custom claims **lato applicazione** usando il `service_role` per leggere il profile e iniettare i claims nel context dell'app (non ideale ma funzionale).

---

## 📝 NOTE TECNICHE

### Formato Event Hook
```typescript
{
  user_id: "uuid-string",
  claims: {}
}
```

### Return Format
```typescript
{
  claims: {
    user_role: "super_admin" | "enterprise" | ...,
    organization_id: "uuid-string",
    email: "string",
    full_name: "string",
    is_super_admin: true | undefined
  }
}
```

### GoTrue Configuration Reload
GoTrue carica la configurazione Auth Hooks:
1. All'avvio del servizio
2. Quando modifichi via Dashboard (trigger esplicito)
3. **NON** quando modifichi via API Management (cache)

Questo spiega perché l'hook enabled=true nell'API ma non funziona al login.

---

## ✅ PROSSIMO STEP OBBLIGATORIO

**ESEGUI COMPREHENSIVE_AUTH_DIAGNOSIS.sql e manda risultati TEST 1-9**

Questo è critico per verificare che `supabase_auth_admin` esista.
