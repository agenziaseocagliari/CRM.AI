# 🚨 FIX CRITICO: Infinite Recursion in RLS Policies

## ❌ ERRORE

```json
{
  "code": "42P17",
  "message": "infinite recursion detected in policy for relation \"profiles\""
}
```

**Frontend**: "Errore nel caricamento agenti"  
**Root Cause**: RLS policies creano loop infinito

---

## 🔍 ROOT CAUSE ANALYSIS

### Problema: Recursive Policy Loop

**Policy ATTUALE (SBAGLIATA)**:
```sql
CREATE POLICY "Super admins can view all agents" ON automation_agents
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles           -- ❌ Query su profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_role = 'super_admin'
        )
    );
```

**Cosa succede**:
1. Frontend query: `SELECT * FROM automation_agents`
2. RLS check: Fa query su `profiles`
3. `profiles` ha RLS → Fa query su `profiles` stessa
4. **LOOP INFINITO** 🔄

### Perché SQL Editor funziona?

In **Supabase SQL Editor** le query sono eseguite come `postgres` superuser → **RLS BYPASS** automatico!

Nel **frontend** le query usano `anon` role → **RLS ACTIVE** → ricorsione!

---

## ✅ SOLUZIONE: Usare auth.jwt() Direttamente

### Approccio CORRETTO

**Policy NUOVA (CORRETTA)**:
```sql
CREATE POLICY "Super admins can view all agents" ON automation_agents
    FOR SELECT
    USING (
        COALESCE(
            (auth.jwt()->>'user_role'),              -- Check top-level
            (auth.jwt()->'user_metadata'->>'user_role')  -- Fallback
        ) = 'super_admin'
    );
```

**Vantaggi**:
- ✅ **Nessuna query** su altre tabelle
- ✅ **Nessuna ricorsione** possibile
- ✅ Legge **direttamente dal JWT token**
- ✅ Supporta **fallback** a user_metadata
- ✅ **Performance migliore** (no JOIN)

---

## 📋 ESECUZIONE FIX

### STEP 1: Esegui Fix Script

1. Vai su **Supabase Studio** → **SQL Editor**
2. Apri `FIX_INFINITE_RECURSION_RLS.sql`
3. **ESEGUI TUTTO** lo script

### STEP 2: Verifica JWT

Lo script include un test per mostrare il tuo JWT:
```sql
SELECT 
    auth.jwt()->>'user_role' as user_role_top_level,
    auth.jwt()->'user_metadata'->>'user_role' as user_role_metadata;
```

**Risultato atteso**:
```
user_role_top_level: null (o 'super_admin' se hook funziona)
user_role_metadata: 'super_admin'  ✅
```

### STEP 3: Test Accesso

Dopo il fix, esegui:
```sql
SELECT COUNT(*) FROM automation_agents;
```

**Risultato atteso**: `5` ✅

---

## 🎯 DIFFERENZE TRA APPROCCI

| Aspetto | Query su profiles ❌ | auth.jwt() ✅ |
|---------|---------------------|---------------|
| Performance | Lenta (JOIN) | Veloce (memoria) |
| Ricorsione | Possibile | Impossibile |
| Cache | No | Sì |
| Fallback | Complesso | Semplice (COALESCE) |
| Maintenance | Difficile | Facile |

---

## 🔧 PATTERN COALESCE

Il pattern `COALESCE` gestisce entrambi i casi:

```sql
COALESCE(
    (auth.jwt()->>'user_role'),           -- 1. Top-level (se hook funziona)
    (auth.jwt()->'user_metadata'->>'user_role')  -- 2. Fallback (sempre presente)
) = 'super_admin'
```

**Funziona in ENTRAMBI gli scenari**:
- ✅ Hook funziona → usa top-level `user_role`
- ✅ Hook non funziona → usa `user_metadata.user_role`

---

## 🧪 TEST POST-FIX

### Test 1: SQL Editor
```sql
SELECT * FROM automation_agents;
```
**Atteso**: 5 agenti ✅

### Test 2: Frontend
1. Ricarica pagina **Agenti AI**
2. **Nessun errore** in console ✅
3. Vedi **5 card** con agenti ✅

### Test 3: Network Tab
- Status: `200` ✅
- Response: Array con 5 oggetti ✅

---

## 📊 TABELLE FIXATE

Lo script `FIX_INFINITE_RECURSION_RLS.sql` aggiorna **15 policies** su **6 tabelle**:

1. ✅ `automation_agents` (4 policies)
2. ✅ `agent_execution_logs` (2 policies)
3. ✅ `api_integrations` (4 policies)
4. ✅ `integration_usage_logs` (2 policies)
5. ✅ `workflow_definitions` (2 policies)
6. ✅ `workflow_execution_logs` (1 policy)

---

## 🎓 LESSONS LEARNED

### 1. RLS Policies Best Practices

**❌ MAI fare query su tabelle con RLS in una policy**:
```sql
-- BAD: Può causare ricorsione
EXISTS (SELECT 1 FROM other_table WHERE ...)
```

**✅ SEMPRE usare funzioni auth.* dirette**:
```sql
-- GOOD: No ricorsione possibile
auth.jwt()->>'claim_name' = 'value'
```

### 2. Testing RLS

- ✅ Test in **SQL Editor** = Superuser = RLS bypass
- ✅ Test in **Frontend** = anon role = RLS active
- ✅ Usa `SET ROLE anon` in SQL Editor per testare RLS

### 3. JWT vs Database Queries

| Usa JWT quando | Usa Database quando |
|---------------|---------------------|
| Check ruolo utente | Query dati business |
| Permission check | Relazioni complesse |
| Claim semplici | Aggregazioni |
| Performance critiche | Join necessari |

---

## 🚀 DEPLOYMENT

**Nessun deployment frontend richiesto** - fix è solo database!

1. ✅ Esegui `FIX_INFINITE_RECURSION_RLS.sql` in Supabase
2. ✅ Ricarica pagina frontend (Ctrl+Shift+R)
3. ✅ Test funzionalità

---

**File**: `FIX_INFINITE_RECURSION_RLS.sql` ✅  
**Impact**: Fix critico per 6 tabelle super admin ✅  
**Urgenza**: ALTA - blocca tutti i moduli super admin ⚠️

---

**Autore**: GitHub Copilot  
**Error Code**: PostgreSQL 42P17  
**Solution**: Direct JWT claims access (no recursion)
