# 🏗️ JWT Custom Claims Fix - Architecture Diagram

## 📊 Solution Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER AUTHENTICATION FLOW                      │
└─────────────────────────────────────────────────────────────────┘

                            ┌──────────┐
                            │  User    │
                            │  Login   │
                            └────┬─────┘
                                 │
                                 ▼
                      ┌──────────────────┐
                      │  Supabase Auth   │
                      │  Generate JWT    │
                      └────┬─────────────┘
                           │
                           │ Invoke Hook
                           ▼
              ┌────────────────────────────┐
              │ custom_access_token_hook   │
              │ ┌────────────────────────┐ │
              │ │ Query profiles table   │ │
              │ │ SELECT role, org_id    │ │
              │ └────────────────────────┘ │
              │            │                │
              │            ▼                │
              │ ┌────────────────────────┐ │
              │ │ Add to JWT claims:     │ │
              │ │ • user_role            │ │
              │ │ • organization_id      │ │
              │ └────────────────────────┘ │
              └────────────┬───────────────┘
                           │
                           ▼
                  ┌────────────────┐
                  │ JWT with Claims│
                  │ ✓ user_role    │
                  │ ✓ organization │
                  └────┬───────────┘
                       │
                       │ Store in Client
                       ▼
```

## 🛡️ Multi-Layer Defense System

```
┌─────────────────────────────────────────────────────────────────┐
│                    API REQUEST VALIDATION                        │
└─────────────────────────────────────────────────────────────────┘

    Client Request
         │
         ▼
    ┌────────────────┐
    │ Extract JWT    │
    │ from Header    │
    └────┬───────────┘
         │
         ▼
    ┌─────────────────────────────────────────┐
    │ Layer 1: JWT Diagnostics                │
    │ ┌─────────────────────────────────────┐ │
    │ │ • Decode JWT payload                │ │
    │ │ • Check user_role exists            │ │
    │ │ • Log token age & expiration        │ │
    │ │ • Warn if claims missing            │ │
    │ └─────────────────────────────────────┘ │
    └────┬────────────────────────────────────┘
         │
         ▼
    ┌─────────────────────────────────────────┐
    │ Layer 2: Verify JWT Signature           │
    │ ┌─────────────────────────────────────┐ │
    │ │ supabase.auth.getUser(token)        │ │
    │ └─────────────────────────────────────┘ │
    └────┬────────────────────────────────────┘
         │
         ▼
    ┌─────────────────────────────────────────┐
    │ Layer 3: Check JWT Claims               │
    │ ┌─────────────────────────────────────┐ │
    │ │ userRole = user.user_role           │ │
    │ └────┬────────────────────────────────┘ │
    └─────┴────────────────────────────────────┘
         │
         ├─── userRole exists ──────┐
         │                           ▼
         │                    ┌──────────────┐
         │                    │ Validate Role│
         │                    │ is super_admin│
         │                    └──────┬───────┘
         │                           │
         │                           ▼
         │                    ┌──────────────┐
         │                    │   SUCCESS    │
         │                    └──────────────┘
         │
         └─── userRole MISSING ────┐
                                   ▼
    ┌─────────────────────────────────────────┐
    │ Layer 4: Database Fallback ⚡           │
    │ ┌─────────────────────────────────────┐ │
    │ │ Query profiles table:               │ │
    │ │ SELECT role                         │ │
    │ │ WHERE id = user.id                  │ │
    │ └────┬────────────────────────────────┘ │
    │      │                                   │
    │      ├─ Found ──┐                        │
    │      │          ▼                        │
    │      │   ┌──────────────┐               │
    │      │   │ Use DB role  │               │
    │      │   │ + Log Warning│               │
    │      │   └──────┬───────┘               │
    │      │          │                        │
    │      └─ Not Found ─┐                     │
    │                    ▼                     │
    │             ┌─────────────┐              │
    │             │   ERROR     │              │
    │             └─────────────┘              │
    └─────────────────────────────────────────┘
```

## 🔄 Error Recovery Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ERROR RECOVERY SYSTEM                         │
└─────────────────────────────────────────────────────────────────┘

    JWT Missing Claim
         │
         ▼
    ┌────────────────────────┐
    │ Database Fallback      │
    │ ┌────────────────────┐ │
    │ │ Query profiles     │ │
    │ │ Get role           │ │
    │ └────────────────────┘ │
    └───┬────────────────────┘
        │
        ├─── Success ───────────────┐
        │                            ▼
        │                     ┌──────────────────┐
        │                     │ Request Succeeds │
        │                     │ ⚠️  Log Warning  │
        │                     └──────────────────┘
        │                            │
        │                            ▼
        │                     ┌──────────────────┐
        │                     │ Alert Monitoring │
        │                     │ "Hook Not Config"│
        │                     └──────────────────┘
        │
        └─── Failure ──────────────┐
                                   ▼
                            ┌──────────────┐
                            │ Return Error │
                            │ + Diagnostics│
                            └──────────────┘
```

## 📈 Monitoring & Observability

```
┌─────────────────────────────────────────────────────────────────┐
│                    MONITORING ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────────┐
    │ Edge Functions   │
    │ Logs             │
    └────┬─────────────┘
         │
         ├─ JWT Diagnostics ─────────┐
         │  • hasUserRole: bool      │
         │  • tokenAge: number       │
         │  • isExpired: bool        │
         │                           │
         ├─ Validation Logs ─────────┤
         │  • source: JWT/Database   │
         │  • success: bool          │
         │  • warnings: []           │
         │                           │
         └─ Fallback Usage ──────────┘
            • count: number
            • percentage: %

                    │
                    ▼
         ┌─────────────────────┐
         │ Monitoring System   │
         ├─────────────────────┤
         │ • Track fallback %  │
         │ • Alert if > 5%     │
         │ • Track claim rate  │
         │ • Alert if < 95%    │
         └─────────────────────┘
```

