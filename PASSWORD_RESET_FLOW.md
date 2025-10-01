# 🔄 Password Reset Flow - Complete Diagram

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PASSWORD RESET FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   /login     │
│              │
│ [Password    │
│  dimenticata?]
└──────┬───────┘
       │
       │ click
       ▼
┌──────────────────────┐
│  /forgot-password    │
│                      │
│  📧 Email Input      │
│  [Invia Link]        │
└──────┬───────────────┘
       │
       │ submit
       ▼
┌──────────────────────────────┐
│  Supabase Auth API           │
│  resetPasswordForEmail()     │
│                              │
│  redirectTo:                 │
│  /reset-password             │
└──────┬───────────────────────┘
       │
       │ send email
       ▼
┌──────────────────────────────┐
│  User's Email Inbox          │
│                              │
│  📧 Password Reset Email     │
│  Link: /reset-password       │
│         ?token=<recovery>    │
└──────┬───────────────────────┘
       │
       │ click link
       ▼
┌──────────────────────────────┐
│  /reset-password             │
│  ?token=<recovery-token>     │
│                              │
│  Extract token from URL      │
│                              │
│  ┌─────────────────────┐    │
│  │ Nuova Password      │    │
│  │ [••••••••]          │    │
│  │                     │    │
│  │ Conferma Password   │    │
│  │ [••••••••]          │    │
│  │                     │    │
│  │ [Aggiorna Password] │    │
│  └─────────────────────┘    │
└──────┬───────────────────────┘
       │
       │ submit
       ▼
┌──────────────────────────────┐
│  Validation:                 │
│  - Passwords match?          │
│  - Min 8 characters?         │
└──────┬───────────────────────┘
       │
       │ ✅ valid
       ▼
┌──────────────────────────────┐
│  Supabase Auth API           │
│  updateUser({ password })    │
│                              │
│  Uses recovery token from    │
│  current session             │
└──────┬───────────────────────┘
       │
       │ ✅ success
       ▼
┌──────────────────────────────┐
│  Success Screen              │
│                              │
│  ✅ Password aggiornata!     │
│                              │
│  Auto-login (session active) │
└──────┬───────────────────────┘
       │
       │ redirect after 2s
       ▼
┌──────────────────────────────┐
│  /dashboard                  │
│                              │
│  User logged in              │
│  with new password           │
└──────────────────────────────┘
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        ERROR SCENARIOS                          │
└─────────────────────────────────────────────────────────────────┘

1. Invalid/Missing Token
   /reset-password (no token)
   ↓
   Show "Link Non Valido" screen
   ↓
   [Richiedi Nuovo Link] → /forgot-password

2. Password Validation Failed
   Passwords don't match or too short
   ↓
   Show error toast
   ↓
   User corrects and retries

3. Expired/Used Token
   Supabase returns error
   ↓
   Show error toast
   ↓
   User can request new reset link

4. Account Enumeration Prevention
   Email not found in /forgot-password
   ↓
   Show same success message
   ↓
   No email sent (handled by Supabase)
```

---

## Component Architecture

```
src/
├── components/
│   ├── ForgotPassword.tsx    ← Step 1: Request reset
│   │   └── Calls: supabase.auth.resetPasswordForEmail()
│   │       with redirectTo: /reset-password
│   │
│   └── ResetPassword.tsx     ← Step 2: Set new password
│       └── Calls: supabase.auth.updateUser({ password })
│
└── App.tsx
    ├── Route: /forgot-password → <ForgotPassword />
    └── Route: /reset-password  → <ResetPassword />
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE AUTH FLOW                           │
└─────────────────────────────────────────────────────────────────┘

1. resetPasswordForEmail(email, { redirectTo })
   ↓
   Supabase generates recovery token
   ↓
   Sends email with link: redirectTo + ?token=<recovery-token>

2. User clicks link
   ↓
   Browser opens: /reset-password?token=<recovery-token>
   ↓
   Supabase automatically creates a temporary session
   ↓
   Token is available in URL params

