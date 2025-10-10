# 🔍 ROOT CAUSE ANALYSIS - JWT user_role Mancante

## ✅ PROBLEMA IDENTIFICATO

### Situazione Attuale:

**Database: ✅ PERFETTO**
- ✅ Utente `agenziaseocagliari@gmail.com` esiste in `profiles` con `user_role='super_admin'`
- ✅ Utente `webproseoid@gmail.com` esiste in `profiles` con `user_role='enterprise'`  
- ✅ Funzione SQL `custom_access_token_hook()` esiste nel database
- ✅ Entrambi hanno `organization_id` assegnato

**Auth Hook: ❌ NON CONFIGURATO**
- ❌ La funzione `custom_access_token_hook` **NON è registrata** in Supabase Auth
- ❌ I JWT token vengono generati **SENZA** chiamare la funzione hook
- ❌ Risultato: JWT token senza `user_role` e `organization_id` nei claims

### Root Cause:

La funzione PostgreSQL esiste ma **Supabase Auth non sa che deve chiamarla** durante la generazione dei JWT token.

## 🎯 SOLUZIONE DEFINITIVA

### Opzione 1: Configurazione via Supabase Dashboard (RACCOMANDATO)

**Steps**:
1. Vai su: https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi
2. Naviga a: **Authentication** → **Hooks**
3. Abilita: **Custom Access Token** hook
4. Seleziona funzione: `custom_access_token_hook` (schema: `public`)
5. Salva la configurazione

**Dopo la configurazione**:
- TUTTI gli utenti devono fare **LOGOUT e RE-LOGIN**
- I nuovi token JWT conterranno automaticamente `user_role` e `organization_id`

### Opzione 2: Configurazione via SQL (Solo per self-hosted)

```sql
-- NOTA: Questo funziona SOLO per installazioni self-hosted di Supabase
-- Per Supabase Cloud DEVI usare il Dashboard
INSERT INTO auth.config (parameter, value)
VALUES ('auth.hook.custom_access_token.uri', 'pg-functions://postgres/public/custom_access_token_hook')
ON CONFLICT (parameter) DO UPDATE SET value = EXCLUDED.value;
```

### Opzione 3: Configurazione via Supabase CLI Secrets

```bash
# Questo potrebbe funzionare per Supabase Cloud
npx supabase secrets set AUTH_HOOK_CUSTOM_ACCESS_TOKEN_URI="pg-functions://postgres/public/custom_access_token_hook" --project-ref qjtaqrlpronohgpfdxsi
```

## 📋 PROCEDURA COMPLETA DI FIX

### Step 1: Configurare Hook in Supabase Dashboard

✅ Vai su Dashboard Authentication → Hooks
✅ Abilita "Custom Access Token"  
✅ Seleziona funzione `public.custom_access_token_hook`
✅ Salva

### Step 2: Forzare Logout Utenti Esistenti

Tutti gli utenti con token vecchi (senza claims) devono rifare login:

**Frontend - Opzione A (Soft Reset)**:
```typescript
// In AuthContext o componente principale
const forceReloginForOldTokens = async () => {
  const session = await supabase.auth.getSession();
  if (session?.data?.session) {
    const diagnostics = diagnoseJWT(session.data.session.access_token);
    if (!diagnostics.hasUserRole) {
      // Token vecchio, forza logout
      await supabase.auth.signOut();
      toast.warning('Per favore, effettua nuovamente il login per aggiornare le tue credenziali.');
      navigate('/login');
    }
  }
};
```

**Backend - Opzione B (Force Logout via SQL)**:
```sql
-- ATTENZIONE: Questo invalida TUTTE le sessioni attive
-- Usare solo se necessario
DELETE FROM auth.sessions WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('agenziaseocagliari@gmail.com', 'webproseoid@gmail.com')
);
```

### Step 3: Test Login

1. Logout completo
2. Effettua login con `agenziaseocagliari@gmail.com`
3. Verifica JWT token contenga `user_role: 'super_admin'`
4. Ripeti per `webproseoid@gmail.com` → `user_role: 'enterprise'`

### Step 4: Verifica

```typescript
// In browser console dopo login
const session = await supabase.auth.getSession();
const token = session.data.session.access_token;
const claims = JSON.parse(atob(token.split('.')[1]));
console.log('Claims:', claims);
console.log('user_role:', claims.user_role); // Deve essere presente!
```

## 🚨 ALTERNATIVA: Workaround Temporaneo (NON RACCOMANDATO)

Se per qualche motivo non puoi configurare l'hook immediatamente, puoi:

1. **Modificare `custom_access_token_hook` per usare `app_metadata`**:
```sql
-- Update app_metadata in auth.users (una tantum)
UPDATE auth.users au
SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object(
  'user_role', p.user_role,
  'organization_id', p.organization_id::text
)
FROM public.profiles p
WHERE au.id = p.id
AND au.email IN ('agenziaseocagliari@gmail.com', 'webproseoid@gmail.com');
```

2. **Frontend fallback**:
```typescript
// Se user_role non è in claims, query profiles
if (!claims.user_role && userId) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_role, organization_id')
    .eq('id', userId)
    .single();
  
  // Usa profile.user_role come fallback
}
```

**⚠️ PROBLEMA**: Questo workaround richiede query extra e non risolve il problema alla radice.

## ✅ SOLUZIONE RACCOMANDATA

**PRIORITÀ ASSOLUTA**: Configurare l'Auth Hook via Dashboard

**Tempo Stimato**: 5 minuti
**Complessità**: Bassa
**Robustezza**: Massima (soluzione definitiva)

---

**Prossimo Step**: Accedere al Supabase Dashboard e configurare l'hook come descritto sopra.

