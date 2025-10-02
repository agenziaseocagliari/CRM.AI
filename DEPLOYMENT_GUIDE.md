# 🚀 Guida al Deployment - Guardian AI CRM

Guida completa per configurare e deployare il CRM su GitHub, Supabase e Vercel.

---

## 📋 Prerequisiti

Prima di iniziare, assicurati di avere:

- [ ] Account GitHub con repository CRM-AI
- [ ] Account Supabase con progetto creato
- [ ] Account Vercel (per frontend)
- [ ] Account Google Cloud (per OAuth e Calendar API)
- [ ] Account Brevo/Sendinblue (per email)
- [ ] Account Twilio (opzionale, per WhatsApp)
- [ ] Google Gemini API Key (per funzionalità AI)
- [ ] Node.js 20+ installato localmente
- [ ] Git configurato

---

## 1️⃣ Setup Iniziale GitHub

### Clona Repository
```bash
git clone https://github.com/seo-cagliari/CRM-AI.git
cd CRM-AI
npm install
```

### Configura GitHub Secrets

Vai su **Repository → Settings → Secrets and variables → Actions** e aggiungi:

| Secret Name | Descrizione | Dove Ottenerlo |
|------------|-------------|----------------|
| `SUPABASE_ACCESS_TOKEN` | Token di accesso Supabase | https://app.supabase.com/account/tokens |
| `SUPABASE_PROJECT_ID` | ID progetto Supabase | Dashboard Supabase → Settings → General |
| `SUPABASE_DB_PASSWORD` | Password database | Salvata durante setup progetto |
| `SUPABASE_URL` | URL progetto | https://[project-id].supabase.co |
| `SUPABASE_ANON_KEY` | Chiave anonima pubblica | Dashboard → Settings → API |

**⚠️ Importante**: Questi secrets sono necessari per il workflow CI/CD automatico.

---

## 2️⃣ Setup Supabase

### Crea Progetto
1. Vai su https://app.supabase.com
2. Crea nuovo progetto
3. Scegli region (consigliato: Europe West)
4. Annota password database

### Configura Database

#### Esegui Migrations
```bash
# Link al progetto
supabase link --project-ref [tuo-project-id]

# Push migrations
supabase db push
```

Se non hai Supabase CLI installato:
```bash
npm install -g supabase
```

#### Verifica Tabelle Create
Verifica che queste tabelle esistano:
- `profiles`
- `organizations`
- `organization_settings`
- `contacts`
- `crm_events`
- `event_reminders`
- `google_credentials`
- `organization_credits`
- `credit_actions`

### Configura Edge Functions Secrets

Vai su **Dashboard → Settings → Edge Functions → Secrets** e aggiungi:

| Variable Name | Valore | Descrizione |
|--------------|--------|-------------|
| `SUPABASE_URL` | `https://[project-id].supabase.co` | URL progetto |
| `SUPABASE_SERVICE_ROLE_KEY` | Da Settings → API | Chiave service role (SENSIBILE!) |
| `GOOGLE_CLIENT_ID` | Da Google Cloud Console | OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Da Google Cloud Console | OAuth Client Secret |
| `GOOGLE_REDIRECT_URI` | `https://[tuo-dominio]/settings` | URL redirect OAuth |
| `GEMINI_API_KEY` | Da Google AI Studio | API key Gemini |
| `BREVO_SENDER_EMAIL` | `noreply@tuodominio.com` | Email mittente globale |
| `BREVO_SENDER_NAME` | `Guardian AI CRM` | Nome mittente |

### Deploy Edge Functions

```bash
# Deploy tutte le functions
supabase functions deploy --no-verify-jwt

# Oppure singolarmente
supabase functions deploy google-auth-url
supabase functions deploy create-crm-event
# ... altre functions
```

**Verifica Deploy**:
```bash
supabase functions list
```

Dovresti vedere tutte le 22 functions deployate.

---

## 3️⃣ Setup Google Cloud Console

### Crea Progetto OAuth

1. Vai su https://console.cloud.google.com
2. Crea nuovo progetto: "Guardian AI CRM"
3. Abilita API: **Google Calendar API**

### Configura OAuth Consent Screen

1. APIs & Services → OAuth consent screen
2. User Type: **External**
3. App name: **Guardian AI CRM**
4. User support email: tua email
5. Authorized domains: aggiungi il tuo dominio
6. Scopes: aggiungi `https://www.googleapis.com/auth/calendar`

### Crea Credenziali OAuth 2.0

1. APIs & Services → Credentials
2. Create Credentials → OAuth 2.0 Client ID
3. Application type: **Web application**
4. Authorized redirect URIs:
   - `https://[tuo-dominio]/settings`
   - `http://localhost:5173/settings` (per dev)
5. Salva **Client ID** e **Client Secret**

### Crea API Key per Gemini

1. Vai su https://aistudio.google.com/app/apikey
2. Crea API key
3. Copia e salva in Supabase Secrets

---

## 4️⃣ Setup Brevo (Email)

### Crea Account
1. Registrati su https://www.brevo.com
2. Verifica email

