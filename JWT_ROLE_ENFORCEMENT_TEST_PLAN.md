# 🎯 JWT Role-Based Access Control - Test Plan

This document outlines the test scenarios to verify that role-based access control is properly enforced through JWT claims.

## Test Environment Setup

### Test Accounts Required

1. **Super Admin Account**
   - Email: [super admin email]
   - Expected role: `super_admin`
   - Should have full access to all features including /super-admin routes

2. **Regular User Account**
   - Email: [user email]
   - Expected role: `user`
   - Should NOT have access to super-admin features

## Test Scenarios

### 1. Login Flow Testing

#### 1.1 Super Admin Login
- [ ] Login with super admin credentials
- [ ] Check browser console for JWT claims log
  - Expected: `🔑 [AuthContext] JWT Claims parsed:` with `user_role: 'super_admin'`
- [ ] Open DebugPanel (Ctrl+Shift+D or click 🐛 button)
- [ ] Verify DebugPanel shows:
  - User Role: `super_admin`
  - Super Admin flag: ✅
  - All JWT claims properly displayed
- [ ] Check Header displays: `🔐 Super Admin` badge
- [ ] Verify Sidebar shows "Super Admin" menu item at bottom
- [ ] Navigate to /super-admin
  - Expected: Access granted, no error messages

#### 1.2 Regular User Login
- [ ] Logout from super admin account
  - Check console for: `👋 [AuthContext] User signed out - clearing all claims`
  - Verify localStorage and sessionStorage are cleared
- [ ] Login with regular user credentials
- [ ] Check browser console for JWT claims log
  - Expected: `🔑 [AuthContext] JWT Claims parsed:` with `user_role: 'user'`
- [ ] Open DebugPanel (Ctrl+Shift+D or click 🐛 button)
- [ ] Verify DebugPanel shows:
  - User Role: `user`
  - User flag: ✅
  - Super Admin flag: ❌
  - Admin flag: ❌
- [ ] Check Header displays: `👤 Utente Standard` badge
- [ ] Verify Sidebar does NOT show "Super Admin" menu item
- [ ] Attempt to navigate to /super-admin manually (type in URL)
  - Expected: Redirected to /dashboard with error toast
  - Check console for: `⚠️ [SuperAdminLayout] UNAUTHORIZED ACCESS ATTEMPT!`

### 2. URL-Based Access Protection

#### 2.1 Direct URL Access as Regular User
- [ ] Login as regular user
- [ ] Try to access these URLs directly:
  - `/super-admin` - Should redirect to /dashboard
  - `/super-admin/dashboard` - Should redirect to /dashboard
  - `/super-admin/customers` - Should redirect to /dashboard
  - `/super-admin/payments` - Should redirect to /dashboard
  - `/super-admin/ai-workflows` - Should redirect to /dashboard
  - `/super-admin/audit-logs` - Should redirect to /dashboard
- [ ] Verify error toast appears with message: "🚫 Accesso Negato"
- [ ] Verify console shows authorization warnings

#### 2.2 Direct URL Access as Super Admin
- [ ] Login as super admin
- [ ] Access all super admin URLs directly:
  - `/super-admin` - Should redirect to `/super-admin/dashboard`
  - `/super-admin/dashboard` - Should load dashboard
  - `/super-admin/customers` - Should load customers
  - `/super-admin/payments` - Should load payments
  - `/super-admin/ai-workflows` - Should load AI workflows
  - `/super-admin/audit-logs` - Should load audit logs
- [ ] No error messages should appear
- [ ] Console should show: `🔒 [SuperAdminLayout] Authorization check:` with `isSuperAdmin: true`

### 3. UI Visibility Testing

#### 3.1 Regular User UI
Login as regular user and verify:
- [ ] Dashboard accessible
- [ ] Opportunities accessible
- [ ] Contacts accessible
- [ ] Calendar accessible
- [ ] Meetings accessible
- [ ] Forms accessible
- [ ] Automations accessible
- [ ] Settings accessible
- [ ] NO "Super Admin" link in sidebar
- [ ] Header shows `👤 Utente Standard` badge

#### 3.2 Super Admin UI
Login as super admin and verify:
- [ ] All regular user features accessible (above)
- [ ] "Super Admin" link IS visible in sidebar
- [ ] Header shows `🔐 Super Admin` badge
- [ ] Can access all super admin routes

### 4. Session Management Testing

#### 4.1 Logout Cleanup
- [ ] Login with any account
- [ ] Open DebugPanel and note the JWT claims
- [ ] Click Logout button
- [ ] Check console for: `👋 [MainLayout] Logging out - clearing all session data`
- [ ] Check console for: `👋 [AuthContext] User signed out - clearing all claims`
- [ ] Verify redirected to home page
- [ ] Open browser DevTools → Application → Storage
  - localStorage should be empty
  - sessionStorage should be empty
