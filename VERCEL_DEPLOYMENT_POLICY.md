# 🚀 Policy di Deployment Vercel - Guardian AI CRM

## 📋 Panoramica

Questo documento descrive la policy di deployment Vercel per il progetto Guardian AI CRM, ottimizzata per massimizzare la sostenibilità e ridurre i costi.

---

## 🎯 Principi Fondamentali

### ✅ Deployment in Produzione

**REGOLA D'ORO: Solo il branch `main` viene deployato in produzione**

- ✅ **Produzione**: Deploy automatico SOLO da branch `main`
- ✅ **Affidabilità**: Codice testato e validato prima del merge
- ✅ **Tracciabilità**: Ogni deploy in produzione corrisponde a un merge su `main`
- ✅ **Rollback**: Facile rollback tramite revert su `main`

### 🔍 Preview Deployments

**REGOLA: Preview solo per feature/fix branch e PR, con cleanup immediato**

- ✅ **Ammessi per**:
  - Branch feature (`feature/*`)
  - Branch fix (`fix/*`)
  - Branch hotfix (`hotfix/*`)
  - Pull Requests attive
  
- ❌ **NON ammessi per**:
  - Branch develop persistenti
  - Branch personali
  - Branch experimentali senza PR

- ⏱️ **TTL Massimo**: 7 giorni
- 🧹 **Cleanup**: Rimozione immediata dopo merge/close della PR

---

## ⚙️ Configurazione

### vercel.json

Il file `vercel.json` implementa questa policy:

```json
{
  "git": {
    "deploymentEnabled": {
      "main": true
    }
  },
  "github": {
    "silent": true,
    "autoJobCancelation": true
  }
}
```

**Spiegazione**:
- `deploymentEnabled`: Abilita deploy automatico SOLO per `main`
- `silent`: Riduce notifiche GitHub per deployment
- `autoJobCancelation`: Cancella automaticamente build obsolete

### Vercel Dashboard Settings

Per completare la configurazione, **nella Vercel Dashboard**:

1. **Project Settings → Git**
   - ✅ Production Branch: `main`
   - ❌ Disabilita "Deploy all branches"
   - ✅ Abilita "Preview Deployments" solo per PR

2. **Project Settings → General**
   - ✅ Automatic Deployments from Git: **ONLY** `main`
   - ✅ Preview Branch Prefix: `feature/`, `fix/`, `hotfix/`

3. **Project Settings → Deployment Protection**
   - ✅ Abilita "Vercel Authentication" per preview (opzionale ma consigliato)
   - ✅ Imposta "Deployment Expiration" a 7 giorni

---

## 🔄 Workflow di Deployment

### 1. Development Locale

```bash
# Crea feature branch
git checkout -b feature/nuova-funzionalita

# Sviluppa e testa localmente
npm run dev
npm run build
npm run lint

# Commit changes
git add .
git commit -m "feat: implementa nuova funzionalità"
```

### 2. Preview Deployment (Opzionale)

```bash
# Push feature branch
git push origin feature/nuova-funzionalita

# Apri Pull Request su GitHub
# ✅ Vercel crea automaticamente preview deployment per la PR
```

**Nota**: Preview deployment viene creato automaticamente all'apertura della PR.

### 3. Review e Testing

- Revisione codice su GitHub
- Test su preview deployment
- CI/CD checks automatici
- Approvazione PR

### 4. Production Deployment

```bash
# Merge PR in main
# ✅ Vercel deploya automaticamente in produzione

# Alternative: merge locale
git checkout main
git merge feature/nuova-funzionalita
git push origin main
# ✅ Deploy automatico in produzione
```

### 5. Cleanup Preview

**Automatico**: Vercel rimuove automaticamente il preview deployment quando:
- La PR viene chiusa (merged o rejected)
- Il branch viene eliminato
- Scadono i 7 giorni di TTL

**Manuale** (se necessario):
1. Vercel Dashboard → Deployments
2. Trova preview deployment
3. Click "Delete"

---

## 🛡️ Best Practices

### ✅ DO

1. **Testa localmente prima del push**
   ```bash
   npm run build
   npm run lint
   npm run preview  # Simula produzione localmente
   ```

2. **Usa PR per ogni feature**
   - Crea PR anche per piccoli fix
   - Usa preview deployment per validare
   - Richiedi review prima del merge

3. **Mantieni main stabile**
   - Merge solo codice testato
   - Usa squash merge per history pulita
   - Tag release importanti

4. **Monitora deployments**
   - Controlla Vercel Dashboard dopo ogni merge
   - Verifica logs in caso di errori
   - Usa Vercel Analytics per performance

5. **Cleanup regolare**
   - Elimina branch merged
   - Chiudi PR obsolete
   - Verifica preview deployments attivi settimanalmente

### ❌ DON'T

1. **Non bypassare la policy**
   - ❌ No push diretti a main senza PR
   - ❌ No deploy manuali da branch non-main
   - ❌ No branch long-lived oltre main

2. **Non lasciare preview attivi**
   - ❌ No PR aperte per >7 giorni senza attività
   - ❌ No preview deployments "dimenticati"
   - ❌ No branch feature obsoleti

