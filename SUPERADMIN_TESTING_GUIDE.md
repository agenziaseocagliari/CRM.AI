# 🧪 Super Admin Functions - Testing Guide

**Versione**: 2.0.0  
**Data**: 2024-01-15

---

## 📋 Panoramica

Questa guida fornisce istruzioni dettagliate per testare tutte le funzioni Super Admin dopo il refactoring con i nuovi helper JWT e logging avanzato.

---

## 🔧 Prerequisiti

### 1. Environment Variables

Assicurati di avere le seguenti variabili d'ambiente configurate:

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGc..."
export SUPER_ADMIN_JWT="eyJhbGc..."  # JWT di un utente con role=super_admin
export NORMAL_USER_JWT="eyJhbGc..."  # (Opzionale) JWT di un utente normale per test negativi
```

### 2. Creare un Super Admin User

Se non hai ancora un utente super admin:

```sql
-- In Supabase SQL Editor
UPDATE profiles 
SET role = 'super_admin' 
WHERE email = 'your-admin@example.com';
```

### 3. Ottenere il JWT

Puoi ottenere il JWT in due modi:

**Metodo 1 - Dal Browser**:
```javascript
// In browser console dopo login
const session = await supabase.auth.getSession();
console.log(session.data.session.access_token);
```

**Metodo 2 - Da Supabase Dashboard**:
1. Vai su Authentication > Users
2. Clicca sull'utente
3. Copia il "Access Token" dal pannello

---

## 🚀 Test Automatizzato

### Eseguire il Test Script

```bash
cd /path/to/CRM-AI
chmod +x scripts/test-superadmin.sh
./scripts/test-superadmin.sh
```

### Output Atteso

```
========================================
    SUPER ADMIN SECURITY TEST SUITE
========================================

✅ Prerequisites check passed

=== Checking Deployed Endpoints ===
✅ superadmin-dashboard-stats (HTTP 403)
✅ superadmin-list-users (HTTP 403)
✅ superadmin-update-user (HTTP 403)
✅ superadmin-list-organizations (HTTP 403)
✅ superadmin-update-organization (HTTP 403)
✅ superadmin-manage-payments (HTTP 403)
✅ superadmin-create-org (HTTP 403)
✅ superadmin-logs (HTTP 403)

=== Test 1: No Authentication (should fail 403) ===
✅ Correctly rejected: HTTP 403

=== Test 3: Super Admin Authentication (should succeed 200) ===
✅ Correctly accepted: HTTP 200
Response: {"stats":{"totalSignups":150,...}}

========================================
         TEST SUMMARY
========================================
✅ All 8 super admin endpoints are deployed
✅ Security tests passed
✅ Super admin access works correctly
```

---

## 🧪 Test Manuali per Funzione

### 1. superadmin-dashboard-stats

**Test: Ottenere Statistiche Dashboard**

```bash
curl -X POST "https://xxx.supabase.co/functions/v1/superadmin-dashboard-stats" \
  -H "Authorization: Bearer $SUPER_ADMIN_JWT" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response**:
```json
{
  "stats": {
    "totalSignups": 150,
    "totalRevenue": 4950,
    "activeUsers": 45,
    "newSignupsThisWeek": 12,
    "churnRiskCount": 3,
    "totalOrganizations": 42,
    "totalEvents": 892
  }
}
```

**Expected Logs** (in Supabase Dashboard):
```
[superadmin-dashboard-stats] START - Function invoked
[validateSuperAdmin] START - Validating super admin access
[validateSuperAdmin] User ID extracted from JWT: abc-123-def
[validateSuperAdmin] Profile found: { userId: 'abc-123', email: 'admin@example.com', role: 'super_admin' }
[validateSuperAdmin] SUCCESS - Super admin validated
[superadmin-dashboard-stats] Super admin validated: { userId: 'abc-123', email: 'admin@example.com' }
[superadmin-dashboard-stats] Fetching statistics...
[superadmin-dashboard-stats] Statistics calculated: { totalSignups: 150, ... }
[superadmin-dashboard-stats] SUCCESS - Returning stats
```

---

### 2. superadmin-list-users

**Test: Listar Todos os Usuários**

```bash
curl -X POST "https://xxx.supabase.co/functions/v1/superadmin-list-users" \
  -H "Authorization: Bearer $SUPER_ADMIN_JWT" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 10,
    "offset": 0
  }'
```

**Test: Buscar Usuário por Email**

```bash
curl -X POST "https://xxx.supabase.co/functions/v1/superadmin-list-users" \
  -H "Authorization: Bearer $SUPER_ADMIN_JWT" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "search": "john@example.com",
    "limit": 10
  }'
```

