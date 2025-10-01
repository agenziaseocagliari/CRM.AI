# 🎨 JWT Diagnostics UI Guide

## Visual Overview of New UI Elements

This guide provides a visual description of all new UI elements added as part of the JWT diagnostics implementation.

## 1. Header - Compact Health Indicator

**Location:** Top-right corner of the application header, always visible

### Visual Description:

```
┌──────────────────────────────────────────────────────────────────┐
│  Guardian AI CRM          [🔐 Super Admin]  [✅ Healthy]  🔔 👤 🚪│
└──────────────────────────────────────────────────────────────────┘
```

### States:

#### Healthy State
- **Appearance:** Green background with ✅ icon
- **Text:** "Healthy"
- **Hover:** Shows dropdown with details

#### Unhealthy State
- **Appearance:** Red background with ⚠️ icon
- **Text:** "Issues"
- **Animation:** Pulsing to draw attention
- **Hover:** Shows dropdown with issue details

### Dropdown Content (On Click):

```
┌─────────────────────────────────────────────┐
│  Session Health                          ×  │
├─────────────────────────────────────────────┤
│  Valid Session:              ✅             │
│  Has user_role:             ✅             │
│  Claims Match Storage:      ✅             │
├─────────────────────────────────────────────┤
│  [🔍 Run Health Check]                     │
├─────────────────────────────────────────────┤
│  Last checked: 14:30:25                    │
└─────────────────────────────────────────────┘
```

## 2. Dashboard - Full Health Panel

**Location:** Top of dashboard, below page title

### Visual Description:

```
┌──────────────────────────────────────────────────────────────────────┐
│  ✅ All Systems Operational                      [🔍 Run Check]      │
│  Last checked: 2024-01-20 14:30:25                                   │
├──────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │      ✅      │  │      ✅      │  │      ✅      │              │
│  │Valid Session │  │ user_role    │  │ Claims Match │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
├──────────────────────────────────────────────────────────────────────┤
│  Automatic health checks every 5 minutes                             │
└──────────────────────────────────────────────────────────────────────┘
```

### Unhealthy State:

```
┌──────────────────────────────────────────────────────────────────────┐
│  ❌ Issues Detected                              [🔍 Run Check]      │
│  Last checked: 2024-01-20 14:30:25                                   │
├──────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │      ✅      │  │      ❌      │  │      ✅      │              │
│  │Valid Session │  │ user_role    │  │ Claims Match │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
├──────────────────────────────────────────────────────────────────────┤
│  🚨 Issues Found:                                                    │
│    • CRITICAL: user_role claim is missing from JWT                  │
│    • User must re-login to get a new token with user_role claim     │
└──────────────────────────────────────────────────────────────────────┘
```

## 3. JWT Viewer - Enhanced with Tabs

**Access:** Via Settings → JWT Diagnostics (or Debug menu)

### Tab Structure:

```
┌────────────────────────────────────────────────────────────────────┐
│  🔐 JWT Session Diagnostics                                     ×  │
├────────────────────────────────────────────────────────────────────┤
│  ✅ Session Healthy                         [🔍 Run Health Check]  │
│  Last checked: 14:30:25                                            │
├────────────────────────────────────────────────────────────────────┤
│  [Current Token]  [Session History (15)]  [Diagnostic Logs]       │
├────────────────────────────────────────────────────────────────────┤
│  ... tab content ...                                               │
└────────────────────────────────────────────────────────────────────┘
```

### Tab 1: Current Token

```
┌────────────────────────────────────────────────────────────────────┐
│  Ruolo Corrente                                                    │
│  🔐 Super Admin                                                    │
│  Account: admin@example.com                                        │
│  Token age: 15 minutes                                             │
│  Expires in: 45 minutes                                            │
├────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐                         │
│  │  Token Valido   │  │  user_role      │                         │
│  │      ✅ Sì     │  │    ✅ Sì       │                         │
│  └─────────────────┘  └─────────────────┘                         │
├────────────────────────────────────────────────────────────────────┤
│  📋 JWT Claims                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ sub:             123e4567-e89b-12d3-a456-426614174000        │ │
│  │ email:           admin@example.com                            │ │
│  │ user_role:       super_admin                                 │ │
│  │ organization_id: ALL                                          │ │
│  │ exp:             1737392400                                  │ │
│  └──────────────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────┤
│  [📋 Copia Report Completo]  [🔄 Ricarica]                        │
└────────────────────────────────────────────────────────────────────┘
```

