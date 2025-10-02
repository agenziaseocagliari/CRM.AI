# 🚀 Vercel Deployment - Quick Reference

Guida rapida per sviluppatori su come gestire i deploy Vercel in modo ottimizzato.

---

## 🌿 Branch Naming per Deploy Automatici

### ✅ Deploy Preview Automatico su PR

```bash
# Pattern che attivano preview on PR
git checkout -b feature/new-dashboard
git checkout -b fix/login-bug
git checkout -b hotfix/critical-security
git checkout -b release/v1.2.0
```

### ❌ No Auto-Deploy (Solo Manuale)

```bash
# Pattern che NON attivano preview automatici
git checkout -b draft/experimental-ui
git checkout -b test/performance-check
git checkout -b wip/refactoring
git checkout -b experimental/ai-v2
git checkout -b docs/update-readme
```

---

## 🏷️ Forzare Preview con Label

Se il tuo branch non segue i pattern automatici ma vuoi comunque un preview:

1. Crea PR
2. Aggiungi label `deploy-preview` alla PR
3. Il workflow partirà automaticamente

---

## 🔄 Workflow Automatici

### Preview Deploy (`vercel-preview.yml`)

**Quando si attiva:**
- Apertura PR su `main`
- Push a PR esistente
- Aggiunta label `deploy-preview`

**Cosa fa:**
- ✅ Verifica se deploy è necessario
- ✅ Build e deploy su Vercel preview
- ✅ Commenta PR con URL preview
- ❌ Blocca deploy non autorizzati (con messaggio esplicativo)

### Cleanup (`vercel-cleanup.yml`)

**Quando si attiva:**
- Chiusura PR (automatico)
- Ogni notte alle 2 AM UTC
- Trigger manuale

**Cosa fa:**
- 🗑️ Rimuove preview di PR chiuse
- 🗑️ Rimuove preview più vecchi di 7 giorni
- 📊 Log delle operazioni

---

## 📋 Checklist Pre-PR

Prima di aprire una PR che richiede preview:

- [ ] Il branch segue naming convention (`feature/*`, `fix/*`, etc.)
- [ ] Build locale passa: `npm run build`
- [ ] Lint passa: `npm run lint`
- [ ] Hai verificato che la feature funziona in dev
- [ ] Hai commit message descrittivi
- [ ] Hai aggiunto label `deploy-preview` (se branch non standard)

---

## 🛠️ Comandi Utili

### Controllare Metriche Vercel

```bash
# Export token (una volta)
export VERCEL_TOKEN=xxx

# Esegui monitoring script
node scripts/vercel-metrics.cjs
```

**Output tipico:**
```
📊 VERCEL DEPLOYMENT METRICS - Guardian AI CRM
═══════════════════════════════════════════

📦 Project Information
   Name: crm-ai
   Framework: vite

🚀 Deployment Summary
   Total Deployments: 45
   ├─ Production: 15
   └─ Preview: 30

👁️  Active Preview Environments
   Active Previews: 3
   Oldest Preview: 2 days old

✅ All metrics look good!
```

### Cleanup Manuale Preview

```bash
# Trigger workflow cleanup manualmente
gh workflow run vercel-cleanup.yml

# Oppure cleanup locale con Vercel CLI
npm install -g vercel
vercel login
vercel ls  # Lista deployments
vercel rm <url> --yes  # Rimuovi specifico
```

### Build Locale Test

```bash
# Test build production
npm run build

# Preview build locale
npm run preview

# Test che tutto funzioni prima di push
```

---

## ⚠️ Cosa NON Fare

### ❌ Non pushare su main direttamente
```bash
# SBAGLIATO
git checkout main
git commit -m "fix"
git push origin main
```

Usa sempre PR anche per hotfix urgenti.

### ❌ Non creare branch senza pattern
```bash
# SBAGLIATO - genera confusione
git checkout -b mybranch
git checkout -b john-work
git checkout -b temp

# CORRETTO
git checkout -b feature/user-dashboard
git checkout -b fix/login-issue
git checkout -b hotfix/security-patch
```

### ❌ Non lasciare PR aperte troppo tempo
- Preview consuma risorse
- Chiudi o mergia PR entro 3-5 giorni
- Se lavoro in corso, usa branch `draft/*`

---

## 🆘 Troubleshooting

### "Preview non viene creato"

**Cause possibili:**
1. Branch name non segue pattern
2. Label `deploy-preview` non presente
3. Workflow fallito (controlla GitHub Actions)

**Soluzione:**
```bash
# Opzione 1: Rinomina branch
git branch -m old-name feature/new-name
git push -u origin feature/new-name

# Opzione 2: Aggiungi label "deploy-preview" alla PR
```

### "Troppi preview attivi"

**Problema:** Oltre 10 preview attivi

**Soluzione:**
```bash
# Trigger cleanup automatico
gh workflow run vercel-cleanup.yml

# O attendi la notte (cleanup automatico alle 2 AM)
```

### "Build fallisce su Vercel ma non in locale"

**Cause comuni:**
1. Environment variables mancanti
2. Dependency issues
3. TypeScript errors ignorati in dev

**Soluzione:**
```bash
# Test build production in locale
npm run build

# Check errori TypeScript
npm run lint

# Verifica .vercelignore non escluda file necessari
```

---

## 💡 Best Practices

### 1. Un Preview per PR
- Non pushare continuamente piccole modifiche
- Accumula modifiche e push una volta pronto per review
- Ogni push = nuovo deploy = consumo risorse

### 2. Cleanup Attivo
- Chiudi PR completate/obsolete
- Non lasciare "draft PR" aperte indefinitamente
- Usa workflow cleanup manuale se necessario

### 3. Testing Locale Prima
- Sempre `npm run build` prima di push
- Preview serve per review, non per debug
- Debug in locale = più veloce e zero costi

### 4. Branch Naming Consistente
- Usa sempre pattern standard
- `feature/` per nuove feature
- `fix/` per bug fix
- `hotfix/` solo per emergenze
- `draft/` per WIP non pronto

### 5. Descrizioni PR Chiare
```markdown
## 🎯 Obiettivo
Implementa nuovo dashboard per super admin

## 🔧 Modifiche
- Aggiunto componente SuperAdminDashboard
- Integrato API metrics
- Aggiornato routing

## ✅ Testing
- [x] Build passa
- [x] Lint passa
- [x] Testato in dev
- [x] Preview funzionante

## 📸 Screenshot
[Include screenshot del preview]
```

---

## 📊 KPI Target per Team

**Obiettivi mensili:**
- Preview Deployments: < 40/mese
- Build Success Rate: > 95%
- Active Previews: < 10 in qualsiasi momento
- Preview Lifetime Medio: < 3 giorni
- Costo Mensile Vercel: $0 (dentro Hobby Plan)

**Se superi questi limiti:**
1. Review branch strategy
2. Aumenta testing locale
3. Cleanup più frequente
4. Considera upgrade a Pro plan ($20/mese)

---

## 📞 Support

**Problemi con deploy?**
- Check [VERCEL_DEPLOYMENT_OPTIMIZATION.md](./VERCEL_DEPLOYMENT_OPTIMIZATION.md)
- Controlla GitHub Actions logs
- Run `node scripts/vercel-metrics.cjs`
- Contatta DevOps team

**Link Utili:**
- [Vercel Dashboard](https://vercel.com/dashboard)
- [GitHub Actions](https://github.com/seo-cagliari/CRM-AI/actions)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)

---

**Ultima modifica:** {{ DATA }}
**Versione:** 1.0
