# 🚀 Vercel Deployment Policy - Guardian AI CRM

**Versione:** 1.0  
**Data:** 2024-10-02  
**Stato:** ✅ Attivo

---

## 📋 Executive Summary

Questo documento definisce la **policy ufficiale di deployment Vercel** per il progetto Guardian AI CRM, garantendo:

- ✅ **Deploy production esclusivo su branch `main`**
- ✅ **Preview solo su PR con branch specifici** (`feature/*`, `fix/*`, `hotfix/*`, `release/*`)
- ✅ **Preview TTL massimo 7 giorni** con cleanup automatico
- ✅ **Ottimizzazione costi** e riduzione build minutes sprecati
- ✅ **Governance enterprise** per ambienti di deploy

---

## 🎯 Principi Fondamentali

### 1. Production Deploy

**Regola:** Deploy production **SOLO** su branch `main`.

```
✅ AUTORIZZATO
Branch: main
Trigger: Push/Merge to main
Domain: Production URL
Auto Deploy: Sempre attivo
Retention: Permanente
```

**Implementazione:**
- `vercel.json`: `"main": true` in `git.deploymentEnabled`
- Nessun altro branch può deployare in production
- Deploy automatico ad ogni push/merge su main

### 2. Preview Deploy

**Regola:** Preview deploy **SOLO** su Pull Request con branch pattern specifici.

```
✅ AUTORIZZATO (Preview via PR)
Branches: feature/*, fix/*, hotfix/*, release/*
Trigger: PR aperta verso main
Domain: pr-{number}.vercel.app
Auto Deploy: Solo se condizioni soddisfatte
Retention: Max 7 giorni dopo chiusura PR
```

**Implementazione:**
- `vercel.json`: Tutti i branch pattern sopra sono `false` (gestiti da workflow)
- `.github/workflows/vercel-preview.yml`: Deploy condizionale su PR
- Preview automatico SOLO se:
  - Branch segue naming convention (`feature/*`, `fix/*`, `hotfix/*`, `release/*`)
  - **OPPURE** PR ha label `deploy-preview`

### 3. Branch Non Autorizzati

**Regola:** I seguenti branch **NON** generano deploy automatici.

```
❌ NON AUTORIZZATO
Branches: draft/*, test/*, wip/*, experimental/*, docs/*, ci/*
Motivo: Work in progress, sperimentazioni, documentazione
Deploy: Solo manuale se strettamente necessario
```

---

## 📁 Configurazione Files

### 1. vercel.json

**Configurazione obbligatoria:**

```json
{
  "git": {
    "deploymentEnabled": {
      "main": true,           // ✅ Production su main
      "feature/*": false,     // ⚙️ Gestito da workflow
      "fix/*": false,         // ⚙️ Gestito da workflow
      "hotfix/*": false,      // ⚙️ Gestito da workflow
      "release/*": false      // ⚙️ Gestito da workflow
    }
  },
  "github": {
    "enabled": true,
    "autoAlias": true,
    "silent": false,
    "autoJobCancelation": true  // ✅ Cancella build obsoleti
  }
}
```

**Features obbligatorie:**
- ✅ `autoJobCancelation: true` - Cancella build duplicati
- ✅ Security headers (XSS, frame options, CSP)
- ✅ Cache headers per assets statici
- ✅ Clean URLs

### 2. .vercelignore

**File da escludere dal deployment:**

```
# Git
.git
.github
.gitignore

# Documentation (non necessaria in production)
*.md
!README.md
docs/

# Testing
coverage
*.test.ts
*.spec.ts
tests/

# Scripts (non necessari in production)
scripts/

# Supabase backend
supabase/
*.sql

# Environment
.env
.env.*
!.env.example
```

**Benefici:**
- ⚡ Deployment più veloce (meno file da uplodare)
- 💰 Riduzione storage Vercel
- 🔒 Evita upload accidentale di file sensibili

### 3. GitHub Actions Workflows

#### `.github/workflows/vercel-preview.yml`

