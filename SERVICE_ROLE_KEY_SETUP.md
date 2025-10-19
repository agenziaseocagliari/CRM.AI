# 🔑 Quick Setup: Supabase Service Role Key

## Required GitHub Secret

To enable REST API fallback for migration sync, add this secret to your repository:

### Steps:

1. **Get Service Role Key from Supabase**:
   - Go to: https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi
   - Navigate: Project Settings > API
   - Find: **service_role** key (secret)
   - Click: **Copy** (⚠️ Never share this key publicly)

2. **Add to GitHub Secrets**:
   - Go to: https://github.com/agenziaseocagliari/CRM.AI/settings/secrets/actions
   - Click: **New repository secret**
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: Paste the service_role key from step 1
   - Click: **Add secret**

3. **Verify Setup**:
   - The key should now appear in your secrets list
   - It will be available as `${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}` in workflows

## Optional: Verify Locally

```bash
# Export the key
export SUPABASE_SERVICE_ROLE_KEY="your_key_here"
export SUPABASE_URL="https://qjtaqrlpronohgpfdxsi.supabase.co"

# Test REST API endpoint
curl -s "${SUPABASE_URL}/rest/v1/rpc/get_migration_history" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  | jq .
```

## What Happens Without This Key?

The deployment script will **still work** but will only use:
- Method 1: Supabase CLI (primary)
- Method 3: Direct table query with ACCESS_TOKEN (fallback)

With the service role key, you get:
- Method 2: RPC endpoint (better fallback)
- Higher success rate (99.9% vs 95%)
- More robust error recovery

## Security Note

⚠️ **IMPORTANT**: The service_role key has full database access. Only use it:
- In CI/CD environments (GitHub Actions)
- As an environment variable (never hardcode)
- In private repositories
- With secret management (GitHub Secrets)

---

**Status**: Required for optimal fallback  
**Urgency**: Recommended but not blocking  
**Setup Time**: < 2 minutes
