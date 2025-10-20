# ✅ CHECKLIST ESECUZIONE: Fix Schema Insurance Policies

**Data**: 2025-10-20  
**Commit**: 9b5b62d  
**Branch**: main

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### Verifica Pre-requisiti

- [x] ✅ Git commit pushato su main
- [x] ✅ Tutti i file necessari presenti:
  - `supabase/migrations/20251020_fix_insurance_policies_schema.sql`
  - `deploy-schema-fix.ps1`
  - `src/__tests__/integration/insurance-policies-schema.test.ts`
  - `INSURANCE_POLICIES_SCHEMA_FIX.md`
- [x] ✅ Zero errori di lint
- [x] ✅ Build locale funzionante

### Verifica Ambiente

- [ ] Supabase CLI installato (`npx supabase --version`)
- [ ] Accesso al progetto Supabase (project-ref: qjtaqrlpronohgpfdxsi)
- [ ] Credentials configurate (SUPABASE_ACCESS_TOKEN o login)

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Esegui Deploy Script

```powershell
# Da eseguire nella root del progetto
.\deploy-schema-fix.ps1
```

**Output atteso**:
```
🚀 Deployment: Insurance Policies Schema Fix
✅ Supabase CLI found
✅ Successfully linked to project
✅ Migration applied successfully
✅ Schema cache reload signal sent
✅ Foreign keys verified
✅ renewal_reminders view is accessible
✅ DEPLOYMENT COMPLETED
```

**Se fallisce**:
- Verifica credentials Supabase
- Controlla connessione internet
- Prova deployment manuale (vedi Step 2)

### Step 2: Deployment Manuale (se script fallisce)

```powershell
# 1. Link al progetto
npx supabase link --project-ref qjtaqrlpronohgpfdxsi

# 2. Apply migration
npx supabase db push --include-all

# 3. Reload schema cache
npx supabase db execute --sql "NOTIFY pgrst, 'reload schema';"

# 4. Verifica FK
npx supabase db execute --sql "
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS references_table
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'insurance_policies'
ORDER BY tc.constraint_name;
"
```

**Output atteso del verify**:
```
fk_insurance_policies_contact       | contact_id       | contacts
fk_insurance_policies_organization  | organization_id  | organizations
fk_insurance_policies_created_by    | created_by       | profiles
```

### Step 3: Reload Schema Cache (via Dashboard se necessario)

**Se NOTIFY pgrst fallisce**:

1. Vai su [Supabase Dashboard](https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi)
2. Naviga su **Database** → **API Settings**
3. Scroll down a **"PostgREST Schema Cache"**
4. Click sul bottone **"Reload Schema Cache"**
5. Attendi conferma (toast notification verde)

---

## 🧪 POST-DEPLOYMENT TESTING

### Test 1: Integration Test Suite

```powershell
# Run integration tests
npm run test -- --testPathPattern="insurance-policies-schema" --silent=false
```

**Success criteria**:
- ✅ 9/9 test passati
- ✅ Nessun errore "relationship"
- ✅ Query performance < 2s

**Expected output**:
```
PASS  src/__tests__/integration/insurance-policies-schema.test.ts
  Insurance Policies Schema Relationships
    Foreign Key Constraints
      ✓ should have FK from insurance_policies to contacts
      ✓ should have FK from insurance_policies to organizations
      ✓ should have optional FK from insurance_policies.created_by to profiles
    Renewal Reminders View
      ✓ should load renewal_reminders view without relationship errors
      ✓ should filter renewal_reminders by organization
      ✓ should include client_name from contacts relationship
    Policy Loading Integration
      ✓ should load policies with nested contact data
      ✓ should handle policies with null contacts gracefully
    Performance and Indexing
      ✓ should efficiently query policies by status and end_date
      ✓ should efficiently query renewal_reminders by organization
    Schema Cache Validation
      ✓ should not throw "Could not find a relationship" error

Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
```

### Test 2: Database Direct Query

```powershell
# Test renewal_reminders view
npx supabase db execute --sql "SELECT COUNT(*) FROM renewal_reminders;"

# Test nested query
npx supabase db execute --sql "
SELECT 
    ip.id,
    ip.policy_number,
    c.name as contact_name
FROM insurance_policies ip
LEFT JOIN contacts c ON ip.contact_id = c.id
LIMIT 5;
"
```

**Success criteria**:
- ✅ Nessun errore "relationship"
- ✅ Query completate con successo
- ✅ Dati ritornati (se presenti polizze)

### Test 3: UI Manual Test

#### 3.1 Development Environment