3. updateUser({ password })
   ↓
   Supabase validates recovery token from session
   ↓
   Updates password in auth.users table
   ↓
   Converts temporary session to full session
   ↓
   User is now logged in with new password
```

---

## State Management

```
┌─────────────────────────────────────────────────────────────────┐
│              RESETPASSWORD COMPONENT STATE                      │
└─────────────────────────────────────────────────────────────────┘

State Variables:
├── password: string           ← User's new password input
├── confirmPassword: string    ← Password confirmation input
├── loading: boolean          ← Submit button state
├── success: boolean          ← Show success screen
└── token: string | null      ← Extracted from URL params

URL Params (useSearchParams):
└── token or access_token     ← Recovery token from email link

Effects:
└── useEffect → Check token validity on mount
    └── If no token → Show error & redirect to /forgot-password
```

---

## Security Features

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY MEASURES                            │
└─────────────────────────────────────────────────────────────────┘

1. ✅ Token Validation
   └── Handled entirely by Supabase (no client-side token storage)

2. ✅ Account Enumeration Prevention
   └── Same response for existing/non-existing emails

3. ✅ Password Strength
   └── Minimum 8 characters enforced

4. ✅ Password Confirmation
   └── Prevents typos in new password

5. ✅ Token Expiration
   └── Tokens expire after configured time (Supabase setting)

6. ✅ One-Time Use
   └── Token invalidated after successful password update

7. ✅ HTTPS Only
   └── Recovery links only work over HTTPS in production

8. ✅ Session Management
   └── Automatic login after successful reset
   └── Old sessions invalidated on password change
```

---

## API Calls

```typescript
// Step 1: Request Password Reset (ForgotPassword.tsx)
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`
});
// Returns: { error } or { data }

// Step 2: Update Password (ResetPassword.tsx)
await supabase.auth.updateUser({
  password: newPassword
});
// Returns: { error } or { data: { user } }
// Automatically uses recovery token from current session
```

---

## Testing Checklist

```
┌─────────────────────────────────────────────────────────────────┐
│                    TESTING SCENARIOS                            │
└─────────────────────────────────────────────────────────────────┘

Happy Path:
✅ Request reset → Email sent → Click link → Set password → Logged in

Error Cases:
✅ Non-existent email → Same success message
✅ Invalid token → Error screen
✅ Expired token → Error message
✅ Passwords don't match → Validation error
✅ Password too short → Validation error
✅ Token already used → Error message

Edge Cases:
✅ No token in URL → Auto-redirect to /forgot-password
✅ Already logged in → Redirect to /dashboard
✅ Browser back button → Navigation works correctly
✅ Multiple reset requests → Only latest token valid
```

---

## Configuration Required

### Supabase Dashboard Settings

1. **Auth → Email Templates**
   - Customize "Reset Password" email template
   - Ensure redirect URL matches: `{{ .SiteURL }}/reset-password`

2. **Auth → URL Configuration**
   - Site URL: `https://yourdomain.com`
   - Redirect URLs: Add `https://yourdomain.com/reset-password`

3. **Auth → Email Settings**
   - Enable Email confirmations (if not already)
   - Configure SMTP (or use Supabase's email service)

---

## Deployment Checklist

```
Before Deploy:
☐ Update Supabase redirect URLs in dashboard
☐ Test email delivery in staging environment
☐ Verify HTTPS is enabled
☐ Test on multiple browsers
☐ Test on mobile devices
☐ Verify email templates are customized
☐ Check token expiration settings

After Deploy:
☐ Test complete flow in production
☐ Verify emails are received
☐ Check console for errors
☐ Monitor for failed password resets
☐ Review user feedback
```

---

**Last Updated:** 2025-01-21  
**Implementation Status:** ✅ Complete  
**Security Review:** ✅ Passed (CodeQL)  
**Build Status:** ✅ Successful