### Tab 2: Session History

```
┌────────────────────────────────────────────────────────────────────┐
│  Session Event History                              [Clear History]│
├────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ LOGIN        Role: super_admin      14:25:30                 │ │
│  │ User ID: 123e4567...                                        │ │
│  │ Org ID: ALL                                                 │ │
│  │ localStorage org_id: ALL                                    │ │
│  └──────────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ HEALTHCHECK  Role: super_admin      14:30:25                │ │
│  │ User ID: 123e4567...                                        │ │
│  │ Org ID: ALL                                                 │ │
│  │ localStorage org_id: ALL                                    │ │
│  └──────────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ REFRESH      Role: super_admin      14:55:30                │ │
│  │ User ID: 123e4567...                                        │ │
│  │ Org ID: ALL                                                 │ │
│  │ localStorage org_id: ALL                                    │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

### Tab 3: Diagnostic Logs

```
┌────────────────────────────────────────────────────────────────────┐
│  Diagnostic Logs                                    [Clear Logs]   │
├────────────────────────────────────────────────────────────────────┤
│  ┌───────────┐  ┌───────────┐  ┌───────────┐                     │
│  │    45     │  │     3     │  │   6.7%    │                     │
│  │Total Logs │  │  Errors   │  │Error Rate │                     │
│  └───────────┘  └───────────┘  └───────────┘                     │
├────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ INFO     [session] User signed in         14:25:30          │ │
│  │ { userId: "123e4567...", email: "admin@example.com" }      │ │
│  └──────────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ INFO     [jwt] JWT parsed from session    14:25:30          │ │
│  │ { hasUserRole: true, userRole: "super_admin" }             │ │
│  └──────────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ ERROR    [api] API error on create-contact 14:26:15         │ │
│  │ { endpoint: "create-contact", statusCode: 500 }            │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

## 4. Error Toast with Logout Button

**Location:** Appears when JWT claim errors are detected

### Visual Description:

