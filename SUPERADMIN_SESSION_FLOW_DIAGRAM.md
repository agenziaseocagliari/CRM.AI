# 🔐 Superadmin Session Security - Flow Diagram

**Date**: 2025-01-23

---

## 📊 Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER AUTHENTICATION                          │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  User enters credentials  │
                    │  at /login                │
                    └───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  Supabase Auth validates  │
                    │  and generates JWT        │
                    └───────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
        ┌─────────────────────┐       ┌─────────────────────┐
        │  JWT with user_role │       │  JWT WITHOUT        │
        │  claim EXISTS ✅     │       │  user_role claim ❌ │
        └─────────────────────┘       └─────────────────────┘
                    │                               │
                    ▼                               ▼
        ┌─────────────────────┐       ┌─────────────────────┐
        │  AuthContext parses │       │  AuthContext detects│
        │  JWT claims         │       │  MISSING user_role  │
        └─────────────────────┘       └─────────────────────┘
                    │                               │
        ┌───────────┴──────────┐                   ▼
        ▼                      ▼       ┌─────────────────────┐
┌─────────────┐    ┌──────────────┐   │  FORCED LOGOUT:     │
│ user_role = │    │ user_role =  │   │  1. localStorage    │
│ super_admin │    │ admin / user │   │     .clear()        │
└─────────────┘    └──────────────┘   │  2. sessionStorage  │
        │                      │       │     .clear()        │
        ▼                      │       │  3. signOut()       │
┌─────────────┐               │       └─────────────────────┘
│ Set orgId = │               │                   │
│ "ALL"       │               │                   ▼
└─────────────┘               │       ┌─────────────────────┐
        │                      │       │  Redirect to:       │
        ▼                      │       │  /login?session_    │
┌─────────────┐               │       │  expired=true       │
│ Redirect to │               │       └─────────────────────┘
│ /super-     │               │                   │
│ admin/      │               │                   ▼
│ dashboard   │               │       ┌─────────────────────┐
└─────────────┘               │       │  Show RED BANNER:   │
        │                      │       │  "Sessione Scaduta" │
        ▼                      │       └─────────────────────┘
┌─────────────┐               │
│ Super Admin │               ▼
│ Dashboard   │    ┌──────────────┐
│             │    │ Standard CRM │
│ - Customers │    │ Dashboard    │
│ - Payments  │    │              │
│ - Workflows │    │ - Opps       │
│ - Audit     │    │ - Contacts   │
└─────────────┘    │ - Forms      │
                   └──────────────┘
```

---

## 🔄 Session Validation Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      CONTINUOUS SESSION MONITORING                    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
        ┌───────────────────┐         ┌───────────────────┐
        │  AuthContext      │         │  App.tsx          │
        │  monitors session │         │  validates claims │
        └───────────────────┘         └───────────────────┘
                    │                               │
                    ▼                               ▼
        ┌───────────────────┐         ┌───────────────────┐
        │  On EVERY auth    │         │  useEffect checks │
        │  state change:    │         │  session + role   │
        │                   │         │  periodically     │
        │  - SIGNED_IN      │         └───────────────────┘
        │  - TOKEN_REFRESHED│                     │
        │  - SIGNED_OUT     │                     │
        └───────────────────┘                     │
                    │                               │
                    ▼                               ▼
        ┌───────────────────┐         ┌───────────────────┐
        │  parseJWTFrom     │         │  If session &&    │
        │  Session() checks │         │  !userRole:       │
        │  user_role claim  │         │                   │
        └───────────────────┘         │  Show ERROR TOAST │
                    │                 │  with LOGOUT btn  │
        ┌───────────┴──────────┐      └───────────────────┘
        ▼                      ▼                  │
┌─────────────┐    ┌──────────────┐             ▼
│ Claim OK ✅ │    │ Claim MISSING│  ┌───────────────────┐
│             │    │ ❌           │  │  beforeunload:    │
│ Continue    │    └──────────────┘  │  Warn user NOT to │
└─────────────┘            │         │  reload page      │
                           ▼         └───────────────────┘
               ┌──────────────┐
               │ FORCED LOGOUT│
               │ (immediate)  │
               └──────────────┘
                           │
                           ▼
               ┌──────────────┐
               │ Clear all    │
               │ storage &    │
               │ redirect     │
               └──────────────┘
```

---

## 🛡️ Security Layers

```
┌──────────────────────────────────────────────────────────────────┐
│                    LAYER 1: Backend (Supabase)                   │
│  - custom_access_token_hook adds user_role to JWT               │
│  - validateSuperAdmin() checks JWT claim                         │
│  - Returns 401/403 if claim missing                              │
└──────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                    LAYER 2: AuthContext.tsx                       │
│  - Parses JWT on every auth event                                │
│  - Forces logout if user_role missing                            │
│  - Sets organization_id = "ALL" for superadmin                   │
└──────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                    LAYER 3: App.tsx                               │
│  - Validates session + userRole combination                      │
│  - Shows persistent error toast if invalid                       │
│  - Prevents page reloads with invalid session                    │
└──────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                    LAYER 4: Route Guards                          │
│  - Prevents superadmin accessing CRM routes                      │
│  - Prevents standard users accessing superadmin routes           │
│  - Redirects with error message                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Token Refresh Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    TOKEN ABOUT TO EXPIRE                         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                ┌───────────────────────────┐
                │  Supabase auto-refreshes  │
                │  token (background)       │
                └───────────────────────────┘
                                │
                                ▼
                ┌───────────────────────────┐
                │  AuthContext receives     │
                │  TOKEN_REFRESHED event    │
                └───────────────────────────┘
                                │
                                ▼
                ┌───────────────────────────┐
                │  parseJWTFromSession()    │
                │  re-validates user_role   │
                └───────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                ▼                               ▼
    ┌─────────────────────┐       ┌─────────────────────┐
    │  user_role still    │       │  user_role NOW      │
    │  present ✅         │       │  missing ❌         │
    │                     │       │                     │
    │  Continue normally  │       │  FORCED LOGOUT      │
    └─────────────────────┘       └─────────────────────┘
```

