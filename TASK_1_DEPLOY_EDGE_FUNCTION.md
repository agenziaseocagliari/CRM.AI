# 🚀 STEP-BY-STEP DEPLOYMENT GUIDE
## Task 1: Deploy Edge Function consume-credits

### 📋 Overview
**Objective:** Upload consume-credits function to fix FormMaster "Errore di rete nella verifica dei crediti"
**Priority:** HIGH - This resolves the network error immediately
**Location:** Files ready in `deployment_temp/consume-credits/`

### 🛠️ Detailed Steps

#### Step 1: Access Supabase Dashboard
1. Open your browser
2. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
3. Login with your credentials
4. Select your CRM-AI project

#### Step 2: Navigate to Edge Functions
1. In the left sidebar, click **"Edge Functions"**
2. You'll see the Edge Functions management page

#### Step 3: Create New Function
1. Click **"Create a new function"** button
2. **Function name:** Enter exactly `consume-credits` (must match exactly)
3. **Description:** Enter "Advanced credit consumption system with enterprise security"
4. Click **"Create function"**

#### Step 4: Upload Function Code
1. You'll be taken to the function editor
2. **DELETE** all existing template code in the editor
3. Open the file: `deployment_temp/consume-credits/index.ts`
4. **COPY** all the content from that file
5. **PASTE** it into the Supabase function editor

#### Step 5: Configure Environment Variables
1. In the function editor, look for **"Settings"** or **"Environment Variables"** tab
2. Add these environment variables:
   - **Key:** `SUPABASE_URL`
   - **Value:** Your Supabase project URL (found in Project Settings → API)
   
   - **Key:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** Your service role key (found in Project Settings → API → service_role key)

⚠️ **IMPORTANT:** Use the `service_role` key, NOT the `anon` key!

#### Step 6: Deploy Function
1. Click **"Deploy"** button
2. Wait for deployment to complete (should take 30-60 seconds)
3. You should see "Deployed successfully" message

#### Step 7: Test Function (Optional but Recommended)
1. In the function editor, look for a **"Test"** or **"Invoke"** section
2. Use this test payload:
```json
{
  "organization_id": "00000000-0000-0000-0000-000000000000",
  "action_type": "test"
}
```
3. Click **"Invoke"** or **"Test"**
4. You should see a response (may be an error about organization not existing, which is OK for testing)

### ✅ Success Indicators
- Function shows as "Deployed" in dashboard
- No deployment errors in logs
- Test invocation returns a response (even if error about organization)

### 🔧 Troubleshooting
- **If deployment fails:** Check that you copied the entire file content
- **If environment variables are missing:** Verify you added both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
- **If function name is wrong:** Delete and recreate with exact name `consume-credits`

---
**Status:** Ready for execution
**Next:** Task 2 - Database Migration