### Configura Sender
1. Settings → Senders & IP → Add Sender
2. Aggiungi email (es. `noreply@tuodominio.com`)
3. Verifica email tramite link

### Ottieni API Key
1. Settings → SMTP & API → API Keys
2. Crea nuova API key
3. Copia la chiave

**⚠️ Nota**: Ogni organizzazione deve configurare la propria `brevo_api_key` nella tabella `organization_settings` tramite UI Settings.

---

## 5️⃣ Setup Twilio WhatsApp (Opzionale)

### Crea Account
1. Registrati su https://www.twilio.com
2. Verifica numero telefono

### Setup Sandbox WhatsApp
1. Messaging → Try it out → Send a WhatsApp message
2. Segui istruzioni per attivare sandbox
3. Invia messaggio a sandbox per testing

### Ottieni Credenziali
1. Account → API keys & tokens
2. Copia:
   - Account SID
   - Auth Token

**⚠️ Nota**: Ogni organizzazione configura le proprie credenziali Twilio nella tabella `organization_settings` tramite UI.

---

## 6️⃣ Deploy Frontend su Vercel

### ⚠️ Policy di Deployment

**IMPORTANTE**: Questo progetto segue una **strict deployment policy** per ottimizzare costi e sostenibilità.

📖 **Leggi la policy completa**: [VERCEL_DEPLOYMENT_POLICY.md](./VERCEL_DEPLOYMENT_POLICY.md)

**Regole chiave**:
- ✅ **Produzione**: Deploy automatico SOLO da branch `main`
- 🔍 **Preview**: Solo per PR su branch `feature/*`, `fix/*`, `hotfix/*`
- ⏱️ **TTL**: Preview deployments max 7 giorni
- 🧹 **Cleanup**: Rimozione immediata dopo merge/close PR

### Collega Repository

1. Vai su https://vercel.com
2. Import Git Repository
3. Seleziona `seo-cagliari/CRM-AI`

### Configura Git Settings (IMPORTANTE)

**In Vercel Dashboard → Project Settings → Git**:

1. **Production Branch**: Imposta su `main`
2. **Automatic Deployments**: 
   - ✅ Abilita SOLO per `main`
   - ❌ Disabilita "Deploy all branches"
3. **Preview Deployments**:
   - ✅ Abilita per Pull Requests
   - ✅ Branch prefix: `feature/`, `fix/`, `hotfix/`

### Configura Environment Variables

Aggiungi in **Settings → Environment Variables**:

```
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key-da-supabase]
```

### Configura Deployment Protection (Opzionale ma Consigliato)

**In Settings → Deployment Protection**:

1. **Deployment Expiration**: Imposta a 7 giorni per preview
2. **Vercel Authentication**: Abilita per preview deployments (protegge ambienti di test)

### Deploy

1. Il primo deploy avviene automaticamente dopo l'import
2. Attendi build e deployment
3. Verifica che il sito sia online

**⚠️ Nota**: Dopo il setup iniziale, i deployment avvengono automaticamente:
- Su **push a `main`** → Deploy in produzione
- Su **apertura PR** → Deploy preview (se branch è `feature/*`, `fix/*`, etc.)

### Configura Custom Domain (Opzionale)

1. Settings → Domains
2. Aggiungi tuo dominio
3. Configura DNS secondo istruzioni Vercel
4. Attendi verifica SSL (automatico)

**⚠️ Importante**: Dopo aver configurato dominio custom, aggiorna:
- `GOOGLE_REDIRECT_URI` nei secrets Supabase
- Authorized redirect URIs in Google Cloud Console

---

## 7️⃣ Configurazione Post-Deploy

### Crea Primo Utente Admin

1. Vai su tuo dominio
2. Registra nuovo account
3. Accedi al database Supabase
4. Aggiorna campo `role` a `'super_admin'` per il tuo user

```sql
UPDATE profiles 
SET role = 'super_admin' 
WHERE email = 'tua-email@example.com';
```

### Configura Organizzazione

1. Login come super admin
2. Dashboard → Organizations
3. Crea nuova organizzazione
4. Configura settings:
   - Brevo API Key
   - Twilio credentials (opzionale)
   - Crediti iniziali

### Testa Integrazioni

#### Test Google Calendar
1. Settings → Integrazioni
2. Connetti Google Calendar
3. Crea evento di test
4. Verifica su Google Calendar

#### Test Email
1. Crea nuovo contatto
2. Invia email di test
3. Verifica ricezione

#### Test AI Features
1. Contacts → Nuovo contatto
2. Verifica lead scoring automatico
3. Prova generazione email AI

---

## 8️⃣ Workflow CI/CD

### Come Funziona

Il workflow `.github/workflows/deploy-supabase.yml` esegue automaticamente:

**Su Pull Request**:
- TypeScript lint check
- Build test
- Security audit

**Su Push a Main**:
- Tutti i check sopra
- Deploy edge functions a Supabase
- Sync migrations database
- Verifica deployment
- Health check

### Trigger Manuale

