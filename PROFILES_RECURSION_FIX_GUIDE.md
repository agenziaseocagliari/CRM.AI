# FIX PROFILES TABLE - INFINITE RECURSION

## 🚨 PROBLEMA CRITICO

**Errore**: `infinite recursion detected in policy for relation "profiles"`  
**Codice**: PostgreSQL Error 42P17  
**Utente affetto**: webproseoid@gmail.com (enterprise)  
**User ID**: dfa97fa5-8375-4f15-ad95-53d339ebcda9

---

## 🔍 ROOT CAUSE ANALYSIS

### Scenario di Ricorsione

Le RLS policies sulla tabella `profiles` stavano probabilmente facendo query del tipo:

```sql
-- ❌ BROKEN (Causa ricorsione infinita)
CREATE POLICY "Some policy" ON profiles
    USING (
        EXISTS (
            SELECT 1 FROM profiles              -- ❌ Query su profiles
            WHERE profiles.id = auth.uid()      -- ❌ profiles ha RLS → recursion!
            AND profiles.user_role = 'enterprise'
        )
    );
```

**Cosa succede**:
1. Policy su `profiles` chiede "leggi da `profiles`"
2. Per leggere da `profiles` deve valutare le policies
3. Le policies chiedono di nuovo "leggi da `profiles`"
4. **Loop infinito** → PostgreSQL Error 42P17

---

## ✅ SOLUZIONE DEFINITIVA

### Pattern 1: Accesso al PROPRIO Profilo (auth.uid())

```sql
-- ✅ CORRECT - No recursion
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT
    USING (
        id = auth.uid()  -- ✅ Confronto diretto, nessuna query
    );
```

**Perché funziona**:
- `auth.uid()` restituisce UUID direttamente dalla sessione
- Nessuna query sulla tabella `profiles`
- Nessuna valutazione di altre policies
- **Zero possibilità di ricorsione**

### Pattern 2: Accesso per Super Admin (auth.jwt())

```sql
-- ✅ CORRECT - No recursion
CREATE POLICY "Super admins can view all profiles" ON profiles
    FOR SELECT
    USING (
        -- Check super_admin dal JWT (NO query su profiles)
        COALESCE(
            (auth.jwt()->>'user_role'),
            (auth.jwt()->'user_metadata'->>'user_role')
        ) = 'super_admin'
        OR
        -- OR utente vede il proprio profilo
        id = auth.uid()
    );
```

**Perché funziona**:
- `auth.jwt()` legge dal token in memoria
- Nessuna query sulla tabella `profiles`
- Pattern COALESCE supporta fallback
- **Zero possibilità di ricorsione**

---

## 📊 DIFFERENZA TRA SQL EDITOR E FRONTEND

| Contesto | Ruolo PostgreSQL | RLS Attivo | Ricorsione |
|----------|------------------|------------|------------|
| **SQL Editor (Supabase Studio)** | `postgres` (superuser) | ❌ No (bypass) | ❌ Non si verifica |
| **Frontend (anon role)** | `anon` / `authenticated` | ✅ Sì | ✅ Si verifica |

**Ecco perché le query funzionano in SQL Editor ma falliscono nel frontend!**

---

## 🎯 ESECUZIONE FIX

### Step 1: Apri SQL Editor in Supabase Studio
URL: https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi/sql/new

### Step 2: Esegui FIX_PROFILES_INFINITE_RECURSION.sql
Copia TUTTO il contenuto del file e incolla nell'editor SQL.

### Step 3: Verifica Output

**Query 1 (Verifica policies)**:
```
Dovrebbe mostrare tutte le policies con '✅ Direct auth.uid()' o '✅ Direct auth.jwt()'
Nessuna con '❌ Query on profiles (RECURSION!)'
```

**Query 5 (Test profilo enterprise)**:
```
| id | email | user_role | organization_id |
| dfa97fa5... | webproseoid@gmail.com | enterprise | <org_id> |
```

**Query 6 (Conta profili)**:
```
| total_profiles_visible | super_admins | enterprise_users |
| 2+ | 1+ | 1+ |
```

---

## 🧪 TEST FINALE

### Test 1: Login Utente Enterprise
1. Logout da account super_admin
2. Login come: webproseoid@gmail.com / WebProSEO@1980#
3. **Risultato atteso**: Accesso riuscito, nessun errore "infinite recursion"

### Test 2: Accesso Dashboard
1. Dopo login, verifica che carichi la dashboard
2. **Risultato atteso**: Dashboard caricata, profilo utente visibile

