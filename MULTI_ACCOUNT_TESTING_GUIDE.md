# 🧪 Multi-Account Support - Testing Guide

This document provides step-by-step instructions for testing the multi-account support implementation.

## 📋 Pre-requisites

Before testing, ensure you have:
- [ ] Two test accounts in the database:
  - `webproseoid@gmail.com` with role `user`
  - `agenziaseocagliari@gmail.com` with role `super_admin`
- [ ] Clean browser state (no cached sessions)
- [ ] Developer tools open for monitoring

## 🎯 Test Scenarios

### Test 1: Account Selection Screen

**Steps:**
1. Navigate to `/login`
2. Observe the account selection screen

**Expected Results:**
- ✅ Two account cards visible:
  - 👤 "Utente Standard" - webproseoid@gmail.com
  - 🔐 "Super Admin" - agenziaseocagliari@gmail.com
- ✅ Info banner explaining role switching policy
- ✅ "Non hai un account? Registrati" link visible
- ✅ Clean, professional UI with hover effects

**Screenshot Reference:** Login Account Selection

---

### Test 2: Login as Standard User

**Steps:**
1. Click on "Utente Standard" card
2. Enter password
3. Click "Accedi"
4. Wait for redirect to dashboard

**Expected Results:**
- ✅ Email field pre-filled with `webproseoid@gmail.com`
- ✅ Email field is disabled (grayed out)
- ✅ "Cambia" button visible to return to account selection
- ✅ After successful login, redirect to `/dashboard`
- ✅ Header shows "👤 Utente Standard" badge in green
- ✅ Sidebar does NOT show "Super Admin" link
- ✅ JWT token contains `user_role: 'user'`

**Verification Commands:**
```javascript
// In browser console
const session = await supabase.auth.getSession();
const jwt = session.data.session.access_token;
const payload = JSON.parse(atob(jwt.split('.')[1]));
console.log('Role:', payload.user_role); // Should be 'user'
```

---

### Test 3: Attempt Super Admin Access as Standard User

**Steps:**
1. While logged in as Standard User
2. Manually navigate to `/super-admin` in URL bar
3. Observe the response

**Expected Results:**
- ✅ Toast notification appears with:
  - Title: "🚫 Accesso Negato"
  - Current role shown: "user"
  - Instructions for proper access
- ✅ Access denied screen displayed with:
  - Clear explanation
  - Step-by-step instructions
  - "Torna alla Dashboard" button
- ✅ After 2 seconds, automatically redirect to `/dashboard`
- ✅ NO "Failed to fetch" errors in console
- ✅ NO CORS errors

**Screenshot Reference:** Access Denied Screen

---

### Test 4: Logout and Session Clearing

**Steps:**
1. While logged in as any user
2. Click logout button in header
3. Observe localStorage and sessionStorage

**Expected Results:**
- ✅ Redirect to home page `/`
- ✅ `localStorage` is completely cleared
- ✅ `sessionStorage` is completely cleared
- ✅ Next visit to `/login` shows account selection (no auto-login)
- ✅ No cached credentials

**Verification Commands:**
```javascript
// Before logout
console.log('LocalStorage keys:', Object.keys(localStorage));
console.log('SessionStorage keys:', Object.keys(sessionStorage));

// After logout - both should be empty
```

---

### Test 5: Login as Super Admin

**Steps:**
1. Navigate to `/login` (after logout)
2. Verify account selection is shown
3. Click on "Super Admin" card
4. Enter password
5. Click "Accedi"

**Expected Results:**
- ✅ Email field pre-filled with `agenziaseocagliari@gmail.com`
- ✅ After successful login, redirect to `/dashboard`
- ✅ Header shows "🔐 Super Admin" badge in purple
- ✅ Sidebar DOES show "Super Admin" link
- ✅ JWT token contains `user_role: 'super_admin'`

---

### Test 6: Super Admin Access

**Steps:**
1. While logged in as Super Admin
2. Click "Super Admin" link in sidebar
3. Navigate to `/super-admin/dashboard`

**Expected Results:**
- ✅ Super Admin dashboard loads successfully
- ✅ No authorization errors
- ✅ Full access to all super admin features
- ✅ Header still shows "🔐 Super Admin" badge

---

### Test 7: Role Display in Header

**Steps:**
1. Login as Standard User
2. Observe header
3. Logout and login as Super Admin
4. Observe header

**Expected Results:**
- ✅ Standard User: Green badge "👤 Utente Standard"
- ✅ Super Admin: Purple badge "🔐 Super Admin"
- ✅ Badge updates immediately after login
- ✅ Badge persists across page navigation
- ✅ Hover over user icon shows email

**Screenshot Reference:** Header Role Display

---

### Test 8: JWT Viewer Integration

**Steps:**
1. Login as any user
2. Navigate to Settings
3. Open JWT Viewer (if available)

**Expected Results:**
- ✅ Current role prominently displayed at top
- ✅ Color-coded role badge
- ✅ Email address shown
- ✅ Instructions for role switching visible
- ✅ All JWT claims properly displayed

