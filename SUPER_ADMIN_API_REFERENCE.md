# 🛡️ Super Admin API Quick Reference

**Versione**: 1.0 | **Data**: 30 Settembre 2024

---

## 🔑 Autenticazione

**Tutti gli endpoint richiedono**:
- Header `Authorization: Bearer [super-admin-jwt-token]`
- Header `apikey: [supabase-anon-key]`
- Utente con role `super_admin` nel database

---

## 📊 Dashboard & Statistics

### GET Dashboard Stats
```bash
POST /functions/v1/superadmin-dashboard-stats
Body: {}
```

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

---

## 👥 User Management

### List Users
```bash
POST /functions/v1/superadmin-list-users
Body: {
  "search": "john",           # optional
  "role": "admin",            # optional
  "organizationId": "uuid",   # optional
  "limit": 50,                # default: 50
  "offset": 0                 # default: 0
}
```

### Update User
```bash
POST /functions/v1/superadmin-update-user
Body: {
  "userId": "user-uuid",
  "updates": {
    "full_name": "New Name",
    "role": "super_admin",    # user, admin, super_admin
    "organization_id": "org-uuid"
  }
}
```

---

## 🏢 Organization Management

### List Organizations
```bash
POST /functions/v1/superadmin-list-organizations
Body: {
  "search": "acme",         # optional
  "status": "active",       # optional: active, trial, suspended
  "plan": "pro",            # optional: free, pro, enterprise
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
      "creditsRemaining": 500,
      "totalCredits": 1000
    }
  ]
}
```

### Update Organization
```bash
POST /functions/v1/superadmin-update-organization
Body: {
  "organizationId": "org-uuid",
  "updates": {
    "name": "New Name",           # optional
    "credits": 2000,              # optional
    "plan_name": "enterprise"     # optional: free, pro, enterprise
  },
  "status": "active",             # optional: active, trial, suspended
  "reason": "Premium upgrade"     # optional
}
```

### Create Organization
```bash
POST /functions/v1/superadmin-create-org
Body: {
  "name": "New Company Inc",
  "adminEmail": "admin@newcompany.com",
  "plan": "pro",                # default: free
  "initialCredits": 1000        # default: 100
}
```

---

## 💳 Payment Management

### List Payments
```bash
POST /functions/v1/superadmin-manage-payments
Body: {
  "status": "Paid",           # optional: Paid, Pending, Failed
  "limit": 50,
  "offset": 0
}
```

### Refund Payment
```bash
POST /functions/v1/superadmin-manage-payments
Body: {
  "action": "refund",
  "transactionId": "payment-uuid"
}
```

---

## 📝 Audit Logs

### Retrieve Logs
```bash
POST /functions/v1/superadmin-logs
Body: {
  "search": "update",                    # optional
  "operationType": "UPDATE",             # optional: CREATE, UPDATE, DELETE, READ, EXECUTE
  "targetType": "USER",                  # optional: USER, ORGANIZATION, PAYMENT, SYSTEM
  "result": "SUCCESS",                   # optional: SUCCESS, FAILURE, PARTIAL
  "startDate": "2024-01-01T00:00:00Z",  # optional
  "endDate": "2024-12-31T23:59:59Z",    # optional
  "limit": 100,                          # default: 100
  "offset": 0
}
```

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
      "details": { "before": {...}, "after": {...} },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0..."
    }
  ],
  "total": 150,
  "offset": 0,
  "limit": 100
}
```

---

## 🚨 Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| 200 | Success | - |
| 400 | Bad Request | Check required parameters |
| 403 | Forbidden | User doesn't have super_admin role |
| 500 | Server Error | Check edge function logs |

---

## 🧪 Testing Examples

### Test with cURL
```bash
# Set environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
export SUPER_ADMIN_JWT="your-jwt-token"

# Test dashboard stats
curl -X POST "$SUPABASE_URL/functions/v1/superadmin-dashboard-stats" \
  -H "Authorization: Bearer $SUPER_ADMIN_JWT" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'

# Test list users
curl -X POST "$SUPABASE_URL/functions/v1/superadmin-list-users" \
  -H "Authorization: Bearer $SUPER_ADMIN_JWT" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"limit": 5}'
```

### Test with JavaScript/n8n
```javascript
const response = await fetch(
  'https://your-project.supabase.co/functions/v1/superadmin-dashboard-stats',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${superAdminJWT}`,
      'apikey': supabaseAnonKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  }
);

const data = await response.json();
console.log(data.stats);
```

### Automated Test Suite
```bash
# Run comprehensive test suite
./scripts/test-superadmin.sh
```

---

## 📋 Checklist per Setup

- [ ] Deploy edge functions: `supabase functions deploy --no-verify-jwt`
- [ ] Apply database migration: `supabase db push`
- [ ] Creare primo super admin: `UPDATE profiles SET role = 'super_admin' WHERE email = 'admin@example.com'`
- [ ] Configurare secrets su Supabase Dashboard
- [ ] Testare autenticazione con `./scripts/test-superadmin.sh`
- [ ] Verificare audit logs funzionanti
- [ ] Documentare procedure per team

---

## 🔗 Link Utili

- **Documentazione Completa**: [SUPER_ADMIN_IMPLEMENTATION.md](./SUPER_ADMIN_IMPLEMENTATION.md)
- **API Documentation**: [EDGE_FUNCTIONS_API.md](./EDGE_FUNCTIONS_API.md)
- **Deployment Guide**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Test Script**: [scripts/test-superadmin.sh](./scripts/test-superadmin.sh)

---

## 💡 Tips & Best Practices

1. **Always use HTTPS** in production
2. **Rotate JWT tokens** regularly (every 24-48h recommended)
3. **Monitor audit logs** for suspicious activity
4. **Backup superadmin_logs** table regularly
5. **Never hardcode** JWT tokens in code
6. **Use environment variables** for all secrets
7. **Test in staging** before production deploy
8. **Enable 2FA** for all super admin accounts

---

**Last Updated**: 30 September 2024  
**Maintained by**: DevOps Team  
**Questions?**: Check SUPER_ADMIN_IMPLEMENTATION.md
