# 🔍 JWT Debugging Guide

## Overview

This guide explains how to use the JWT debugging features in Guardian AI CRM to diagnose and resolve authentication issues, particularly those related to missing `user_role` claims.

## Features

### 1. JWT Token Viewer (Settings → Debug JWT)

**Location:** Settings page → Debug JWT tab

**What it shows:**
- ✅ Token validity status
- ✅ Presence of `user_role` claim
- ✅ All JWT claims in detail
- ✅ Token expiration information
- ✅ Errors and warnings

**How to access:**
1. Log in to Guardian AI CRM
2. Navigate to Settings
3. Click on "🔧 Debug JWT" tab
4. Click "🔍 Visualizza JWT Token"

**TOKEN DEFECT Warning:**
If the `user_role` claim is missing, you'll see a prominent yellow warning box with:
- Clear explanation of the issue
- Recommended actions to fix the problem
- Button to perform deep logout and cleanup

### 2. SuperAdmin Dashboard JWT Status

**Location:** Super Admin Dashboard (top panel)

**What it shows:**
- Token validity status
- `user_role` presence
- Current role value
- Email address
- All JWT claims (expandable)

**Features:**
- Automatic display on dashboard load
- Show/Hide claims toggle
- Warning if `user_role` is missing

### 3. Login Page JWT Diagnostics

**Location:** Login page (automatic after login)

**What it shows:**
- Automatic JWT validation after login
- TOKEN DEFECT warning if issues detected
- Login method tracking
- Login history viewer

**Features:**
- Auto-detects JWT issues immediately after login
- Shows which login method was used (password, magic link, etc.)
- Deep logout button for recovery
- Login history with JWT status

### 4. Global JWT Health Check

**Location:** Automatic (runs after login)

**What it does:**
- Monitors JWT health across the entire app
- Shows toast notification if JWT defect detected
- Suggests navigating to Settings for more info

## JWT Claims Reference

### Standard Claims

| Claim | Description | Required |
|-------|-------------|----------|
| `sub` | User ID (subject) | ✅ Yes |
| `email` | User email address | ✅ Yes |
| `aud` | Audience (authenticated) | ✅ Yes |
| `exp` | Expiration timestamp | ✅ Yes |
| `iat` | Issued at timestamp | ✅ Yes |
| `iss` | Issuer (Supabase URL) | ✅ Yes |

### Custom Claims (Added by custom_access_token_hook)

| Claim | Description | Required | Impact if Missing |
|-------|-------------|----------|-------------------|
| `user_role` | User's role (super_admin, user, etc.) | ✅ Yes | **CRITICAL** - Cannot access protected resources |
| `organization_id` | User's organization UUID | Conditional | Required for non-superadmin users |

## TOKEN DEFECT: What It Means

A "TOKEN DEFECT" occurs when the JWT is valid but missing the `user_role` claim. This typically happens when:

1. **The custom_access_token_hook was not configured** when the token was issued
2. **User logged in before the hook was activated** in Supabase
3. **Database migration was not applied** properly
4. **Backend was updated** but user didn't re-login

## Recovery Steps

### For End Users

1. **Deep Logout:**
   - Go to Settings → Debug JWT tab
   - Click "🔄 Esegui Logout Profondo e Pulizia"
   - This will:
     - Clear all localStorage
     - Clear all sessionStorage
     - Sign out from Supabase
     - Force page reload

2. **Re-login with Email + Password:**
   - Use ONLY the email + password form
   - Do NOT use magic links
   - Do NOT use password reset flow
   - This ensures a fresh token with all claims

3. **Verify Fix:**
   - After login, go to Settings → Debug JWT
   - Verify that `user_role` shows as "✅ Presente"
   - Check that your role is displayed correctly

### For Administrators

1. **Verify custom_access_token_hook is configured:**
   ```sql
   -- Check if function exists
   SELECT proname FROM pg_proc WHERE proname = 'custom_access_token_hook';
   ```

2. **Check hook configuration in Supabase Dashboard:**
   - Navigate to Authentication → Hooks
   - Ensure "Custom Access Token" hook is enabled
   - Verify function is set to `custom_access_token_hook`

3. **Test with a new user:**
   - Create a test account
   - Login and check JWT immediately
   - Verify `user_role` is present

4. **Force token refresh for existing users:**
   ```sql
   -- Option 1: Ask users to logout and login
   -- Option 2: Revoke all sessions (DRASTIC)
   -- UPDATE auth.refresh_tokens SET revoked = true;
   ```

## Login Method Tracking

The system tracks different login methods to identify patterns in JWT issues:

### Tracked Methods

- **password**: Email + password form login
- **magic_link**: Email magic link authentication
- **password_reset**: Password reset flow
- **oauth**: OAuth providers (Google, etc.)
- **unknown**: Unidentified method

