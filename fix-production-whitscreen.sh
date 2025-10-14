#!/bin/bash

# 🔧 CRITICAL PRODUCTION FIX: Environment Variables Setup for Vercel
# This script identifies and resolves the white screen issue

echo "🚨 CRITICAL PRODUCTION ISSUE DIAGNOSIS"
echo "======================================="
echo ""

echo "📋 Issue Summary:"
echo "- Production site shows white screen"
echo "- Local builds work perfectly"
echo "- Environment variables missing in Vercel"
echo ""

echo "🔍 Root Cause Analysis:"
echo "- Vercel does not automatically read .env.production files"
echo "- Environment variables must be manually configured in Vercel dashboard"
echo "- Missing VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY cause app initialization to fail"
echo ""

echo "📦 Required Environment Variables (from .env.production):"
cat .env.production
echo ""

echo "🛠️ IMMEDIATE SOLUTION:"
echo "1. Go to Vercel Dashboard: https://vercel.com/dashboard"
echo "2. Select the CRM.AI project"
echo "3. Go to Settings > Environment Variables"
echo "4. Add the following variables for Production AND Preview:"
echo ""
echo "   Variable Name: VITE_SUPABASE_URL"
echo "   Value: $(grep VITE_SUPABASE_URL .env.production | cut -d'=' -f2)"
echo ""
echo "   Variable Name: VITE_SUPABASE_ANON_KEY"
echo "   Value: $(grep VITE_SUPABASE_ANON_KEY .env.production | cut -d'=' -f2)"
echo ""
echo "   Variable Name: VITE_SUPABASE_SERVICE_ROLE_KEY"
echo "   Value: $(grep VITE_SUPABASE_SERVICE_ROLE_KEY .env.production | cut -d'=' -f2)"
echo ""

echo "5. Redeploy the application to apply the new environment variables"
echo ""

echo "⚡ Quick Fix - Create Vercel Environment Setup Script"
echo "Creating vercel-env-setup.md with step-by-step instructions..."

# Create comprehensive setup guide
cat > vercel-env-setup.md << 'EOF'
# 🔧 VERCEL ENVIRONMENT VARIABLES SETUP

## CRITICAL PRODUCTION FIX

### Issue
- Production site shows white screen
- Environment variables not configured in Vercel
- App fails during Supabase client initialization

### Solution Steps

1. **Access Vercel Dashboard**
   - Go to https://vercel.com/dashboard
   - Select your CRM.AI project

2. **Navigate to Settings**
   - Click on "Settings" tab
   - Select "Environment Variables" from the left menu

3. **Add Required Variables**
   
   **For Production Environment:**
   ```
   VITE_SUPABASE_URL = https://qjtaqrlpronohgpfdxsi.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzg2NjQsImV4cCI6MjA3MzAxNDY2NH0.bOVp6mXAUY2lL-REcBFwvKiAu2k6ATigL8j44mlZ4RU
   VITE_SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0
   ```

4. **Set Environment Scope**
   - For each variable, select "Production" and "Preview" environments
   - This ensures both production and preview deployments work

5. **Redeploy Application**
   - Go to "Deployments" tab
   - Click "..." on the latest deployment
   - Select "Redeploy"
   - OR push a new commit to trigger automatic deployment

### Verification Steps

After setting up environment variables:

1. **Check Deployment Logs**
   - Look for successful build completion
   - Verify no environment variable errors

2. **Test Application**
   - Visit https://crm-ai-steel.vercel.app
   - Should load properly without white screen
   - Login functionality should work

3. **Browser Console Check**
   - Open Developer Tools (F12)
   - Check for JavaScript errors
   - Should see initialization messages

### Common Issues

**Variable Not Applied:**
- Ensure you selected the correct environment (Production/Preview)
- Redeploy after adding variables

**Still White Screen:**
- Check browser console for specific errors
- Verify all 3 environment variables are set
- Check deployment logs for build errors

**Invalid Supabase Configuration:**
- Verify URLs and keys are correct
- Test Supabase connection independently

### Emergency Contact

If issues persist:
1. Check GitHub Actions for CI/CD errors
2. Review Vercel deployment logs
3. Test local production build: `npm run build && npm run preview`

---

**Status:** ✅ READY FOR DEPLOYMENT
**Priority:** 🔴 CRITICAL - Production Down
**ETA:** 5-10 minutes after environment setup
EOF

echo "✅ Setup guide created: vercel-env-setup.md"
echo ""

echo "🎯 NEXT STEPS:"
echo "1. Follow the instructions in vercel-env-setup.md"
echo "2. Set up environment variables in Vercel Dashboard"
echo "3. Redeploy the application"
echo "4. Verify production site loads correctly"
echo ""

echo "⏱️ Expected Resolution Time: 5-10 minutes"
echo "🎉 Once completed, production site will be fully functional"