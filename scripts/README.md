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

### vercel-metrics.js

Script Node.js per monitorare l'utilizzo delle risorse Vercel e generare report dettagliati.

**Uso**:
```bash
# Export token (richiesto)
export VERCEL_TOKEN=xxx

# Se usi Vercel Team account
export VERCEL_TEAM_ID=yyy

# Esegui script
node scripts/vercel-metrics.js
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
- `node scripts/vercel-metrics.js` - Monitora usage Vercel
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

**Creato da**: AI Chief Engineer  
**Versione**: 1.0  
**Ultima Revisione**: 2025-09-30
