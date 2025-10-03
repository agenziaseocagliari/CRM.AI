# 🛠️ Scripts di Utilità Guardian AI CRM

Questa directory contiene script per automatizzare verifiche e manutenzione del repository.

---

## 📜 Script Disponibili

### verify-role-cleanup.sh

Script di verifica completa per assicurare che non ci siano riferimenti problematici a ruoli PostgreSQL nel database.

**Uso**:
```bash
./scripts/verify-role-cleanup.sh
```

**Cosa Verifica**:
1. ✅ Nessun riferimento a `TO super_admin`
2. ✅ Nessun riferimento a `TO authenticated`
3. ✅ Nessun riferimento a `TO service_role`
4. ✅ Nessun statement `SET ROLE`
5. ✅ Nessun statement `CREATE/ALTER/DROP ROLE`
6. ✅ Nessun `GRANT` a ruoli DB non esistenti
7. ✅ Nessun parametro `role=` in connection strings
8. ✅ Tutte le policy RLS usano `TO public`

**Output**:
```
✅ ALL CHECKS PASSED!
The codebase is clean and ready for deployment.
No problematic PostgreSQL role references found.
```

**Exit Codes**:
- `0`: Tutti i check passati
- `1`: Errori trovati che devono essere corretti

---

### verify-rls-policies.sh

Script di verifica specifico per le RLS policies e la loro compliance con le best practices.

**Uso**:
```bash
./scripts/verify-rls-policies.sh
```

**Cosa Verifica**:
1. ✅ Policy usano solo `TO public`
2. ✅ Filtri custom claim (`profiles.role`) implementati
3. ✅ Naming convention migration files
4. ✅ Nessuna policy eccessivamente permissiva

---

### verify-sync.sh

Script di verifica automatica della sincronizzazione GitHub ↔️ Supabase.

**Uso**:
```bash
./scripts/verify-sync.sh
```

**Cosa Verifica**:
1. ✅ Integrità repository Git
2. ✅ Build TypeScript
3. ✅ Inventario edge functions (22 attese)
4. ✅ Documentazione completa
5. ✅ Migrations database
6. ✅ Security check (secrets)
7. ✅ Supabase CLI (opzionale)

**Output**:
- ✓ Check passati (verde)
- ⚠ Warning (giallo)
- ✗ Check falliti (rosso)
- Report finale con conteggio

**Exit Codes**:
- `0`: Tutti i check passati o solo warnings
- `1`: Alcuni check falliti

**Esempio Output**:
```
╔════════════════════════════════════════════════════╗
║   Guardian AI CRM - Sync Verification Script      ║
║   Automated checks for GitHub ↔️ Supabase         ║
╚════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1️⃣  Repository Integrity Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Git repository detected
✓ No uncommitted changes
✓ .github/workflows directory exists
✓ deploy-supabase.yml workflow found
✓ No duplicate 'shared/' directory
✓ _shared directory exists
✓ _shared/cors.ts exists
✓ _shared/supabase.ts exists
✓ _shared/google.ts exists
✓ _shared/diagnostics.ts exists

[... altri check ...]

📊 Verification Summary

Total Checks: 45
Passed: 42
Warnings: 3
Failed: 0

⚠ Some warnings found. Review them for improvements.
```

---

### test-superadmin.sh

Script per testare le funzionalità Super Admin delle edge functions.

**Uso**:
```bash
./scripts/test-superadmin.sh
```

**Cosa Testa**:
- Deployment delle 8 edge functions super admin
- Verifica security checks
- Test endpoint availability

---

### vercel-metrics.cjs

Script Node.js per monitorare l'utilizzo delle risorse Vercel e generare report dettagliati.

**Uso**:
```bash
# Export token (richiesto)
export VERCEL_TOKEN=xxx

# Se usi Vercel Team account
export VERCEL_TEAM_ID=yyy

# Esegui script
node scripts/vercel-metrics.cjs
```

**Cosa Monitora**:
1. 📊 Totale deployments (production vs preview)
2. 📅 Activity ultimi 7/30 giorni
3. ✅ Build success rate
4. 👁️ Preview environments attivi
5. ⚠️ Warning su usage eccessivo
6. 💰 Stima costi mensili

