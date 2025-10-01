# 🎨 JWT Debugging UI Features - Visual Guide

This document provides a visual description of all JWT debugging UI features implemented.

## 1. Settings Page - Debug JWT Tab

### Location
**Settings → 🔧 Debug JWT**

### Initial View
```
┌─────────────────────────────────────────────────────────────┐
│ 🔐 Debug JWT Token                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Questa sezione ti permette di visualizzare e diagnosticare │
│ il tuo JWT token. Utile per verificare la presenza del     │
│ claim user_role.                                            │
│                                                             │
│  ┌─────────────────────────────────────┐                   │
│  │  🔍 Visualizza JWT Token            │                   │
│  └─────────────────────────────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Expanded JWT Viewer
```
┌─────────────────────────────────────────────────────────────┐
│ 🔐 JWT Token Viewer                                    [×]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌────────────────────┐  ┌────────────────────┐           │
│ │ Token Valido       │  │ user_role Presente │           │
│ │ ✅ Sì              │  │ ✅ Sì              │           │
│ └────────────────────┘  └────────────────────┘           │
│                                                             │
│ ℹ️ Importante: Aggiornamenti Backend                       │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Dopo ogni aggiornamento backend o delle policy di   │   │
│ │ autenticazione, è indispensabile rigenerare il JWT. │   │
│ │ Per farlo, effettua logout e login nuovamente.      │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ 📋 JWT Claims                                              │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ sub:              abc-123-xyz                        │   │
│ │ email:            user@example.com                   │   │
│ │ user_role:        ✅ super_admin                     │   │
│ │ organization_id:  org-uuid-here                      │   │
│ │ aud:              authenticated                      │   │
│ │ exp:              1705756800                         │   │
│ │ iat:              1705753200                         │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ 🔑 Token Raw                      [Nascondi]               │
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐         │
│  │ 📋 Copia Report     │  │ 🔄 Ricarica         │         │
│  │    Completo         │  │                     │         │
│  └─────────────────────┘  └─────────────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### TOKEN DEFECT Warning
```
┌─────────────────────────────────────────────────────────────┐
│ 🔐 JWT Token Viewer                                    [×]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌────────────────────┐  ┌────────────────────┐           │
│ │ Token Valido       │  │ user_role Presente │           │
│ │ ✅ Sì              │  │ ❌ No              │           │
│ └────────────────────┘  └────────────────────┘           │
│                                                             │
│ ⚠️ TOKEN DEFECT RILEVATO                                   │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Il tuo JWT non contiene il claim user_role.         │   │
│ │ Questo significa che il token è stato generato prima│   │
│ │ della configurazione del custom_access_token_hook.  │   │
│ │                                                      │   │
│ │ 📝 Azioni Consigliate:                              │   │
│ │  1. Effettua un logout profondo (pulsante sotto)    │   │
│ │  2. Pulizia completa di storage e cookie           │   │
│ │  3. Effettua login SOLO tramite form email+password│   │
│ │  4. Non usare magic link o reset password          │   │
│ │                                                      │   │
│ │  ┌───────────────────────────────────────────────┐ │   │
│ │  │ 🔄 Esegui Logout Profondo e Pulizia          │ │   │
│ │  └───────────────────────────────────────────────┘ │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 2. SuperAdmin Dashboard - JWT Status Panel

### Location
**SuperAdmin Dashboard (top of page)**

### Healthy JWT Display
```
┌─────────────────────────────────────────────────────────────┐
│ Dashboard Generale                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🔐 JWT Status (SuperAdmin)            [Mostra Claims]      │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Token Valido: ✅ Sì    user_role: ✅ Presente       │   │
│ │ Ruolo: super_admin     Email: admin@example.com     │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ [Statistics cards below...]                                 │
└─────────────────────────────────────────────────────────────┘
```

### Expanded Claims View
```
┌─────────────────────────────────────────────────────────────┐
│ 🔐 JWT Status (SuperAdmin)            [Nascondi Claims]    │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Token Valido: ✅ Sì    user_role: ✅ Presente       │   │
│ │ Ruolo: super_admin     Email: admin@example.com     │   │
│ │                                                      │   │
│ │ Tutti i Claims JWT:                                 │   │
│ │ ┌────────────────────────────────────────────────┐ │   │
│ │ │ sub: "abc-123-xyz"                             │ │   │
│ │ │ email: "admin@example.com"                     │ │   │
│ │ │ user_role: "super_admin"                       │ │   │
│ │ │ organization_id: null                          │ │   │
│ │ │ aud: "authenticated"                           │ │   │
│ │ │ exp: 1705756800                                │ │   │
│ │ │ iat: 1705753200                                │ │   │
│ │ │ iss: "https://xxx.supabase.co/auth/v1"        │ │   │
│ │ │ role: "authenticated"                          │ │   │
│ │ └────────────────────────────────────────────────┘ │   │
│ └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### TOKEN DEFECT Warning
```
┌─────────────────────────────────────────────────────────────┐
│ 🔐 JWT Status (SuperAdmin)            [Nascondi Claims]    │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Token Valido: ✅ Sì    user_role: ❌ Mancante       │   │
│ │                                                      │   │
│ │ ⚠️ TOKEN DEFECT: Il claim user_role è mancante.    │   │
│ │ Effettua logout e login nuovamente.                │   │
│ └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 3. Login Page - JWT Diagnostics

### Location
**Login Page (below login form, shown automatically if issues detected)**

### TOKEN DEFECT Panel
```
┌─────────────────────────────────────────────────────────────┐
│ [Login Form Above]                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ⚠️ TOKEN DEFECT RILEVATO                                   │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ user_role presente: ❌ No                           │   │
│ │                                                      │   │
│ │ 📝 Azioni necessarie:                               │   │
│ │  1. Effettua logout profondo (pulsante sotto)       │   │
│ │  2. Effettua login solo da form email + password    │   │
│ │  3. Non usare magic link o reset password          │   │
│ │                                                      │   │
│ │  ┌───────────────────────────────────────────────┐ │   │
│ │  │ 🔄 Esegui Logout Profondo                    │ │   │
│ │  └───────────────────────────────────────────────┘ │   │
│ │                                                      │   │
│ │  [Nascondi diagnostica]                            │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Login History Viewer
```
┌─────────────────────────────────────────────────────────────┐
│ [Login Form Above]                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📊 Visualizza storico login (5 tentativi)                  │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 📊 Storico Login                         [Nascondi] │   │
│ │ ┌───────────────┐  ┌───────────────┐              │   │
│ │ │ Totale        │  │ Successi      │              │   │
│ │ │ 5             │  │ 4             │              │   │
│ │ └───────────────┘  └───────────────┘              │   │
│ │                                                      │   │
│ │ Per Metodo:                                         │   │
│ │ ┌────────────────────────────────────────────────┐ │   │
│ │ │ password: 3                                    │ │   │
│ │ │ magic_link: 1 (⚠️ 1 JWT defect)               │ │   │
│ │ │ oauth: 1                                       │ │   │
│ │ └────────────────────────────────────────────────┘ │   │
│ │                                                      │   │
│ │ Recenti:                                            │   │
│ │ ┌────────────────────────────────────────────────┐ │   │
│ │ │ password               ✅                      │ │   │
│ │ │ Jan 20, 14:30                                  │ │   │
│ │ │                                                │ │   │
│ │ │ magic_link             ✅                      │ │   │
│ │ │ Jan 20, 12:15                                  │ │   │
│ │ │ ⚠️ JWT defect                                  │ │   │
│ │ └────────────────────────────────────────────────┘ │   │
│ │                                                      │   │
│ │  ┌───────────────────────────────────────────────┐ │   │
│ │  │ 📋 Copia Report Completo                     │ │   │
│ │  └───────────────────────────────────────────────┘ │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 4. Global JWT Health Check Toast

### Location
**Top center of screen (automatic, appears once per session)**

### Toast Notification
```
┌─────────────────────────────────────────────┐
│ ⚠️ TOKEN DEFECT RILEVATO                   │
│ Il tuo JWT non contiene il claim user_role.│
│                                             │
│ Vai su Impostazioni → Debug JWT per più    │
│ informazioni                                │
│                                             │
│ [Vai a Impostazioni]                        │
└─────────────────────────────────────────────┘
```

## 5. Error Toast with JWT Context

### When JWT Error Occurs During API Call

```
┌─────────────────────────────────────────────┐
│ La sessione è scaduta o aggiornata. Per     │
│ favore, effettua nuovamente il login.       │
│                                             │
│ ⚠️ La tua sessione è scaduta o è stata     │
│ aggiornata. È necessario effettuare        │
│ nuovamente il login.                        │
│                                             │
│ [Vai al Login]  [Copia Diagnosi]           │
└─────────────────────────────────────────────┘
```

## Color Coding

Throughout the UI, consistent color coding is used:

| Color | Meaning | Example |
|-------|---------|---------|
| 🟢 Green | Success / Present | ✅ Token Valid, user_role Present |
| 🔴 Red | Error / Missing | ❌ user_role Missing |
| 🟡 Yellow | Warning / Caution | ⚠️ TOKEN DEFECT |
| 🔵 Blue | Information | ℹ️ Backend Update Warning |
| ⚫ Gray | Neutral / Disabled | Secondary buttons |

## Icons Used

| Icon | Meaning | Usage |
|------|---------|-------|
| 🔐 | Security/JWT | JWT headers |
| ✅ | Success | Valid states |
| ❌ | Error | Missing/Invalid |
| ⚠️ | Warning | Defects/Issues |
| ℹ️ | Information | Helpful notes |
| 🔄 | Refresh/Logout | Action buttons |
| 📋 | Copy | Copy to clipboard |
| 🔍 | View/Inspect | View details |
| 📊 | Analytics | History/Stats |
| 🔧 | Debug/Tools | Debug section |

## Responsive Behavior

### Desktop (> 1024px)
- Full layout with side-by-side status cards
- Expanded claim tables
- All details visible

### Tablet (768px - 1024px)
- Stacked status cards
- Scrollable claim tables
- Compact buttons

### Mobile (< 768px)
- Single column layout
- Collapsible sections
- Full-width buttons
- Minimal padding

## Accessibility

All UI components include:
- ✅ Proper ARIA labels
- ✅ Keyboard navigation support
- ✅ High contrast ratios (WCAG AA)
- ✅ Focus indicators
- ✅ Screen reader friendly

## Animation & Transitions

- Smooth expand/collapse for claim viewers
- Toast notifications slide in from top
- Buttons have hover states
- Loading states for async operations

## User Flow Example

### Scenario: User with TOKEN DEFECT

1. **User logs in** → Automatic JWT validation
2. **TOKEN DEFECT detected** → Yellow warning appears on login page
3. **User navigates to Settings** → Sees global toast notification
4. **User clicks Debug JWT tab** → Full JWT Viewer opens
5. **User sees detailed diagnostics** → TOKEN DEFECT warning with instructions
6. **User clicks "Deep Logout"** → Confirmation, then logout
7. **User logs in with email+password** → Fresh JWT generated
8. **User checks Settings again** → Green ✅ all good!

---

**Note:** All screenshots/visual representations above are ASCII art for documentation purposes. The actual UI uses modern CSS, Tailwind classes, and React components for a polished appearance.