**Funzionalità:**
- ✅ Verifica condizioni deploy (branch pattern o label)
- ✅ Deploy preview solo se autorizzato
- ✅ Commenta PR con preview URL
- ✅ Blocca deploy non autorizzati con messaggio informativo

**Jobs:**
1. `should-deploy` - Verifica se deploy è necessario
2. `deploy-preview` - Esegue deploy a Vercel Preview
3. `block-unauthorized` - Informa su deploy disabilitato

**Trigger:**
```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened, labeled]
    branches:
      - main
```

#### `.github/workflows/vercel-cleanup.yml`

**Funzionalità:**
- ✅ Cleanup automatico alla chiusura PR
- ✅ Cleanup schedulato daily per preview > 7 giorni
- ✅ Manual trigger per cleanup on-demand

**Trigger:**
```yaml
on:
  pull_request:
    types: [closed]
  schedule:
    - cron: '0 2 * * *'  # Ogni notte alle 2 AM UTC
  workflow_dispatch:       # Manual trigger
```

---

## 🔄 Workflow Operativo

### Deploy Production

```bash
# 1. Merge PR approvata su main
git checkout main
git merge feature/my-feature

# 2. Push a main
git push origin main

# 3. Deploy automatico su Vercel Production
# (Nessuna azione richiesta)
```

### Deploy Preview (su PR)

```bash
# 1. Crea branch con naming convention
git checkout -b feature/my-new-feature

# 2. Commit e push
git push origin feature/my-new-feature

# 3. Apri PR verso main
# (via GitHub UI)

# 4. Preview deploy automatico se:
#    - Branch segue pattern (feature/*, fix/*, hotfix/*, release/*)
#    - O ha label "deploy-preview"

# 5. Preview URL commentato automaticamente nella PR
```

### Override Deploy Preview

Se hai un branch che non segue naming convention ma vuoi preview:

```bash
# 1. Apri PR
# 2. Aggiungi label "deploy-preview" alla PR
# 3. Preview deploy si attiverà automaticamente
```

---

## 🧹 Cleanup Policy

### Automatico

1. **Alla chiusura PR:**
   - Tutti i preview della PR vengono rimossi immediatamente
   - Workflow `vercel-cleanup.yml` attivato su evento `pull_request.closed`

2. **Cleanup schedulato (daily):**
   - Ogni notte alle 2 AM UTC
   - Rimuove preview > 7 giorni
   - Workflow `vercel-cleanup.yml` attivato da cron

### Manuale

```bash
# Trigger manuale cleanup workflow
# Via GitHub UI: Actions > Cleanup Vercel Previews > Run workflow
```

---

## 📊 Monitoring

### Metriche da Monitorare

1. **Build Minutes**
   - Target: < 250 min/mese
   - Alert: > 400 min/mese

2. **Active Previews**
   - Target: < 10 preview attivi
   - Alert: > 15 preview attivi

3. **Deployment Success Rate**
   - Target: > 95%
   - Alert: < 90%

4. **Preview Age**
   - Target: 0 preview > 7 giorni
   - Alert: > 3 preview > 7 giorni

### Script di Monitoring

```bash
# Esegui monitoring manuale
node scripts/vercel-metrics.cjs

# Output:
# - Total deployments
# - Active previews
# - Oldest preview age
# - Monthly usage estimate
# - Warnings
```

---

## 🚨 Troubleshooting

### Preview Deploy Non Si Attiva

**Possibili cause:**
1. Branch non segue naming convention
2. PR non ha label `deploy-preview`
3. Secrets Vercel non configurati

**Soluzione:**
```bash
# 1. Verifica naming branch
git branch --show-current
# Deve essere: feature/*, fix/*, hotfix/*, release/*

# 2. Oppure aggiungi label alla PR
# Label: "deploy-preview"

# 3. Verifica secrets in GitHub
# Settings > Secrets > Actions
# - VERCEL_TOKEN
# - VERCEL_ORG_ID
# - VERCEL_PROJECT_ID
```

### Preview Non Viene Rimosso

**Possibili cause:**
1. Workflow cleanup fallito
2. Preview creato manualmente (non via PR)