Puoi triggerare il workflow manualmente:

1. Repository → Actions
2. Seleziona "Deploy to Supabase"
3. Run workflow → Run workflow

---

## 9️⃣ Verifica Deployment

### Script di Verifica Automatica

```bash
./scripts/verify-sync.sh
```

Questo script verifica:
- ✅ Repository integrity
- ✅ TypeScript build
- ✅ 22 edge functions presenti
- ✅ Documentazione completa
- ✅ Security checks

### Verifica Manuale

#### Edge Functions
```bash
# Test function
curl -X POST https://[project-id].supabase.co/functions/v1/test-org-settings \
  -H "apikey: [anon-key]" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Dovresti ricevere risposta JSON senza errori.

#### Database
```sql
-- Verifica tabelle
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verifica RLS policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

#### Frontend
1. Apri browser su tuo dominio
2. Apri Developer Tools → Console
3. Non devono esserci errori JavaScript
4. Verifica che login funzioni

---

## 🔟 Troubleshooting Comuni

### Edge Function 500 Error

**Problema**: Function restituisce 500 Internal Server Error

**Soluzioni**:
1. Controlla logs: Dashboard → Edge Functions → [function] → Logs
2. Verifica secrets configurati correttamente
3. Verifica che database abbia tabelle necessarie
4. Re-deploy function: `supabase functions deploy [name]`

### Google OAuth Non Funziona

**Problema**: Errore durante connessione Google Calendar

**Soluzioni**:
1. Verifica `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` nei secrets
2. Controlla redirect URI in Google Cloud Console
3. Verifica che Calendar API sia abilitata
4. Controlla logs edge function `google-token-exchange`

### Email Non Vengono Inviate

**Problema**: Email non arrivano a destinazione

**Soluzioni**:
1. Verifica `brevo_api_key` in `organization_settings`
2. Controlla quota Brevo non esaurita
3. Verifica sender email verificata in Brevo
4. Controlla logs edge function `send-email`

### Crediti Non Vengono Decrementati

**Problema**: Sistema crediti non funziona

**Soluzioni**:
1. Verifica tabella `credit_actions` popolata
2. Controlla RPC function `consume_credits_rpc` esista
3. Verifica `organization_credits` abbia record per l'org
4. Controlla logs function `consume-credits`

### GitHub Actions Workflow Fallisce

**Problema**: Workflow CI/CD non completa

**Soluzioni**:
1. Verifica GitHub Secrets configurati
2. Controlla logs workflow per errore specifico
3. Verifica Supabase Access Token valido
4. Testa comandi localmente

---

## 📊 Monitoring & Manutenzione

### Quotidiano
- [ ] Controlla logs edge functions per errori
- [ ] Verifica usage crediti organizzazioni
- [ ] Review errori applicazione

### Settimanale
- [ ] Esegui `./scripts/verify-sync.sh`
- [ ] Controlla GitHub Actions runs
- [ ] Review performance Supabase Dashboard
- [ ] Backup database

### Mensile
- [ ] `npm audit` e aggiornamenti sicurezza
- [ ] Review e cleanup logs vecchi
- [ ] Verifica storage usage
- [ ] Update documentazione se necessario

---

## 🆘 Supporto

### Risorse
- 📖 [EDGE_FUNCTIONS_API.md](./EDGE_FUNCTIONS_API.md) - Documentazione API
- 📋 [SYNC_CHECKLIST.md](./SYNC_CHECKLIST.md) - Checklist sincronizzazione
- 🔍 [SUPERVISION_REPORT.md](./SUPERVISION_REPORT.md) - Report supervisione
- 🛠️ [scripts/README.md](./scripts/README.md) - Documentazione script

### Links Utili
- **Supabase Docs**: https://supabase.com/docs
- **Google Calendar API**: https://developers.google.com/calendar
- **Brevo API**: https://developers.brevo.com
- **Vercel Docs**: https://vercel.com/docs

---

## ✅ Checklist Deployment Completo

- [ ] Repository GitHub configurato
- [ ] GitHub Secrets aggiunti
- [ ] Progetto Supabase creato
- [ ] Database migrations applicate
- [ ] Supabase Edge Functions secrets configurati
- [ ] Edge functions deployate (22 totali)
- [ ] Google Cloud OAuth configurato
- [ ] Gemini API key ottenuta
- [ ] Brevo account creato e configurato
- [ ] Twilio configurato (opzionale)
- [ ] Frontend deployato su Vercel
- [ ] Environment variables Vercel configurate
- [ ] Custom domain configurato (opzionale)
- [ ] Primo utente admin creato
- [ ] Organizzazione configurata
- [ ] Integrazioni testate (Calendar, Email, AI)
- [ ] Workflow CI/CD testato
- [ ] Script verifica eseguito
- [ ] Documentazione letta

---

**Congratulazioni! 🎉**

Il tuo Guardian AI CRM è ora completamente deployato e operativo!

---

**Guida creata da**: AI Chief Engineer  
**Versione**: 1.0  
**Ultima Revisione**: 2025-09-30
