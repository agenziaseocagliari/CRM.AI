# 🤖 Super Admin AI + Automation Control Plane - Guida Completa

## 📋 Indice

1. [Panoramica](#panoramica)
2. [Agenti di Automazione](#agenti-di-automazione)
3. [API & Integrations Manager](#api--integrations-manager)
4. [Workflow Builder AI](#workflow-builder-ai)
5. [Architettura del Sistema](#architettura-del-sistema)
6. [Guida all'Implementazione](#guida-allimplementazione)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Panoramica

Il sistema di **AI + Automation Control Plane** per Super Admin offre una piattaforma completa per:

- 🤖 Gestione di agenti AI automatizzati per monitoring, security, payments, support e user engagement
- 🌐 Configurazione centralizzata di integrazioni API esterne (WhatsApp, Email, Telegram, AI, Push)
- ⚡ Creazione di workflow personalizzati tramite linguaggio naturale
- 📊 Monitoring e logging completo di tutte le operazioni
- 🔐 Audit trail automatico per compliance e sicurezza

### Caratteristiche Principali

✅ **Modularità**: Ogni agente è un componente indipendente e configurabile  
✅ **Scalabilità**: Architettura plugin-based per aggiungere nuovi provider  
✅ **Sicurezza**: RLS policies e audit logging su tutte le operazioni  
✅ **Usabilità**: Interfaccia AI per creare automazioni senza codice  
✅ **Osservabilità**: Log dettagliati e metriche in tempo reale  

---

## Agenti di Automazione

### 1. Health Monitor Agent

**Scopo**: Monitora l'uptime, errori API, anomalie login e health generale del sistema.

**Configurazione**:
```json
{
  "alert_channels": ["in_app", "email"],
  "check_interval_minutes": 15,
  "thresholds": {
    "error_rate": 5,
    "uptime_percentage": 99
  }
}
```

**Funzionalità**:
- ✅ Controlla uptime servizi ogni N minuti
- ✅ Rileva errori API sopra soglia
- ✅ Identifica anomalie nei pattern di login
- ✅ Invia alert automatici su canali configurati
- ✅ Dashboard health in tempo reale

**Alert Automatici**:
- Uptime < 99% → Email + In-App Notification
- Error rate > 5/min → Slack/Telegram Alert
- Login anomaly detected → Security team notification

---

### 2. Payment/Revenue Agent

**Scopo**: Monitora pagamenti ricorrenti, crediti, transazioni failed, e stato abbonamenti.

**Configurazione**:
```json
{
  "alert_channels": ["email", "whatsapp"],
  "check_interval_minutes": 30,
  "thresholds": {
    "failed_payment_count": 3
  }
}
```

**Funzionalità**:
- ✅ Monitora pagamenti ricorrenti in scadenza
- ✅ Traccia consumo crediti delle organizzazioni
- ✅ Rileva transazioni failed e retry automatici
- ✅ Invia notifiche ai clienti per pagamenti mancati
- ✅ Report revenue giornalieri/settimanali

**Automazioni**:
- Payment failed → Email reminder dopo 24h
- Credits < 10% → Notifica admin + cliente
- Renewal in 7 days → Promemoria upgrade

---

### 3. Support/Ticket Agent

**Scopo**: Classifica, smista e risponde automaticamente alle richieste di supporto.

**Configurazione**:
```json
{
  "alert_channels": ["in_app", "email"],
  "auto_response_enabled": true,
  "escalation_threshold_hours": 24
}
```

**Funzionalità**:
- ✅ Classifica richieste per urgenza e categoria
- ✅ Auto-risposta con FAQ AI
- ✅ Escalation automatica per ticket critici
- ✅ Creazione ticket automatica da email/chat
- ✅ Routing intelligente al team giusto

**AI Features**:
- Sentiment analysis sulle richieste
- Suggerimenti risposte da knowledge base
- Auto-close per problemi risolti
- Priority scoring automatico

---

### 4. User Engagement Agent

**Scopo**: Automatizza onboarding, upgrade reminders, e campagne marketing.

**Configurazione**:
```json
{
  "channels": ["email", "whatsapp"],
  "onboarding_enabled": true,
  "upgrade_reminder_days": 7
}
```

**Funzionalità**:
- ✅ Onboarding automatico nuovi utenti
- ✅ Sequenze email personalizzate
- ✅ Upgrade reminders basati su usage
- ✅ Campagne marketing multicanale
- ✅ A/B testing automatizzato

**Workflow Esempio**:
1. Nuovo signup → Email benvenuto immediate
2. Day 1 → Tutorial video via email
3. Day 3 → Check-in + offer free support
4. Day 7 → Upgrade reminder se usage > 80%
5. Day 30 → Feedback survey

---

### 5. Security Watcher Agent

**Scopo**: Scansiona log auth/API per anomalie, tentativi login irregolari, e minacce.

**Configurazione**:
```json
{
  "alert_channels": ["email", "telegram"],
  "auto_lock_enabled": false,
  "failed_login_threshold": 5,
  "anomaly_detection_enabled": true
}
```

**Funzionalità**:
- ✅ Monitora failed login attempts
- ✅ Rileva pattern di accesso sospetti
- ✅ Analisi anomalie su API usage
- ✅ Auto-lock account compromessi (opzionale)
- ✅ Alert immediati al security team

**Sicurezza**:
- Brute force detection
- Geolocation anomaly
- Unusual API access patterns
- Credential stuffing prevention

---

## API & Integrations Manager

### Provider Supportati

#### 1. Messaging

**WhatsApp Business API**
```json
{
  "provider_name": "whatsapp_business",
  "credentials": {
    "token": "YOUR_WHATSAPP_TOKEN",
    "phone_id": "YOUR_PHONE_ID"
  },
  "configuration": {
    "webhook_endpoint": "https://your-domain.com/webhook",
    "verify_token": "YOUR_VERIFY_TOKEN"
  }
}
```

**Telegram Bot**
```json
{
  "provider_name": "telegram_bot",
  "credentials": {
    "bot_token": "YOUR_BOT_TOKEN",
    "chat_id": "YOUR_CHAT_ID"
  }
}
```

#### 2. Email

**Mailgun**
```json
{
  "provider_name": "email_mailgun",
  "credentials": {
    "api_key": "YOUR_MAILGUN_KEY",
    "domain": "yourdomain.com"
  }
}
```

**SendGrid**
```json
{
  "provider_name": "email_sendgrid",
  "credentials": {
    "api_key": "YOUR_SENDGRID_KEY"
  }
}
```

**Amazon SES**
```json
{
  "provider_name": "email_ses",
  "credentials": {
    "access_key": "YOUR_AWS_ACCESS_KEY",
    "secret_key": "YOUR_AWS_SECRET_KEY"
  },
  "configuration": {
    "region": "us-east-1"
  }
}
```

#### 3. AI Models

**OpenAI GPT**
```json
{
  "provider_name": "openai_gpt",
  "credentials": {
    "api_key": "YOUR_OPENAI_KEY"
  },
  "configuration": {
    "default_model": "gpt-4o",
    "max_tokens": 4096
  }
}
```

**Google Gemini**
```json
{
  "provider_name": "google_gemini",
  "credentials": {
    "api_key": "YOUR_GEMINI_KEY"
  },
  "configuration": {
    "default_model": "gemini-2.5-flash"
  }
}
```

#### 4. Push Notifications

**Firebase Cloud Messaging**
```json
{
  "provider_name": "firebase_fcm",
  "credentials": {
    "server_key": "YOUR_FCM_SERVER_KEY",
    "sender_id": "YOUR_SENDER_ID"
  }
}
```

**OneSignal**
```json
{
  "provider_name": "onesignal",
  "credentials": {
    "app_id": "YOUR_APP_ID",
    "api_key": "YOUR_API_KEY"
  }
}
```

### Gestione Provider

#### Aggiungere Nuova Integrazione

1. Vai a **Super Admin → API & Integrazioni**
2. Click su **Nuova Integrazione**
3. Compila i campi:
   - **Nome Display**: Nome leggibile (es: "WhatsApp Produzione")
   - **Provider Name**: Identificatore tecnico (es: "whatsapp_business")
   - **Tipo Provider**: Scegli categoria (messaging, email, ai, push, custom)
   - **Credenziali**: JSON con chiavi API
   - **Configurazione**: JSON con endpoint e parametri
4. Salva e attiva

#### Testare Integrazione

1. Seleziona l'integrazione dalla lista
2. Click su **Test**
3. Verifica il risultato nel log

#### Monitorare Usage

- **Stats** button mostra:
  - Numero richieste successo/errori
  - Tempo medio esecuzione
  - Log ultimi 50 utilizzi
  - Rate limiting status

---

## Workflow Builder AI

### Creazione Workflow

Il Workflow Builder permette di creare automazioni complesse usando **linguaggio naturale**.

#### Esempio 1: Promemoria Pagamento

**Prompt Utente**:
> "Quando un cliente non paga entro la scadenza, invia un'email di promemoria dopo 3 giorni, poi un SMS dopo 7 giorni, e infine disattiva l'account dopo 14 giorni."

**AI Response**:
```
✅ Ho capito il tuo workflow. Ecco cosa verrà creato:

TRIGGER: Payment overdue
CONDIZIONI: 
  - Invoice status = unpaid
  - Days past due date

AZIONI:
  1. Day 3: Invia email di promemoria gentile
  2. Day 7: Invia SMS urgente
  3. Day 14: Disattiva account + email notifica admin

CANALI: Email, SMS
TRIGGER TYPE: Scheduled (check daily)
```

#### Esempio 2: Onboarding Automatico

**Prompt Utente**:
> "Quando si registra un nuovo utente, invia email di benvenuto immediate, poi un tutorial video il giorno dopo, e un check-in dopo 3 giorni."

**AI Response**:
```
✅ Workflow di onboarding pronto!

TRIGGER: User signup
CONDIZIONI: New user registration

SEQUENZA:
  1. T+0h: Email benvenuto + credenziali
  2. T+24h: Video tutorial + guida quick start
  3. T+72h: Check-in personale + offer support

CANALI: Email
PERSONALIZZAZIONE: Nome utente, organization
```

### Tipi di Trigger

- **Manual**: Esecuzione manuale da dashboard
- **Schedule**: Esecuzione periodica (cron)
- **Event**: Scatenato da eventi sistema
- **Condition**: Basato su condizioni specifiche

### Gestione Workflow

- ✅ **Attiva/Disattiva**: Toggle per abilitare/disabilitare
- ✅ **Esegui**: Esecuzione manuale per test
- ✅ **Log**: Storico esecuzioni con risultati
- ✅ **Modifica**: Aggiorna configurazione (in sviluppo)
- ✅ **Elimina**: Rimuovi workflow

---

## Architettura del Sistema

### Database Schema

```sql
-- Automation Agents
automation_agents
  - id (UUID)
  - name, type, description
  - is_active, status
  - configuration (JSONB)
  - last_run_at, last_error
  
agent_execution_logs
  - id, agent_id
  - execution_start/end
  - status, result_summary
  - actions_taken (JSONB)

-- API Integrations  
api_integrations
  - id (UUID)
  - provider_name, provider_type
  - credentials (JSONB - encrypted)
  - configuration (JSONB)
  - status, last_ping_at
  - usage_stats (JSONB)

integration_usage_logs
  - id, integration_id
  - action_type, status
  - execution_time_ms
  - request/response_details

-- Workflows
workflow_definitions
  - id (UUID)
  - organization_id
  - natural_language_prompt
  - workflow_json (JSONB)
  - trigger_type, trigger_config
  - is_active

workflow_execution_logs
  - id, workflow_id
  - execution_start/end
  - status, execution_result
```

### Security

Tutte le tabelle hanno **Row Level Security (RLS)** attivato:

```sql
-- Solo super_admin può accedere
CREATE POLICY "Super admins can view all agents" 
ON automation_agents FOR SELECT TO public
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
);
```

### Edge Functions (TODO)

Le seguenti edge functions devono essere create per completare il sistema:

1. **execute-automation-agent**
   - Esegue un agente specifico
   - Registra risultati in agent_execution_logs
   - Invia notifiche su canali configurati

2. **test-api-integration**
   - Testa connessione a provider
   - Registra risultato in integration_usage_logs
   - Restituisce status e latency

3. **execute-workflow**
   - Esegue workflow definito
   - Interpreta workflow_json
   - Registra risultato in workflow_execution_logs

4. **parse-natural-language-workflow**
   - Riceve prompt in linguaggio naturale
   - Usa AI per generare workflow_json
   - Restituisce struttura validata

---

## Guida all'Implementazione

### Passo 1: Setup Database

1. Applica migration:
```bash
supabase db push
```

2. Verifica tabelle create:
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%agent%' OR tablename LIKE '%integration%';
```

### Passo 2: Configurare Prima Integrazione

1. Accedi come Super Admin
2. Vai a **API & Integrazioni**
3. Configura un provider (es: Email Mailgun)
4. Testa la connessione
5. Attiva l'integrazione

### Passo 3: Attivare Primo Agente

1. Vai a **Agenti AI**
2. Seleziona "Health Monitor"
3. Configura canali di alert
4. Attiva agente
5. Monitora log esecuzioni

### Passo 4: Creare Primo Workflow

1. Vai a **Workflow Builder**
2. Descrivi workflow in linguaggio naturale
3. Rivedi risposta AI
4. Salva workflow
5. Attiva e testa

---

## Best Practices

### Sicurezza

✅ **Credenziali API**: Mai hardcodare, usa sempre variabili ambiente  
✅ **Audit Logging**: Abilita per tutte le operazioni sensibili  
✅ **Rate Limiting**: Configura limiti per evitare abusi  
✅ **Encryption**: Le credenziali in DB devono essere cifrate  
✅ **Rotation**: Ruota chiavi API regolarmente (ogni 90 giorni)  

### Performance

✅ **Caching**: Cache risultati API dove possibile  
✅ **Batch Processing**: Raggruppa operazioni simili  
✅ **Async**: Usa queue per operazioni long-running  
✅ **Monitoring**: Alert su latency > 2s  
✅ **Indexes**: Crea index su colonne filtrate spesso  

### Manutenzione

✅ **Backup**: Backup giornaliero delle configurazioni  
✅ **Documentation**: Documenta ogni agente e workflow  
✅ **Testing**: Test ogni integrazione dopo update  
✅ **Versioning**: Mantieni versioni precedenti di workflow  
✅ **Cleanup**: Archivia log vecchi (> 90 giorni)  

---

## Troubleshooting

### Problema: Agente Non Si Esegue

**Sintomi**: Agente attivo ma last_run_at non aggiorna

**Soluzioni**:
1. Verifica cron job/scheduler è attivo
2. Controlla log errori in agent_execution_logs
3. Verifica configurazione JSON è valida
4. Controlla rate limiting non sia raggiunto

### Problema: Integrazione API Failed

**Sintomi**: Status "error", last_error popolato

**Soluzioni**:
1. Verifica credenziali sono corrette
2. Testa endpoint manualmente con curl
3. Controlla IP whitelisting su provider
4. Verifica quota mensile non sia esaurita
5. Controlla integration_usage_logs per dettagli

### Problema: Workflow Non Invia Notifiche

**Sintomi**: Workflow eseguito ma notifiche non arrivano

**Soluzioni**:
1. Verifica integrazione canale è attiva
2. Controlla configurazione canali in workflow
3. Verifica email/numero telefono sono validi
4. Controlla spam folder
5. Verifica log esecuzione per errori

### Problema: AI Non Risponde nel Workflow Builder

**Sintomi**: Loading infinito o errore generico

**Soluzioni**:
1. Verifica GEMINI_API_KEY è configurato in Supabase
2. Controlla crediti organization > 8 (costo operazione)
3. Verifica edge function `process-automation-request` è deployed
4. Controlla network tab per errori API
5. Verifica JWT è valido e non scaduto

---

## Contatti & Supporto

Per domande o problemi:
- 📧 Email: support@guardian-ai-crm.com
- 📝 GitHub Issues: https://github.com/seo-cagliari/CRM-AI/issues
- 📚 Documentazione: Consulta EDGE_FUNCTIONS_API.md e SUPER_ADMIN_IMPLEMENTATION.md

---

**Ultima Revisione**: 02 Gennaio 2025  
**Versione**: 1.0  
**Autore**: CRM-AI Development Team