---

## 🚪 Logout Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER CLICKS LOGOUT                       │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                ┌───────────────────────────┐
                │  Clear ALL storage:       │
                │  - localStorage.clear()   │
                │  - sessionStorage.clear() │
                └───────────────────────────┘
                                │
                                ▼
                ┌───────────────────────────┐
                │  supabase.auth.signOut()  │
                └───────────────────────────┘
                                │
                                ▼
                ┌───────────────────────────┐
                │  AuthContext receives     │
                │  SIGNED_OUT event         │
                └───────────────────────────┘
                                │
                                ▼
                ┌───────────────────────────┐
                │  setJwtClaims(null)       │
                │  setSession(null)         │
                └───────────────────────────┘
                                │
                                ▼
                ┌───────────────────────────┐
                │  Redirect to /login       │
                └───────────────────────────┘
```

---

## 🎯 Role Separation Enforcement

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER ATTEMPTS ROUTE ACCESS                    │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                ▼                               ▼
    ┌─────────────────────┐       ┌─────────────────────┐
    │  Superadmin tries   │       │  Standard user tries│
    │  to access /        │       │  to access /super-  │
    │  dashboard          │       │  admin/*            │
    └─────────────────────┘       └─────────────────────┘
                │                               │
                ▼                               ▼
    ┌─────────────────────┐       ┌─────────────────────┐
    │  App.tsx detects    │       │  App.tsx detects    │
    │  role mismatch      │       │  role mismatch      │
    └─────────────────────┘       └─────────────────────┘
                │                               │
                ▼                               ▼
    ┌─────────────────────┐       ┌─────────────────────┐
    │  Show error toast:  │       │  Show error toast:  │
    │  "Devi usare        │       │  "Non hai permessi" │
    │  dashboard dedicata"│       │                     │
    └─────────────────────┘       └─────────────────────┘
                │                               │
                ▼                               ▼
    ┌─────────────────────┐       ┌─────────────────────┐
    │  Redirect to:       │       │  Redirect to:       │
    │  /super-admin/      │       │  /dashboard         │
    │  dashboard          │       │                     │
    └─────────────────────┘       └─────────────────────┘
```

---

## 📱 User Experience Flows

### ✅ Happy Path: Successful Superadmin Login

```
Login → JWT with user_role → AuthContext sets orgId="ALL"
     → Redirect to /super-admin/dashboard
     → Access all superadmin features
     → No errors, smooth experience
```

### ❌ Error Path: Missing user_role Claim

```
Login → JWT WITHOUT user_role → AuthContext detects missing claim
     → Immediate forced logout
     → Clear all storage
     → Redirect to /login?session_expired=true
     → Show red banner: "Sessione Scaduta"
     → User must re-login
```

### 🔄 Token Refresh with Missing Claim

```
Active session → Token expires → Auto-refresh triggered
     → New JWT still missing user_role
     → AuthContext detects in TOKEN_REFRESHED event
     → Forced logout (same as above)
```

### 🚫 Invalid Role Access Attempt

```
Superadmin logged in → Tries /dashboard → App.tsx detects mismatch
     → Show error toast
     → Redirect to /super-admin/dashboard
     → No access granted
```

---

## 🛠️ Implementation Key Points

| Component | Responsibility | Action on Invalid Session |
|-----------|----------------|---------------------------|
| **AuthContext** | Primary validator | Forces logout immediately |
| **App.tsx** | Secondary validator | Shows error toast + beforeunload warning |
| **Login.tsx** | User feedback | Shows session expiry banner |
| **Route Guards** | Access control | Prevents cross-role access |

---

## 🔍 Monitoring Points

### Console Logs to Watch For

✅ **Success Indicators:**
```
🔐 [AuthContext] Super Admin detected - setting organization_id to "ALL"
✅ [AuthContext] User signed in
🔄 [AuthContext] Token refreshed - re-parsing claims and validating
```

❌ **Error Indicators:**
```
❌ [AuthContext] CRITICAL: user_role claim is MISSING from JWT!
❌ [AuthContext] This session is INVALID. Forcing logout...
❌ [App] JWT TOKEN DEFECT: user_role is missing from JWT
```

---

## 📊 Flow Summary

1. **Authentication**: JWT generated with or without user_role claim
2. **Validation**: AuthContext checks claim on every auth event
3. **Enforcement**: Forced logout if claim missing
4. **User Feedback**: Clear messages explain what happened
5. **Prevention**: beforeunload warns against page reloads
6. **Recovery**: Session expiry banner guides user to re-login

**Result**: Secure, clear, user-friendly authentication flow with no ambiguity about session state.
