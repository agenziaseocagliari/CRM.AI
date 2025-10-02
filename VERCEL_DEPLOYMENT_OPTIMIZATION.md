# 🚀 Vercel Deployment Optimization Guide - Guardian AI CRM

Strategia completa per ottimizzare deploy Vercel, ridurre costi e gestire ambienti in modo efficiente.

---

## 📊 Executive Summary

**Problema**: Deploy multipli non controllati su Vercel possono causare:
- ⚠️ Consumo eccessivo di build minutes
- ⚠️ Bandwidth sprecato su preview non utilizzati
- ⚠️ Quota storage occupata da deployment obsoleti
- ⚠️ Difficoltà nel tracciare costi per ambiente

**Soluzione**: Strategia di deploy intelligente con:
- ✅ Preview solo su PR attive e specifiche
- ✅ Auto-cleanup di preview chiusi
- ✅ Production deploy limitati al branch main
- ✅ Monitoring e alerting su consumi
- ✅ Branch naming e deployment rules

---

## 🎯 Architettura Deployment Ottimale

### 1. Strategia Ambienti

```
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL ENVIRONMENTS                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🟢 PRODUCTION                                               │
│  ├─ Branch: main                                             │
│  ├─- Trigger: Push/Merge to main                            │
│  ├─ Domain: app.tuodominio.com                              │
│  ├─ Auto Deploy: ✅ Always                                   │
│  └─ Retention: ♾️ Permanent                                  │
│                                                              │
│  🟡 PREVIEW (Controlled)                                     │
│  ├─ Branch: feature/*, fix/*, release/*                     │
│  ├─ Trigger: Solo PR aperte E approvate                     │
│  ├─ Domain: pr-{number}.vercel.app                          │
│  ├─ Auto Deploy: ⚙️ Conditional                             │
│  ├─ Auto Cleanup: ✅ On PR close/merge                       │
│  └─ Retention: 7 days dopo PR close                         │
│                                                              │
│  🔴 DISABLED (Cost Control)                                  │
│  ├─ Branch: experimental/*, draft/*, test/*                 │
│  ├─ Trigger: Manual only                                    │
│  ├─ Deploy: ❌ Disabled by default                          │
│  └─ Reason: WIP, non pronto per review                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2. Branch Naming Convention

```bash
# ✅ AUTO-DEPLOY (Preview on PR)
feature/new-dashboard      # Nuove feature
fix/login-bug              # Bug fix
hotfix/critical-issue      # Fix urgenti
release/v1.2.0             # Release candidate

# ⚙️ MANUAL-ONLY (No auto-preview)
draft/experimental-ui      # Lavori in corso
test/performance           # Test interni
wip/refactoring            # Work in progress
experimental/ai-v2         # Sperimentazioni