**Soluzione:**
```bash
# 1. Trigger manuale cleanup
# Actions > Cleanup Vercel Previews > Run workflow

# 2. Rimozione manuale via CLI
vercel ls
vercel rm <deployment-url>
```

### Deploy Production Fallito

**Possibili cause:**
1. Build error
2. Secrets mancanti
3. Vercel quota esaurita

**Soluzione:**
```bash
# 1. Verifica build logs in Vercel dashboard
# 2. Verifica environment variables in Vercel
# 3. Controlla usage limits in Vercel dashboard
```

---

## 🎓 Best Practices

### Developer Guidelines

1. **Usa naming convention corretto:**
   ```bash
   ✅ feature/user-dashboard
   ✅ fix/login-bug
   ✅ hotfix/critical-security
   ✅ release/v1.2.0
   
   ❌ my-branch
   ❌ test-123
   ❌ experimental-ui
   ```

2. **Non creare preview inutili:**
   - Usa draft PR per WIP
   - Aggiungi `deploy-preview` label solo quando necessario
   - Chiudi PR obsolete prontamente

3. **Cleanup dopo review:**
   - Mergea o chiudi PR dopo review
   - Non lasciare PR aperte indefinitamente
   - Preview vengono rimossi automaticamente

### Team Guidelines

1. **Code Review:**
   - Testa sempre preview URL prima di approvare
   - Verifica funzionalità su preview environment
   - Commenta preview URL nelle review

2. **Deployment:**
   - Solo maintainer possono mergeare su main
   - Production deploy avviene automaticamente
   - Monitorare Vercel dashboard per errori

3. **Cost Control:**
   - Review monthly usage report
   - Cleanup vecchi preview regolarmente
   - Ottimizza build process se usage alto

---

## 📚 Documentazione Correlata

- **[VERCEL_DEPLOYMENT_OPTIMIZATION.md](./VERCEL_DEPLOYMENT_OPTIMIZATION.md)** - Strategia completa ottimizzazione
- **[VERCEL_QUICK_REFERENCE.md](./VERCEL_QUICK_REFERENCE.md)** - Quick reference per sviluppatori
- **[VERCEL_DEPLOYMENT_IMPLEMENTATION_SUMMARY.md](./VERCEL_DEPLOYMENT_IMPLEMENTATION_SUMMARY.md)** - Summary implementazione
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Guida setup completo
- **[scripts/vercel-metrics.cjs](./scripts/vercel-metrics.cjs)** - Script monitoring

---

## ✅ Compliance Checklist

### Repository Configuration

- [x] `vercel.json` configurato con policy deployment
- [x] `.vercelignore` esclude file non necessari
- [x] `.github/workflows/vercel-preview.yml` implementato
- [x] `.github/workflows/vercel-cleanup.yml` implementato
- [x] `scripts/vercel-metrics.cjs` disponibile

### Vercel Dashboard

- [ ] Production branch impostato su `main`
- [ ] Auto-deploy disabled per tutti i branch (tranne main)
- [ ] Environment variables configurate
- [ ] Usage alerts abilitati
- [ ] Custom domain configurato (se applicabile)

### GitHub Secrets

- [ ] `VERCEL_TOKEN` configurato
- [ ] `VERCEL_ORG_ID` configurato
- [ ] `VERCEL_PROJECT_ID` configurato

### Documentation

- [x] Policy deployment documentata
- [x] README.md aggiornato con riferimenti
- [x] Workflow documentati
- [x] Best practices condivise con team

---

## 🔄 Change History

| Data | Versione | Autore | Modifiche |
|------|----------|--------|-----------|
| 2024-10-02 | 1.0 | AI Engineer | Creazione policy iniziale |

---

## 📞 Support

Per domande o problemi relativi alla deployment policy:

1. Consulta la documentazione sopra
2. Verifica [Troubleshooting](#-troubleshooting)
3. Esegui `scripts/vercel-metrics.cjs` per diagnostics
4. Apri issue su GitHub con label `deployment`

---

**Status:** ✅ POLICY ATTIVA  
**Enforcement:** OBBLIGATORIO  
**Review:** Quarterly
