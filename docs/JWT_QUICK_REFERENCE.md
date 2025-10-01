# 🔐 JWT Quick Reference Card

## Quick Actions

### 🔍 Check Your JWT Status
1. Go to **Settings**
2. Click **🔧 Debug JWT** tab
3. Click **🔍 Visualizza JWT Token**

### ⚠️ I See "TOKEN DEFECT"
1. Click **🔄 Esegui Logout Profondo**
2. Wait for confirmation
3. Login with **email + password** only
4. ✅ Check JWT status again

### 📊 View Login History
1. Go to **Login** page
2. Look for **"📊 Visualizza storico login"**
3. Click to expand history
4. Check for JWT defects by method

### 📋 Copy Diagnostics for Support
1. Open JWT Viewer (Settings → Debug JWT)
2. Click **📋 Copia Report Completo**
3. Share with support team

## Quick Checks

### ✅ Healthy JWT
```
Token Valido: ✅ Sì
user_role Presente: ✅ Sì
Ruolo: super_admin (or user)
```

### ❌ TOKEN DEFECT
```
Token Valido: ✅ Sì
user_role Presente: ❌ No
Warning: Token was generated before hook configuration
```

## Where to Find JWT Info

| Location | What You See | When to Use |
|----------|--------------|-------------|
| **Settings → Debug JWT** | Full JWT viewer with all claims | Detailed diagnostics |
| **SuperAdmin Dashboard** | JWT status panel (top of page) | Quick status check |
| **Login Page** | JWT warning + login history | After login issues |
| **App-wide** | Toast notification | Automatic detection |

## Common Issues & Solutions

### Issue: "user_role not found"
**Solution:** Deep logout → Login with email+password

### Issue: "Token expired"
**Solution:** Just login again (normal behavior)

### Issue: Different login methods cause problems
**Solution:** Check login history → Use password method only

### Issue: Backend was updated
**Solution:** Everyone must logout and login once

## Login Methods Ranked

| Method | Reliability | JWT Quality | Recommended |
|--------|-------------|-------------|-------------|
| **Email + Password** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ YES |
| **Magic Link** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⚠️ Check JWT after |
| **Password Reset** | ⭐⭐⭐ | ⭐⭐ | ⚠️ Use with caution |
| **OAuth** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ Usually fine |

## Key Warnings

### 🚨 CRITICAL
- Missing `user_role` claim → Cannot access protected resources
- Solution: Deep logout + re-login

### ⚠️ IMPORTANT
- After backend updates → Must regenerate JWT
- Solution: Logout + login once

### ℹ️ INFO
- Token expiring soon → Will auto-refresh or require re-login
- Login history is local → Different per device/browser

## Quick Glossary

| Term | Meaning |
|------|---------|
| **JWT** | JSON Web Token - your authentication credential |
| **user_role** | Claim in JWT that defines your access level |
| **TOKEN DEFECT** | JWT missing required claims |
| **Deep Logout** | Complete cleanup of all auth data |
| **Claims** | Information stored in JWT (role, email, etc.) |
| **Hook** | Backend function that adds custom claims to JWT |

## Need More Help?

📖 **Full Guide:** `docs/JWT_DEBUGGING_GUIDE.md`  
💬 **Support:** Share your diagnostics report  
🔧 **Technical:** See implementation docs

---

**Remember:** After ANY backend update, logout and login to get a fresh JWT! 🔄