# 🚫 IGNORED (Never deploy)
docs/*                     # Solo documentazione
ci/*                       # Solo CI/CD changes
```

---

## 🔧 Configurazione Vercel

### 1. vercel.json - Ottimizzato

```json
{
  "git": {
    "deploymentEnabled": {
      "main": true,
      "feature/*": true,
      "fix/*": true,
      "hotfix/*": true,
      "release/*": true
    }
  },
  "github": {
    "enabled": true,
    "autoAlias": true,
    "silent": false,
    "autoJobCancelation": true
  },
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm ci",
  "framework": "vite",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "cleanUrls": true,
  "trailingSlash": false
}
```

### 2. .vercelignore

```
# Escludi file non necessari da upload
.git
.github
.vscode
node_modules
*.log
*.md
docs/
scripts/
tests/
*.test.ts
*.spec.ts
coverage/
.env
.env.*
!.env.example
supabase/
*.sql

# Riduce dimensione deployment e velocizza build
```

---

## 🤖 GitHub Actions Workflow per Vercel

### .github/workflows/vercel-preview.yml

```yaml
name: Vercel Preview Deployment

on:
  pull_request:
    types: [opened, synchronize, reopened, labeled]
    branches:
      - main

jobs:
  # Job 1: Verifica se il deploy è necessario
  should-deploy:
    name: Check if Preview Deploy Needed
    runs-on: ubuntu-latest
    outputs:
      deploy: ${{ steps.check.outputs.deploy }}
    steps:
      - name: Check deployment conditions
        id: check
        run: |
          # Deploy solo se:
          # 1. PR ha label "deploy-preview" O
          # 2. Branch inizia con feature/fix/hotfix/release
          
          BRANCH="${{ github.head_ref }}"
          HAS_LABEL="${{ contains(github.event.pull_request.labels.*.name, 'deploy-preview') }}"
          
          if [[ "$HAS_LABEL" == "true" ]]; then
            echo "deploy=true" >> $GITHUB_OUTPUT
            echo "✅ Label 'deploy-preview' trovato - Deploy abilitato"
            exit 0
          fi
          
          if [[ "$BRANCH" =~ ^(feature|fix|hotfix|release)/ ]]; then
            echo "deploy=true" >> $GITHUB_OUTPUT
            echo "✅ Branch pattern matched - Deploy abilitato"
            exit 0
          fi
          
          echo "deploy=false" >> $GITHUB_OUTPUT
          echo "⏭️ Condizioni non soddisfatte - Deploy saltato"

  # Job 2: Deploy a Vercel (solo se necessario)
  deploy-preview:
    name: Deploy to Vercel Preview
    runs-on: ubuntu-latest
    needs: should-deploy
    if: needs.should-deploy.outputs.deploy == 'true'
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Vercel CLI
        run: npm install -g vercel@latest

      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Build Project
        run: vercel build --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Deploy to Vercel Preview
        id: deploy
        run: |
          URL=$(vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }} 2>&1 | tee /dev/stderr | grep -o 'https://[^ ]*')
          echo "url=$URL" >> $GITHUB_OUTPUT
          echo "## 🚀 Preview Deployed" >> $GITHUB_STEP_SUMMARY
          echo "Preview URL: $URL" >> $GITHUB_STEP_SUMMARY
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Comment PR with Preview URL
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const url = '${{ steps.deploy.outputs.url }}';
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## 🚀 Preview Deployment Ready\n\n✅ **URL**: ${url}\n\n⚠️ Questo preview sarà rimosso automaticamente alla chiusura della PR.`
            });

  # Job 3: Blocca deployment non autorizzati
  block-unauthorized:
    name: Block Unauthorized Deploys
    runs-on: ubuntu-latest
    needs: should-deploy
    if: needs.should-deploy.outputs.deploy == 'false'
    steps:
      - name: Comment PR - Deploy Blocked
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## ⚠️ Preview Deploy Disabilitato\n\nQuesto branch non è configurato per preview automatici.\n\n**Per abilitare il preview:**\n1. Rinomina branch con pattern: \`feature/*\`, \`fix/*\`, \`hotfix/*\`, \`release/*\`\n2. Oppure aggiungi label \`deploy-preview\` alla PR\n\n**Motivo**: Strategia di cost optimization per ridurre deploy inutili.`
            });
```

### .github/workflows/vercel-cleanup.yml

```yaml
name: Cleanup Vercel Previews

on:
  pull_request:
    types: [closed]
  schedule:
    # Cleanup giornaliero alle 2 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch:

jobs:
  cleanup-closed-pr-previews:
    name: Remove Closed PR Previews
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - name: Install Vercel CLI
        run: npm install -g vercel@latest

      - name: Remove Preview Deployment
        run: |
          echo "🗑️ Rimozione preview per PR #${{ github.event.number }}"
          
          # Lista deployments per questo PR
          DEPLOYMENTS=$(vercel ls --token=${{ secrets.VERCEL_TOKEN }} --scope=${{ secrets.VERCEL_ORG_ID }} | grep "pr-${{ github.event.number }}" || true)
          
          if [ -n "$DEPLOYMENTS" ]; then
            echo "$DEPLOYMENTS" | while read -r line; do
              DEPLOY_URL=$(echo "$line" | awk '{print $2}')
              echo "Rimozione: $DEPLOY_URL"
              vercel rm "$DEPLOY_URL" --yes --token=${{ secrets.VERCEL_TOKEN }} --scope=${{ secrets.VERCEL_ORG_ID }} || true
            done
            echo "✅ Preview rimossi per PR #${{ github.event.number }}"
          else
            echo "ℹ️ Nessun preview trovato per PR #${{ github.event.number }}"
          fi
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}

  cleanup-old-previews:
    name: Remove Old/Stale Previews
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule' || github.event_name == 'workflow_dispatch'
    steps:
      - name: Install Vercel CLI
        run: npm install -g vercel@latest

      - name: Cleanup Deployments Older Than 7 Days
        run: |
          echo "🗑️ Cleanup preview deployments più vecchi di 7 giorni"
          
          # Timestamp 7 giorni fa
          CUTOFF_DATE=$(date -d '7 days ago' +%s)000
          
          # Lista tutti i deployments preview
          vercel ls --token=${{ secrets.VERCEL_TOKEN }} --scope=${{ secrets.VERCEL_ORG_ID }} | grep -v "production" | tail -n +2 | while read -r line; do
            DEPLOY_URL=$(echo "$line" | awk '{print $2}')
            DEPLOY_AGE=$(echo "$line" | awk '{print $4}')
            
            # Verifica età (conversione approssimativa)
            if [[ "$DEPLOY_AGE" == *d || "$DEPLOY_AGE" == *w || "$DEPLOY_AGE" == *mo ]]; then
              echo "Rimozione deployment vecchio: $DEPLOY_URL (età: $DEPLOY_AGE)"
              vercel rm "$DEPLOY_URL" --yes --token=${{ secrets.VERCEL_TOKEN }} --scope=${{ secrets.VERCEL_ORG_ID }} || true
            fi
          done
          
          echo "✅ Cleanup completato"
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

---

## 📋 Dashboard Vercel - Configurazione Manuale

### 1. Project Settings

Naviga su: **Vercel Dashboard → Project → Settings**

#### Git Configuration
```
✅ Branches
  Production Branch: main
  
❌ Automatic Preview Deployments
  ⚪ All Branches (DISABILITARE)
  🔘 Only Production Branch
  
✅ Deploy Hooks
  Crea webhook per deploy manuali se necessario
```

#### Environment Variables
```
Production (main)
├─ VITE_SUPABASE_URL
├─ VITE_SUPABASE_ANON_KEY
└─ NODE_ENV=production

Preview (altri branch)
├─ VITE_SUPABASE_URL (stesso di prod o staging)
├─ VITE_SUPABASE_ANON_KEY (stesso di prod o staging)
└─ NODE_ENV=preview
```

#### Domains
```
Production:
  ├─ app.tuodominio.com (custom domain)
  └─ guardian-ai-crm.vercel.app (vercel subdomain)

Preview:
  └─ Usa solo URL auto-generati (pr-123-*.vercel.app)
```

### 2. Team Settings (se Vercel Team/Pro)

```
Usage Alerts:
  ✅ Abilita notifiche email per:
     - 50% quota bandwidth
     - 75% quota build minutes
     - 90% quota deployments
     
Spending Limits:
  ✅ Imposta soft limit mensile (es. $50/mese)
  ✅ Hard limit per evitare sorprese (es. $100/mese)
  
Deployment Protection:
  ✅ Abilita per production
  ❌ Disabilita per preview (troppo costoso)
```

---

## 📊 KPI e Monitoring

### 1. Metriche da Tracciare

```javascript
// Script: scripts/vercel-metrics.js
// Uso: node scripts/vercel-metrics.js

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const TEAM_ID = process.env.VERCEL_TEAM_ID;

const metrics = {
  monthly: {
    buildMinutes: 0,      // Max: 6000/mese (Hobby) o illimitati (Pro)
    bandwidth: 0,          // Max: 100GB/mese (Hobby)
    deployments: 0,        // Trackare numero totale
    previewDeploys: 0,     // Separare production da preview
    activePreview: 0       // Preview attivi al momento
  },
  
  costs: {
    estimated: 0,          // Stima basata su usage
    overages: 0            // Costi extra oltre piano
  },
  
  efficiency: {
    avgBuildTime: 0,       // Tempo medio build
    cacheHitRate: 0,       // Percentage cache hits
    failedBuilds: 0        // Build fallite (sprecate)
  }
};

// API calls per ottenere dati da Vercel
// https://vercel.com/docs/rest-api
```

### 2. Dashboard Monitoring

```yaml
# Metriche Settimanali da Controllare:

Build Performance:
  - ✅ Build time < 2 min (target)
  - ✅ Success rate > 95%
  - ⚠️ Failed builds < 5%
  
Preview Management:
  - 📊 Active previews: < 10
  - 📊 Avg preview lifetime: < 3 giorni
  - 📊 Preview per PR: 1-2 max
  
Resource Usage:
  - 📈 Bandwidth trend (GB/settimana)
  - 📈 Build minutes trend
  - 📈 Storage usage
  
Cost Analysis:
  - 💰 Projected monthly cost
  - 💰 Cost per deployment
  - 💰 Preview vs Production ratio
```

### 3. Alerts Configuration

```javascript
// scripts/vercel-alerts.js

const THRESHOLDS = {
  BUILD_MINUTES_WARNING: 4000,    // 66% di 6000
  BUILD_MINUTES_CRITICAL: 5000,   // 83% di 6000
  BANDWIDTH_WARNING: 70,          // 70GB di 100GB
  BANDWIDTH_CRITICAL: 85,         // 85GB di 100GB
  ACTIVE_PREVIEWS_MAX: 15,
  PREVIEW_AGE_MAX_DAYS: 7
};

async function checkAndAlert() {
  const usage = await getVercelUsage();
  
  if (usage.buildMinutes > THRESHOLDS.BUILD_MINUTES_CRITICAL) {
    await sendAlert({
      level: 'critical',
      message: `Build minutes at ${usage.buildMinutes}/6000. Action required!`,
      action: 'Disable preview deployments o upgrade plan'
    });
  }
  
  // Altri check...
}
```

---

## 🎓 Best Practices SaaS

### 1. Feature Flags per Deploy Condizionali

```typescript
// src/lib/featureFlags.ts

export const FEATURE_FLAGS = {
  // Deploy features progressivamente
  newDashboard: {
    production: true,
    preview: true,
    development: true
  },
  
  experimentalAI: {
    production: false,    // Non ancora in prod
    preview: true,        // Test in preview
    development: true
  },
  
  betaFeatures: {
    production: false,
    preview: true,
    development: true
  }
};

// Uso nel codice
if (FEATURE_FLAGS.experimentalAI[import.meta.env.MODE]) {
  // Mostra feature
}
```

### 2. Preview TTL (Time To Live)

```javascript
// vercel.json - configurazione avanzata
{
  "github": {
    "autoJobCancelation": true,  // Cancella build in corso se nuovo push
    "silent": false               // Commenta su GitHub
  }
}

// + Script cleanup automatico ogni notte (vedi workflow sopra)
```

### 3. Branch Protection Rules

Su GitHub: **Settings → Branches → Branch protection rules**

```yaml
Branch name pattern: main

Require:
  ✅ Pull request before merging
  ✅ Status checks to pass:
     - lint-and-typecheck
     - (opzionale) vercel-preview-success
  ✅ Conversation resolution before merging
  ✅ Linear history

Restrictions:
  ✅ Require deployments to succeed before merging (production env)
```

### 4. Deploy Commit Message Standards

```bash
# ✅ TRIGGER DEPLOY
git commit -m "feat: new dashboard component"
git commit -m "fix: login validation error"
git commit -m "chore: update dependencies"

# ❌ NO DEPLOY (usa [skip ci] se necessario)
git commit -m "docs: update README [skip ci]"
git commit -m "test: add unit tests [skip ci]"
git commit -m "ci: update workflow [skip ci]"
```

---

## 🚨 Troubleshooting & FAQ

### Q: "Ho troppi preview deployments attivi"
**A**: Esegui cleanup manuale:
```bash
# Installa Vercel CLI
npm i -g vercel

# Login
vercel login

# Lista deployments
vercel ls

# Rimuovi specifici
vercel rm <deployment-url> --yes

# O usa workflow cleanup automatico
gh workflow run vercel-cleanup.yml
```

### Q: "Build impiega troppo tempo"
**A**: Ottimizza build:
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    // Riduci chunk size
    chunkSizeWarningLimit: 1000,
    
    // Ottimizza minification
    minify: 'esbuild',
    
    // Riduci source maps in prod
    sourcemap: false
  },
  
  // Abilita cache
  cacheDir: '.vite'
});
```

### Q: "Costi Vercel inaspettati"
**A**: Analizza usage:
1. Vercel Dashboard → Usage
2. Verifica bandwidth (immagini, assets pesanti?)
3. Controlla build minutes (troppi rebuild?)
4. Valuta upgrade a Pro ($20/mese) se hobby limit superato

### Q: "Preview non si aggiorna"
**A**: Forza rebuild:
```bash
# Su PR, aggiungi commit vuoto
git commit --allow-empty -m "chore: trigger preview rebuild"
git push
```

---

## 📈 Optimization Roadmap

### Phase 1: Immediate (Questa settimana)
- [x] Disabilita auto-deploy su branch non necessari
- [x] Configura .vercelignore per ridurre upload
- [x] Implementa workflow cleanup automatico
- [x] Aggiungi branch naming convention

### Phase 2: Short-term (Prossimo mese)
- [ ] Implementa feature flags per rilasci graduali
- [ ] Setup monitoring alerts su Slack/Email
- [ ] Ottimizza bundle size (analizza con `npm run build -- --report`)
- [ ] Setup staging environment separato

### Phase 3: Long-term (3-6 mesi)
- [ ] Migrate to Vercel Pro per features avanzate
- [ ] Implementa A/B testing con Edge Middleware
- [ ] Setup CDN caching strategy
- [ ] Implement preview environments per user testing

---

## 📝 Checklist Implementazione

### Dashboard Vercel
- [ ] Disabilita "All Branches" preview deploy
- [ ] Configura production branch (main)
- [ ] Setup environment variables (prod vs preview)
- [ ] Abilita usage alerts
- [ ] Configura custom domain

### GitHub Repository
- [ ] Crea workflow .github/workflows/vercel-preview.yml
- [ ] Crea workflow .github/workflows/vercel-cleanup.yml
- [ ] Aggiungi secrets necessari:
  - [ ] VERCEL_TOKEN
  - [ ] VERCEL_ORG_ID
  - [ ] VERCEL_PROJECT_ID
- [ ] Configura branch protection rules
- [ ] Documenta branch naming convention

### Repository Files
- [ ] Aggiorna vercel.json con configurazione ottimizzata
- [ ] Crea .vercelignore
- [ ] Aggiungi scripts/vercel-metrics.js
- [ ] Aggiungi scripts/vercel-alerts.js
- [ ] Aggiorna DEPLOYMENT_GUIDE.md con sezione Vercel

### Team Communication
- [ ] Condividi branch naming convention con team
- [ ] Spiega quando usare label "deploy-preview"
- [ ] Training su cost optimization
- [ ] Setup canale Slack per Vercel notifications

---

## 🎯 Expected Results

### Prima dell'Ottimizzazione
```
📊 Metriche Tipiche (non ottimizzato):
- Preview deployments: 20-30/settimana
- Build minutes: 500-800/mese
- Preview inutilizzati: 60-70%
- Costi: $20-40/mese (hobby plan esaurito)
```

### Dopo l'Ottimizzazione
```
✅ Target Metriche (ottimizzato):
- Preview deployments: 5-10/settimana (-70%)
- Build minutes: 150-250/mese (-60%)
- Preview inutilizzati: <20%
- Costi: $0/mese (dentro hobby limits) o $20/mese (Pro plan ottimizzato)

💰 Risparmio Stimato: $20-30/mese
⏱️ Tempo Risparmiato: 4-6 ore/mese di gestione manuale
```

---

## 📚 Risorse Aggiuntive

- [Vercel Pricing](https://vercel.com/pricing)
- [Vercel Git Integration](https://vercel.com/docs/concepts/git)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Vercel REST API](https://vercel.com/docs/rest-api)
- [Vercel Usage Limits](https://vercel.com/docs/limits)

---

**✅ Documento compilato**: {{ DATA }}
**🔄 Prossima Review**: Ogni 2 settimane
**👤 Owner**: DevOps Team / Tech Lead
