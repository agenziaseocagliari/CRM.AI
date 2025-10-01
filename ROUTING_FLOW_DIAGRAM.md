# 🔀 Role-Based Routing Flow Diagram

## Login Flow

```
┌─────────────────────┐
│   User Logs In      │
│   (via /login)      │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────────────┐
│  JWT Token Received          │
│  (Contains user_role claim)  │
└──────────┬───────────────────┘
           │
           ▼
     ┌─────┴─────┐
     │           │
     ▼           ▼
┌─────────┐  ┌──────────────┐
│ user_   │  │ user_role =  │
│ role =  │  │ 'super_admin'│
│ 'user'  │  │              │
└────┬────┘  └──────┬───────┘
     │              │
     ▼              ▼
┌─────────────┐  ┌──────────────────────┐
│ Redirect to │  │ Redirect to          │
│ /dashboard  │  │ /super-admin/        │
│             │  │ dashboard            │
└─────────────┘  └──────────────────────┘
```

## Route Guard Logic

### For Super Admin Users (`user_role === 'super_admin'`)

```
┌───────────────────────────────┐
│  Super Admin navigates to:    │
└───────────┬───────────────────┘
            │
      ┌─────┴─────┐
      │           │
      ▼           ▼
┌──────────┐  ┌────────────────────┐
│ /super-  │  │ Standard CRM Route │
│ admin/*  │  │ /dashboard, etc    │
└────┬─────┘  └─────────┬──────────┘
     │                  │
     ▼                  ▼
┌─────────────┐  ┌─────────────────────────┐
│ ✅ ALLOWED  │  │ ❌ BLOCKED              │
│             │  │ - Show error toast      │
│ Access      │  │ - Redirect to           │
│ granted     │  │   /super-admin/dashboard│
└─────────────┘  └─────────────────────────┘
```

### For Regular Users (`user_role === 'user'`)

```
┌───────────────────────────────┐
│  Regular User navigates to:   │
└───────────┬───────────────────┘
            │
      ┌─────┴─────┐
      │           │
      ▼           ▼
┌──────────┐  ┌────────────────┐
│ Standard │  │ /super-admin/* │
│ CRM      │  │                │
│ Routes   │  │                │
└────┬─────┘  └─────────┬──────┘
     │                  │
     ▼                  ▼
┌─────────────┐  ┌──────────────────────┐
│ ✅ ALLOWED  │  │ ❌ BLOCKED           │
│             │  │ - Show error toast   │
│ Access      │  │ - Redirect to        │
│ granted     │  │   /dashboard         │
└─────────────┘  └──────────────────────┘
```

## Route Protection Summary

### Protected Routes by Role

| Route                  | Super Admin | Regular User |
|------------------------|-------------|--------------|
| `/dashboard`           | ❌ Blocked   | ✅ Allowed    |
| `/opportunities`       | ❌ Blocked   | ✅ Allowed    |
| `/contacts`            | ❌ Blocked   | ✅ Allowed    |
| `/calendar`            | ❌ Blocked   | ✅ Allowed    |
| `/meetings`            | ❌ Blocked   | ✅ Allowed    |
| `/forms`               | ❌ Blocked   | ✅ Allowed    |
| `/automations`         | ❌ Blocked   | ✅ Allowed    |
| `/settings`            | ❌ Blocked   | ✅ Allowed    |
| `/super-admin/*`       | ✅ Allowed   | ❌ Blocked    |

### Redirect Behavior

| Scenario                        | Action                           |
|---------------------------------|----------------------------------|
| Super Admin logs in             | → `/super-admin/dashboard`       |
| Regular User logs in            | → `/dashboard`                   |
| Super Admin visits `/dashboard` | → `/super-admin/dashboard` + 🔔  |
| User visits `/super-admin/*`    | → `/dashboard` + 🔔              |
| Super Admin visits `/login`     | → `/super-admin/dashboard`       |
| User visits `/login`            | → `/dashboard`                   |
| Super Admin visits `/unknown`   | → `/super-admin/dashboard`       |
| User visits `/unknown`          | → `/dashboard`                   |

🔔 = Toast notification displayed

## Implementation Details

### Key Components

1. **Post-Login Routing** (`App.tsx` lines 72-92)
   - Triggers when user is on `/login` with active session
   - Checks `userRole` from JWT claims
   - Navigates to role-appropriate dashboard

