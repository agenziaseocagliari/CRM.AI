# ✅ Checklist di Sincronizzazione GitHub ↔️ Supabase

Questa checklist serve per verificare periodicamente che GitHub e Supabase siano perfettamente sincronizzati.

---

## 📅 Frequenza Verifiche

- **Settimanale**: Sezioni 1-3
- **Mensile**: Sezioni 1-5
- **Trimestrale**: Tutte le sezioni

---

## 1️⃣ Verifica Integrità Repository GitHub

### Code Quality
- [ ] Build TypeScript passa senza errori: `npm run lint`
- [ ] Nessun warning critico nel build
- [ ] Dipendenze aggiornate (controllare con `npm outdated`)
- [ ] Nessuna vulnerability critica: `npm audit`

### File Structure
- [ ] Directory `.github/workflows/` presente e intatta
- [ ] File `deploy-supabase.yml` presente e corretto
- [ ] Nessun file duplicato o legacy (es. `shared/` vs `_shared/`)
- [ ] `.gitignore` configurato correttamente

### Documentazione
- [ ] `README.md` aggiornato con info corrette
- [ ] `EDGE_FUNCTIONS_API.md` riflette tutte le functions
- [ ] `.env.example` contiene tutte le variabili necessarie

**Comando Verifica**:
```bash
cd /path/to/CRM-AI
npm run lint
npm audit
git status
```

---

## 2️⃣ Allineamento Branch Sviluppo/Produzione

### Branch Strategy
- [ ] Branch `main` contiene codice stabile e testato
- [ ] Branch di feature seguono naming convention: `feature/nome-feature`
- [ ] Branch di fix seguono naming convention: `fix/nome-fix`
- [ ] Nessun branch obsoleto o abbandonato

### Pull Requests
- [ ] Tutte le PR aperte sono revisionate
- [ ] PR vecchie (>2 settimane) sono chiuse o mergiate
- [ ] Nessuna PR in conflitto

### Commit History
- [ ] Commit messages sono descrittivi
- [ ] Nessun commit con secrets o credenziali
- [ ] History pulita senza merge confusi

**Comando Verifica**:
```bash
git branch -a
git log --oneline --graph --all -20
git --no-pager diff main...develop  # se hai branch develop
```

---

## 3️⃣ Sincronizzazione Edge Functions

### Deploy Status
- [ ] Workflow GitHub Actions `deploy-supabase.yml` esegue con successo
- [ ] Tutte le 22 edge functions sono deployate su Supabase
- [ ] Logs GitHub Actions non mostrano errori critici
- [ ] Nessun deployment fallito nelle ultime esecuzioni

### Functions Inventory
- [ ] `google-auth-url` ✓
- [ ] `google-token-exchange` ✓
- [ ] `check-google-token-status` ✓
- [ ] `create-google-event` ✓
- [ ] `update-google-event` ✓
- [ ] `delete-google-event` ✓
- [ ] `get-google-calendar-events` ✓
- [ ] `create-crm-event` ✓
- [ ] `get-all-crm-events` ✓
- [ ] `consume-credits` ✓
- [ ] `process-automation-request` ✓
- [ ] `score-contact-lead` ✓
- [ ] `generate-email-content` ✓
- [ ] `generate-whatsapp-message` ✓
- [ ] `generate-form-fields` ✓
- [ ] `send-email` ✓
- [ ] `send-welcome-email` ✓
- [ ] `send-whatsapp-message` ✓
- [ ] `schedule-event-reminders` ✓
- [ ] `process-scheduled-reminders` ✓
- [ ] `test-org-settings` ✓
- [ ] `run-debug-query` ✓

### Verifica Manuale Deploy
```bash
# Link al progetto
supabase link --project-ref [project-id]

# Lista functions deployate
supabase functions list

# Deploy tutte le functions (se necessario)
supabase functions deploy --no-verify-jwt

# Verifica singola function
curl -X POST https://[project].supabase.co/functions/v1/test-org-settings \
  -H "apikey: [anon-key]" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 4️⃣ Sincronizzazione Database Migrations

### Migration Files
- [ ] Tutte le migrations in `supabase/migrations/` sono valide
- [ ] Nessun file migration vuoto
- [ ] Migrations sono in ordine cronologico corretto
- [ ] Nessuna migration duplicata

### Applied Migrations
- [ ] Migrations sono applicate su Supabase remoto
- [ ] Schema database corrisponde a migrations locali
- [ ] Nessuna differenza tra local e remote schema

**Verifica Migrations**:
```bash
# Vedi migrations applicate
supabase migration list

# Pull schema da remoto
supabase db pull