**Output Esempio**:
```
📊 VERCEL DEPLOYMENT METRICS - Guardian AI CRM
═══════════════════════════════════════════

🚀 Deployment Summary
   Total Deployments: 45
   ├─ Production: 15
   └─ Preview: 30

👁️  Active Preview Environments
   Active Previews: 3
   Oldest Preview: 2 days old

💰 Estimated Monthly Usage
   Projected Deployments/Month: ~40
   Estimated Build Minutes: ~80 min
   Hobby Plan Limit: 80/6000 min (1.3%)

✅ All metrics look good!
```

**Exit Codes**:
- `0`: Metriche recuperate con successo
- `1`: Errore (token mancante o API error)

**Prerequisiti**:
- Token Vercel da https://vercel.com/account/tokens
- Progetto configurato su Vercel

---

## 🔧 Quando Usare gli Script

### Prima di Ogni Deploy
- `verify-role-cleanup.sh` - Verifica pulizia riferimenti ruoli DB
- `verify-rls-policies.sh` - Verifica compliance RLS policies
- `verify-sync.sh` - Verifica sincronizzazione completa

### Quotidiano
- Prima di fare commit importanti
- Prima di creare PR

### Settimanale
- Verifica routine sincronizzazione
- `node scripts/vercel-metrics.cjs` - Monitora usage Vercel
- Check post-deployment

### Pre-Deploy
- Prima di merge su main
- Verifica che tutto sia a posto

---

## 💡 Suggerimenti

### Automatizzare con Git Hooks

Puoi configurare il script per eseguire automaticamente prima di ogni commit:

**Setup pre-commit hook**:
```bash
# Crea file .git/hooks/pre-commit
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
./scripts/verify-sync.sh
if [ $? -ne 0 ]; then
    echo "❌ Verification failed. Commit aborted."
    exit 1
fi
EOF

# Rendi eseguibile
chmod +x .git/hooks/pre-commit
```

### Integrazione CI/CD

Lo script può essere integrato in GitHub Actions:

```yaml
- name: Run Verification Script
  run: |
    chmod +x scripts/verify-sync.sh
    ./scripts/verify-sync.sh
```

---

## 🆘 Troubleshooting

### Script Non Esegue
```bash
# Assicurati che sia eseguibile
chmod +x scripts/verify-sync.sh

# Esegui con bash esplicitamente
bash scripts/verify-sync.sh
```

### Check Falliti
Leggi l'output dello script per dettagli su cosa è fallito, poi:

1. **TypeScript errors**: Esegui `npm run lint` per dettagli
2. **Missing functions**: Verifica directory `supabase/functions/`
3. **Missing docs**: Controlla che tutti i file documentazione esistano
4. **Security issues**: Review manuale del codice

---

## 📝 Manutenzione Script

Gli script sono versionati insieme al codice. Se aggiungi:
- Nuove edge functions → Aggiorna array `EXPECTED_FUNCTIONS` in `verify-sync.sh`
- Nuovi file documentazione → Aggiorna array `DOC_FILES`
- Nuovi check → Aggiungi funzione `check_*` e chiamala in `main()`

---

### verify-phase3-schema.sql

Script SQL per validazione completa dello schema database per Phase 3.

**Uso**:
```bash
# Con Supabase CLI
supabase db execute --file scripts/verify-phase3-schema.sql

# Con psql
psql <connection-string> -f scripts/verify-phase3-schema.sql
```

**Cosa Verifica**:
1. ✅ Tutte le tabelle richieste esistono
2. ✅ Tutte le colonne richieste esistono in ogni tabella
3. ✅ Funzioni critiche sono presenti
4. ✅ Indici essenziali sono creati
5. ✅ RLS (Row Level Security) è configurato correttamente
6. ✅ Colonne specifiche come `window_end`, `organization_id`, `action_type`

**Quando Usare**:
- Prima di deploy Phase 3 migrations
- Dopo modifiche schema database
- Durante troubleshooting
- Come parte della CI/CD pipeline

**Output Atteso**:
Tutti i check devono mostrare `TRUE` o `✓`. Qualsiasi `FALSE` o `✗` indica una risorsa mancante.

---

### test-phase3-migrations.sql

Script SQL per testare Phase 3 migrations in ambiente test/staging.

**Uso**:
```bash
# ⚠️ SOLO in ambiente test/staging!
supabase db execute --file scripts/test-phase3-migrations.sql
```

**Cosa Testa**:
1. ✅ Funzionalità colonne computed (`window_end`)
2. ✅ Creazione indici su colonne computed
3. ✅ Performance query con nuovi indici
4. ✅ Comportamento UPDATE con colonne computed
5. ✅ Performance query di cleanup
6. ✅ Preservazione policy RLS

