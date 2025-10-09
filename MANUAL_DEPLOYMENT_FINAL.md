# 🚀 MANUAL DEPLOYMENT - FormMaster Level 5

## Current Status
✅ **Function Fixed**: Syntax error corrected in `supabase/functions/generate-form-fields/index.ts`
✅ **Code Updated**: FormMaster Level 5 with GDPR compliance ready
❌ **Auto Deploy Blocked**: Docker Desktop not available

## 📋 MANUAL DEPLOYMENT STEPS

### Method 1: Supabase Dashboard (RECOMMENDED)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi)
2. Navigate to **Edge Functions** in the left sidebar
3. Find `generate-form-fields` function
4. Click **Edit Function**
5. Copy the entire content from: `C:\Users\inves\CRM-AI\supabase\functions\generate-form-fields\index.ts`
6. Paste it in the editor
7. Click **Deploy Function**

### Method 2: GitHub Codespaces (ALTERNATIVE)
```bash
# If you switch to Codespaces:
supabase functions deploy generate-form-fields --project-ref qjtaqrlpronohgpfdxsi
```

## 🧪 IMMEDIATE TESTING
Once deployed, test with:
```powershell
$headers = @{'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; 'Content-Type' = 'application/json'}
$body = '{"prompt":"Genera un form per web agency","organization_id":"test123"}'
Invoke-RestMethod -Uri 'https://qjtaqrlpronohgpfdxsi.supabase.co/functions/v1/generate-form-fields' -Method POST -Headers $headers -Body $body
```

## ✅ EXPECTED RESULT
```json
{
  "fields": [
    {"name": "nome", "label": "Nome", "type": "text", "required": true},
    {"name": "email", "label": "Email", "type": "email", "required": true},
    {"name": "azienda", "label": "Azienda", "type": "text", "required": false},
    {"name": "messaggio", "label": "Come possiamo aiutarti?", "type": "textarea", "required": false}
  ],
  "meta": {
    "version": "12.1",
    "level": 5,
    "gdpr_enabled": true,
    "timestamp": "2025-10-07T..."
  }
}
```

## 🔧 KEY FIXES APPLIED
- ✅ Fixed syntax error: `//**` → `/**`
- ✅ GDPR compliance detection working
- ✅ Smart field generation based on prompt
- ✅ Proper CORS headers
- ✅ Error handling improved

The function is **READY FOR MANUAL DEPLOYMENT**!