---

### Test 9: Role Switching Flow

**Steps:**
1. Login as Standard User
2. Complete work in dashboard
3. Click logout
4. Select Super Admin account
5. Login with Super Admin credentials
6. Verify role switch

**Expected Results:**
- ✅ Clean logout (no residual data)
- ✅ Account selection screen appears
- ✅ Can select different account
- ✅ New login creates new session with correct role
- ✅ UI updates to reflect new role immediately
- ✅ Access granted to appropriate features

---

### Test 10: Back to Account Selection

**Steps:**
1. On login page, select an account
2. Password form appears
3. Click "Cambia" button

**Expected Results:**
- ✅ Returns to account selection screen
- ✅ Email and password fields cleared
- ✅ Can select different account
- ✅ No errors

---

### Test 11: Registration Flow

**Steps:**
1. On account selection screen
2. Click "Non hai un account? Registrati"
3. Enter new email and password
4. Submit registration

**Expected Results:**
- ✅ Switches to registration form
- ✅ Can enter custom email (not limited to predefined accounts)
- ✅ Registration success message appears
- ✅ Confirmation email sent
- ✅ Returns to login mode after registration

---

### Test 12: Auth State Listener

**Steps:**
1. Login as Standard User
2. Open browser DevTools → Console
3. Logout
4. Observe sidebar
5. Login as Super Admin
6. Observe sidebar

**Expected Results:**
- ✅ "Super Admin" link disappears immediately on logout
- ✅ "Super Admin" link appears immediately on login (if super_admin)
- ✅ No UI flicker or delay
- ✅ No console errors

---

### Test 13: Direct URL Navigation

**Steps:**
1. Logout completely
2. Try navigating to protected routes:
   - `/dashboard`
   - `/super-admin`
   - `/contacts`

**Expected Results:**
- ✅ All protected routes redirect to `/login`
- ✅ Login page shows account selection
- ✅ After login, user redirects to originally requested page (or dashboard)

---

### Test 14: Tooltip and Instructions

**Steps:**
1. Login as any user
2. Hover over logout button
3. Check info banners on login page

**Expected Results:**
- ✅ Logout button tooltip: "Logout - Per cambiare ruolo effettua logout e login con account diverso"
- ✅ Login page info banner clearly explains role switching policy
- ✅ Access denied screen provides step-by-step instructions

---

### Test 15: Multiple Browser Tabs

**Steps:**
1. Open CRM in Tab 1, login as Standard User
2. Open CRM in Tab 2 (same browser)
3. In Tab 2, logout
4. Observe Tab 1

**Expected Results:**
- ✅ Tab 1 detects logout and updates UI
- ✅ Both tabs redirect to login/home
- ✅ Auth state synchronized across tabs

---

### Test 16: Token Expiration

**Steps:**
1. Login as any user
2. Wait for token to expire (or manually expire in DevTools)
3. Try to navigate to protected route

**Expected Results:**
- ✅ Automatic redirect to login
- ✅ Account selection screen shown (no auto-login with expired token)
- ✅ Clear error message if applicable

---

## 🔍 Debugging Tips

### Check JWT Claims
```javascript
// In browser console
const session = await supabase.auth.getSession();
const token = session.data.session.access_token;
const payload = JSON.parse(atob(token.split('.')[1]));
console.table(payload);
```

### Check Storage
```javascript
// Check what's stored
console.log('LocalStorage:', Object.entries(localStorage));
console.log('SessionStorage:', Object.entries(sessionStorage));
```

### Monitor Auth Events
```javascript
// Add to console to watch auth events
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth Event:', event);
  console.log('Session:', session);
  if (session?.access_token) {
    const payload = JSON.parse(atob(session.access_token.split('.')[1]));
    console.log('Role:', payload.user_role);
  }
});
```

---

## ✅ Success Criteria

All tests should pass with:
- [ ] No console errors
- [ ] No CORS errors
- [ ] No "Failed to fetch" errors
- [ ] Clear, user-friendly messages
- [ ] Immediate UI updates
- [ ] Proper role-based access control
- [ ] Complete session clearing on logout
- [ ] No auto-login after logout

---

## 🐛 Known Issues / Limitations

### By Design
- **Token refresh delay**: Role changes in database don't reflect until logout/login (expected behavior)
- **Account selection**: Limited to predefined accounts for login (registration allows custom emails)
- **Session synchronization**: Cross-tab logout requires page refresh (browser limitation)

### Future Enhancements
- [ ] Remember last selected account (opt-in feature)
- [ ] Add "Forgot Password" flow for predefined accounts
- [ ] Multi-factor authentication
- [ ] Session timeout warning

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify JWT claims using debugging commands above
3. Clear browser cache and retry
4. Check network tab for failed requests
5. Review `TESTING_CHECKLIST_SUPERADMIN_FIX.md` for additional scenarios

---

**Last Updated:** 2025-01-21  
**Version:** 1.0.0  
**Status:** ✅ Ready for Testing
