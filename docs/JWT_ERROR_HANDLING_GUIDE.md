# 🔐 JWT Custom Claims Error Handling Guide

## Overview

This document describes the UX-friendly error handling system implemented for JWT custom claim errors during the migration to custom JWT claims in the Guardian AI CRM application.

## Problem Statement

During the migration to JWT custom claims (where `user_role` is embedded in the JWT instead of queried from the database), users with old JWT tokens lacking the `user_role` claim would encounter generic 403 errors, leading to:

- Poor user experience with cryptic error messages
- No clear path to resolution
- Potential endless loops of retries
- Support tickets from confused users

## Solution Architecture

### 1. Error Detection

The system detects JWT custom claim errors by checking:

```typescript
const isJwtClaimError = (response.status === 403 || response.status === 401) && 
                       /user_role not found|JWT custom claim|custom claim.*not found/i.test(errorMessage);
```

**Triggers:**
- HTTP status codes: 403 or 401
- Error message patterns:
  - "user_role not found"
  - "JWT custom claim"
  - "custom claim.*not found"

### 2. User-Facing Messages

When a JWT custom claim error is detected:

**Main Message:**
> "La sessione è scaduta o aggiornata. Per favore, effettua nuovamente il login."

**Additional Context:**
> "⚠️ La tua sessione è scaduta o è stata aggiornata. È necessario effettuare nuovamente il login."

### 3. UX Flow

```
┌─────────────────────────────────┐
│ User makes API request          │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ Backend returns 403 with        │
│ "user_role not found"           │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ Frontend detects JWT error      │
│ - Shows clear message           │
│ - Displays "Vai al Login" button│
│ - Clears localStorage           │
│ - Toast persists (no auto-hide) │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ User clicks "Vai al Login"      │
│ - Signs out from Supabase       │
│ - Redirects to /login           │
└─────────────────────────────────┘
```

### 4. Implementation Details

#### Enhanced `showErrorToast` Function

```typescript
function showErrorToast(message: string, diagnosticReport: string, options?: { 
    requiresLogout?: boolean;
    isJwtError?: boolean;
})
```