- [ ] Try to go back using browser back button
  - Should be redirected to login

#### 4.2 Token Refresh
- [ ] Login with any account
- [ ] Wait for token to refresh (typically 1 hour, may need to force refresh)
- [ ] Check console for: `🔄 [AuthContext] Token refreshed - re-parsing claims`
- [ ] Open DebugPanel - claims should still be correct
- [ ] UI should not change or flicker

### 5. JWT Token Defect Handling

#### 5.1 Missing user_role Claim
If JWT doesn't contain `user_role` claim:
- [ ] After login, check for error toast: "⚠️ TOKEN DEFECT RILEVATO"
- [ ] Console should show: `⚠️ [AuthContext] JWT TOKEN DEFECT: user_role claim is MISSING from JWT!`
- [ ] DebugPanel should show:
  - User Role: "NULL ⚠️" in red
  - Warning message: "user_role is missing from JWT!"
- [ ] Super Admin link should NOT appear in sidebar (even if user was supposed to be super admin)
- [ ] Access to /super-admin should be blocked

### 6. DebugPanel Testing

#### 6.1 Toggle Functionality
- [ ] Login with any account
- [ ] Press Ctrl+Shift+D - panel should appear
- [ ] Press Ctrl+Shift+D again - panel should disappear
- [ ] Click 🐛 button in bottom-right - panel should appear
- [ ] Click ✕ button in panel - panel should disappear

#### 6.2 Information Display
- [ ] Open DebugPanel
- [ ] Verify displays:
  - User Role (should match actual role)
  - Email (should match logged-in user)
  - User ID (sub claim)
  - Organization ID (if applicable)
  - Role flags (Super Admin, Admin, User)
- [ ] Click "All Claims (click to expand)"
- [ ] Verify full JWT payload is displayed in JSON format
- [ ] Verify all standard JWT claims are present (sub, email, aud, exp, iat, iss)

### 7. Console Logging Verification

Check that console logs include:

#### On Login:
```
🔑 [AuthContext] Initializing auth context...
🔑 [AuthContext] Auth state changed: SIGNED_IN
✅ [AuthContext] User signed in
🔑 [AuthContext] JWT Claims parsed: {user_role: 'super_admin', email: '...', ...}
```

#### On Logout:
```
👋 [MainLayout] Logging out - clearing all session data
🔑 [AuthContext] Auth state changed: SIGNED_OUT
👋 [AuthContext] User signed out - clearing all claims
```

#### On Super Admin Access (authorized):
```
🔒 [SuperAdminLayout] Authorization check: {userRole: 'super_admin', isSuperAdmin: true, ...}
```

#### On Super Admin Access (unauthorized):
```
🔒 [SuperAdminLayout] Authorization check: {userRole: 'user', isSuperAdmin: false, ...}
⚠️ [SuperAdminLayout] UNAUTHORIZED ACCESS ATTEMPT!
⚠️ [SuperAdminLayout] User role: user
⚠️ [SuperAdminLayout] Expected: super_admin
```

#### On Role Mismatch:
```
❌ [AuthContext] CRITICAL: User is logged in but user_role is NULL!
❌ [AuthContext] This means JWT does not contain user_role claim.
❌ [AuthContext] UI will not render correctly. User must re-login.
```

## Success Criteria

✅ All test scenarios pass
✅ Regular users CANNOT access super admin features under any circumstances
✅ Super admins CAN access all features including super admin panel
✅ Direct URL navigation is properly protected
✅ Session cleanup on logout is complete (no persistent state)
✅ Console logs provide clear debugging information
✅ DebugPanel displays correct JWT claims in real-time
✅ UI elements (badges, menu items) reflect current user role accurately

## Known Issues / Edge Cases

- **Token without user_role**: If backend doesn't inject user_role claim, UI will block all admin access and show warnings. User must re-login after backend fix.
- **Browser cache**: If user had old session cached, they may need to clear browser cache or do "hard refresh" (Ctrl+Shift+R).
- **Multiple tabs**: If user is logged in with multiple tabs, logout from one tab should clear session in all tabs (handled by Supabase auth state listener).

## Troubleshooting

### Problem: Super admin user can't access /super-admin
**Check:**
1. Open DebugPanel - verify user_role is 'super_admin'
2. Check console for JWT claims - ensure user_role is in the token
3. If user_role is missing, backend needs to be fixed and user must re-login

### Problem: Regular user can access super admin routes
**Check:**
1. Open DebugPanel - verify user_role is 'user' not 'super_admin'
2. Check console for authorization warnings
3. Verify AuthContext is properly wrapping App in index.tsx
4. Check SuperAdminLayout is using useAuth() hook correctly

### Problem: UI shows wrong role badge
**Check:**
1. Open DebugPanel and compare role shown there vs. Header badge
2. If DebugPanel is correct but Header is wrong, Header may not be using AuthContext
3. Check browser console for errors
