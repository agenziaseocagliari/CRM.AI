# ✅ Quick Start Checklist - CI/CD Setup

## 🎯 Obiettivo
Completare il setup CI/CD e sincronizzazione GitHub ↔️ Supabase

---

## 📋 Checklist Rapida (30 minuti)

### Fase 1: Merge PR #3 (5 min)
```
[ ] 1.1 Vai su: https://github.com/seo-cagliari/CRM-AI/pull/3
[ ] 1.2 Clicca "Ready for review" (rimuovi draft status)
[ ] 1.3 Clicca "Merge pull request"
[ ] 1.4 Scegli "Squash and merge"
[ ] 1.5 Conferma merge
[ ] 1.6 Verifica: branch main aggiornato
```

### Fase 2: GitHub Secrets (10 min)
```
Location: Settings → Secrets and variables → Actions

[ ] 2.1 SUPABASE_ACCESS_TOKEN
    Dove: https://app.supabase.com/account/tokens
    
[ ] 2.2 SUPABASE_PROJECT_ID
    Dove: Dashboard → Settings → General → Reference ID
    
[ ] 2.3 SUPABASE_DB_PASSWORD
    La tua password database Supabase
    
[ ] 2.4 SUPABASE_URL
    Dove: Dashboard → Settings → API → Project URL
    Formato: https://[project-id].supabase.co
    
[ ] 2.5 SUPABASE_ANON_KEY
    Dove: Dashboard → Settings → API → anon public key
    Formato: eyJ...
```

### Fase 3: Trigger Pipeline (2 min)
```
[ ] 3.1 Opzione A - Push commit:
    git checkout main
    git pull origin main
    git commit --allow-empty -m "chore: trigger CI/CD"
    git push origin main

[ ] 3.2 Opzione B - Trigger manuale:
    GitHub → Actions → Deploy to Supabase → Run workflow
```

### Fase 4: Monitoraggio (10 min)
```
Location: https://github.com/seo-cagliari/CRM-AI/actions

[ ] 4.1 Verifica job "Lint and TypeScript Check" ✓
[ ] 4.2 Verifica job "Deploy Edge Functions" ✓
[ ] 4.3 Verifica job "Sync Database Migrations" ✓
[ ] 4.4 Verifica job "Verify Deployment" ✓
[ ] 4.5 Verifica job "Security Audit" ✓
```

### Fase 5: Verifica Supabase (5 min)
```
Location: https://app.supabase.com → Il tuo progetto

[ ] 5.1 Edge Functions → Verifica 22 functions presenti
[ ] 5.2 Edge Functions → Data aggiornamento = OGGI
[ ] 5.3 Database → Migrations sincronizzate
[ ] 5.4 Logs → Nessun errore critico recente
```

---

## 🚨 Troubleshooting Rapido

### ❌ Workflow Fallisce
```
→ Controlla GitHub Actions logs
→ Verifica tutti i 5 secrets configurati
→ Controlla che nomi secrets siano esatti (case-sensitive)
```

### ❌ Secret Non Trovato
```
→ Settings → Secrets → Verifica tutti presenti
→ Re-genera token se scaduto
→ Re-run workflow
```

### ❌ Edge Functions Non Deployate
```
→ Controlla Supabase Edge Functions Secrets:
  • SUPABASE_SERVICE_ROLE_KEY
  • GEMINI_API_KEY
  • GOOGLE_CLIENT_ID
  • GOOGLE_CLIENT_SECRET
  • GOOGLE_REDIRECT_URI
  • BREVO_SENDER_EMAIL
  • BREVO_SENDER_NAME
```

---

## ✅ Test Finale

```bash
# Test rapido che le functions rispondano
curl -X POST https://[project-id].supabase.co/functions/v1/test-org-settings \
  -H "apikey: [anon-key]" \
  -H "Content-Type: application/json" \
  -d '{}'

# Output atteso: JSON (non 404 o 500)
```

---

## 📚 Documentazione Completa

Dopo il merge di PR #3, vedi:
- `DEVOPS_ACTION_PLAN.md` (questo repository) - Guida dettagliata
- `DEPLOYMENT_GUIDE.md` (post-merge) - Setup completo
- `EDGE_FUNCTIONS_API.md` (post-merge) - Documentazione API

---

**Tempo Totale Stimato**: 30 minuti  
**Difficoltà**: 🟢 Facile (solo configurazione, no coding)