```
┌──────────────────────────────────────────────────────────────────┐
│  ❌ Error                                                     ×  │
├──────────────────────────────────────────────────────────────────┤
│  ⚠️ Il tuo ruolo utente è stato modificato. Per continuare, devi:│
│                                                                  │
│  1. Cliccare sul pulsante "Logout" qui sotto                   │
│  2. Effettuare nuovamente il login                             │
│                                                                  │
│  NOTA: Semplicemente ricaricare la pagina o riaprire il        │
│  browser NON risolverà il problema.                            │
├──────────────────────────────────────────────────────────────────┤
│  [🚪 Logout]  [Copia Diagnosi]                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Persistent (doesn't auto-dismiss)
- Red logout button prominently displayed
- Copy diagnostics button for support
- Clear, actionable instructions

## Color Coding

### Health Status Colors:
- 🟢 **Green** (`bg-green-50/100`) - Healthy, all checks pass
- 🔴 **Red** (`bg-red-50/100`) - Critical issues detected
- 🟡 **Yellow** (`bg-yellow-50/100`) - Warnings, non-critical issues
- 🔵 **Blue** (`bg-blue-50/100`) - Info, neutral status
- 🟣 **Purple** (`bg-purple-50/100`) - Special states (healthcheck category)

### Log Level Colors:
- 🔵 **Blue** - INFO level
- 🟡 **Yellow** - WARN level
- 🔴 **Red** - ERROR level
- 🔴🔴 **Dark Red** - CRITICAL level

### Event Type Colors:
- 🟢 **Green** - LOGIN events
- 🔴 **Red** - LOGOUT events
- 🔵 **Blue** - REFRESH events
- 🟡 **Yellow** - CLAIM_MISMATCH events
- 🟣 **Purple** - HEALTHCHECK events
- 🔴 **Red** - ERROR events

## User Interactions

### 1. Checking Session Health
1. Click compact indicator in header OR
2. View full panel in dashboard OR
3. Click "Run Health Check" button

### 2. Viewing JWT Details
1. Navigate to Settings → JWT Diagnostics OR
2. Open JWT Viewer from debug menu
3. Switch between tabs to view different information

### 3. Exporting Diagnostics
1. Open JWT Viewer
2. Click "📋 Copia Report Completo" button
3. Diagnostic report copied to clipboard
4. Paste in support ticket or email

### 4. Handling Issues
1. See health indicator turn red
2. Click to view details
3. If critical, perform logout
4. Follow on-screen instructions to re-login

## Accessibility

### Visual Indicators:
- ✅ Color is never the only indicator
- ✅ Icons and text always accompany colors
- ✅ High contrast ratios maintained
- ✅ Clear, descriptive labels

### Keyboard Navigation:
- ✅ All buttons are keyboard accessible
- ✅ Tab order is logical
- ✅ Dropdowns can be dismissed with Escape

### Screen Readers:
- ✅ All status indicators have text alternatives
- ✅ Buttons have descriptive labels
- ✅ Error messages are announced

## Responsive Design

### Mobile View (< 768px):
- Compact indicator remains in header
- Full panel stacks vertically in dashboard
- JWT Viewer tabs become accordion on small screens
- Touch-friendly button sizes

### Tablet View (768px - 1024px):
- All elements visible
- Slightly reduced spacing
- Two-column layout in health panel

### Desktop View (> 1024px):
- Full layout as designed
- Three-column layout in health panel
- Optimal spacing and sizing

## Performance Indicators

### Loading States:
```
[🔍 Checking...]  ← Button shows this while health check runs
```

### Auto-Update Indicators:
```
Last checked: 14:30:25  ← Updates in real-time
```

### Background Activity:
- Health checks run silently every 5 minutes
- No UI disruption during automatic checks
- Status updates appear immediately

## Tips for Users

### Daily Use:
1. **Check the green badge** in header - if it's green, all is well
2. **Ignore unless red** - don't worry about the details unless issues arise
3. **Export before reporting** - always copy diagnostics when reporting issues

### Troubleshooting:
1. **Red badge?** Click to see what's wrong
2. **Missing user_role?** Use the logout button and re-login
3. **Still broken?** Export diagnostics and contact support

### For Developers:
1. **Check logs tab** for detailed diagnostic information
2. **Review session history** to understand event timeline
3. **Export everything** for comprehensive debugging
4. **Monitor error rate** for patterns or systemic issues

## Animation & Feedback

### Pulsing Animation (Unhealthy State):
```css
animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
```
- Draws attention to critical issues
- Not too distracting
- Stops when resolved

### Transitions:
- Health status changes smoothly (300ms)
- Dropdowns slide in/out
- Tab switching is instant
- Toast messages fade in

### Feedback on Actions:
- Button hover states change color
- Click feedback with subtle scale
- Success toast on copy actions
- Loading spinners for async operations

## Integration with Existing UI

### Fits Naturally:
- Matches existing color scheme
- Uses same fonts and spacing
- Consistent with other components
- Non-intrusive placement

### Complements Existing Features:
- Works with existing JWT viewer
- Enhances existing error handling
- Builds on current diagnostic tools
- Doesn't replace, only improves

## Summary

The JWT diagnostics UI elements provide:
- ✅ **Always visible** health status
- ✅ **Detailed diagnostics** when needed
- ✅ **One-click export** for support
- ✅ **Clear visual feedback** at all times
- ✅ **Accessible and responsive** design
- ✅ **Non-intrusive** user experience

Users should rarely need to interact with these elements - they just provide reassurance that everything is working. When issues occur, they provide clear guidance and easy access to diagnostic data.
