# 📧 GUIDA CONFIGURAZIONE RESEND API

**Status**: ⏳ Pending (Blocca completamento Phase 1.2 al 100%)  
**Tempo Stimato**: 30 minuti  
**Priorità**: 🔴 ALTA (ultimo 5% Phase 1.2)

---

## 🎯 OBIETTIVO

Configurare Resend per abilitare le email automatiche di promemoria rinnovo polizze.

---

## 📋 PREREQUISITI

1. ✅ Edge Function creata: `supabase/functions/send-renewal-notifications/`
2. ✅ Database configurato: `renewal_settings`, `get_policies_needing_notification()`
3. ✅ UI completa: ReminderSettings + BulkRenewalActions
4. ⏳ Account Resend: https://resend.com/signup

---

## 🚀 STEP-BY-STEP

### 1. Crea Account Resend (5 minuti)

```bash
# Vai su https://resend.com/signup
# Free Tier: 100 email/giorno, 3000 email/mese
# Perfetto per fase iniziale CRM
```

**Cosa registrare**:
- Email: [tua email business]
- Compagnia: Agenzia SEO Cagliari / Guardian AI CRM
- Use case: Transactional emails (CRM notifications)

### 2. Verifica Dominio (10 minuti)

**Opzione A: Sottodominio Dedicato (CONSIGLIATO)**
```
mail.guardianai.it → Resend
```

**DNS Records da aggiungere**:
```
Type: TXT
Name: mail.guardianai.it
Value: [fornito da Resend]

Type: MX
Name: mail.guardianai.it
Value: [fornito da Resend]
Priority: 10

Type: CNAME
Name: resend._domainkey.mail.guardianai.it
Value: [fornito da Resend]
```

**Opzione B: Dominio Principale**
```
guardianai.it → Resend (sconsigliato, può interferire con email esistenti)
```

**Verifica**:
- Resend Dashboard → Domains → Verify DNS
- Attendi 5-15 minuti per propagazione DNS
- Status: ✅ Verified

### 3. Genera API Key (2 minuti)

1. Resend Dashboard → API Keys
2. "Create API Key"
3. Name: `CRM-Production-Renewals`
4. Permission: **Send access** (non serve Full access)
5. Copia chiave: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx`
6. **⚠️ SALVA SUBITO**: Non sarà più visibile dopo chiusura popup

### 4. Configura Supabase Secrets (5 minuti)

```powershell
# Installa Supabase CLI (se non già installato)
npm install -g supabase

# Login Supabase
supabase login

# Set RESEND_API_KEY
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx --project-ref qjtaqrlpronohgpfdxsi

# Genera CRON_SECRET (per sicurezza Edge Function)
$cronSecret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
supabase secrets set CRON_SECRET=$cronSecret --project-ref qjtaqrlpronohgpfdxsi

# Verifica secrets salvati
supabase secrets list --project-ref qjtaqrlpronohgpfdxsi
```

**Output atteso**:
```
NAME                VALUE (encrypted)
RESEND_API_KEY     ************************xxxx
CRON_SECRET        ************************xxxx
SUPABASE_URL       (già presente)
SUPABASE_SERVICE_ROLE_KEY  (già presente)
```

### 5. Deploy Edge Function (3 minuti)

```powershell
# Deploy function con secrets configurati
supabase functions deploy send-renewal-notifications --project-ref qjtaqrlpronohgpfdxsi

# Output atteso:
# ✓ Deployed function send-renewal-notifications
# URL: https://qjtaqrlpronohgpfdxsi.supabase.co/functions/v1/send-renewal-notifications
```

### 6. Configura Cron Job (5 minuti)

**Via Supabase Dashboard** (metodo preferito):

1. Vai su https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi
2. Edge Functions → `send-renewal-notifications`
3. Tab "Cron Jobs" → "Create Cron Job"
4. Configurazione:
   ```
   Schedule: 0 7 * * *
   Description: Invio promemoria rinnovi giornalieri
   Timezone: Europe/Rome
   HTTP Method: POST
   Headers:
     Authorization: Bearer <CRON_SECRET copiato sopra>
   ```
5. Save → Enable

**Via CLI** (alternativa):
```powershell
# Crea cron config file
@"
{
  "schedule": "0 7 * * *",
  "timezone": "Europe/Rome",
  "description": "Send daily renewal notifications at 09:00 CEST"
}
"@ | Out-File -Encoding UTF8 supabase/functions/send-renewal-notifications/cron.json

# Deploy con cron
supabase functions deploy send-renewal-notifications --project-ref qjtaqrlpronohgpfdxsi
```

### 7. Test Email Manuale (5 minuti)

```powershell
# Test immediato (senza aspettare cron)
# Sostituisci <CRON_SECRET> con il valore generato sopra

