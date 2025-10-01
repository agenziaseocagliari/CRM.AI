# ✅ Testing Checklist: SuperAdmin "Failed to fetch" Fix

**Issue Fixed:** Errore "Failed to fetch" quando si passa da account normale a super admin  
**Testing Target:** Verifica che tutte le correzioni funzionino correttamente in produzione

---

## 🧪 Test Scenarios

### Test 1: Utente Normale NON Vede Link Super Admin

**Prerequisiti:**
- Utente con `role = 'user'` nel database
- Utente ha fatto login

**Steps:**
1. Login come utente normale
2. Controlla la sidebar

**Expected:**
- ✅ Il link "Super Admin" NON è visibile nella sidebar
- ✅ Nessun errore nella console

**Actual:**
- [ ] Confermato

---

### Test 2: Utente con Vecchio JWT Tenta Accesso Super Admin

**Prerequisiti:**
- Utente con `role = 'user'` nel JWT (vecchio token)
- Ruolo cambiato a `super_admin` nel database (senza logout)

**Steps:**
1. Accedi manualmente a `/super-admin` (digita URL nel browser)
2. Controlla il messaggio di errore visualizzato

**Expected:**
- ✅ Nessun errore "Failed to fetch"
- ✅ Toast mostra messaggio chiaro: "Access denied. Your current role is: user. Please logout and login again if your role was recently changed."
- ✅ Pulsante "Vai al Login" presente nel toast
- ✅ Nessun errore CORS nella console del browser

**Actual:**
- [ ] Confermato

---

### Test 3: Cambio Ruolo + Logout + Login

**Prerequisiti:**
- Super Admin cambia ruolo di un utente da `user` a `super_admin`

**Steps:**
1. Super Admin usa `superadmin-update-user` per cambiare il ruolo
2. Utente target fa logout
3. Utente target fa login nuovamente
4. Controlla la sidebar

**Expected:**
- ✅ Dopo il login, il link "Super Admin" appare nella sidebar
- ✅ Cliccando sul link, la dashboard super admin carica correttamente
- ✅ Nessun errore nella console

**Actual:**
- [ ] Confermato

---

### Test 4: Token Refresh Automatico

**Prerequisiti:**
- Utente con vecchio JWT
- Ruolo cambiato nel database

**Steps:**
1. Aspetta che il token venga automaticamente refreshato (~1 ora)
   - OPPURE forza il refresh: `await supabase.auth.refreshSession()`
2. Controlla la sidebar

**Expected:**
- ✅ Dopo il refresh, il link "Super Admin" appare automaticamente
- ✅ L'accesso alla dashboard funziona

**Actual:**
- [ ] Confermato

---

### Test 5: CORS Headers su Errori

**Prerequisiti:**
- Browser con DevTools aperto
- Utente che riceve errore 403

**Steps:**
1. Trigger un errore 403 (es. tentativo accesso super admin con ruolo sbagliato)
2. Apri Network tab nelle DevTools
3. Controlla gli headers della risposta di errore

