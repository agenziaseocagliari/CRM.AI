# 🔍 DEBUG: "Errore nel caricamento agenti"

## 🎯 PROBLEMA

Frontend mostra: **"Errore nel caricamento agenti: Errore sconosciuto"**

Database ha **5 agenti** e **RLS policies funzionano** ✅

---

## 🔍 CAUSE POSSIBILI

### 1. Sessione JWT Scaduta o Invalida
- Il frontend usa un token JWT scaduto
- Il token non contiene `user_role = 'super_admin'`

### 2. CORS o Network Error
- Supabase URL non raggiungibile
- CORS policy blocca la richiesta

### 3. RLS Policy Mismatch
- La policy controlla qualcosa che il JWT non ha
- Policy funziona in SQL Editor ma non via API

### 4. TypeScript Type Mismatch
- Database ha colonne diverse da tipo TypeScript
- Parsing JSON fallisce

---

## ✅ DEBUGGING STEP-BY-STEP

### STEP 1: Verifica Console Browser

**Apri DevTools** (F12) → **Console Tab**

Cerca questi log aggiunti:
```
❌ [AutomationAgents] Supabase error: {...}
❌ [AutomationAgents] Full error: {...}
```

**O anche**:
```
✅ [AutomationAgents] Loaded agents: 5
```

### STEP 2: Verifica Network Tab

**DevTools** → **Network Tab**

1. Filtra per: `automation_agents`
2. Clicca sulla richiesta
3. Verifica:
   - **Status**: Deve essere `200` ✅
   - **Response**: Deve contenere array con 5 oggetti
   - **Headers**: Controlla `Authorization: Bearer ...`

**Possibili errori**:
- Status `401` → JWT invalido o scaduto
- Status `403` → RLS policy blocca (ma SQL Editor funziona?)
- Status `500` → Errore server Supabase
- Response vuoto `[]` → RLS blocca

### STEP 3: Verifica JWT Token

1. **DevTools** → **Application** → **Local Storage**
2. Cerca chiave tipo: `sb-qjtaqrlpronohgpfdxsi-auth-token`
3. Copia il token
4. Vai su: https://jwt.io
5. Incolla e verifica:
   ```json
   {
     "user_metadata": {
       "user_role": "super_admin",  // ✅ DEVE esistere
       "organization_id": "..."
     }
   }
   ```

**Se `user_role` manca**: LOGOUT + LOGIN di nuovo

### STEP 4: Hard Reload

- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`
- O usa **finestra Incognito**

### STEP 5: Test con Console Browser

Apri **Console** e esegui:

```javascript
// Test 1: Verifica client Supabase
console.log('Supabase client:', window.supabase);

// Test 2: Verifica sessione
const { data: session } = await window.supabase.auth.getSession();
console.log('Session:', session);
console.log('User role:', session?.session?.user?.user_metadata?.user_role);

// Test 3: Query manuale
const { data, error } = await window.supabase
  .from('automation_agents')
  .select('*');
console.log('Agents data:', data);
console.log('Agents error:', error);
```

---

## 🔧 SOLUZIONI

### Soluzione 1: Re-login
Se JWT scaduto o invalido:
1. Click **Logout**
2. **Login** di nuovo con: agenziaseocagliari@gmail.com
3. Vai su **Agenti AI**

### Soluzione 2: Clear Storage + Hard Reload
```javascript
// In Console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Soluzione 3: Verifica Supabase Client Init
Controlla che il client Supabase sia inizializzato con l'URL corretto:

```typescript
// src/lib/supabaseClient.ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

### Soluzione 4: Verifica .env
```bash
# .env.local
VITE_SUPABASE_URL=https://qjtaqrlpronohgpfdxsi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## 📊 INFORMAZIONI DA FORNIRE

Per aiutarti meglio, fornisci:

1. **Console Log** completo (dopo reload)
2. **Network Tab**: Screenshot della richiesta `automation_agents`
3. **JWT Token** (primi 50 caratteri)
4. **Response** della richiesta (se presente)

---

## 🎯 PROSSIMI STEP

1. Apri **DevTools** (F12)
2. Vai su **Console Tab**
3. **Ricarica** pagina Agenti AI
4. Cerca log `[AutomationAgents]`
5. Copia e invia il **messaggio di errore completo**

---

**File aggiornati**:
- `AutomationAgents.tsx` → Migliore error logging ✅
- `DEBUG_AGENTS_QUERY.sql` → Test query identica al frontend ✅

**Next**: Attendo log console per debug preciso