**Features:**
- `requiresLogout`: Shows "Vai al Login" button that performs logout and redirect
- `isJwtError`: Displays JWT-specific warning message
- Toast duration is `Infinity` when logout is required (won't auto-dismiss)
- Includes diagnostic copy button for support purposes

#### JWT Error Handling in `invokeSupabaseFunction`

```typescript
if (isJwtClaimError) {
    console.error(`[API Helper] JWT Custom Claim Error detected`);
    const userMessage = 'La sessione è scaduta o aggiornata...';
    
    // Show error with logout button
    showErrorToast(userMessage, diagnosticReport, { 
        requiresLogout: true,
        isJwtError: true 
    });
    
    // Automatically clear auth state
    localStorage.removeItem('organization_id');
    
    throw { 
        error: userMessage, 
        isJwtError: true,
        requiresRelogin: true,
        diagnostics: errorJson 
    };
}
```

### 5. Error Classification

The system now distinguishes between three types of errors:

#### Type 1: JWT Custom Claim Errors
- **Status:** 403/401
- **Pattern:** "user_role not found"
- **Action:** Show logout button, clear localStorage, persist toast
- **User Action Required:** Re-login

#### Type 2: Other Auth Errors
- **Status:** 401/403 or token-related errors
- **Action:** Attempt session refresh, retry once
- **Fallback:** Show logout button if refresh fails

#### Type 3: Network Errors
- **Pattern:** "Failed to fetch", TypeError
- **Action:** Show network error message, allow retry
- **No automatic logout**

## Configuration

### Backend Error Messages

The backend (in `supabase/functions/_shared/superadmin.ts`) returns:

```typescript
return { 
  isValid: false, 
  error: 'Permission check failed. JWT custom claim user_role not found. Please re-login or contact support.' 
};
```

This message is detected by the frontend's regex pattern.

### Frontend Detection Pattern

```typescript
/user_role not found|JWT custom claim|custom claim.*not found/i
```

**Important:** If you modify backend error messages, update this pattern accordingly.

## Testing Scenarios

### Manual Testing

1. **Simulate JWT Error:**
   - Use an old JWT token without `user_role` claim
   - Make any API request that validates super_admin role
   - Expected: Toast with "Vai al Login" button appears

2. **Test Session Refresh:**
   - Use an expired but valid JWT structure
   - Expected: System attempts refresh, then shows logout if refresh fails

3. **Test Network Error:**
   - Disconnect network
   - Make API request
   - Expected: "Errore di rete" message without logout button

### Expected Outcomes

✅ **Correct JWT Error Detection:**
- Toast persists (doesn't auto-dismiss)
- "Vai al Login" button is prominently displayed
- Clicking button performs logout and redirects to /login
- localStorage is cleared automatically

✅ **No False Positives:**
- Regular auth errors attempt refresh first
- Network errors don't trigger logout flow
- 200 OK errors are handled separately

## Migration Support

### User Communication Template

When rolling out JWT custom claims migration:

```markdown
**Importante:** Dopo l'aggiornamento della piattaforma, potrebbe essere 
necessario effettuare nuovamente il login per garantire il corretto 
funzionamento del sistema.

Se vedi un messaggio che indica "La sessione è scaduta o aggiornata", 
clicca sul pulsante "Vai al Login" e accedi nuovamente.

Questo è un aggiornamento una tantum per migliorare la sicurezza e le 
prestazioni della piattaforma.
```

### Banner Implementation (Optional)

Consider adding a temporary banner after deployment:

```typescript
// In App.tsx or MainLayout.tsx
const [showMigrationBanner, setShowMigrationBanner] = useState(
  !localStorage.getItem('jwt_migration_acknowledged')
);

if (showMigrationBanner) {
  return (
    <div className="bg-blue-50 border-b border-blue-200 p-4">
      <p className="text-sm text-blue-800">
        ℹ️ Abbiamo aggiornato il sistema di autenticazione. 
        Se riscontri problemi, effettua il logout e il login nuovamente.
      </p>
      <button 
        onClick={() => {
          localStorage.setItem('jwt_migration_acknowledged', 'true');
          setShowMigrationBanner(false);
        }}
        className="text-blue-600 underline text-sm mt-2"
      >
        Ho capito
      </button>
    </div>
  );
}
```

## Troubleshooting

### Issue: Toast Doesn't Show Logout Button

**Cause:** Error not matching detection pattern

**Solution:**
1. Check browser console for error object
2. Verify backend error message matches pattern
3. Update regex pattern if needed

### Issue: Endless Retry Loop

**Cause:** Error being re-thrown without proper flags

**Solution:**
- Ensure error object has `isJwtError` or `requiresRelogin` flag
- Check that retry logic respects these flags

### Issue: User Not Redirected to Login

**Cause:** Browser blocking redirect or logout failing

**Solution:**
```typescript
// Enhanced logout with error handling
onClick: async () => {
    try {
        toast.dismiss(t.id);
        await supabase.auth.signOut();
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        window.location.href = '/login';
    }
}
```

## Performance Considerations

- **No Performance Impact:** Error detection happens only on error responses
- **Single Regex Check:** Minimal CPU overhead
- **localStorage Clear:** Instantaneous operation
- **Toast Persistence:** Only for critical errors requiring user action

## Security Considerations

✅ **Automatic Logout:** Prevents use of invalid/outdated tokens
✅ **Clear State:** Removes all client-side auth artifacts
✅ **No Retry Loop:** Prevents repeated invalid requests to backend
✅ **User Awareness:** Clear messaging prevents confusion

## Code References

### Primary Files

1. **`src/lib/api.ts`**
   - Lines 55-100: `showErrorToast` with logout support
   - Lines 175-204: JWT custom claim detection
   - Lines 206-222: Improved session refresh with error handling
   - Lines 257-285: Enhanced network error parsing

### Related Files

2. **`supabase/functions/_shared/superadmin.ts`**
   - Lines 52-62: Backend error message generation

3. **`JWT_CUSTOM_CLAIMS_IMPLEMENTATION.md`**
   - Architecture overview
   - Migration guide

## Future Enhancements

### Potential Improvements

1. **Metrics & Monitoring:**
   - Track JWT error frequency
   - Alert on spike in JWT errors
   - Dashboard for migration progress

2. **Progressive Re-authentication:**
   - Silent token refresh in background
   - Proactive detection before API calls fail

3. **User Session Management:**
   - Show list of active sessions
   - Allow remote logout from other devices

4. **Enhanced Diagnostics:**
   - Capture JWT claims in error report
   - Include token expiry information
   - Detect specific claim mismatches

## Changelog

### v1.0.0 (2025-01-XX)
- ✅ Initial implementation of JWT custom claim error detection
- ✅ UX-friendly error messages with logout flow
- ✅ Automatic localStorage cleanup
- ✅ Improved network error classification
- ✅ Session refresh error handling

---

**Last Updated:** 2025-01-XX  
**Maintainer:** CRM-AI Dev Team  
**Related Issues:** Migration to Custom JWT Claims