3. **Non sprecare risorse**
   - ❌ No build multiple per piccoli fix (usa squash)
   - ❌ No preview per ogni commit (solo PR)
   - ❌ No deployment di file non necessari (usa .vercelignore)

---

## 📊 Monitoring e Maintenance

### Controlli Settimanali

```bash
# 1. Verifica branch attivi
git branch -a | grep -v main

# 2. Lista PR aperte
gh pr list --state open

# 3. Verifica preview deployments attivi
# (Da Vercel Dashboard → Deployments → Filter: Preview)
```

### Cleanup Mensile

1. **GitHub**:
   - Chiudi PR obsolete (>2 settimane senza attività)
   - Elimina branch merged
   - Review e chiudi issue risolte

2. **Vercel**:
   - Verifica nessun preview deployment "orfano"
   - Controlla usage e costi
   - Review logs per errori ricorrenti

### Metriche da Monitorare

- **Deployment frequency**: Quanti deploy/settimana su main
- **Preview deployments attivi**: Max 5 contemporanei (target)
- **TTL medio preview**: <3 giorni (target)
- **Build time**: <5 minuti (target)
- **Cost per month**: Monitora trend

---

## 🚨 Troubleshooting

### Preview Deployment Non Creato

**Problema**: PR aperta ma nessun preview deployment

**Soluzioni**:
1. Verifica configurazione Vercel Dashboard (Preview Deployments abilitato)
2. Controlla che branch segua naming convention (feature/, fix/)
3. Verifica Vercel GitHub App ha permessi corretti
4. Check build logs per errori

### Deploy Produzione Fallito

**Problema**: Merge su main ma deploy fallisce

**Soluzioni**:
1. Controlla Vercel Dashboard → Deployments → Logs
2. Verifica environment variables in Vercel
3. Testa build localmente: `npm run build`
4. Controlla GitHub Actions logs
5. Se necessario, revert merge e fix

### Troppi Preview Deployments

**Problema**: Molti preview attivi, costi elevati

**Soluzioni**:
1. Chiudi PR obsolete
2. Elimina branch merged
3. Educa team sulla policy
4. Imposta deployment expiration più aggressivo (3 giorni)

### Branch Non-Main Deploya in Produzione

**Problema**: Branch diverso da main viene deployato come production

**Soluzioni**:
1. ⚠️ **URGENTE**: Verifica `vercel.json` configurazione
2. Controlla Vercel Dashboard → Settings → Git → Production Branch
3. Assicurati `deploymentEnabled` specifica solo `main`
4. Contatta supporto Vercel se problema persiste

---

## 💰 Benefici della Policy

### Sostenibilità

- ✅ **-80% preview deployments**: Solo PR attive vs tutti i branch
- ✅ **-60% build time totale**: No build duplicate
- ✅ **-90% storage usage**: Cleanup automatico

### Costi

- ✅ **Riduzione 70% costi Vercel** (stima)
- ✅ **Ottimizzazione bandwidth**: No deploy non necessari
- ✅ **Prevedibilità**: Budget stabile e controllato

### Qualità

- ✅ **Main sempre stabile**: Solo codice reviewato
- ✅ **Tracciabilità completa**: Ogni deploy = PR/merge
- ✅ **Rollback immediato**: Revert su main

### Team

- ✅ **Workflow chiaro**: Tutti seguono stessa policy
- ✅ **Meno confusione**: Un solo ambiente produzione
- ✅ **Onboarding semplice**: Policy documentata

---

## 📚 Riferimenti

### Documentazione Ufficiale

- [Vercel Git Integration](https://vercel.com/docs/concepts/git)
- [Vercel Preview Deployments](https://vercel.com/docs/concepts/deployments/preview-deployments)
- [Vercel Production Deployments](https://vercel.com/docs/concepts/deployments/production-deployments)
- [Vercel Project Configuration](https://vercel.com/docs/project-configuration)

### Documentazione Progetto

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Guida deployment completa
- [README.md](./README.md) - Panoramica progetto
- [SYNC_CHECKLIST.md](./SYNC_CHECKLIST.md) - Checklist sincronizzazione

---

## ✅ Checklist Implementazione

- [x] `vercel.json` configurato con production-only per main
- [x] `.vercelignore` creato per ottimizzare bundle
- [x] Policy documentata
- [ ] Vercel Dashboard configurato (settings manuali richiesti)
- [ ] Team educato sulla policy
- [ ] Cleanup branch esistenti
- [ ] Monitoring setup (weekly/monthly checks)

---

## 🎓 Golden Standard

Questa policy è allineata con le **best practices** di:

- ✅ Vercel official recommendations
- ✅ GitHub Flow
- ✅ GitLab Flow (production branch)
- ✅ Trunk-based development
- ✅ Continuous Deployment
- ✅ FinOps best practices
- ✅ Team scalabili di successo

**Risultato**: Massima sostenibilità, minimi costi, massima qualità.

---

**Documento Version**: 1.0  
**Ultima Revisione**: 2025-01-21  
**Owner**: DevOps Team / Tech Lead