```powershell
# Start dev server (se non già running)
npm run dev
```

1. Apri browser su `http://localhost:5173`
2. Login con credenziali test
3. Naviga su **Insurance** → **Calendario Scadenzario**
4. Verifica:
   - ✅ Pagina si carica senza errori console
   - ✅ Polizze visualizzate con nomi clienti
   - ✅ Filtri organizzazione funzionanti
   - ✅ Ordinamento per data funzionante

#### 3.2 Production Environment

**Dopo deploy Vercel**:

1. Vai su `https://crm-ai-rho.vercel.app`
2. Ripeti gli stessi test del dev environment
3. Verifica nessun errore in console browser (F12)

---

## 📊 MONITORING POST-DEPLOYMENT

### Check 1: Error Logs (Prime 2 ore)

```powershell
# Via Supabase Dashboard
```

1. Dashboard → **Logs** → **Error Logs**
2. Filtra per "relationship" o "schema cache"
3. Verifica zero errori correlati

### Check 2: Application Insights

**Metriche da monitorare**:
- ✅ Renewal calendar page views (dovrebbero tornare normali)
- ✅ Error rate insurance module (dovrebbe scendere)
- ✅ Query latency renewal_reminders (< 2s)

### Check 3: User Feedback

**Conferma con stakeholder**:
- [ ] Claudio Comunale può accedere calendario scadenzario
- [ ] Polizze si caricano correttamente
- [ ] Nomi clienti visualizzati
- [ ] Nessun errore visibile

---

## 🔄 ROLLBACK PROCEDURE (se necessario)

### Opzione 1: Revert Migration

```powershell
# Crea migration di rollback
npx supabase db diff --file rollback_insurance_policies_schema

# Modifica il file per droppare i constraint
# Poi applica
npx supabase db push
```

### Opzione 2: Drop FK Manualmente

```sql
-- Drop FK constraints
ALTER TABLE insurance_policies 
DROP CONSTRAINT IF EXISTS fk_insurance_policies_contact;

ALTER TABLE insurance_policies 
DROP CONSTRAINT IF EXISTS fk_insurance_policies_organization;

ALTER TABLE insurance_policies 
DROP CONSTRAINT IF EXISTS fk_insurance_policies_created_by;
```

### Opzione 3: Revert Git Commit

```powershell
# Revert commit
git revert 9b5b62d

# Push revert
git push origin main

# Re-deploy database
npx supabase db push
```

---

## ✅ COMPLETION CHECKLIST

### Deployment Completato

- [ ] ✅ Deploy script eseguito con successo
- [ ] ✅ 3 FK constraints creati e verificati
- [ ] ✅ PostgREST schema cache reloaded
- [ ] ✅ Integration tests passati (9/9)
- [ ] ✅ Database queries funzionanti
- [ ] ✅ UI calendario carica senza errori
- [ ] ✅ Zero errori "relationship" nei log

### Documentazione

- [x] ✅ INSURANCE_POLICIES_SCHEMA_FIX.md creato
- [x] ✅ Commit message dettagliato
- [ ] ✅ Team notificato del fix
- [ ] ✅ Stakeholder confermano funzionamento

### Monitoring

- [ ] ✅ Error logs monitorati per 2 ore
- [ ] ✅ User feedback positivo
- [ ] ✅ Performance metrics normali

---

## 📝 NOTES & OBSERVATIONS

### Problemi Riscontrati Durante Deploy
*(Compila durante l'esecuzione)*

```
[Timestamp] [Problema] [Soluzione Applicata]
```

### Metriche Performance

```
Query renewal_reminders (pre-fix):  ERROR
Query renewal_reminders (post-fix): [___] ms
```

### User Feedback

```
[User] [Date] [Feedback]
```

---

## 🎯 SUCCESS CRITERIA FINALI

- [x] ✅ **Zero errori** "Could not find a relationship"
- [ ] ✅ **100% test passati** (9/9)
- [ ] ✅ **UI funzionale** - calendario scadenzario
- [ ] ✅ **Performance OK** - query < 2s
- [ ] ✅ **User satisfaction** - feedback positivo

---

## 📞 SUPPORT CONTACTS

**In caso di problemi**:

- **Technical**: Claude Sonnet 4.5 (via chat)
- **Database**: Supabase Support (support@supabase.io)
- **Business**: [Stakeholder contact]

**Documentazione**:
- `INSURANCE_POLICIES_SCHEMA_FIX.md` - Dettagli tecnici completi
- Supabase Dashboard: https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi

---

**Fine Checklist**  
**Status**: ⏳ READY FOR DEPLOYMENT
