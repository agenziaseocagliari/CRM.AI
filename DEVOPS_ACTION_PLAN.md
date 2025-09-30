# 🚀 Piano Operativo DevOps - Sincronizzazione GitHub/Supabase

**Data**: 2025-09-30  
**Agente**: DevOps Senior  
**Stato**: 📋 IN ATTESA DI ESECUZIONE MANUALE

---

## 🎯 Obiettivo

Ripristinare la sincronizzazione e l'automazione tra GitHub e Supabase eseguendo il merge della Pull Request #3 e configurando correttamente i GitHub Secrets.

---

## ⚠️ NOTA IMPORTANTE PER L'UTENTE

Come agente AI, ho alcune **limitazioni tecniche** che richiedono il tuo intervento diretto:

### ❌ Cosa NON Posso Fare
- **Non posso mergiare Pull Request** (richiede permessi GitHub che non ho)
- **Non posso accedere o configurare GitHub Secrets** (restrizione di sicurezza)
- **Non posso eseguire push diretto sul branch main** (limitazione repository)
- **Non posso accedere alla dashboard Supabase** per verificare deployment

### ✅ Cosa Posso Fare
- Creare documentazione dettagliata e piani d'azione
- Analizzare il codice e la configurazione
- Preparare script e verifiche
- Fornire istruzioni passo-passo chiare

---

## 📋 TASK OPERATIVI DA ESEGUIRE

### ✅ Task 1: Analisi della Pull Request #3

**COMPLETATO** ✓

Ho analizzato la PR #3 e confermato che contiene:
- ✅ Workflow CI/CD completo (`.github/workflows/deploy-supabase.yml`)
- ✅ Script di verifica automatica (`scripts/verify-sync.sh`)
- ✅ Documentazione completa (DEPLOYMENT_GUIDE.md, EDGE_FUNCTIONS_API.md, etc.)
- ✅ Template configurazione (`.env.example` completato)
- ✅ Pulizia directory duplicate (rimozione `supabase/functions/shared/`)

**PR #3 Status**:
- **Stato**: Open (draft)
- **Branch**: `copilot/fix-a8a05e7b-ff53-4831-81d0-bc4cd91f7838` → `main`
- **File modificati**: 12
- **Aggiunte**: 3527 righe
- **Rimozioni**: 19 righe
- **Mergeable**: ✅ Sì (nessun conflitto)

---

### 🔴 Task 2: Merge della Pull Request #3 [RICHIEDE AZIONE MANUALE]

**ISTRUZIONI PER L'UTENTE**:

1. **Vai alla Pull Request #3**:
   - URL: https://github.com/seo-cagliari/CRM-AI/pull/3

2. **Rivedi le modifiche**:
   - Controlla i file modificati
   - Verifica che tutto sia come previsto
   - La PR contiene 3527 righe di documentazione e configurazione

3. **Cambia stato da Draft a Ready**:
   - Nella PR, clicca su "Ready for review"
   - Questo rimuove lo stato draft

4. **Esegui il Merge**:
   - Clicca su "Merge pull request"
   - Scegli "Squash and merge" (raccomandato per PR di documentazione)
   - Conferma il merge

5. **Verifica che il merge sia completato**:
   ```bash
   git checkout main
   git pull origin main
   ls -la .github/workflows/deploy-supabase.yml
   ```

**Risultato Atteso**: Il branch `main` ora contiene tutti i file della PR #3.

---

### 🔴 Task 3: Configurazione GitHub Secrets [RICHIEDE AZIONE MANUALE]

**ISTRUZIONI PER L'UTENTE**:

#### Dove Configurare
1. Vai al repository: https://github.com/seo-cagliari/CRM-AI
2. Clicca su **Settings** (⚙️ icona in alto)
3. Nel menu laterale, vai su **Secrets and variables** → **Actions**
4. Clicca su **New repository secret**

#### Secrets Richiesti

Devi aggiungere questi 5 secrets per abilitare il workflow CI/CD:

