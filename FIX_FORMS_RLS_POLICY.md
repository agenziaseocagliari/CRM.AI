# 🛑 FIX CRITICO: RLS Policy Forms Table

## ❌ ERRORE RISCONTRATO

**Messaggio:**
```
Errore durante il salvaggio: new row violates row-level security policy for table "forms"
```

**Quando:** Durante il save di un nuovo form

**Causa:** Le RLS (Row Level Security) policies della tabella `forms` non permettono INSERT

---

## 🔍 DIAGNOSI

### Problema:
La tabella `forms` ha RLS abilitato MA manca la policy per INSERT, oppure la policy esistente non matcha le condizioni.

### RLS Policy Requirements:
Per permettere a un utente di inserire un form, la policy deve verificare:
1. L'utente è autenticato (`auth.uid()` esiste)
2. L'`organization_id` del form corrisponde all'organization dell'utente
3. L'utente ha un profile valido collegato a quell'organization

---

## ✅ SOLUZIONE ROBUSTA

### File: `supabase/migrations/20251010_fix_forms_rls_policies.sql`

```sql
-- Enable RLS
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

-- DROP existing policies (clean slate)
DROP POLICY IF EXISTS "forms_select_policy" ON public.forms;
DROP POLICY IF EXISTS "forms_insert_policy" ON public.forms;
DROP POLICY IF EXISTS "forms_update_policy" ON public.forms;
DROP POLICY IF EXISTS "forms_delete_policy" ON public.forms;

-- SELECT: Users can view forms from their organization
CREATE POLICY "forms_select_policy" ON public.forms
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- INSERT: Users can create forms for their organization
CREATE POLICY "forms_insert_policy" ON public.forms
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- UPDATE: Users can update forms from their organization
CREATE POLICY "forms_update_policy" ON public.forms
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- DELETE: Users can delete forms from their organization
CREATE POLICY "forms_delete_policy" ON public.forms
FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);
```

---

## 📋 COME APPLICARE

### **Opzione 1: Supabase SQL Editor (CONSIGLIATO)**

1. Vai a: https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi/sql/new
2. Copia il contenuto di `supabase/migrations/20251010_fix_forms_rls_policies.sql`
3. Click "Run"
4. Verifica che appaia: "Success. No rows returned"

### **Opzione 2: Terminal con psql**

```bash
psql "postgresql://postgres.qjtaqrlpronohgpfdxsi:WebProSEO@1980%23@db.qjtaqrlpronohgpfdxsi.supabase.co:5432/postgres" \
  -f supabase/migrations/20251010_fix_forms_rls_policies.sql
```

---

## 🧪 VERIFICA

### Test 1: Check Policies Exist
```sql
SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'forms'
ORDER BY policyname;
```

**Expected Output:**
```
policyname               | cmd    | permissive
-------------------------+--------+-----------
forms_delete_policy      | DELETE | PERMISSIVE
forms_insert_policy      | INSERT | PERMISSIVE
forms_select_policy      | SELECT | PERMISSIVE
forms_update_policy      | UPDATE | PERMISSIVE
```

### Test 2: Try INSERT from Frontend
```
1. Login: admin@agenziaseocagliari.it
2. Vai a Forms module
3. Crea nuovo form con AI
4. Save
```

**Expected:** ✅ "Form salvato con successo!"

---

## 🔐 COME FUNZIONANO LE POLICIES

### **INSERT Policy Logic:**
```sql
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
)
```

**Traduzione:**
1. `auth.uid()` → ID dell'utente loggato (dal JWT token)
2. Query sul `profiles` → trova l'`organization_id` dell'utente
3. `WITH CHECK` → verifica che l'`organization_id` del form da inserire corrisponda

**Se match:** ✅ INSERT permesso  
**Se NO match:** ❌ "new row violates row-level security policy"

---

## 🛡️ SICUREZZA

### **Cosa prevengono queste policies:**

✅ **Prevent:**
- Utenti che inseriscono form per altre organizations
- Utenti non autenticati che accedono ai form
- Cross-organization data leakage

✅ **Allow:**
- Utenti autenticati che creano form per la loro org
- Utenti che vedono solo i form della loro org
- Utenti che modificano solo i form della loro org

---

## 📊 BEFORE vs AFTER

### **BEFORE (Broken):**
```
User clicks Save
  ↓
Supabase checks RLS
  ↓
No INSERT policy OR policy fails
  ↓
❌ Error: "new row violates row-level security policy"
```

### **AFTER (Fixed):**
```
User clicks Save
  ↓
Supabase checks RLS
  ↓
INSERT policy checks:
  - auth.uid() exists? ✅
  - organization_id matches profile? ✅
  ↓
✅ Form saved successfully!
```

---

## 🚀 AZIONE RICHIESTA

**STEP 1:** Applica il SQL (opzione 1 o 2 sopra)

**STEP 2:** Testa il save form

**STEP 3:** Se funziona, committa la migrazione:
```bash
git add supabase/migrations/20251010_fix_forms_rls_policies.sql
git commit -m "fix: Add RLS policies for forms table INSERT/UPDATE/DELETE"
git push origin main
```

---

## ⚠️ NOTE IMPORTANTI

1. **RLS è CRITICO per la sicurezza** - Non disabilitarlo mai in production
2. **profiles table deve esistere** - Assicurati che ogni utente abbia un profile
3. **organization_id deve essere valido** - Verifica che non sia NULL
4. **auth.uid() deve esistere** - Utente deve essere autenticato

---

**STATUS:** ⏸️ **WAITING FOR FIX APPLICATION**  
**Priority:** 🔴 **CRITICAL** (blocca save form)  
**Impact:** Forms module non utilizzabile fino al fix