$headers = @{
    "Authorization" = "Bearer <CRON_SECRET>"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "https://qjtaqrlpronohgpfdxsi.supabase.co/functions/v1/send-renewal-notifications" -Method POST -Headers $headers
```

**Output atteso**:
```json
{
  "success": true,
  "total_policies": 2,
  "emails_sent": 2,
  "emails_failed": 0,
  "results": [
    { "success": true, "policy_id": "uuid-123" },
    { "success": true, "policy_id": "uuid-456" }
  ]
}
```

---

## 🔍 VERIFICA FUNZIONAMENTO

### Checklist Post-Deploy

- [ ] Resend domain verificato (✅ Verified)
- [ ] API key salvata in Supabase secrets
- [ ] CRON_SECRET salvato in Supabase secrets
- [ ] Edge Function deployed senza errori
- [ ] Cron job schedulato (0 7 * * *)
- [ ] Test manuale invia email
- [ ] Email ricevuta in inbox (controlla spam)
- [ ] Database `insurance_policies.last_renewal_email_sent` aggiornato

### Database Verification

```sql
-- Controlla email inviate
SELECT 
  policy_number,
  last_renewal_email_sent,
  renewal_email_count,
  end_date
FROM insurance_policies
WHERE last_renewal_email_sent IS NOT NULL
ORDER BY last_renewal_email_sent DESC;

-- Controlla prossime email da inviare
SELECT * FROM get_policies_needing_notification();
```

### Resend Dashboard Monitoring

1. Vai su https://resend.com/emails
2. Dovresti vedere:
   - Email inviate con status "Delivered"
   - Timestamp 09:00 CEST ogni mattina
   - To: email configurate in `renewal_settings.notification_email`

### Supabase Logs

```powershell
# View real-time logs
supabase functions logs send-renewal-notifications --project-ref qjtaqrlpronohgpfdxsi

# Output atteso ogni giorno alle 09:00:
# ✅ Email sent successfully to john@example.com for policy POL-001
# ✅ Email sent successfully to jane@example.com for policy POL-002
# ✅ Email notifications complete: 2 sent, 0 failed
```

---

## 🐛 TROUBLESHOOTING

### Email non ricevute

**Problema**: Test manuale ritorna success ma email non arriva.

**Soluzioni**:
1. Controlla cartella spam/junk
2. Verifica dominio Resend completamente verificato (DNS propagato)
3. Resend Dashboard → Email Logs → Controlla delivery status
4. Se "Bounced": Email destinatario non valida
5. Se "Deferred": Server destinatario temporaneamente non disponibile

### Error 401 "Unauthorized"

**Problema**: Edge Function ritorna 401.

**Soluzione**:
```powershell
# Verifica CRON_SECRET corretto
supabase secrets list --project-ref qjtaqrlpronohgpfdxsi

# Aggiorna header Authorization nel test/cron
# Authorization: Bearer <CRON_SECRET esatto>
```

### Error 403 "Invalid API Key"

**Problema**: Resend ritorna 403.

**Soluzioni**:
1. Verifica RESEND_API_KEY corretta:
   ```powershell
   supabase secrets list --project-ref qjtaqrlpronohgpfdxsi
   ```
2. Rigenera API key su Resend Dashboard se necessario
3. Re-deploy Edge Function dopo aggiornamento secret

### Cron non si attiva

**Problema**: 09:00 passa ma email non inviate.

**Soluzioni**:
1. Verifica cron job enabled (Supabase Dashboard)
2. Controlla timezone: deve essere Europe/Rome
3. Verifica logs:
   ```powershell
   supabase functions logs send-renewal-notifications --project-ref qjtaqrlpronohgpfdxsi
   ```
4. Se mancano logs alle 09:00, cron non configurato correttamente

### Nessuna policy trovata

**Problema**: Response `"total_policies": 0`.

**Soluzioni**:
1. Verifica `renewal_settings` configurato per organizzazione:
   ```sql
   SELECT * FROM renewal_settings;
   ```
2. Verifica `email_enabled = true`
3. Verifica almeno un `reminder_X_days = true`
4. Verifica polizze in scadenza:
   ```sql
   SELECT * FROM get_policies_needing_notification();
   ```

---

## 📊 METRICHE POST-DEPLOY

Dopo configurazione completata, dovresti avere:

- ✅ **Edge Function**: Deployed e schedulato
- ✅ **Cron**: 1 esecuzione/giorno alle 09:00 CEST
- ✅ **Email Rate**: ~2-5 email/giorno (inizialmente, cresce con polizze)
- ✅ **Success Rate**: >95% (email delivered)
- ✅ **Database Updates**: `last_renewal_email_sent` aggiornato dopo ogni email

---

## 🎯 PHASE 1.2 100% COMPLETE

Una volta completati tutti gli step sopra:

1. Update `PHASE_1_2_COMPLETION_REPORT.md`:
   - Status: 95% → 100%
   - Blocker RESEND_API_KEY: ✅ RESOLVED

2. Update `INSURANCE_CRM_PHASE_AUDIT_2025.md`:
   - Phase 1.2: 95% → 100%
   - Overall module: 30% → 32%

3. Git commit:
   ```powershell
   git add -A
   git commit -m "PHASE 1.2 100% COMPLETE: Email notifications operational"
   git push origin main
   ```

4. Celebrate 🎉 - Sistema rinnovi completamente automatizzato!

---

## 📞 SUPPORTO

**Resend Documentation**: https://resend.com/docs  
**Supabase Edge Functions**: https://supabase.com/docs/guides/functions  
**Cron Expression**: https://crontab.guru/#0_7_*_*_*  

**Problemi?** Controlla logs:
- Resend: https://resend.com/emails
- Supabase: Dashboard → Edge Functions → Logs
- Database: Query `insurance_policies` per tracking

---

**Documento creato**: 2025-01-20  
**Ultima modifica**: 2025-01-20  
**Agent**: GitHub Copilot  