**Expected:**
- ✅ Headers presenti:
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type, x-n8n-api-key`
  - `Access-Control-Allow-Methods: POST, GET, OPTIONS`
- ✅ Nessun errore CORS nella console

**Actual:**
- [ ] Confermato

---

### Test 6: JWT Diagnostics Panel

**Prerequisiti:**
- Utente super admin loggato

**Steps:**
1. Accedi alla dashboard super admin
2. Controlla il JWT Status panel nella parte superiore della pagina

**Expected:**
- ✅ Panel mostra:
  - Token Valido: ✅ Sì
  - user_role: ✅ Presente
  - Ruolo: super_admin
  - Email: [email utente]
- ✅ Pulsante "Mostra Claims" espande i dettagli completi del JWT

**Actual:**
- [ ] Confermato

---

### Test 7: Auth State Change Listener

**Prerequisiti:**
- Browser con utente loggato

**Steps:**
1. Apri la console del browser
2. Fai logout
3. Controlla che il link "Super Admin" scompaia
4. Fai login come super admin
5. Controlla che il link "Super Admin" riappaia

**Expected:**
- ✅ Link scompare immediatamente al logout
- ✅ Link riappare immediatamente al login (se super_admin)
- ✅ Nessun flash/flicker della UI

**Actual:**
- [ ] Confermato

---

### Test 8: Backend Error Messages

**Prerequisiti:**
- Accesso ai logs del backend (Supabase Edge Functions)

**Steps:**
1. Trigger un errore di validazione super admin
2. Controlla i logs nel Supabase Dashboard

**Expected:**
- ✅ Log mostra dettagli chiari:
  ```
  [validateSuperAdmin] UNAUTHORIZED: Access denied
  {
    userId: "...",
    email: "...",
    userRole: "user",
    requiredRole: "super_admin"
  }
  ```
- ✅ Response body include:
  ```json
  {
    "error": "Access denied. Super Admin role required. Your current role is: user. Please logout and login again if your role was recently changed.",
    "diagnostics": {
      "timestamp": "...",
      "suggestion": "..."
    }
  }
  ```

**Actual:**
- [ ] Confermato

---

## 🔍 Verification Commands

### Check JWT Claims
```typescript
// In browser console
import { diagnoseJWT } from './lib/jwtUtils';
const session = await (await fetch('/api/session')).json();
const diagnostics = diagnoseJWT(session.access_token);
console.log('Has user_role:', diagnostics.hasUserRole);
console.log('User role:', diagnostics.claims?.user_role);
```

### Force Token Refresh
```typescript
// In browser console
await supabase.auth.refreshSession();
```

### Check Profile Role in Database
```sql
-- In Supabase SQL Editor
SELECT id, email, role FROM profiles WHERE email = 'user@example.com';
```

---

## 📊 Testing Matrix

| Test | Chrome | Firefox | Safari | Mobile |
|------|--------|---------|--------|--------|
| Test 1: Link non visibile | ⏳ | ⏳ | ⏳ | ⏳ |
| Test 2: Errore chiaro | ⏳ | ⏳ | ⏳ | ⏳ |
| Test 3: Logout/Login | ⏳ | ⏳ | ⏳ | ⏳ |
| Test 4: Token refresh | ⏳ | ⏳ | ⏳ | ⏳ |
| Test 5: CORS headers | ⏳ | ⏳ | ⏳ | ⏳ |
| Test 6: JWT panel | ⏳ | ⏳ | ⏳ | ⏳ |
| Test 7: Auth listener | ⏳ | ⏳ | ⏳ | ⏳ |
| Test 8: Backend logs | ⏳ | ⏳ | ⏳ | ⏳ |

**Legend:**
- ⏳ = Pending
- ✅ = Passed
- ❌ = Failed
- ⚠️ = Warning/Issue

---

## 🚨 Known Issues / Edge Cases

### Issue: Token Non Aggiornato Immediatamente

**Scenario:** Cambio ruolo nel database, utente continua a usare il vecchio token

**Expected Behavior:** 
- Link Super Admin non appare finché token non è refreshato
- Tentativo di accesso mostra messaggio chiaro

**Workaround:**
- Informare utente di fare logout/login
- Oppure aspettare refresh automatico (~1 ora)

**Status:** ⚠️ By design (non un bug)

---

### Issue: Link Appare/Scompare al Page Reload

**Scenario:** Utente ricarica la pagina, link può fare "flash"

**Expected Behavior:**
- Il check JWT avviene in `useEffect`, quindi può esserci un breve delay

**Mitigation:**
- Il delay è minimo (< 100ms)
- Non impatta l'usabilità

**Status:** ⚠️ Accettabile

---

## 📝 Test Results Summary

**Data Test:** _____________  
**Tester:** _____________  
**Environment:** _____________

### Results
- [ ] Tutti i test passati
- [ ] Alcuni test falliti (vedi note sotto)
- [ ] Test non completati

### Notes
```
[Spazio per note aggiuntive]




```

### Issues Found
```
[Documentare eventuali problemi riscontrati]




```

### Recommended Actions
```
[Azioni consigliate basate sui risultati]




```

---

**Prepared by:** GitHub Copilot  
**Last Updated:** 2025-01-20
