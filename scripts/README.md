# 🛠️ Scripts di Utilità Guardian AI CRM

Questa directory contiene script per automatizzare verifiche e manutenzione del repository.

---

## 📜 Script Disponibili

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

## 🔧 Quando Usare gli Script

### Quotidiano
- Prima di fare commit importanti
- Prima di creare PR

### Settimanale
- Verifica routine sincronizzazione
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