| Secret Name | Dove Ottenerlo | Esempio Valore |
|-------------|----------------|----------------|
| `SUPABASE_ACCESS_TOKEN` | https://app.supabase.com/account/tokens | `sbp_...` (inizia con sbp_) |
| `SUPABASE_PROJECT_ID` | Dashboard Supabase → Settings → General | `abcdefghijklmnopqrst` (20 caratteri) |
| `SUPABASE_DB_PASSWORD` | Salvata durante creazione progetto Supabase | La password del database |
| `SUPABASE_URL` | Dashboard Supabase → Settings → API | `https://[project-id].supabase.co` |
| `SUPABASE_ANON_KEY` | Dashboard Supabase → Settings → API | `eyJ...` (JWT token lungo) |

#### Guida Dettagliata per Ogni Secret

##### 1. SUPABASE_ACCESS_TOKEN
```
1. Vai su: https://app.supabase.com/account/tokens
2. Clicca su "Generate new token"
3. Nome: "GitHub Actions Deploy"
4. Copia il token (inizia con sbp_)
5. Aggiungi come secret in GitHub
```

##### 2. SUPABASE_PROJECT_ID
```
1. Vai su: https://app.supabase.com
2. Seleziona il tuo progetto "CRM-AI"
3. Settings → General
4. Copia "Reference ID" (es: abcdefghijklmnopqrst)
5. Aggiungi come secret in GitHub
```

##### 3. SUPABASE_DB_PASSWORD
```
Questa è la password che hai impostato quando hai creato il progetto Supabase.
Se l'hai persa, puoi resetarla da:
1. Dashboard Supabase → Settings → Database
2. Clicca su "Reset database password"
3. Imposta nuova password
4. Aggiungila come secret in GitHub
```

##### 4. SUPABASE_URL
```
1. Dashboard Supabase → Settings → API
2. Copia "Project URL" (formato: https://[project-id].supabase.co)
3. Aggiungi come secret in GitHub
```

##### 5. SUPABASE_ANON_KEY
```
1. Dashboard Supabase → Settings → API
2. Copia "anon public" key (un JWT lungo che inizia con eyJ)
3. Aggiungi come secret in GitHub
```

#### Verifica Configurazione Secrets
Una volta aggiunti tutti i secrets:
1. Vai su Settings → Secrets and variables → Actions
2. Dovresti vedere tutti e 5 i secrets elencati
3. ✅ Configurazione completata!

**⚠️ IMPORTANTE**: Non condividere mai questi secrets pubblicamente!

---

### 🔴 Task 4: Trigger Pipeline CI/CD [RICHIEDE AZIONE MANUALE]

Dopo aver completato Task 2 e Task 3, devi triggare la pipeline:

#### Opzione A: Push Commit al Main (Raccomandato)
```bash
# Checkout al main
git checkout main
git pull origin main

# Crea un commit vuoto per triggare il workflow
git commit --allow-empty -m "chore: trigger CI/CD pipeline after PR #3 merge"

# Push al main
git push origin main
```

#### Opzione B: Trigger Manuale da GitHub UI
1. Vai su: https://github.com/seo-cagliari/CRM-AI/actions
2. Seleziona il workflow "Deploy to Supabase"
3. Clicca su "Run workflow"
4. Scegli branch "main"
5. Clicca "Run workflow"

**Risultato Atteso**: Il workflow inizierà l'esecuzione automaticamente.

---

### 📊 Task 5: Monitoraggio Pipeline [RICHIEDE VERIFICA MANUALE]

#### Accesso ai Logs
1. Vai su: https://github.com/seo-cagliari/CRM-AI/actions
2. Clicca sull'esecuzione più recente
3. Vedrai 5 job paralleli:
   - 🔍 Lint and TypeScript Check
   - 🚀 Deploy Edge Functions to Supabase
   - 🗄️ Sync Database Migrations
   - ✅ Verify Deployment
   - 🔒 Security Audit

#### Checklist Verifica

##### ✅ Job 1: Lint and TypeScript Check
- [ ] TypeScript compilation passa senza errori
- [ ] Linting completa con successo
- [ ] Nessun warning critico

