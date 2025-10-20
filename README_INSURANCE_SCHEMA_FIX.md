# 🚀 Quick Start: Insurance Policies Schema Fix

> **Fix per**: "Could not find a relationship between 'insurance_policies' and 'profiles' in the schema cache"

---

## ⚡ ESECUZIONE RAPIDA (3 minuti)

### 1️⃣ Deploy Automatico

```powershell
# Esegui lo script di deploy
.\deploy-schema-fix.ps1
```

✅ **Fatto!** Lo script fa tutto automaticamente:
- Apply migration
- Reload schema cache
- Verifica FK constraints
- Test database

---

### 2️⃣ Test Integrazione

```powershell
# Run test suite
npm run test -- --testPathPattern="insurance-policies-schema"
```

✅ **Atteso**: 9/9 test passati

---

### 3️⃣ Verifica UI

1. Apri app: `npm run dev`
2. Vai su **Insurance → Calendario Scadenzario**
3. ✅ **Verifica**: Nessun errore, polizze visibili

---

## 📚 DOCUMENTAZIONE COMPLETA

- **Dettagli tecnici**: [INSURANCE_POLICIES_SCHEMA_FIX.md](./INSURANCE_POLICIES_SCHEMA_FIX.md)
- **Checklist deployment**: [DEPLOYMENT_CHECKLIST_INSURANCE_SCHEMA.md](./DEPLOYMENT_CHECKLIST_INSURANCE_SCHEMA.md)

---

## 🆘 TROUBLESHOOTING RAPIDO

### ❌ Script fallisce?

**Soluzione**: Deploy manuale

```powershell
# 1. Apply migration
npx supabase db push --include-all

# 2. Reload cache
npx supabase db execute --sql "NOTIFY pgrst, 'reload schema';"
```

### ❌ Cache non si aggiorna?

**Soluzione**: Reload via Dashboard

1. Vai su [Supabase Dashboard](https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi/settings/api)
2. Click **"Reload Schema Cache"**

### ❌ Test falliscono?

**Verifica**:
```powershell
# Check FK creati
npx supabase db execute --sql "
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'insurance_policies' 
AND constraint_type = 'FOREIGN KEY';
"
```

**Atteso**: 3 FK (contact, organization, created_by)

---

## ✅ SUCCESS CRITERIA

- ✅ Zero errori "relationship"
- ✅ Calendario scadenzario funzionante
- ✅ 9/9 test passati

---

## 📦 FILES INCLUSI

```
supabase/migrations/
  └─ 20251020_fix_insurance_policies_schema.sql  # Migration SQL

deploy-schema-fix.ps1                             # Deploy script

src/__tests__/integration/
  └─ insurance-policies-schema.test.ts            # Integration tests

INSURANCE_POLICIES_SCHEMA_FIX.md                  # Documentazione completa
DEPLOYMENT_CHECKLIST_INSURANCE_SCHEMA.md          # Checklist dettagliata
README_INSURANCE_SCHEMA_FIX.md                    # Questa guida
```

---

**Tempo stimato**: 3-5 minuti  
**Difficoltà**: ⭐ Facile (script automatico)  
**Impatto**: 🔥 Critico (fix errore bloccante)