**⚠️ ATTENZIONE**: 
- Crea dati di test
- Esegue operazioni INSERT/UPDATE/DELETE
- NON eseguire in produzione senza backup
- Solo per ambienti staging/test

**Output Atteso**:
```
✓ Test 1 PASSED: window_end column works correctly
✓ Test 2 PASSED: All indexes created successfully
✓ Test 3 PASSED: Queries can use window_end indexes
✓ Test 4 PASSED: UPDATE behavior correct
✓ Test 5 PASSED: Cleanup query performance acceptable
✓ Test 6 PASSED: RLS configuration verified
All Tests PASSED! ✓
```

---

## 🔧 Quando Usare gli Script

### Prima di Ogni Deploy
- `verify-role-cleanup.sh` - Verifica pulizia riferimenti ruoli DB
- `verify-rls-policies.sh` - Verifica compliance RLS policies
- `verify-sync.sh` - Verifica sincronizzazione completa
- **`verify-phase3-schema.sql`** - Verifica schema database Phase 3

### In Staging
- **`test-phase3-migrations.sql`** - Test completo migrations Phase 3
- Verifica funzionalità colonne computed
- Test performance indici

### Quotidiano
- Prima di fare commit importanti
- Prima di creare PR

### Settimanale
- Verifica routine sincronizzazione
- `node scripts/vercel-metrics.cjs` - Monitora usage Vercel
- Check post-deployment

### Pre-Deploy
- Prima di merge su main
- Verifica che tutto sia a posto
- Esegui validazione schema completa

---

## 💡 Suggerimenti

### Automatizzare con Git Hooks

Puoi configurare il script per eseguire automaticamente prima di ogni commit:

**Setup pre-commit hook**:
```bash
# Crea file .git/hooks/pre-commit
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
./scripts/verify-sync.sh
if [ $? -ne 0 ]; then
    echo "❌ Verification failed. Commit aborted."
    exit 1
fi
EOF

# Rendi eseguibile
chmod +x .git/hooks/pre-commit
```

### Integrazione CI/CD

Lo script può essere integrato in GitHub Actions:

```yaml
- name: Run Verification Script
  run: |
    chmod +x scripts/verify-sync.sh
    ./scripts/verify-sync.sh

- name: Validate Database Schema
  run: |
    supabase db execute --file scripts/verify-phase3-schema.sql
    
- name: Test Migrations (staging only)
  if: github.ref == 'refs/heads/staging'
  run: |
    supabase db execute --file scripts/test-phase3-migrations.sql
```

---

## 🆘 Troubleshooting

### Script Non Esegue
```bash
# Assicurati che sia eseguibile
chmod +x scripts/verify-sync.sh

# Esegui con bash esplicitamente
bash scripts/verify-sync.sh
```

### Check Falliti
Leggi l'output dello script per dettagli su cosa è fallito, poi:

1. **TypeScript errors**: Esegui `npm run lint` per dettagli
2. **Missing functions**: Verifica directory `supabase/functions/`
3. **Missing docs**: Controlla che tutti i file documentazione esistano
4. **Security issues**: Review manuale del codice
5. **Schema validation fails**: Esegui migration mancante
6. **Column not exists**: Esegui `20250123000003_add_window_end_to_api_rate_limits.sql`

### Script SQL Fallisce con "table does not exist"

**Soluzione**: Esegui migration che crea la tabella mancante.

```bash
supabase db execute --file supabase/migrations/<migration_file>.sql
```

### Script SQL Fallisce con "column does not exist"

**Soluzione**: Esegui migration che aggiunge la colonna mancante.

```bash
supabase db execute --file supabase/migrations/20250123000003_add_window_end_to_api_rate_limits.sql
```

---

## 📝 Manutenzione Script

Gli script sono versionati insieme al codice. Se aggiungi:
- Nuove edge functions → Aggiorna array `EXPECTED_FUNCTIONS` in `verify-sync.sh`
- Nuovi file documentazione → Aggiorna array `DOC_FILES`
- Nuovi check → Aggiungi funzione `check_*` e chiamala in `main()`
- Nuove tabelle database → Aggiorna `verify-phase3-schema.sql`
- Nuovi requisiti colonne → Aggiorna sezione corrispondente in validation script

---

**Creato da**: AI Chief Engineer  
**Versione**: 2.0  
**Ultima Revisione**: 2025-10-03  
**Aggiornamenti Phase 3**: Schema validation e migration testing
