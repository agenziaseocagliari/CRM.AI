# 🚀 QUICK DEPLOYMENT GUIDE - Rollback Branch

**Branch**: `rollback/stable-615ec3b`  
**Stable Commit**: `615ec3bfa3473add3f79081a41e8b7abb326a6b0`  
**Status**: Ready for Production

---

## ⚡ QUICK START (3 Steps)

### 1️⃣ Update Vercel Production Branch
```bash
# Option A: Via Vercel Dashboard
# 1. Go to https://vercel.com/your-project/settings/git
# 2. Under "Production Branch", change from "main" to "rollback/stable-615ec3b"
# 3. Click "Save"
# 4. Trigger new deployment

# Option B: Via CLI
git checkout rollback/stable-615ec3b
npx vercel --prod
```

### 2️⃣ Verify Supabase Deployment
```bash
# GitHub Actions will auto-deploy, or manually:
supabase link --project-ref qjtaqrlpronohgpfdxsi
supabase db push
```

### 3️⃣ Test Core Features
- Visit PolicyDetail: Should display policies without errors
- Test RenewalCalendar: "Dettagli" button should navigate correctly
- Check browser console: Should be error-free

---

## 🎯 VERIFICATION CHECKLIST

After deployment, verify:

- [ ] Vercel deployment succeeded (check dashboard)
- [ ] PolicyDetail loads without "Polizza non trovata" errors
- [ ] RenewalCalendar displays correctly
- [ ] "Dettagli" button navigates to `/insurance/policies/:id`
- [ ] No JavaScript errors in browser console
- [ ] Supabase migrations applied successfully
- [ ] GitHub Actions workflows passing

---

## 🔄 ROLLBACK DETAILS

**From**: `main` branch (commit `f5cfec7` - Triple fallback fixes)  
**To**: `rollback/stable-615ec3b` (commit `615ec3b` - Stable working state)  
**Commits Reverted**: 13 commits

**Why Rollback**:
- Recent commits introduced instability
- Persistent build and deploy failures
- PolicyDetail and RenewalCalendar issues
- Need to return to known-good state

**What's Stable in 615ec3b**:
- ✅ PolicyDetail working perfectly
- ✅ RenewalCalendar fully functional
- ✅ Supabase deploys succeeding
- ✅ All core features operational

---

## 📞 SUPPORT

If issues persist after rollback deployment:

1. Check GitHub Actions logs: https://github.com/agenziaseocagliari/CRM.AI/actions
2. Review Vercel logs: `npx vercel logs --prod`
3. Check Supabase dashboard for migration errors
4. Consult full report: `ROLLBACK_TO_STABLE_615EC3B_REPORT.md`

---

## ⏭️ NEXT STEPS

After successful rollback:

1. Monitor production for 24 hours
2. Verify all user-reported issues resolved
3. Review what went wrong with recent commits
4. Plan incremental fixes without destabilization
5. Improve testing procedures before future deployments

---

**DEPLOYMENT READY**: ✅ Branch `rollback/stable-615ec3b` is ready for production use.

**Action Required**: Update Vercel production branch settings and trigger deployment.