**Test: Filtrar por Role**

```bash
curl -X POST "https://xxx.supabase.co/functions/v1/superadmin-list-users" \
  -H "Authorization: Bearer $SUPER_ADMIN_JWT" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin",
    "limit": 10
  }'
```

**Expected Response**:
```json
{
  "users": [
    {
      "id": "user-123",
      "email": "john@example.com",
      "full_name": "John Doe",
      "role": "admin",
      "organization_id": "org-456",
      "created_at": "2024-01-01T10:00:00Z",
      "organizations": {
        "id": "org-456",
        "name": "Acme Corp"
      }
    }
  ]
}
```

---

### 3. superadmin-update-user

**Test: Atualizar Role de Usuário**

```bash
curl -X POST "https://xxx.supabase.co/functions/v1/superadmin-update-user" \
  -H "Authorization: Bearer $SUPER_ADMIN_JWT" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123-abc",
    "updates": {
      "role": "admin"
    }
  }'
```

**Test: Atualizar Nome**

```bash
curl -X POST "https://xxx.supabase.co/functions/v1/superadmin-update-user" \
  -H "Authorization: Bearer $SUPER_ADMIN_JWT" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123-abc",
    "updates": {
      "full_name": "John Smith"
    }
  }'
```

**Expected Response**:
```json
{
  "user": {
    "id": "user-123-abc",
    "email": "john@example.com",
    "full_name": "John Smith",
    "role": "admin",
    "organization_id": "org-456",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Verificar Audit Log**:
```sql
SELECT * FROM superadmin_logs 
WHERE action = 'Update User' 
  AND target_id = 'user-123-abc'
ORDER BY created_at DESC 
LIMIT 1;
```

---

### 4. superadmin-list-organizations

**Test: Listar Todas as Organizações**

```bash
curl -X POST "https://xxx.supabase.co/functions/v1/superadmin-list-organizations" \
  -H "Authorization: Bearer $SUPER_ADMIN_JWT" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 20,
    "offset": 0
  }'
```

**Test: Buscar por Nome**

```bash
curl -X POST "https://xxx.supabase.co/functions/v1/superadmin-list-organizations" \
  -H "Authorization: Bearer $SUPER_ADMIN_JWT" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "search": "Acme",
    "limit": 10
  }'
```

**Test: Filtrar por Status**

```bash
curl -X POST "https://xxx.supabase.co/functions/v1/superadmin-list-organizations" \
  -H "Authorization: Bearer $SUPER_ADMIN_JWT" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active",
    "limit": 10
  }'
```

**Expected Response**:
```json
{
  "customers": [
    {
      "id": "org-123",
      "name": "Acme Corp",
      "adminEmail": "admin@acme.com",
      "status": "active",
      "paymentStatus": "Paid",
      "plan": "Pro",
      "memberCount": 5,
      "createdAt": "2024-01-01T10:00:00Z",
      "creditsRemaining": 800,
      "totalCredits": 1000
    }
  ]
}
```

---

### 5. superadmin-update-organization

**Test: Atualizar Nome da Organização**

```bash
curl -X POST "https://xxx.supabase.co/functions/v1/superadmin-update-organization" \
  -H "Authorization: Bearer $SUPER_ADMIN_JWT" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "org-123-abc",
    "updates": {
      "name": "Acme Corporation Inc."
    }
  }'
```

**Test: Atualizar Créditos**

```bash
curl -X POST "https://xxx.supabase.co/functions/v1/superadmin-update-organization" \
  -H "Authorization: Bearer $SUPER_ADMIN_JWT" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "org-123-abc",
    "updates": {
      "credits": 5000,
      "plan_name": "enterprise"
    }
  }'
```

**Test: Atualizar Status com Motivo**

```bash
curl -X POST "https://xxx.supabase.co/functions/v1/superadmin-update-organization" \
  -H "Authorization: Bearer $SUPER_ADMIN_JWT" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "org-123-abc",
    "status": "suspended",
    "reason": "Non-payment for 3 months"
  }'