### Test 3: Super Admin Access
1. Login come: agenziaseocagliari@gmail.com
2. Vai su Super Admin → Customers o Team
3. **Risultato atteso**: Lista profili visibile senza errori

---

## 🏗️ ARCHITETTURA RLS - BEST PRACTICES

### ✅ DO (Fai così)

```sql
-- Pattern sicuro per vedere il proprio profilo
USING (id = auth.uid())

-- Pattern sicuro per super admin
USING (
    COALESCE(
        (auth.jwt()->>'user_role'),
        (auth.jwt()->'user_metadata'->>'user_role')
    ) = 'super_admin'
)

-- Pattern sicuro per organization member
USING (
    organization_id = COALESCE(
        (auth.jwt()->>'organization_id')::uuid,
        (auth.jwt()->'user_metadata'->>'organization_id')::uuid
    )
)
```

### ❌ DON'T (Non fare MAI)

```sql
-- ❌ MAI query sulla stessa tabella in una policy
USING (
    EXISTS (SELECT 1 FROM profiles WHERE ...)  -- RECURSION!
)

-- ❌ MAI query su altre tabelle con RLS in policy di tabelle con RLS
USING (
    EXISTS (SELECT 1 FROM other_table_with_rls WHERE ...)  -- POTENZIALE RECURSION!
)
```

---

## 📈 PERFORMANCE COMPARISON

| Metodo | Operazione | Performance | Recursion Risk |
|--------|------------|-------------|----------------|
| `auth.uid()` | Legge da sessione (memoria) | ⚡ Instantaneo | ✅ Zero |
| `auth.jwt()` | Legge token (memoria) | ⚡ Instantaneo | ✅ Zero |
| `SELECT FROM profiles` | Query DB + JOIN | 🐌 Lento | ❌ Alto |
| `SELECT FROM altra_tabella` | Query DB + JOIN + RLS | 🐌 Molto lento | ❌ Medio |

---

## 🔧 TROUBLESHOOTING

### Problema: "Still getting recursion error"

**Soluzione**:
1. Verifica che TUTTE le policies siano state droppate:
   ```sql
   SELECT policyname FROM pg_policies WHERE tablename = 'profiles';
   ```
2. Ri-esegui tutto il blocco DROP POLICY
3. Ri-esegui tutto il blocco CREATE POLICY

### Problema: "User still can't see their profile"

**Soluzione**:
1. Verifica JWT dell'utente:
   ```sql
   SELECT raw_user_meta_data FROM auth.users WHERE email = 'webproseoid@gmail.com';
   ```
2. Verifica che `user_role` sia in `raw_user_meta_data`
3. Se mancante, aggiorna user_metadata con script apposito

### Problema: "Super admin can't see all profiles"

**Soluzione**:
1. Verifica JWT super admin:
   ```sql
   SELECT 
       auth.jwt()->>'user_role' as top_level,
       auth.jwt()->'user_metadata'->>'user_role' as metadata
   ```
2. Deve esserci `'super_admin'` in almeno uno dei due

---

## 📝 CHECKLIST POST-FIX

- [ ] FIX_PROFILES_INFINITE_RECURSION.sql eseguito senza errori
- [ ] Query verifica policies mostra solo '✅' (no '❌')
- [ ] Test profilo enterprise mostra 1 riga (webproseoid@gmail.com)
- [ ] Login enterprise funziona senza errori
- [ ] Dashboard enterprise carica correttamente
- [ ] Super admin vede tutti i profili
- [ ] Nessun errore 42P17 nei log

---

## 🎯 NEXT STEPS

Dopo aver eseguito questo fix:

1. **Esegui FIX_PROFILES_INFINITE_RECURSION.sql** in Supabase Studio
2. **Test login enterprise**: webproseoid@gmail.com
3. **Test login super_admin**: agenziaseocagliari@gmail.com
4. **Verifica frontend**: Entrambi gli account devono funzionare senza errori
5. **Git commit**: Documenta il fix nel repository

---

## 📚 FILES CORRELATI

- `FIX_INFINITE_RECURSION_RLS.sql` - Fix per automation_agents e altre tabelle
- `FIX_PROFILES_INFINITE_RECURSION.sql` - Fix per tabella profiles (QUESTO FILE)
- `INFINITE_RECURSION_FIX_GUIDE.md` - Guida generale sulla ricorsione RLS

---

**Data fix**: 2025-01-10  
**Urgenza**: 🚨 CRITICA  
**Impatto**: Blocca login utenti enterprise  
**Soluzione**: Definitiva (usa auth.uid() e auth.jwt() direttamente)