# Push migrations a remoto (attenzione!)
supabase db push

# Se ci sono migrations con date anteriori a quelle già applicate, usa:
supabase db push --include-all
```

### Tabelle Critiche da Verificare
- [ ] `profiles` - Profili utenti
- [ ] `organizations` - Organizzazioni
- [ ] `organization_settings` - Settings per org
- [ ] `contacts` - Contatti CRM
- [ ] `crm_events` - Eventi CRM
- [ ] `event_reminders` - Promemoria
- [ ] `google_credentials` - Token OAuth Google
- [ ] `organization_credits` - Sistema crediti
- [ ] `credit_actions` - Configurazione costi azioni

---

## 5️⃣ Controllo Policy Accesso DB e Storage

### Row Level Security (RLS)
- [ ] RLS abilitato su tutte le tabelle pubbliche
- [ ] Policy per `SELECT` configurate correttamente
- [ ] Policy per `INSERT` limitano agli utenti autorizzati
- [ ] Policy per `UPDATE` verificano ownership
- [ ] Policy per `DELETE` verificano ownership
- [ ] Nessuna policy che espone dati sensibili

### Verifica Policy
```sql
-- Vedi tutte le policy
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verifica RLS abilitato
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;
```

### Storage Buckets
- [ ] Bucket configurati correttamente
- [ ] Policy storage limitano accesso per organization_id
- [ ] Nessun file pubblico non autorizzato
- [ ] Quota storage monitorata

---

## 6️⃣ Validazione Token API e Secret Management

### Supabase Secrets
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurato
- [ ] `GOOGLE_CLIENT_ID` configurato
- [ ] `GOOGLE_CLIENT_SECRET` configurato
- [ ] `GOOGLE_REDIRECT_URI` configurato
- [ ] `GEMINI_API_KEY` configurato
- [ ] `BREVO_SENDER_EMAIL` configurato
- [ ] `BREVO_SENDER_NAME` configurato

**Verifica Secrets (Supabase Dashboard)**:
1. Vai su: Settings → Edge Functions → Secrets
2. Verifica che tutte le variabili richieste siano presenti
3. Testa che i valori siano corretti (non scaduti)

### GitHub Secrets
- [ ] `SUPABASE_ACCESS_TOKEN` configurato
- [ ] `SUPABASE_PROJECT_ID` configurato
- [ ] `SUPABASE_DB_PASSWORD` configurato
- [ ] `SUPABASE_URL` configurato
- [ ] `SUPABASE_ANON_KEY` configurato

**Verifica GitHub Secrets**:
1. Vai su: Repository → Settings → Secrets and variables → Actions
2. Verifica presenza di tutti i secrets necessari

### Token Google OAuth
- [ ] Token Google non scaduti per organizzazioni attive
- [ ] `refresh_token` presente per tutte le org connesse
- [ ] Nessun errore `invalid_grant` nei logs

**Verifica Google Tokens**:
```sql
SELECT 
  organization_id,
  user_id,
  expiry_date,
  CASE 
    WHEN expiry_date < EXTRACT(EPOCH FROM NOW()) THEN 'EXPIRED'
    ELSE 'VALID'
  END as status,
  CASE 
    WHEN refresh_token IS NULL THEN 'MISSING REFRESH TOKEN'
    ELSE 'OK'
  END as refresh_status
FROM google_credentials;
```

---

## 7️⃣ Testing Eventi Calendario e Webhook

### Google Calendar Integration
- [ ] Creazione evento funziona
- [ ] Aggiornamento evento funziona
- [ ] Eliminazione evento funziona
- [ ] Lettura eventi funziona
- [ ] Token refresh automatico funziona

**Test Manuale**:
```bash
# Test create event
curl -X POST https://[project].supabase.co/functions/v1/create-google-event \
  -H "Authorization: Bearer [jwt-token]" \
  -H "apikey: [anon-key]" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "[org-id]",
    "summary": "Test Event",
    "start": "2025-10-01T10:00:00Z",
    "end": "2025-10-01T11:00:00Z"
  }'