```

**Expected Response**:
```json
{
  "organization": {
    "id": "org-123-abc",
    "name": "Acme Corporation Inc.",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  "credits": {
    "organization_id": "org-123-abc",
    "plan_name": "enterprise",
    "total_credits": 5000,
    "credits_remaining": 5000
  },
  "statusUpdate": {
    "status": "suspended",
    "reason": "Non-payment for 3 months",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 6. superadmin-manage-payments

**Test: Listar Todos os Pagamentos**

```bash
curl -X POST "https://xxx.supabase.co/functions/v1/superadmin-manage-payments" \
  -H "Authorization: Bearer $SUPER_ADMIN_JWT" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 20,
    "offset": 0
  }'
```

**Test: Filtrar por Status**

```bash
curl -X POST "https://xxx.supabase.co/functions/v1/superadmin-manage-payments" \
  -H "Authorization: Bearer $SUPER_ADMIN_JWT" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Paid",
    "limit": 10
  }'
```

**Expected Response**:
```json
{
  "payments": [
    {
      "id": "payment-org-123-0",
      "organizationName": "Acme Corp",
      "organizationId": "org-123",
      "amount": 49,
      "date": "2024-01-01T00:00:00Z",
      "status": "Paid",
      "plan": "pro",
      "credits": 1000
    }
  ],
  "creditLogs": [...]
}
```

---

### 7. superadmin-create-org

**Test: Criar Nova Organização**

```bash
curl -X POST "https://xxx.supabase.co/functions/v1/superadmin-create-org" \
  -H "Authorization: Bearer $SUPER_ADMIN_JWT" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Corporation",
    "adminEmail": "admin@newcorp.com",
    "plan": "pro",
    "initialCredits": 1000
  }'
```

**Expected Response**:
```json
{
  "organization": {
    "id": "org-new-123",
    "name": "New Corporation",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "credits": {
    "organization_id": "org-new-123",
    "plan_name": "pro",
    "total_credits": 1000,
    "credits_remaining": 1000,
    "cycle_start_date": "2024-01-15T10:30:00Z",
    "cycle_end_date": "2024-02-14T10:30:00Z"
  },
  "message": "Organization created successfully. Admin user should be invited separately."
}
```

**Verificar Rollback** (Test negativo - org já existe):
```bash
# Executar o mesmo comando novamente
# Expected: Error 400 com rollback (org não criada)
```

---

### 8. superadmin-logs

**Test: Listar Todos os Logs**

```bash
curl -X POST "https://xxx.supabase.co/functions/v1/superadmin-logs" \
  -H "Authorization: Bearer $SUPER_ADMIN_JWT" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 50,
    "offset": 0
  }'
```

**Test: Filtrar por Operation Type**

```bash
curl -X POST "https://xxx.supabase.co/functions/v1/superadmin-logs" \
  -H "Authorization: Bearer $SUPER_ADMIN_JWT" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "operationType": "UPDATE",
    "limit": 20
  }'
```

**Test: Buscar por Email de Admin**

```bash
curl -X POST "https://xxx.supabase.co/functions/v1/superadmin-logs" \
  -H "Authorization: Bearer $SUPER_ADMIN_JWT" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "search": "admin@example.com",
    "limit": 20
  }'
```

**Test: Filtrar por Data Range**

```bash
curl -X POST "https://xxx.supabase.co/functions/v1/superadmin-logs" \
  -H "Authorization: Bearer $SUPER_ADMIN_JWT" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-15T23:59:59Z",
    "limit": 100
  }'
```

**Expected Response**:
```json
{
  "logs": [
    {
      "id": "12345",
      "timestamp": "2024-01-15T10:30:00Z",
      "adminEmail": "admin@example.com",
      "action": "Update User",
      "targetId": "user-123",
      "operationType": "UPDATE",
      "targetType": "USER",
      "result": "SUCCESS",
      "details": {
        "before": {...},
        "after": {...}
      },
      "errorMessage": null,
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0..."
    }
  ],
  "total": 150,
  "offset": 0,
  "limit": 50
}
```

---

## 🔍 Verificare Logging Avanzato

### 1. Nel Supabase Dashboard

1. Vai su **Edge Functions**
2. Seleziona una funzione (es. `superadmin-dashboard-stats`)
3. Clicca su **Logs**
4. Dovresti vedere i nuovi log dettagliati:

```
2024-01-15 10:30:00 | [superadmin-dashboard-stats] START - Function invoked
2024-01-15 10:30:00 | [superadmin-dashboard-stats] Request headers: { hasAuthorization: true, ... }
2024-01-15 10:30:00 | [validateSuperAdmin] START - Validating super admin access
2024-01-15 10:30:01 | [validateSuperAdmin] User ID extracted from JWT: abc-123
2024-01-15 10:30:01 | [validateSuperAdmin] Profile found: { userId: 'abc-123', email: '...', role: 'super_admin' }
2024-01-15 10:30:01 | [validateSuperAdmin] SUCCESS - Super admin validated
2024-01-15 10:30:01 | [superadmin-dashboard-stats] Fetching statistics...
2024-01-15 10:30:02 | [superadmin-dashboard-stats] Statistics calculated: { totalSignups: 150, ... }
2024-01-15 10:30:02 | [superadmin-dashboard-stats] SUCCESS - Returning stats
```

### 2. Query Audit Logs

```sql
-- Verificare che tutte le operazioni siano loggatesql
SELECT 
  created_at,
  admin_email,
  action,
  operation_type,
  target_type,
  result,
  error_message
FROM superadmin_logs
ORDER BY created_at DESC
LIMIT 20;
```

---

## ❌ Test Negativi

### 1. Sem JWT Token

```bash
curl -X POST "https://xxx.supabase.co/functions/v1/superadmin-dashboard-stats" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response**:
```json
{
  "error": "Authorization header is required. Please ensure you are logged in.",
  "diagnostics": {
    "function": "superadmin-dashboard-stats",
    "timestamp": "2024-01-15T10:30:00Z",
    "suggestion": "Check your JWT token is valid and not expired"
  }
}
```

**Expected HTTP Status**: 403

---

### 2. Com JWT de Usuário Normal (não super_admin)

```bash
curl -X POST "https://xxx.supabase.co/functions/v1/superadmin-dashboard-stats" \
  -H "Authorization: Bearer $NORMAL_USER_JWT" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response**:
```json
{
  "error": "Insufficient permissions. Super Admin role required. Current role: user",
  "diagnostics": {
    "function": "superadmin-dashboard-stats",
    "timestamp": "2024-01-15T10:30:00Z",
    "suggestion": "Verify you have super_admin role assigned in your profile"
  }
}
```

**Expected HTTP Status**: 403

---

### 3. JWT Expirado

```bash
# Use um JWT que você sabe ser expirado
curl -X POST "https://xxx.supabase.co/functions/v1/superadmin-dashboard-stats" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response**:
```json
{
  "error": "Invalid or expired JWT token: ...",
  "diagnostics": {
    "function": "superadmin-dashboard-stats",
    "timestamp": "2024-01-15T10:30:00Z",
    "suggestion": "Check your JWT token is valid and not expired"
  }
}
```

**Expected HTTP Status**: 403

---

## 📊 Checklist de Testes Completos

### Funcionalidade

- [ ] Todas as 8 funzioni deployate e raggiungibili
- [ ] Autenticazione JWT funciona
- [ ] Validazione super_admin role funciona
- [ ] Tutte le query database funzionano
- [ ] Audit logging funciona (verificare `superadmin_logs` table)
- [ ] Error handling funciona (test con parametri invalidi)

### Logging

- [ ] Log START markers presenti
- [ ] Log user identity (userId, email) presenti
- [ ] Log query parameters presenti
- [ ] Log query results presenti
- [ ] Log SUCCESS/FAILURE presenti
- [ ] Log error stack traces presenti (quando ci sono errori)

### Security

- [ ] Richieste senza JWT vengono rifiutate (403)
- [ ] Richieste con JWT di utente normale vengono rifiutate (403)
- [ ] Richieste con JWT expirato vengono rifiutate (403)
- [ ] Solo utenti con role='super_admin' possono accedere
- [ ] Audit trail completo per tutte le operazioni

### Performance

- [ ] Response time accettabile (<2s per query semplici)
- [ ] Log volume accettabile (non troppe righe per request)
- [ ] Database queries ottimizzate (verificare execution plan se necessario)

---

## 🐛 Troubleshooting Comune

### Problema: "Authorization header is required"

**Causa**: JWT token non inviato nell'header
**Soluzione**: Verificare che l'header `Authorization: Bearer TOKEN` sia presente

---

### Problema: "Insufficient permissions"

**Causa**: Utente non ha role='super_admin'
**Soluzione**: 
```sql
UPDATE profiles SET role = 'super_admin' WHERE email = 'your@email.com';
```

---

### Problema: "Invalid or expired JWT token"

**Causa**: JWT expirato o invalido
**Soluzione**: Ottenere un nuovo JWT dal browser/Supabase Dashboard

---

### Problema: "User profile not found"

**Causa**: Profilo utente non esiste nel database
**Soluzione**: Verificare che il profilo sia stato creato durante la registrazione

---

### Problema: Funzione ritorna 404

**Causa**: Funzione non deployata
**Soluzione**: 
```bash
npx supabase functions deploy function-name
```

---

## ✅ Sign-off

Dopo aver completato tutti i test:

- [ ] Tutte le funzionalità testate e funzionanti
- [ ] Logging verificato e completo
- [ ] Security verificata
- [ ] Performance accettabile
- [ ] Team notificato del successo del deploy

---

**Fine Testing Guide** - Versione 2.0.0
