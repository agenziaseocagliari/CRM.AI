# 📡 Guardian AI CRM - Edge Functions API Documentation

Documentazione completa delle Supabase Edge Functions per il CRM.

---

## 🔐 Autenticazione

Tutte le edge functions richiedono autenticazione tramite JWT token di Supabase, eccetto dove indicato diversamente.

**Headers Richiesti**:
```
Authorization: Bearer [jwt-token]
apikey: [supabase-anon-key]
Content-Type: application/json
```

---

## 📋 Indice Functions per Categoria

### 🛡️ Super Admin (NEW)
- [superadmin-dashboard-stats](#superadmin-dashboard-stats)
- [superadmin-list-users](#superadmin-list-users)
- [superadmin-update-user](#superadmin-update-user)
- [superadmin-list-organizations](#superadmin-list-organizations)
- [superadmin-update-organization](#superadmin-update-organization)
- [superadmin-manage-payments](#superadmin-manage-payments)
- [superadmin-create-org](#superadmin-create-org)
- [superadmin-logs](#superadmin-logs)

### Autenticazione & OAuth
- [google-auth-url](#google-auth-url)
- [google-token-exchange](#google-token-exchange)
- [check-google-token-status](#check-google-token-status)

### Gestione Calendario
- [create-google-event](#create-google-event)
- [update-google-event](#update-google-event)
- [delete-google-event](#delete-google-event)
- [get-google-calendar-events](#get-google-calendar-events)
- [create-crm-event](#create-crm-event)
- [get-all-crm-events](#get-all-crm-events)

### Sistema Crediti
- [consume-credits](#consume-credits)

### AI & Automazione
- [process-automation-request](#process-automation-request)
- [score-contact-lead](#score-contact-lead)
- [generate-email-content](#generate-email-content)
- [generate-whatsapp-message](#generate-whatsapp-message)
- [generate-form-fields](#generate-form-fields)

### Comunicazioni
- [send-email](#send-email)
- [send-welcome-email](#send-welcome-email)
- [send-whatsapp-message](#send-whatsapp-message)

### Reminders
- [schedule-event-reminders](#schedule-event-reminders)
- [process-scheduled-reminders](#process-scheduled-reminders)

### Utility
- [test-org-settings](#test-org-settings)
- [run-debug-query](#run-debug-query)

---

## 🛡️ Super Admin Functions

**⚠️ IMPORTANTE**: Tutte le Super Admin functions richiedono che l'utente autenticato abbia il ruolo `super_admin` nel database. L'accesso non autorizzato restituisce un errore 403.

**Sicurezza**:
- Validazione multi-livello: JWT + verifica ruolo su database
- Audit logging automatico per ogni operazione
- RLS policies applicate a livello database
- Rate limiting raccomandato in produzione

---

### superadmin-dashboard-stats

Recupera statistiche aggregate per la dashboard Super Admin.

**Endpoint**: `POST /functions/v1/superadmin-dashboard-stats`

**Request Body**: Nessuno richiesto (può essere `{}`)

**Response**:
```json
{
  "stats": {
    "totalSignups": 150,
    "totalRevenue": 9850,
    "activeUsers": 89,
    "newSignupsThisWeek": 12,
    "churnRiskCount": 5,
    "totalOrganizations": 45,
    "totalEvents": 1234
  }
}
```

**Errori**:
- `403`: Utente non autorizzato (non super_admin)
- `500`: Errore server interno

**Esempio cURL**:
```bash
curl -X POST https://[project].supabase.co/functions/v1/superadmin-dashboard-stats \
  -H "Authorization: Bearer [jwt-token]" \
  -H "apikey: [supabase-anon-key]" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

### superadmin-list-users

Lista tutti gli utenti con filtri e paginazione.

**Endpoint**: `POST /functions/v1/superadmin-list-users`

**Request Body**:
```json
{
  "search": "john",
  "role": "admin",
  "organizationId": "uuid-optional",
  "limit": 50,
  "offset": 0
}
```

**Response**:
```json
{
  "users": [
    {
      "id": "user-uuid",
      "email": "john@example.com",
      "full_name": "John Doe",
      "role": "admin",
      "organization_id": "org-uuid",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "organizations": {
        "id": "org-uuid",
        "name": "Acme Corp"
      }
    }
  ]
}
```

**Errori**:
- `403`: Utente non autorizzato
- `500`: Errore server

---

### superadmin-update-user

Aggiorna profilo utente (ruolo, organizzazione, etc.).

**Endpoint**: `POST /functions/v1/superadmin-update-user`

**Request Body**:
```json
{
  "userId": "user-uuid",
  "updates": {
    "full_name": "John Smith",
    "role": "super_admin",
    "organization_id": "new-org-uuid"
  }
}
```

**Campi aggiornabili**: `full_name`, `role`, `organization_id`

**Response**:
```json
{
  "user": {
    "id": "user-uuid",
    "email": "john@example.com",
    "full_name": "John Smith",
    "role": "super_admin",
    "organization_id": "new-org-uuid"
  }
}
```

**Errori**:
- `400`: userId mancante o updates non validi
- `403`: Utente non autorizzato
- `500`: Errore nell'aggiornamento

---

### superadmin-list-organizations

Lista tutte le organizzazioni con dettagli crediti e membri.

**Endpoint**: `POST /functions/v1/superadmin-list-organizations`

**Request Body**:
```json
{
  "search": "acme",
  "status": "active",
  "plan": "pro",
  "limit": 50,
  "offset": 0
}
```

**Response**:
```json
{
  "customers": [
    {
      "id": "org-uuid",
      "name": "Acme Corp",
      "adminEmail": "admin@acme.com",
      "status": "active",
      "paymentStatus": "Paid",
      "plan": "Pro",
      "memberCount": 5,
      "createdAt": "2024-01-01T00:00:00Z",
      "creditsRemaining": 500,
      "totalCredits": 1000
    }
  ]
}
```

**Filtri disponibili**:
- `search`: Cerca per nome organizzazione
- `status`: `active`, `trial`, `suspended`
- `plan`: `free`, `pro`, `enterprise`

---

### superadmin-update-organization

Aggiorna organizzazione (nome, crediti, piano, status).

**Endpoint**: `POST /functions/v1/superadmin-update-organization`

**Request Body**:
```json
{
  "organizationId": "org-uuid",
  "updates": {
    "name": "New Name",
    "credits": 2000,
    "plan_name": "enterprise"
  },
  "status": "active",
  "reason": "Credits added for premium plan"
}
```

**Response**:
```json
{
  "organization": { ... },
  "credits": { ... },
  "statusUpdate": {
    "status": "active",
    "reason": "Credits added for premium plan",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Errori**:
- `400`: organizationId mancante
- `403`: Utente non autorizzato
- `500`: Errore nell'aggiornamento

---

### superadmin-manage-payments

Gestisce pagamenti e transazioni (lista, refund).

**Endpoint**: `POST /functions/v1/superadmin-manage-payments`

**Request Body (Lista)**:
```json
{
  "status": "Paid",
  "limit": 50,
  "offset": 0
}
```

**Request Body (Refund)**:
```json
{
  "action": "refund",
  "transactionId": "payment-uuid"
}
```

**Response (Lista)**:
```json
{
  "payments": [
    {
      "id": "payment-uuid",
      "organizationName": "Acme Corp",
      "organizationId": "org-uuid",
      "amount": 49,
      "date": "2024-01-01T00:00:00Z",
      "status": "Paid",
      "plan": "pro",
      "credits": 1000
    }
  ],
  "creditLogs": [ ... ]
}
```

**Response (Refund)**:
```json
{
  "message": "Refund processed successfully",
  "transactionId": "payment-uuid"
}
```

---

### superadmin-create-org

Crea nuova organizzazione con setup iniziale.

**Endpoint**: `POST /functions/v1/superadmin-create-org`

**Request Body**:
```json
{
  "name": "New Organization",
  "adminEmail": "admin@neworg.com",
  "plan": "pro",
  "initialCredits": 1000
}
```

**Response**:
```json
{
  "organization": {
    "id": "new-org-uuid",
    "name": "New Organization",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "credits": {
    "organization_id": "new-org-uuid",
    "plan_name": "pro",
    "total_credits": 1000,
    "credits_remaining": 1000
  },
  "message": "Organization created successfully. Admin user should be invited separately."
}
```

**Errori**:
- `400`: name o adminEmail mancanti, o organizzazione già esistente
- `403`: Utente non autorizzato
- `500`: Errore nella creazione

**Note**: L'utente admin deve essere invitato separatamente tramite Supabase Auth.

---

### superadmin-logs

Recupera audit logs con filtri avanzati.

**Endpoint**: `POST /functions/v1/superadmin-logs`

**Request Body**:
```json
{
  "search": "update",
  "operationType": "UPDATE",
  "targetType": "USER",
  "result": "SUCCESS",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-12-31T23:59:59Z",
  "limit": 100,
  "offset": 0
}
```

**Parametri filtro**:
- `search`: Cerca in email admin, azione, target ID
- `operationType`: `CREATE`, `UPDATE`, `DELETE`, `READ`, `EXECUTE`
- `targetType`: `USER`, `ORGANIZATION`, `PAYMENT`, `SYSTEM`
- `result`: `SUCCESS`, `FAILURE`, `PARTIAL`
- `startDate`, `endDate`: Range temporale

**Response**:
```json
{
  "logs": [
    {
      "id": "12345",
      "timestamp": "2024-01-01T12:00:00Z",
      "adminEmail": "superadmin@example.com",
      "action": "Update User",
      "targetId": "user-uuid",
      "operationType": "UPDATE",
      "targetType": "USER",
      "result": "SUCCESS",
      "details": { ... },
      "errorMessage": null,
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0..."
    }
  ],
  "total": 150,
  "offset": 0,
  "limit": 100
}
```

**Esempio n8n Webhook**:
```javascript
// N8n HTTP Request Node
{
  "method": "POST",
  "url": "https://[project].supabase.co/functions/v1/superadmin-logs",
  "headers": {
    "Authorization": "Bearer {{$json.jwt_token}}",
    "apikey": "{{$json.supabase_anon_key}}",
    "Content-Type": "application/json"
  },
  "body": {
    "operationType": "UPDATE",
    "limit": 50
  }
}
```

---

## 🔐 Autenticazione & OAuth

### google-auth-url

Genera l'URL per l'autenticazione Google OAuth 2.0.

**Endpoint**: `POST /functions/v1/google-auth-url`

**Request Body**:
```json
{
  "state": "random-csrf-token"
}
```

**Response**:
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=..."
}
```

**Errori**:
- `400`: State parameter mancante
- `500`: Configurazione server mancante (GOOGLE_CLIENT_ID o GOOGLE_REDIRECT_URI)

---

### google-token-exchange

Scambia il codice di autorizzazione per i token di accesso Google.

**Endpoint**: `POST /functions/v1/google-token-exchange`

**Request Body**:
```json
{
  "code": "authorization-code-from-google",
  "organization_id": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Google account collegato con successo!"
}
```

**Note**:
- Salva access_token, refresh_token ed expiry_date nella tabella `google_credentials`
- Il refresh_token viene usato per rinnovare automaticamente l'accesso

---

### check-google-token-status

Verifica lo stato del token Google per un'organizzazione.

**Endpoint**: `POST /functions/v1/check-google-token-status`

**Request Body**:
```json
{
  "organization_id": "uuid"
}
```

**Response**:
```json
{
  "connected": true,
  "expiry_date": 1234567890,
  "is_expired": false,
  "email": "user@example.com"
}
```

---

## 📅 Gestione Calendario

### create-google-event

Crea un evento su Google Calendar.

**Endpoint**: `POST /functions/v1/create-google-event`

**Request Body**:
```json
{
  "organization_id": "uuid",
  "summary": "Meeting con cliente",
  "description": "Discussione progetto XYZ",
  "start": "2025-10-01T10:00:00Z",
  "end": "2025-10-01T11:00:00Z",
  "attendees": ["email1@example.com", "email2@example.com"]
}
```

**Response**:
```json
{
  "success": true,
  "eventId": "google-event-id",
  "htmlLink": "https://calendar.google.com/event?eid=..."
}
```

**Costo Crediti**: Sì (action_type: `create_google_event`)

---

### update-google-event

Aggiorna un evento esistente su Google Calendar.

**Endpoint**: `POST /functions/v1/update-google-event`

**Request Body**:
```json
{
  "organization_id": "uuid",
  "event_id": "google-event-id",
  "summary": "Meeting aggiornato",
  "start": "2025-10-01T14:00:00Z",
  "end": "2025-10-01T15:00:00Z"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Evento aggiornato con successo"
}
```

**Costo Crediti**: Sì (action_type: `update_google_event`)

---

### delete-google-event

Elimina un evento da Google Calendar.

**Endpoint**: `POST /functions/v1/delete-google-event`

**Request Body**:
```json
{
  "organization_id": "uuid",
  "event_id": "google-event-id"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Evento eliminato con successo"
}
```

**Costo Crediti**: Sì (action_type: `delete_google_event`)

---

### get-google-calendar-events

Recupera eventi da Google Calendar.

**Endpoint**: `POST /functions/v1/get-google-calendar-events`

**Request Body**:
```json
{
  "organization_id": "uuid",
  "timeMin": "2025-10-01T00:00:00Z",
  "timeMax": "2025-10-31T23:59:59Z",
  "maxResults": 50
}
```

**Response**:
```json
{
  "events": [
    {
      "id": "google-event-id",
      "summary": "Meeting",
      "start": { "dateTime": "2025-10-01T10:00:00Z" },
      "end": { "dateTime": "2025-10-01T11:00:00Z" },
      "htmlLink": "https://calendar.google.com/..."
    }
  ]
}
```

---

### create-crm-event

Crea un evento nel database CRM interno.

**Endpoint**: `POST /functions/v1/create-crm-event`

**Request Body**:
```json
{
  "organization_id": "uuid",
  "contact_id": "uuid",
  "event_summary": "Chiamata di follow-up",
  "event_description": "Discutere proposta commerciale",
  "event_start_time": "2025-10-01T10:00:00Z",
  "event_end_time": "2025-10-01T10:30:00Z",
  "google_event_id": "optional-google-event-id"
}
```

**Response**:
```json
{
  "crmEvent": {
    "id": "uuid",
    "contact_id": "uuid",
    "event_summary": "Chiamata di follow-up",
    "created_at": "2025-09-30T12:00:00Z"
  }
}
```

**Costo Crediti**: Sì (action_type: `create_crm_event`)

---

### get-all-crm-events

Recupera tutti gli eventi CRM per un'organizzazione.

**Endpoint**: `POST /functions/v1/get-all-crm-events`

**Request Body**:
```json
{
  "organization_id": "uuid"
}
```

**Response**:
```json
{
  "events": [
    {
      "id": "uuid",
      "contact_id": "uuid",
      "contact_name": "Mario Rossi",
      "event_summary": "Meeting",
      "event_start_time": "2025-10-01T10:00:00Z"
    }
  ]
}
```

---

## 💳 Sistema Crediti

### consume-credits

Consuma crediti per un'azione specifica. Questa function è tipicamente chiamata internamente da altre edge functions.

**Endpoint**: `POST /functions/v1/consume-credits`

**Request Body**:
```json
{
  "organization_id": "uuid",
  "action_type": "create_google_event"
}
```

**Response Success**:
```json
{
  "success": true,
  "remaining_credits": 450,
  "cost": 5
}
```

**Response Insufficient Credits**:
```json
{
  "success": false,
  "error": "Crediti insufficienti",
  "remaining_credits": 2,
  "required_credits": 5
}
```

**Action Types e Costi**:
- `create_google_event`: 5 crediti
- `update_google_event`: 3 crediti
- `delete_google_event`: 3 crediti
- `send_email`: 2 crediti
- `send_whatsapp_message`: 3 crediti
- `score_contact_lead`: 10 crediti
- `generate_email_content`: 5 crediti
- `generate_whatsapp_message`: 5 crediti
- `process_automation_request`: 8 crediti

---

## 🤖 AI & Automazione

### process-automation-request

Elabora una richiesta di automazione usando AI (Google Gemini).

**Endpoint**: `POST /functions/v1/process-automation-request`

**Request Body**:
```json
{
  "organization_id": "uuid",
  "prompt": "Crea un'automazione per inviare email di benvenuto ai nuovi contatti"
}
```

**Response**:
```json
{
  "reply": "Ecco come creare l'automazione per email di benvenuto:\n1. Trigger: Nuovo contatto creato\n2. Azione: Invia email template 'benvenuto'\n3. Condizioni: Solo per contatti con email valida..."
}
```

**Costo Crediti**: Sì (action_type: `process_automation_request`)

**Variabili Ambiente**:
- `GEMINI_API_KEY`: Richiesta

---

### score-contact-lead

Assegna un punteggio automatico a un lead usando AI. Tipicamente chiamato da trigger database.

**Endpoint**: `POST /functions/v1/score-contact-lead`

**Request Body**:
```json
{
  "record": {
    "id": "uuid",
    "organization_id": "uuid",
    "name": "Mario Rossi",
    "email": "mario@example.com",
    "company": "Acme Corp",
    "phone": "+39 333 1234567"
  }
}
```

**Response**:
```json
{
  "success": true,
  "score": 75,
  "category": "Warm",
  "reasoning": "Lead promettente con azienda consolidata..."
}
```

**Costo Crediti**: Sì (action_type: `score_contact_lead`)

**Note**:
- Aggiorna automaticamente i campi `lead_score` e `lead_category` nel database
- Categorie: Hot (80-100), Warm (50-79), Cold (0-49)

---

### generate-email-content

Genera contenuto email personalizzato usando AI.

**Endpoint**: `POST /functions/v1/generate-email-content`

**Request Body**:
```json
{
  "organization_id": "uuid",
  "contact_name": "Mario Rossi",
  "context": "follow-up dopo meeting",
  "tone": "professionale",
  "length": "medio"
}
```

**Response**:
```json
{
  "subject": "Follow-up: Discussione progetto XYZ",
  "content": "Gentile Mario,\n\nGrazie per il tempo dedicato oggi..."
}
```

**Costo Crediti**: Sì (action_type: `generate_email_content`)

---

### generate-whatsapp-message

Genera un messaggio WhatsApp personalizzato usando AI.

**Endpoint**: `POST /functions/v1/generate-whatsapp-message`

**Request Body**:
```json
{
  "organization_id": "uuid",
  "contact_name": "Mario Rossi",
  "purpose": "promemoria appuntamento",
  "details": {
    "date": "2025-10-01",
    "time": "10:00"
  }
}
```

**Response**:
```json
{
  "message": "Ciao Mario! 👋 Questo è un promemoria per il nostro appuntamento domani, 1 ottobre alle 10:00. Ci vediamo presto!"
}
```

**Costo Crediti**: Sì (action_type: `generate_whatsapp_message`)

---

### generate-form-fields

Genera campi form dinamici usando AI basati su una descrizione.

**Endpoint**: `POST /functions/v1/generate-form-fields`

**Request Body**:
```json
{
  "organization_id": "uuid",
  "description": "Form per raccolta informazioni lead automotive"
}
```

**Response**:
```json
{
  "fields": [
    {
      "name": "vehicle_interest",
      "type": "select",
      "label": "Veicolo di interesse",
      "options": ["Nuovo", "Usato", "Entrambi"],
      "required": true
    },
    {
      "name": "budget",
      "type": "range",
      "label": "Budget disponibile",
      "min": 10000,
      "max": 100000,
      "required": false
    }
  ]
}
```

**Note**: Non consuma crediti

---

## 📧 Comunicazioni

### send-email

Invia un'email tramite Brevo (ex-Sendinblue).

**Endpoint**: `POST /functions/v1/send-email`

**Request Body**:
```json
{
  "organization_id": "uuid",
  "recipient_email": "mario@example.com",
  "recipient_name": "Mario Rossi",
  "subject": "Benvenuto nel nostro CRM",
  "html_content": "Gentile Mario,\n\nGrazie per esserti registrato..."
}
```

**Response**:
```json
{
  "success": true,
  "messageId": "brevo-message-id"
}
```

**Note**:
- Richiede `brevo_api_key` configurata in `organization_settings`
- Usa `BREVO_SENDER_EMAIL` e `BREVO_SENDER_NAME` come mittente globale
- Non consuma crediti

---

### send-welcome-email

Invia automaticamente email di benvenuto. Tipicamente chiamato da trigger database.

**Endpoint**: `POST /functions/v1/send-welcome-email`

**Request Body**:
```json
{
  "record": {
    "id": "uuid",
    "organization_id": "uuid",
    "email": "mario@example.com",
    "name": "Mario Rossi"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Email di benvenuto inviata con successo"
}
```

**Note**: Non consuma crediti (email di sistema)

---

### send-whatsapp-message

Invia un messaggio WhatsApp tramite Twilio.

**Endpoint**: `POST /functions/v1/send-whatsapp-message`

**Request Body**:
```json
{
  "organization_id": "uuid",
  "contact_phone": "+393331234567",
  "message": "Ciao Mario! Promemoria per l'appuntamento di domani alle 10:00.",
  "isReminder": false
}
```

**Response**:
```json
{
  "success": true,
  "sid": "twilio-message-sid"
}
```

**Costo Crediti**: Sì, tranne se `isReminder: true` (action_type: `send_whatsapp_message`)

**Note**:
- Richiede `twilio_account_sid` e `twilio_auth_token` in `organization_settings`
- Usa Twilio Sandbox: `whatsapp:+14155238886`

---

## ⏰ Reminders

### schedule-event-reminders

Pianifica promemoria per un evento CRM.

**Endpoint**: `POST /functions/v1/schedule-event-reminders`

**Request Body**:
```json
{
  "organization_id": "uuid",
  "event_id": "uuid",
  "event_start_time": "2025-10-01T10:00:00Z",
  "contact_id": "uuid",
  "reminder_intervals": [24, 1]
}
```

**Response**:
```json
{
  "success": true,
  "reminders_scheduled": 2
}
```

**Note**:
- `reminder_intervals` in ore prima dell'evento
- Crea record in tabella `event_reminders`
- Non consuma crediti

---

### process-scheduled-reminders

Elabora e invia promemoria pianificati. Da chiamare periodicamente (cron job).

**Endpoint**: `POST /functions/v1/process-scheduled-reminders`

**Request Body**:
```json
{}
```

**Response**:
```json
{
  "processed": 5,
  "sent": 4,
  "failed": 1
}
```

**Note**:
- Controlla `event_reminders` per promemoria da inviare
- Invia via WhatsApp se configurato
- Marca come `sent` dopo invio
- Non consuma crediti (sistema automatico)

---

## 🛠️ Utility

### test-org-settings

Testa la configurazione di un'organizzazione.

**Endpoint**: `POST /functions/v1/test-org-settings`

**Request Body**:
```json
{
  "organization_id": "uuid"
}
```

**Response**:
```json
{
  "organization_id": "uuid",
  "google_connected": true,
  "brevo_configured": true,
  "twilio_configured": false,
  "credits_remaining": 450
}
```

---

### run-debug-query

Esegue una query diagnostica sul database. Solo per debugging.

**Endpoint**: `POST /functions/v1/run-debug-query`

**Request Body**:
```json
{
  "query": "SELECT * FROM contacts WHERE organization_id = $1 LIMIT 5",
  "params": ["uuid"]
}
```

**Response**:
```json
{
  "results": [...],
  "rowCount": 5
}
```

**⚠️ Attenzione**: Usare solo in ambiente di sviluppo/staging. Mai in produzione.

---

## 🔒 CORS Configuration

Tutte le edge functions supportano CORS con le seguenti configurazioni:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type, x-n8n-api-key
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Max-Age: 86400
```

**Raccomandazione Produzione**: Restringere `Allow-Origin` a domini specifici.

---

## 📊 Rate Limiting & Quotas

Attualmente non implementato rate limiting a livello di edge function. Raccomandazioni:

1. Implementare rate limiting tramite Supabase Edge Function environment
2. Usare il sistema crediti come controllo indiretto
3. Monitorare usage tramite Supabase Dashboard

---

## 🐛 Error Handling

Tutte le edge functions seguono un formato di errore standard:

**Success Response**:
```json
{
  "success": true,
  "data": {...}
}
```

**Error Response**:
```json
{
  "error": "Messaggio di errore user-friendly",
  "details": "Dettagli tecnici (opzionale)"
}
```

**HTTP Status Codes**:
- `200`: Success
- `400`: Bad Request (parametri mancanti/invalidi)
- `401`: Unauthorized (token mancante/invalido)
- `403`: Forbidden (permessi insufficienti)
- `500`: Internal Server Error

---

## 📝 Note Implementazione

### Autenticazione JWT
Ogni edge function che richiede autenticazione usa:
```typescript
const authHeader = req.headers.get('Authorization');
const token = authHeader?.replace('Bearer ', '');
// Verifica token e estrae user_id
```

### Organization ID
- Estratto dal profilo utente tramite `getOrganizationId(req)` helper
- O passato direttamente nel body per funzioni di sistema

### Gestione Token Google
Il sistema automaticamente:
1. Controlla scadenza access_token
2. Usa refresh_token per ottenere nuovo access_token
3. Salva nuovo token nel database
4. Retry operazione se token refresh ha successo

---

## 🔄 Webhook Integration (n8n)

Per integrare con n8n, le edge functions supportano header custom:
```
x-n8n-api-key: [your-n8n-key]
```

Esempio webhook trigger:
```
POST https://[project].supabase.co/functions/v1/create-crm-event
Headers:
  - apikey: [supabase-anon-key]
  - x-n8n-api-key: [n8n-key]
  - Content-Type: application/json
```

---

## 📚 Risorse Aggiuntive

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Google Calendar API](https://developers.google.com/calendar/api)
- [Brevo API](https://developers.brevo.com/)
- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp)
- [Google Gemini API](https://ai.google.dev/docs)

---

**Ultima Revisione**: 2025-09-30  
**Versione API**: 1.0