```

### Webhook n8n (se configurato)
- [ ] Webhook endpoint n8n raggiungibile
- [ ] n8n riceve correttamente eventi da Supabase
- [ ] Workflow n8n eseguono senza errori
- [ ] Logs n8n non mostrano fallimenti

### Reminders System
- [ ] Promemoria vengono creati correttamente
- [ ] `process-scheduled-reminders` esegue con successo
- [ ] Notifiche WhatsApp vengono inviate
- [ ] Timestamp promemoria corretti

---

## 8️⃣ Generazione Report Errori/Debug

### Supabase Logs
- [ ] Controllare logs edge functions per errori
- [ ] Identificare pattern di errori ricorrenti
- [ ] Nessun errore 500 frequente
- [ ] Nessun timeout eccessivo

**Accedi ai Logs**:
1. Supabase Dashboard → Edge Functions → [function-name] → Logs
2. Filtra per errori: Level = Error
3. Ordina per timestamp discendente

### GitHub Actions Logs
- [ ] Workflow runs completano con successo
- [ ] Nessun fallimento nei job di deploy
- [ ] Build e lint passano sempre
- [ ] Security audit non trova vulnerabilità critiche

**Verifica GitHub Actions**:
1. Repository → Actions
2. Verifica ultimo workflow run
3. Controlla job falliti

### Application Logs (Frontend)
- [ ] Nessun errore critico in console browser
- [ ] API calls completano con successo
- [ ] Nessun loop infinito o memory leak
- [ ] Performance accettabile (load time < 3s)

---

## 9️⃣ Sistema a Crediti

### Funzionamento
- [ ] Funzione `consume-credits` funziona correttamente
- [ ] Crediti vengono decrementati correttamente
- [ ] Errore crediti insufficienti viene gestito
- [ ] Crediti rimanenti sono accurati

### Verifica Crediti Organizzazioni
```sql
-- Vedi crediti per tutte le org
SELECT 
  organization_id,
  credits_remaining,
  credits_total,
  last_updated
FROM organization_credits
ORDER BY credits_remaining ASC;

-- Vedi log consumi crediti
SELECT 
  organization_id,
  action_type,
  credits_consumed,
  created_at
FROM credit_consumption_logs
ORDER BY created_at DESC
LIMIT 50;
```

### Configurazione Costi
- [ ] Tabella `credit_actions` contiene tutte le azioni
- [ ] Costi sono ragionevoli e aggiornati
- [ ] Nessuna azione con costo 0 (tranne system actions)

---

## 🔟 Ottimizzazione Workflow

### Performance Edge Functions
- [ ] Tempo risposta medio < 2s
- [ ] Nessuna function con >90% di errori
- [ ] Cold start accettabile
- [ ] Nessun timeout eccessivo

### Optimization Suggestions
- [ ] Considerare caching per query frequenti
- [ ] Ottimizzare query database lente
- [ ] Ridurre dimensione payload dove possibile
- [ ] Implementare retry logic con backoff

### Monitoring
- [ ] Setup alert per errori critici (opzionale)
- [ ] Dashboard Supabase monitorato regolarmente
- [ ] Metriche usage tracciate

---

## 1️⃣1️⃣ Aggiornamento Documentazione

### README.md
- [ ] Istruzioni setup aggiornate
- [ ] Link corretti e funzionanti
- [ ] Sezioni CI/CD accurate
- [ ] Info su Google OAuth corrette

### EDGE_FUNCTIONS_API.md
- [ ] Tutte le functions documentate
- [ ] Request/Response examples accurati
- [ ] Costi crediti corretti
- [ ] Note implementazione aggiornate

### SUPERVISION_REPORT.md
- [ ] Report riflette stato attuale
- [ ] Criticità risolte rimosse
- [ ] Nuove raccomandazioni aggiunte

---

## 🎯 Azioni Correttive Comuni

### Se Edge Function Non Funziona
1. Controllare logs in Supabase Dashboard
2. Verificare secrets configurati correttamente
3. Testare localmente con `supabase functions serve [name]`
4. Re-deploy: `supabase functions deploy [name]`

### Se GitHub Actions Fallisce
1. Controllare logs workflow
2. Verificare GitHub secrets
3. Testare comandi localmente
4. Controllare rate limits GitHub/Supabase

### Se Token Google Scaduto
1. Utente riconnette da Settings UI
2. Verifica `refresh_token` salvato
3. Test manuale token refresh
4. Controllare Google Cloud Console per revoche

### Se Database Non Sincronizzato
1. `supabase db pull` per vedere differenze
2. Creare migration per fix: `supabase migration new fix_name`
3. Applicare: `supabase db push`
4. Se ci sono migrations con date anteriori: `supabase db push --include-all`
5. Verificare in Supabase Dashboard

---

## ✅ Sign-Off

Dopo aver completato la checklist:

- **Data Verifica**: _________________
- **Verificato da**: _________________
- **Criticità Trovate**: _________________
- **Azioni Intraprese**: _________________
- **Prossima Verifica**: _________________

---

**Template creato da**: AI Chief Engineer  
**Versione Checklist**: 1.0  
**Ultima Revisione**: 2025-09-30