2. **Route Guard** (`App.tsx` lines 94-112)
   - Monitors all route changes via `useEffect`
   - Detects cross-role access attempts
   - Shows toast and redirects immediately

3. **Route Definitions** (`App.tsx` lines 151-210)
   - All protected routes check user role
   - Dynamic navigation based on `userRole`
   - Wildcard route handles 404s with role-awareness

### State Dependencies

```
AuthContext
    ├── session (Supabase Session)
    ├── userRole (from JWT claim)
    ├── loading (auth loading state)
    └── isSuperAdmin (boolean flag)
            │
            ▼
        App.tsx
            ├── useNavigate (React Router)
            ├── useLocation (React Router)
            └── Route Guards
                    │
                    ▼
            Protected Components
```

## Testing Matrix

| Test Case | User Role | Action | Expected Result |
|-----------|-----------|--------|-----------------|
| TC-1      | super_admin | Login | Land on `/super-admin/dashboard` |
| TC-2      | user | Login | Land on `/dashboard` |
| TC-3      | super_admin | Navigate to `/dashboard` | Redirect to `/super-admin/dashboard` + toast |
| TC-4      | user | Navigate to `/super-admin/dashboard` | Redirect to `/dashboard` + toast |
| TC-5      | super_admin | Type `/opportunities` in URL | Redirect to `/super-admin/dashboard` + toast |
| TC-6      | user | Type `/super-admin/customers` in URL | Redirect to `/dashboard` + toast |
| TC-7      | super_admin | Visit `/login` when logged in | Redirect to `/super-admin/dashboard` |
| TC-8      | user | Visit `/login` when logged in | Redirect to `/dashboard` |
| TC-9      | super_admin | Visit `/nonexistent` | Redirect to `/super-admin/dashboard` |
| TC-10     | user | Visit `/nonexistent` | Redirect to `/dashboard` |

## Browser Dev Tools Verification

### Console Logging Examples

**Super Admin Login:**
```
🔐 [App] Super Admin logged in - redirecting to /super-admin/dashboard
```

**Regular User Login:**
```
👤 [App] Standard user logged in - redirecting to /dashboard
```

**Cross-Role Access Attempt:**
```
⚠️ [App] Super Admin attempting to access standard CRM route - redirecting to /super-admin/dashboard
```
or
```
⚠️ [App] Non-Super Admin attempting to access Super Admin route - redirecting to /dashboard
```

### Toast Messages

**Super Admin trying to access standard CRM:**
```
🚫 Come Super Admin, devi usare la dashboard dedicata.
```

**Regular user trying to access Super Admin:**
```
🚫 Non hai i permessi per accedere a questa sezione.
```

## Edge Cases

### Handled Edge Cases

✅ **Missing user_role claim**
- Falls back to regular user behavior
- Shows JWT defect warning
- Redirects to `/dashboard`

✅ **Auth loading state**
- Route guard waits for `loading === false`
- Prevents premature redirects
- Shows loading spinner

✅ **Token refresh**
- JWT re-parsed on `TOKEN_REFRESHED` event
- Role changes detected immediately
- Routing adjusts automatically

✅ **Multiple rapid navigations**
- `navigate(..., { replace: true })` prevents history issues
- Guards apply on every route change
- No race conditions

✅ **Direct URL manipulation**
- Guards apply even on direct URL entry
- Browser back/forward buttons handled
- Bookmarks redirected appropriately

### Not Handled (By Design)

⚠️ **JWT without user_role**
- System falls back to regular user
- Existing JWT defect warning shown
- User must re-login to fix

⚠️ **Malformed JWT**
- Handled by AuthContext
- User logged out automatically
- Redirected to login

## Performance Considerations

- **Minimal Re-renders**: Route guards use `useEffect` with proper dependencies
- **No Blocking**: Redirects use `replace: true` to avoid history pollution
- **Fast Checks**: Simple string comparisons and boolean flags
- **Cached JWT**: JWT parsed once in AuthContext, reused in App

## Security Notes

🔒 **Client-Side Only**: This is UI routing protection
🔒 **Backend Validation**: API still validates using JWT claims
🔒 **SuperAdminLayout**: Additional server-side check remains in place
🔒 **Defense in Depth**: Multiple layers of protection

## Compatibility

✅ Works with existing JWT structure
✅ No database schema changes
✅ No API changes required
✅ Backward compatible with existing users
✅ No breaking changes to components