##### ✅ Job 2: Deploy Edge Functions
- [ ] Supabase CLI si collega al progetto
- [ ] Tutte le 22 edge functions vengono deployate
- [ ] Nessun errore di deploy
- [ ] Output mostra "✅ Edge functions deployed successfully!"

##### ✅ Job 3: Sync Database Migrations
- [ ] Migrations vengono push a Supabase
- [ ] Nessun conflitto di schema
- [ ] Output mostra "✅ Database migrations synced successfully!"

##### ✅ Job 4: Verify Deployment
- [ ] Health check edge functions passa
- [ ] API risponde correttamente
- [ ] HTTP status code tra 200-499

##### ✅ Job 5: Security Audit
- [ ] npm audit completa
- [ ] Nessun secret trovato nel codice
- [ ] Output mostra "✅ No obvious secrets detected in code"

#### Verifica su Supabase Dashboard

Dopo il completamento del workflow, verifica su Supabase:

1. **Edge Functions**:
   ```
   Dashboard → Edge Functions
   
   Dovresti vedere tutte le 22 functions:
   ✓ google-auth-url
   ✓ google-token-exchange
   ✓ check-google-token-status
   ✓ create-google-event
   ✓ update-google-event
   ✓ delete-google-event
   ✓ get-google-calendar-events
   ✓ create-crm-event
   ✓ get-all-crm-events
   ✓ consume-credits
   ✓ process-automation-request
   ✓ score-contact-lead
   ✓ generate-email-content
   ✓ generate-whatsapp-message
   ✓ generate-form-fields
   ✓ send-email
   ✓ send-welcome-email
   ✓ send-whatsapp-message
   ✓ schedule-event-reminders
   ✓ process-scheduled-reminders
   ✓ test-org-settings
   ✓ run-debug-query
   
   Verifica che tutte siano state aggiornate OGGI.
   ```

2. **Database Migrations**:
   ```
   Dashboard → Database → Migrations
   
   Verifica che tutte le migrations siano applicate e sincronizzate.
   ```

3. **Logs**:
   ```
   Dashboard → Edge Functions → [nome-function] → Logs
   
   Controlla che non ci siano errori recenti.
   ```

---

### 🐛 Task 6: Troubleshooting Errori Comuni

#### Errore: GitHub Secrets Non Configurati
```
Sintomo: Workflow fallisce con "Error: secret not found"

Soluzione:
1. Verifica che tutti i 5 secrets siano configurati
2. Controlla che i nomi siano esattamente come indicato (case-sensitive)
3. Re-run workflow dopo aver aggiunto secrets mancanti
```

#### Errore: Supabase Access Token Invalido
```
Sintomo: "Error: Invalid Supabase Access Token"

Soluzione:
1. Vai su https://app.supabase.com/account/tokens
2. Revoca il vecchio token
3. Genera nuovo token
4. Aggiorna il secret SUPABASE_ACCESS_TOKEN in GitHub
5. Re-run workflow
```

#### Errore: Project ID Non Trovato
```
Sintomo: "Error: Project not found"

Soluzione:
1. Verifica SUPABASE_PROJECT_ID sia corretto
2. Vai su Dashboard Supabase → Settings → General
3. Copia esattamente il "Reference ID"
4. Aggiorna il secret in GitHub
5. Re-run workflow
```

#### Errore: Database Password Errata
```
Sintomo: "Error: Database authentication failed"

Soluzione:
1. Dashboard Supabase → Settings → Database
2. Reset database password
3. Aggiorna SUPABASE_DB_PASSWORD in GitHub secrets
4. Re-run workflow
```

#### Errore: Edge Function Deployment Failed
```
Sintomo: Alcune functions non si deployano

Soluzione:
1. Controlla logs workflow per dettagli errore
2. Verifica che tutti i secrets Supabase Edge Functions siano configurati:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - GEMINI_API_KEY
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET
   - GOOGLE_REDIRECT_URI
   - BREVO_SENDER_EMAIL
   - BREVO_SENDER_NAME
3. Configura secrets mancanti in Supabase Dashboard
4. Re-deploy manualmente se necessario:
   ```bash
   supabase functions deploy --no-verify-jwt
   ```
```