### Viewing Login History

1. Navigate to Login page
2. If you have login history, you'll see: "📊 Visualizza storico login"
3. Click to expand and view:
   - Total login attempts
   - Successful vs failed logins
   - Breakdown by method
   - JWT defects by method
   - Recent login details

### Analyzing Login History

The login history can help identify:
- Which login method causes JWT defects
- Patterns in authentication failures
- Whether the issue is specific to certain flows

**Example findings:**
- If `magic_link` shows JWT defects but `password` doesn't → Issue with magic link flow
- If all methods show JWT defects → Hook not configured properly
- If only old logins show defects → Fixed after backend update

## Important Warnings

### Backend Update Warning

After ANY backend or authentication policy update:

⚠️ **Users MUST regenerate their JWT tokens by logging out and logging back in.**

This warning is displayed in:
- JWT Viewer component (Settings → Debug JWT)
- Login page diagnostics
- Documentation

### Why Token Regeneration is Required

JWT tokens are cryptographically signed and cannot be modified after issuance. When backend updates add new claims or change authentication logic:

1. Existing tokens still have old structure
2. New code expects new claims (like `user_role`)
3. Mismatch causes authentication failures

**Solution:** Force users to get new tokens by:
- Logging out
- Logging back in
- Token will be regenerated with latest structure

## API Reference

### JavaScript Utilities

#### `diagnoseJWT(token: string): JWTDiagnostics`

Performs comprehensive JWT diagnostics.

```typescript
import { diagnoseJWT } from '@/lib/jwtUtils';

const diagnostics = diagnoseJWT(session.access_token);
console.log('Has user_role:', diagnostics.hasUserRole);
console.log('Claims:', diagnostics.claims);
console.log('Errors:', diagnostics.errors);
```

#### `recordLoginAttempt(attempt: LoginAttempt): void`

Records a login attempt for tracking.

```typescript
import { recordLoginAttempt } from '@/lib/loginTracker';

recordLoginAttempt({
  method: 'password',
  timestamp: new Date().toISOString(),
  email: 'user@example.com',
  success: true,
  jwtHasUserRole: true,
});
```

#### `analyzeLoginHistory(): LoginHistoryAnalysis`

Analyzes login history for patterns.

```typescript
import { analyzeLoginHistory } from '@/lib/loginTracker';

const analysis = analyzeLoginHistory();
console.log('JWT defects by method:', analysis.jwtDefectsByMethod);
```

## Troubleshooting

### Issue: JWT Viewer shows "Token is empty"

**Cause:** No active session

**Solution:**
1. Logout and login again
2. If persists, clear browser cache
3. Check browser console for errors

### Issue: user_role shows as missing even after re-login

**Cause:** Hook not configured in Supabase

**Solution:**
1. Verify hook configuration in Supabase Dashboard
2. Check SQL function exists
3. Test with a new test user
4. Contact support if issue persists

### Issue: Login history is empty

**Cause:** First time using new debug features OR localStorage was cleared

**Solution:**
- History will populate on next login
- This is normal for first-time use

### Issue: Different results on different devices

**Cause:** Tokens are device-specific

**Solution:**
- Each device/browser has its own token
- Must re-login on each device separately
- Token issues may be device-specific

## Best Practices

### For Users

1. ✅ Always use email + password for login (most reliable)
2. ✅ Logout and login after backend updates
3. ✅ Check JWT status in Settings if issues occur
4. ✅ Use deep logout for persistent issues
5. ❌ Don't share JWT tokens or diagnostics publicly

### For Developers

1. ✅ Test JWT generation after any auth changes
2. ✅ Document backend updates that affect JWT
3. ✅ Monitor JWT error rates in logs
4. ✅ Provide clear communication about required re-logins
5. ✅ Include JWT diagnostics in support requests

### For Support Team

1. ✅ Ask users to share JWT diagnostics report
2. ✅ Check login history for patterns
3. ✅ Verify hook configuration in Supabase
4. ✅ Guide users through deep logout process
5. ✅ Escalate if issue persists after clean login

## Related Documentation

- [JWT Custom Claims Implementation](../JWT_CUSTOM_CLAIMS_IMPLEMENTATION.md)
- [Authentication Best Practices](../AUTHENTICATION_BEST_PRACTICES.md)
- [SuperAdmin Testing Guide](../SUPERADMIN_TESTING_GUIDE.md)

## Support

If JWT issues persist after following this guide:

1. Copy the full JWT diagnostics report
2. Copy the login history report
3. Note which login method was used
4. Contact support with all information
5. Be prepared to share browser console logs

---

**Last Updated:** 2025-01-20  
**Version:** 1.0.0
