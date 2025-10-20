# Send Renewal Notifications Edge Function

Supabase Edge Function per inviare automaticamente notifiche email per i rinnovi polizze in scadenza.

## Configurazione

### 1. Environment Variables (Supabase Dashboard)

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
CRON_SECRET=xxxxxxxxxxxxx  # Generate with: openssl rand -base64 32
```

### 2. Deploy Edge Function

```bash
# Deploy function
supabase functions deploy send-renewal-notifications --project-ref qjtaqrlpronohgpfdxsi

# Set secrets
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx --project-ref qjtaqrlpronohgpfdxsi
supabase secrets set CRON_SECRET=$(openssl rand -base64 32) --project-ref qjtaqrlpronohgpfdxsi
```

### 3. Configurare Cron (Supabase Dashboard)

1. Vai su Supabase Dashboard > Edge Functions
2. Seleziona `send-renewal-notifications`
3. Tab "Cron Jobs" > "Add Cron Job"
4. Schedule: `0 7 * * *` (ogni giorno alle 09:00 CEST)
5. Headers: `Authorization: Bearer <CRON_SECRET>`

### 4. Test Manuale

```bash
# Test locale
supabase functions serve send-renewal-notifications

# Test remoto
curl -X POST https://qjtaqrlpronohgpfdxsi.supabase.co/functions/v1/send-renewal-notifications \
  -H "Authorization: Bearer <CRON_SECRET>" \
  -H "Content-Type: application/json"
```

## Funzionamento

1. **Trigger**: Esecuzione automatica ogni giorno alle 09:00 CEST via cron
2. **Query**: Chiama `get_policies_needing_notification()` SQL function
3. **Filtri**: Restituisce polizze attive con scadenza a 7/30/60/90 giorni (secondo le impostazioni organizzazione)
4. **Email**: Invia notifica via Resend API con template HTML italiano
5. **Tracking**: Aggiorna `last_renewal_email_sent` e `renewal_email_count` in `insurance_policies`

## Template Email

- Design responsive HTML
- Colori dinamici in base all'urgenza (rosso ≤7 giorni, arancio ≤30, blu ≤60)
- Dettagli polizza (numero, scadenza, giorni rimanenti)
- CTA button per aprire polizza nel CRM
- Footer con branding Guardian AI CRM

## Monitoraggio

```bash
# View logs
supabase functions logs send-renewal-notifications --project-ref qjtaqrlpronohgpfdxsi

# Check Resend dashboard
# https://resend.com/emails
```

## Troubleshooting

### Email non inviate
- Verifica RESEND_API_KEY valida
- Controlla email domain verificato in Resend
- Verifica rate limits Resend (100 email/day su free tier)

### Cron non eseguito
- Verifica CRON_SECRET corretto
- Controlla schedule cron (timezone Europe/Rome)
- Verifica logs Supabase Edge Functions

### Policy non trovate
- Verifica renewal_settings configurato per organizzazione
- Controlla email_enabled = true
- Verifica reminder_X_days = true per il giorno target
- Controlla last_renewal_email_sent timestamp

## Production Checklist

- [ ] RESEND_API_KEY configurato
- [ ] CRON_SECRET generato e configurato
- [ ] Edge Function deployed
- [ ] Cron job configurato (0 7 * * *)
- [ ] Test email inviate e ricevute
- [ ] Resend domain verificato
- [ ] Monitoring attivato (Supabase logs + Resend dashboard)
- [ ] renewal_settings popolato per tutte le organizzazioni