---

## 📊 Report Stato Finale

Una volta completati tutti i task, compila questo report:

### Stato Sincronizzazione GitHub/Supabase

```
Data Verifica: _______________

✅ COMPLETATO / ⏳ IN CORSO / ❌ ERRORE

[ ] Task 1: Analisi PR #3
[ ] Task 2: Merge PR #3 sul main
[ ] Task 3: Configurazione GitHub Secrets (5/5)
[ ] Task 4: Trigger Pipeline CI/CD
[ ] Task 5: Verifica Deployment Workflow
[ ] Task 6: Verifica Edge Functions su Supabase (22/22)
[ ] Task 7: Verifica Migrations Sincronizzate

Stato Complessivo: ________________

Note:
_________________________________________________
_________________________________________________
_________________________________________________
```

### Verifica Edge Functions

```bash
# Esegui questo comando per verificare che le functions rispondano
curl -X POST https://[your-project-id].supabase.co/functions/v1/test-org-settings \
  -H "apikey: [your-anon-key]" \
  -H "Content-Type: application/json" \
  -d '{}'

# Output atteso: JSON con info organizzazione o errore strutturato
# NON deve essere: 404 Not Found o 500 Internal Server Error
```

### Checklist Finale

- [ ] Workflow GitHub Actions esegue senza errori
- [ ] Tutte le 22 edge functions deployate su Supabase
- [ ] Data ultimo deploy = OGGI
- [ ] Migrations database sincronizzate
- [ ] Health check passa
- [ ] Security audit passa
- [ ] Nessun errore nei logs Supabase

---

## 📚 Documentazione di Riferimento

Dopo il merge della PR #3, avrai accesso a:

- **DEPLOYMENT_GUIDE.md** - Guida completa deployment
- **EDGE_FUNCTIONS_API.md** - Documentazione API completa
- **SYNC_CHECKLIST.md** - Checklist verifiche periodiche
- **SUPERVISION_REPORT.md** - Report analisi repository
- **IMPLEMENTATION_SUMMARY.md** - Riepilogo implementazioni
- **scripts/verify-sync.sh** - Script verifica automatica

### Uso Script di Verifica
```bash
# Dopo il merge, esegui:
chmod +x scripts/verify-sync.sh
./scripts/verify-sync.sh

# Output: Report completo sullo stato del repository
```

---

## 🆘 Supporto Aggiuntivo

Se incontri problemi durante l'esecuzione:

1. **Controlla i Logs**:
   - GitHub Actions: https://github.com/seo-cagliari/CRM-AI/actions
   - Supabase: Dashboard → Edge Functions → Logs

2. **Consulta la Documentazione**:
   - DEPLOYMENT_GUIDE.md (nel repository dopo merge PR #3)
   - EDGE_FUNCTIONS_API.md (documentazione API)
   - Troubleshooting section sopra

3. **Verifica Secrets**:
   - Tutti configurati correttamente?
   - Valori corretti (nessun spazio extra)?
   - Token non scaduti?

4. **Test Manuale**:
   ```bash
   # Verifica accesso Supabase
   supabase link --project-ref [project-id]
   supabase functions list
   
   # Se necessario, deploy manuale
   supabase functions deploy --no-verify-jwt
   ```

---

## ✅ Conclusione

Questo piano d'azione fornisce tutte le istruzioni necessarie per:
- ✅ Mergiare la PR #3 sul branch main
- ✅ Configurare i GitHub Secrets necessari
- ✅ Triggare e monitorare la pipeline CI/CD
- ✅ Verificare che edge functions e migrations siano sincronizzate
- ✅ Troubleshooting errori comuni

**Prossimo Step**: Eseguire i Task 2, 3, 4, 5 seguendo le istruzioni sopra.

---

**Creato da**: DevOps Senior Agent  
**Data**: 2025-09-30  
**Versione**: 1.0