## 🔧 Hook Configuration States

```
┌─────────────────────────────────────────────────────────────────┐
│                    HOOK CONFIGURATION STATES                     │
└─────────────────────────────────────────────────────────────────┘

STATE 1: Hook Not Configured (Before Fix)
┌────────────────────────────────────────┐
│ Hook: ❌ Not configured                │
│ JWT:  ❌ Missing user_role             │
│ API:  ❌ Hard failure                  │
│ User: ❌ Cannot access dashboard       │
└────────────────────────────────────────┘

STATE 2: Hook Not Configured (After Fix)
┌────────────────────────────────────────┐
│ Hook:     ❌ Not configured            │
│ JWT:      ❌ Missing user_role         │
│ Fallback: ✅ Database query            │
│ API:      ✅ Success with warning      │
│ User:     ✅ Can access dashboard      │
│ Logs:     ⚠️  "DATABASE FALLBACK"      │
└────────────────────────────────────────┘

STATE 3: Hook Configured (Optimal)
┌────────────────────────────────────────┐
│ Hook:     ✅ Configured                │
│ JWT:      ✅ Contains user_role        │
│ Fallback: ⏸️  Not needed               │
│ API:      ✅ Success (fast)            │
│ User:     ✅ Can access dashboard      │
│ Logs:     ✅ "SUCCESS - source: JWT"   │
└────────────────────────────────────────┘
```

## 🛠️ Diagnostic Tools Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    DIAGNOSTIC TOOLS FLOW                         │
└─────────────────────────────────────────────────────────────────┘

                    npm run verify:jwt
                           │
                           ▼
              ┌────────────────────────┐
              │ 1. Check Environment   │
              │    Variables           │
              └────┬───────────────────┘
                   │
                   ▼
              ┌────────────────────────┐
              │ 2. Get Current Session │
              └────┬───────────────────┘
                   │
                   ▼
              ┌────────────────────────┐
              │ 3. Decode JWT          │
              │    • Check user_role   │
              │    • Check expiration  │
              └────┬───────────────────┘
                   │
                   ▼
              ┌────────────────────────┐
              │ 4. Query Database      │
              │    • Get profile role  │
              │    • Compare with JWT  │
              └────┬───────────────────┘
                   │
                   ▼
              ┌────────────────────────┐
              │ 5. Check Hook Config   │
              │    • Function exists?  │
              │    • Hook enabled?     │
              └────┬───────────────────┘
                   │
                   ▼
              ┌────────────────────────┐
              │ 6. Display Report      │
              │    ✅ or ❌ + Details  │
              └────────────────────────┘
```

## 📦 Deployment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT WORKFLOW                           │
└─────────────────────────────────────────────────────────────────┘

Step 1: Apply SQL Migration
    │
    ├─ Create/Update hook function
    ├─ Add enhanced logging
    ├─ Test with sample user
    └─ Verify profiles table
              │
              ▼
Step 2: Configure Hook
    │
    ├─ Supabase Dashboard → Auth → Hooks
    ├─ Enable "Custom Access Token"
    ├─ Select function
    └─ Save
              │
              ▼
Step 3: Deploy Edge Functions
    │
    ├─ Deploy superadmin-* functions
    └─ Functions now include fallback
              │
              ▼
Step 4: Verify Deployment
    │
    ├─ Run npm run verify:jwt
    ├─ Check logs
    └─ Test with user
              │
              ▼
Step 5: User Re-login
    │
    ├─ Users logout
    ├─ Users login again
    └─ New JWT with claims
              │
              ▼
         ✅ Complete
```

## 🎯 System States Comparison

```
┌─────────────────────────────────────────────────────────────────┐
│                    BEFORE vs AFTER                               │
└─────────────────────────────────────────────────────────────────┘

BEFORE FIX:
┌─────────────────────────────────────────┐
│ User Login                              │
│   ↓                                     │
│ JWT (may be missing user_role)          │
│   ↓                                     │
│ API Request                             │
│   ↓                                     │
│ validateSuperAdmin                      │
│   ↓                                     │
│ Check JWT claim ──────┐                │
│                       ↓                 │
│                  ❌ Missing             │
│                       ↓                 │
│                  HARD ERROR             │
│                       ↓                 │
│              User Locked Out            │
└─────────────────────────────────────────┘

AFTER FIX:
┌─────────────────────────────────────────┐
│ User Login                              │
│   ↓                                     │
│ JWT (may be missing user_role)          │
│   ↓                                     │
│ API Request                             │
│   ↓                                     │
│ validateSuperAdmin                      │
│   ↓                                     │
│ Check JWT claim ──────┬── ✅ Found     │
│                       │      ↓          │
│                       │   SUCCESS       │
│                       │                 │
│                       └── ❌ Missing    │
│                              ↓          │
│                       Database Fallback │
│                              ↓          │
│                         Query Role      │
│                              ↓          │
│                      ✅ SUCCESS          │
│                      + Warning Log      │
└─────────────────────────────────────────┘
```

---

## 🎉 Summary

The solution implements a **defense-in-depth** approach:

1. **Primary Path:** JWT custom claims (fast, optimal)
2. **Fallback Path:** Database query (slower, but reliable)
3. **Diagnostics:** Comprehensive logging at every step
4. **Monitoring:** Clear metrics for operational health
5. **Recovery:** Self-healing with clear guidance

**Result:** Zero downtime, graceful degradation, production-ready solution

---

**Last Updated:** 2025-10-01  
**Architecture Version:** 1.0  
**Status:** Production Ready ✅
