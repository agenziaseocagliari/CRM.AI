# 🔐 JWT Role-Based Access Control Implementation

## Overview

This implementation enforces role-based UI separation using JWT claims to ensure that `user_role` controls all admin and super-admin access throughout the application. The solution ensures that:

1. **All JWT claims are imported and stored globally** on login and token refresh
2. **Every component/route** checks `user_role` before showing admin features
3. **Regular users** see no admin links, menus, badges, or features
4. **Direct URL access** to admin routes is blocked for non-admin users
5. **Complete session cleanup** on logout prevents any state leakage
6. **Debug tools** provide live JWT claim inspection for verification

## Architecture

### Core Components

#### 1. AuthContext (`src/contexts/AuthContext.tsx`)

**Purpose:** Global authentication state management with JWT claim parsing.

**Key Features:**
- Parses JWT on every auth state change (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
- Stores claims globally: `userRole`, `userEmail`, `userId`, `organizationId`, `jwtClaims`
- Provides convenience boolean flags: `isSuperAdmin`, `isAdmin`, `isUser`
- Comprehensive console logging for debugging
- Automatic localStorage/sessionStorage cleanup on logout
- Warnings when `user_role` is missing from JWT

**Usage:**
```typescript
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { userRole, isSuperAdmin, userEmail } = useAuth();
  
  if (!isSuperAdmin) {
    return <div>Access Denied</div>;
  }
  
  return <div>Admin Content</div>;
};
```

#### 2. DebugPanel (`src/components/DebugPanel.tsx`)

**Purpose:** Real-time JWT claim inspection for debugging and verification.

**Key Features:**
- Toggle with `Ctrl+Shift+D` or click 🐛 button
- Shows current `user_role`, email, user ID, organization ID
- Displays role flags (Super Admin, Admin, User) with visual indicators
- Expandable view of all JWT claims in JSON format
- Warns when `user_role` is missing
- Always available when logged in

**Usage:**
- Automatically included in App when user is logged in
- Press `Ctrl+Shift+D` to toggle visibility
- Click 🐛 icon in bottom-right corner

### Updated Components

#### App.tsx
- Uses AuthContext instead of managing local session state
- Shows toast warning if `user_role` is missing
- Includes DebugPanel for JWT inspection
- Improved navigation handling for logout

#### Sidebar.tsx
- Uses `isSuperAdmin` from AuthContext
- Conditionally renders "Super Admin" menu item only when `user_role === 'super_admin'`
- Removed all local JWT parsing logic

#### Header.tsx
- Uses `userRole` and `userEmail` from AuthContext
- Displays real-time role badge:
  - 🔐 Super Admin (purple)
  - ⚙️ Admin (blue)
  - 👤 Utente Standard (green)
- Removed local state management

#### SuperAdminLayout.tsx
- Uses AuthContext for authorization check
- Blocks non-super_admin users immediately
- Shows clear "Access Denied" page with instructions
- Logs all authorization attempts to console
- Redirects unauthorized users to dashboard

#### MainLayout.tsx
- Enhanced logout with console logging
- Ensures complete session cleanup

## Role Enforcement Logic

### Super Admin Routes Protection

```typescript
// In SuperAdminLayout.tsx
const { isSuperAdmin, userRole, loading } = useAuth();

useEffect(() => {
  if (!loading && !isSuperAdmin) {
    console.warn('⚠️ [SuperAdminLayout] UNAUTHORIZED ACCESS ATTEMPT!');
    // Show error toast
    // Redirect to dashboard
  }
}, [isSuperAdmin, userRole, loading]);

if (!isSuperAdmin) {
  return <AccessDeniedPage />;
}

return <SuperAdminContent />;
```

### UI Element Visibility

```typescript
// In Sidebar.tsx
const { isSuperAdmin } = useAuth();

return (
  <aside>
    {/* Standard menu items always visible */}
    <NavItem to="/dashboard" label="Dashboard" />
    <NavItem to="/opportunities" label="Opportunità" />
    {/* ... */}
    
    {/* Admin menu only for super_admin role */}
    {isSuperAdmin && (
      <NavItem to="/super-admin" label="Super Admin" />
    )}
  </aside>
);
```

## Console Logging

The implementation provides comprehensive console logging for debugging:

### Auth State Changes
```
🔑 [AuthContext] Initializing auth context...
🔑 [AuthContext] Auth state changed: SIGNED_IN
✅ [AuthContext] User signed in
🔑 [AuthContext] JWT Claims parsed: {
  user_role: 'super_admin',
  email: 'admin@example.com',
  sub: '...',
  organization_id: '...'
}
```

### JWT Warnings
```
⚠️ [AuthContext] JWT TOKEN DEFECT: user_role claim is MISSING from JWT!
⚠️ [AuthContext] User must logout and login again to get proper token
```

### Authorization Checks
```
🔒 [SuperAdminLayout] Authorization check: {
  userRole: 'user',
  isSuperAdmin: false,
  timestamp: '2024-01-21T...'
}
⚠️ [SuperAdminLayout] UNAUTHORIZED ACCESS ATTEMPT!
⚠️ [SuperAdminLayout] User role: user
⚠️ [SuperAdminLayout] Expected: super_admin
```

### Logout
```
👋 [MainLayout] Logging out - clearing all session data
🔑 [AuthContext] Auth state changed: SIGNED_OUT
👋 [AuthContext] User signed out - clearing all claims
```

## Security Features

### 1. No Client-Side Role Bypass
- All role checks use JWT claims parsed from backend-issued token
- User cannot manipulate role through browser tools
- AuthContext is the single source of truth

### 2. Complete Session Cleanup
- On logout, all storage is cleared:
  - `localStorage.clear()`
  - `sessionStorage.clear()`
  - Supabase auth signOut
- Prevents any persistent state from old sessions

### 3. URL-Based Access Protection
- Protected routes check `isSuperAdmin` before rendering
- Unauthorized users are immediately redirected
- No race conditions or state leaks

### 4. Real-Time Updates
- AuthContext listens to all auth state changes
- JWT is re-parsed on token refresh
- UI updates automatically when role changes

### 5. Visual Feedback
- Header badge shows current role
- DebugPanel allows verification
- Toast notifications for access denials
- Console warnings for debugging

## Testing

See `JWT_ROLE_ENFORCEMENT_TEST_PLAN.md` for comprehensive test scenarios.

Key test cases:
1. ✅ Regular user cannot access /super-admin routes
2. ✅ Regular user does not see admin UI elements
3. ✅ Super admin can access all features
4. ✅ Direct URL navigation is protected
5. ✅ Logout clears all session state
6. ✅ JWT without user_role is detected and blocked

## Usage Examples

### Checking User Role in Components

```typescript
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { userRole, isSuperAdmin, isUser } = useAuth();
  
  // Simple role check
  if (isSuperAdmin) {
    return <AdminFeature />;
  }
  
  // Multiple role support
  if (isSuperAdmin || isAdmin) {
    return <ManagerFeature />;
  }
  
  // Regular users
  return <StandardFeature />;
};
```

### Conditional Rendering

```typescript
const Menu = () => {
  const { isSuperAdmin } = useAuth();
  
  return (
    <ul>
      <MenuItem to="/dashboard">Dashboard</MenuItem>
      <MenuItem to="/opportunities">Opportunities</MenuItem>
      
      {isSuperAdmin && (
        <MenuItem to="/super-admin">Super Admin</MenuItem>
      )}
    </ul>
  );
};
```

### Route Protection

```typescript
// In App.tsx
<Route 
  path="/super-admin"
  element={session ? <SuperAdminLayout /> : <Navigate to="/login" />}
>
  {/* SuperAdminLayout internally checks isSuperAdmin */}
  <Route path="dashboard" element={<SuperAdminDashboard />} />
</Route>
```

## Troubleshooting

### Issue: JWT does not contain user_role

**Symptoms:**
- Console shows: "JWT TOKEN DEFECT: user_role claim is MISSING"
- DebugPanel shows user_role as "NULL ⚠️"
- Admin features not accessible even for admin users

**Solution:**
1. Verify backend JWT generation includes user_role claim
2. User must logout and login again to get new token with user_role
3. Check Supabase Auth Hooks configuration (custom_access_token_hook)

### Issue: Role badge shows wrong role

**Symptoms:**
- Header shows incorrect role badge
- DebugPanel shows correct role

**Solution:**
1. Check that Header.tsx is using `useAuth()` hook
2. Verify AuthContext is properly wrapping App in index.tsx
3. Clear browser cache and hard refresh (Ctrl+Shift+R)

### Issue: User can access admin routes

**Symptoms:**
- Regular user can navigate to /super-admin
- No access denied message shown

**Solution:**
1. Verify SuperAdminLayout is using `useAuth()` hook
2. Check console for authorization logs
3. Ensure AuthProvider is wrapping App in index.tsx
4. Verify JWT contains correct user_role claim

## Migration Notes

### For Developers

1. **All components should use AuthContext** instead of parsing JWT locally
2. **Remove local JWT parsing logic** from components
3. **Use provided hooks** like `isSuperAdmin`, `isAdmin` instead of string comparisons
4. **Check console logs** when debugging auth issues

### For Users

1. **Re-login required** after this update to get properly formatted JWT with all claims
2. **Old sessions won't work** - complete logout/login cycle needed
3. **Use DebugPanel** (Ctrl+Shift+D) to verify JWT claims if issues occur

## Future Enhancements

Potential improvements:
1. Add `isManager` role between user and admin
2. Permission-based access control (beyond just roles)
3. API endpoint protection with role verification
4. Role-based feature flags
5. Audit logging of role checks and access attempts
6. Role hierarchy enforcement (super_admin > admin > user)

## References

- Original Issue: Fix critical role enforcement via JWT claims
- AuthContext Implementation: `src/contexts/AuthContext.tsx`
- DebugPanel: `src/components/DebugPanel.tsx`
- Test Plan: `JWT_ROLE_ENFORCEMENT_TEST_PLAN.md`
- JWT Utilities: `src/lib/jwtUtils.ts`
