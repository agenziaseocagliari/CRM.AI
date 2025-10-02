# ✅ Vercel Setup Checklist - Azioni Richieste

## 📋 Panoramica

Questo documento contiene le azioni manuali da completare nella **Vercel Dashboard** per attivare completamente la policy di deployment.

---

## 🎯 Configurazione Vercel Dashboard

### 1. Impostazioni Git (CRITICO)

**Percorso**: Project Settings → Git

#### Production Branch
- [ ] Imposta **Production Branch** su `main`
- [ ] Salva le modifiche

#### Automatic Deployments
- [ ] Disabilita **"Automatically deploy all branches"**
- [ ] Verifica che solo `main` sia abilitato per production

#### Preview Deployments
- [ ] Abilita **"Preview Deployments"** per Pull Requests
- [ ] Configura **Branch Prefixes** (se disponibile):
  - `feature/`
  - `fix/`
  - `hotfix/`

**Screenshot**: Verifica che le impostazioni corrispondano alla policy documentata

---

### 2. Deployment Protection (CONSIGLIATO)

**Percorso**: Project Settings → Deployment Protection

#### Expiration
- [ ] Imposta **"Deployment Expiration"** per preview:
  - **TTL**: 7 giorni
  - **Auto-cleanup**: Abilitato

#### Authentication (Opzionale ma Consigliato)
- [ ] Abilita **"Vercel Authentication"** per preview deployments
  - Protegge gli ambienti di test da accessi non autorizzati
  - Riduce il rischio di leak di dati sensibili

---

### 3. Environment Variables

**Percorso**: Project Settings → Environment Variables

Verifica che siano configurate:

- [ ] `VITE_SUPABASE_URL`
  - **Valore**: `https://[project-id].supabase.co`
  - **Environment**: Production, Preview
  
- [ ] `VITE_SUPABASE_ANON_KEY`
  - **Valore**: `[anon-key-da-supabase]`
  - **Environment**: Production, Preview

**⚠️ Nota**: Non committare mai questi valori nel codice!

---

### 4. General Settings

**Percorso**: Project Settings → General

#### Build & Development Settings
- [ ] Verifica **Framework Preset**: Vite
- [ ] Verifica **Build Command**: `npm run build`
- [ ] Verifica **Output Directory**: `dist`
- [ ] Verifica **Install Command**: `npm ci`

**Nota**: Queste impostazioni sono già configurate in `vercel.json`, ma verifica che siano correttamente rilevate.

---

## 🧹 Cleanup Esistente

### Prima Attivazione Policy

Se hai deployments esistenti da altri branch:

1. **Lista Deployments Attivi**:
   - Dashboard → Deployments
   - Filtra per **Branch** (non-main)

2. **Identifica Preview Obsoleti**:
   - PR chiuse ma deployment attivo
   - Branch eliminati ma deployment attivo
   - Deployment oltre 7 giorni

3. **Elimina Preview Non Necessari**:
   - Click su deployment
   - **Delete** deployment
   - Conferma eliminazione

4. **Elimina Branch Obsoleti**:
   ```bash
   # Locale
   git branch -d feature/vecchia-feature
   
   # Remote
   git push origin --delete feature/vecchia-feature
   ```

---

## ✅ Verifica Configurazione

### Test 1: Production Deploy (da main)

```bash
# Crea commit test
git checkout main
echo "test" >> test.txt
git add test.txt
git commit -m "test: verifica deploy produzione"
git push origin main
```

**Verifica**:
- [ ] Deployment si attiva su Vercel
- [ ] Deployment è **Production**
- [ ] Deployment va su dominio production

### Test 2: Preview Deploy (da feature branch)

```bash
# Crea feature branch
git checkout -b feature/test-policy
echo "preview test" >> test-preview.txt
git add test-preview.txt
git commit -m "test: verifica preview deployment"
git push origin feature/test-policy
```

**Apri PR su GitHub**

**Verifica**:
- [ ] Deployment si attiva su Vercel
- [ ] Deployment è **Preview**
- [ ] Link preview nella PR
- [ ] Preview è accessibile

### Test 3: Cleanup Automatico

**Merge/Chiudi la PR creata sopra**

**Verifica**:
- [ ] Preview deployment viene rimosso automaticamente
- [ ] Deployment non appare più in Dashboard

---

## 📊 Monitoring

### Metriche da Controllare

Dopo l'attivazione della policy, monitora:

1. **Numero Preview Attivi**:
   - Target: Max 5 contemporanei
   - Dashboard → Deployments → Filter: Preview

2. **TTL Medio Preview**:
   - Target: <3 giorni
   - Controlla data creazione vs eliminazione

3. **Costi Mensili**:
   - Dashboard → Usage
   - Confronta con mesi precedenti
   - Target: Riduzione 60-80%

4. **Build Success Rate**:
   - Dashboard → Deployments
   - Verifica nessun deploy fallito su main

---

## 🚨 Troubleshooting

### Preview Non Creato per PR

**Causa**: Configurazione Git non corretta

**Soluzione**:
1. Verifica Settings → Git → Preview Deployments abilitato
2. Verifica branch segue naming (feature/, fix/, hotfix/)
3. Verifica Vercel GitHub App ha permessi

### Branch Non-Main Deploya in Produzione

**Causa**: Production Branch non impostato correttamente

**Soluzione**:
1. ⚠️ **URGENTE**: Settings → Git → Production Branch = `main`
2. Disabilita "Deploy all branches"
3. Re-deploy da main per confermare

### Preview Non Viene Eliminato

**Causa**: Auto-cleanup non abilitato

**Soluzione**:
1. Settings → Deployment Protection → Expiration = 7 giorni
2. Elimina manualmente preview esistenti
3. Verifica comportamento su prossima PR

---

## 📚 Documentazione di Riferimento

- **[VERCEL_DEPLOYMENT_POLICY.md](./VERCEL_DEPLOYMENT_POLICY.md)** - Policy completa
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Guida deployment
- **[README.md](./README.md)** - Panoramica progetto

---

## ✅ Checklist Finale

Prima di considerare il setup completo:

- [ ] Production Branch impostato su `main`
- [ ] Deploy all branches disabilitato
- [ ] Preview deployments abilitato per PR
- [ ] Deployment expiration impostato (7 giorni)
- [ ] Environment variables configurate
- [ ] Test production deploy da main ✅
- [ ] Test preview deploy da feature branch ✅
- [ ] Test cleanup automatico ✅
- [ ] Branch obsoleti eliminati
- [ ] Preview obsoleti eliminati
- [ ] Team educato sulla policy
- [ ] Monitoring attivo

---

**Setup Completato**: 🎉

**Benefici Attesi**:
- ✅ 60-80% riduzione costi Vercel
- ✅ Main sempre stabile
- ✅ Workflow chiaro per il team
- ✅ Tracciabilità completa deployments

---

**Documento Version**: 1.0  
**Data**: 2025-01-21  
**Owner**: DevOps Team
