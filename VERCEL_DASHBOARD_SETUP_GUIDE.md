# 🚨 Guida Configurazione Vercel Dashboard - BLOCCO DEPLOY NON AUTORIZZATI

**Versione:** 1.0  
**Data:** 2025-10-02  
**Stato:** 🔴 AZIONE IMMEDIATA RICHIESTA

---

## ⚠️ PROBLEMA IDENTIFICATO

Vercel sta eseguendo deploy su **TUTTI** i branch (inclusi `copilot/*`), consumando crediti inutilmente.

**Deployments NON autorizzati attualmente attivi:**
- `copilot/fix-a1b7b6a6-359d-488b-8f31-3b1aeb7e7d04` (6 preview deployments)
- `copilot/fix-e720e0f4-60f7-4a6a-a3b2-f90ec1d5b721` (PR #41)
- `copilot/fix-7c106182-f3cf-43a8-b29f-86dd0b0d2761` (PR #39)
- Altri branch `copilot/*`

**Causa radice:** Vercel Dashboard ha l'opzione "Deploy all branches" ATTIVA, che sovrascrive le configurazioni in `vercel.json`.

---

## 🎯 SOLUZIONE: CONFIGURAZIONE MANUALE DASHBOARD

### Step 1: Disabilitare Auto-Deploy su Tutti i Branch

1. **Accedi a Vercel Dashboard**
   - URL: https://vercel.com/seo-cagliari/crm-ai
   - Login con account GitHub

2. **Vai in Settings → Git**
   ```
   Dashboard → crm-ai Project → Settings → Git
   ```

3. **Configura Production Branch**
   ```
   Production Branch: main
   ```

4. **DISABILITA "Deploy all branches"**
   ```
   ❌ DISATTIVARE: "Automatically create Preview Deployments for all branches"
   
   ✅ ATTIVARE: "Only Production Branch" 
   ```
   
   **OPPURE:**
   
   ```
   ✅ ATTIVARE: "Preview Deployments: Pull Requests Only"
   ```

5. **Configura Branch Protection (opzionale ma raccomandato)**
   ```
   Ignored Build Step: (lasciare vuoto per usare vercel.json)
   ```

### Step 2: Rimuovere Deploy Esistenti Non Autorizzati

1. **Vai in Deployments**
   ```
   Dashboard → crm-ai Project → Deployments
   ```

2. **Filtra per branch non autorizzati**
   ```
   Cerca: "copilot/"
   ```

3. **Per ogni deployment trovato:**
   - Clicca sui 3 puntini (⋯)
   - Seleziona "Delete"
   - Conferma l'eliminazione

4. **Branch da eliminare completamente:**
   ```bash
   # Lista branch da cercare e cancellare:
   - copilot/fix-a1b7b6a6-359d-488b-8f31-3b1aeb7e7d04 (6 deployments)
   - Tutti i branch copilot/* con "Preview" status
   ```

### Step 3: Verificare Configurazione

1. **Controlla Git Configuration**
   ```
   Settings → Git → Production Branch = "main" ✅
   Settings → Git → Auto Deploy = "Off" o "Pull Requests Only" ✅
   ```

2. **Controlla Deployment Expiration (opzionale)**
   ```
   Settings → Deployment Protection → 
   Deployment Expiration: 7 days ✅
   ```

3. **Test della configurazione**
   - Crea un commit su un branch `test/vercel-block`
   - Verifica che NON venga creato nessun deployment
   - Se viene creato, rivedi Step 1

---

## 🔧 AGGIORNAMENTI REPOSITORY GIÀ APPLICATI

Il repository è già stato aggiornato con:

✅ **vercel.json** - Pattern espliciti di blocco:
```json
{
  "git": {
    "deploymentEnabled": {
      "main": true,              // ✅ Solo main autorizzato
      "feature/*": false,        // ⚙️ Gestito da workflow
      "fix/*": false,            // ⚙️ Gestito da workflow
      "hotfix/*": false,         // ⚙️ Gestito da workflow
      "release/*": false,        // ⚙️ Gestito da workflow
      "copilot/*": false,        // 🚫 BLOCCATO
      "draft/*": false,          // 🚫 BLOCCATO
      "test/*": false,           // 🚫 BLOCCATO
      "wip/*": false,            // 🚫 BLOCCATO
      "experimental/*": false,   // 🚫 BLOCCATO
      "docs/*": false,           // 🚫 BLOCCATO
      "ci/*": false              // 🚫 BLOCCATO
    }
  }
}
```

✅ **.vercelignore** - File esclusi dal deployment

✅ **GitHub Actions** - Workflow per deploy controllati:
- `.github/workflows/vercel-preview.yml` - Deploy preview solo su PR autorizzate
- `.github/workflows/vercel-cleanup.yml` - Cleanup automatico

⚠️ **IMPORTANTE:** Anche con queste configurazioni, Vercel Dashboard può sovrascriverle se "Deploy all branches" è attivo!

---

## 🔍 VERIFICA POST-CONFIGURAZIONE

Esegui questi controlli per confermare che tutto funzioni:

### 1. Verifica Dashboard Settings
```bash
✅ Production Branch = "main"
✅ Auto Deploy = "Off" oppure "Pull Requests Only"
✅ Nessun deployment attivo su branch copilot/*
```

### 2. Test con Nuovo Branch
```bash
# Crea branch di test
git checkout -b test/vercel-block-test
git commit --allow-empty -m "Test vercel block"
git push origin test/vercel-block-test

# Controlla Dashboard Vercel
# RISULTATO ATTESO: Nessun nuovo deployment creato
```

### 3. Verifica Workflow GitHub Actions
```bash
# Crea PR da branch feature/
git checkout -b feature/test-vercel
git commit --allow-empty -m "Test PR deploy"
git push origin feature/test-vercel

# Apri PR su GitHub
# RISULTATO ATTESO: 
# - Workflow vercel-preview.yml si attiva
# - Deploy preview viene creato SOLO tramite workflow
# - Commento automatico sulla PR con URL preview
```

---

## 📊 STIMA RISPARMIO CREDITI

**Situazione attuale (NON configurato):**
- ~50 deployments/mese (ogni push su ogni branch)
- ~100 minuti build/mese
- Costo stimato: 80-90% dei crediti Hobby Plan

**Situazione target (configurato correttamente):**
- ~10-15 deployments/mese (solo main + PR autorizzate)
- ~20-30 minuti build/mese
- Costo stimato: 20-30% dei crediti Hobby Plan

**Risparmio:** ~70% dei crediti Vercel 💰

---

## 🚨 TROUBLESHOOTING

### Problema: Deploy continua su branch non autorizzati

**Causa:** Vercel Dashboard override di vercel.json

**Soluzione:**
1. Verifica Settings → Git → "Deploy all branches" sia DISATTIVATO
2. Elimina tutti i deployment esistenti non autorizzati
3. Elimina i branch remoti non necessari
4. Attendi 5 minuti per propagazione settings
5. Test con nuovo commit su branch non autorizzato

### Problema: PR non crea preview deployment

**Causa:** Branch naming non segue convenzione o workflow disabilitato

**Soluzione:**
1. Verifica branch name: deve essere `feature/*`, `fix/*`, `hotfix/*`, o `release/*`
2. OPPURE aggiungi label `deploy-preview` alla PR
3. Controlla GitHub Actions → vercel-preview.yml sia attivo
4. Verifica GitHub Secrets configurati (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID)

### Problema: Come faccio a fare deploy di un branch sperimentale?

**Soluzione:**
1. Apri PR verso main
2. Aggiungi label `deploy-preview` alla PR
3. Il workflow creerà automaticamente il preview
4. OPPURE usa Vercel CLI locale:
   ```bash
   npx vercel --prod=false
   ```

---

## ✅ CHECKLIST CONFIGURAZIONE COMPLETA

Usa questa checklist per verificare che tutto sia configurato:

### Dashboard Vercel
- [ ] Production Branch impostato su `main`
- [ ] "Deploy all branches" DISABILITATO
- [ ] "Preview Deployments" su "Pull Requests Only"
- [ ] Deployment Expiration impostato su 7 giorni (opzionale)
- [ ] Tutti i deployment su branch `copilot/*` eliminati
- [ ] Tutti i deployment su branch `test/*`, `draft/*` eliminati

### Repository GitHub
- [ ] `vercel.json` aggiornato con pattern blocco estesi
- [ ] `.vercelignore` configurato
- [ ] Workflow `vercel-preview.yml` attivo
- [ ] Workflow `vercel-cleanup.yml` attivo

### GitHub Secrets
- [ ] `VERCEL_TOKEN` configurato
- [ ] `VERCEL_ORG_ID` configurato
- [ ] `VERCEL_PROJECT_ID` configurato

### Test
- [ ] Test con branch non autorizzato → nessun deploy
- [ ] Test con PR da branch autorizzato → deploy preview OK
- [ ] Test chiusura PR → cleanup automatico OK

---

## 📞 SUPPORTO

Se hai problemi con la configurazione:

1. **Verifica log GitHub Actions**
   ```
   Repository → Actions → vercel-preview.yml
   ```

2. **Controlla Vercel Dashboard Activity Log**
   ```
   Dashboard → crm-ai → Settings → Activity Log
   ```

3. **Consulta documentazione ufficiale**
   - [Vercel Git Configuration](https://vercel.com/docs/concepts/git)
   - [Vercel Deployment Protection](https://vercel.com/docs/security/deployment-protection)

---

**🎯 AZIONE IMMEDIATA:** Completa Step 1 e Step 2 per bloccare i deploy non autorizzati e ridurre immediatamente i costi.
