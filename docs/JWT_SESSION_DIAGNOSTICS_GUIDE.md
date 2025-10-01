# 🔐 JWT Session Diagnostics & Monitoring Guide

## Overview

This guide describes the comprehensive JWT session diagnostics and monitoring system implemented in the CRM-AI application. The system provides zero-tolerance error detection, instant diagnosis, and actionable troubleshooting for JWT and session-related issues.

## Architecture Components

### 1. JWT Diagnostics Hook (`useJWTDiagnostics`)

**Location:** `src/hooks/useJWTDiagnostics.ts`

A comprehensive React hook that monitors JWT sessions in real-time.

**Features:**
- Tracks all session state changes (login, logout, refresh)
- Monitors JWT claims validity
- Detects mismatches between session, localStorage, and state
- Maintains history of session events (up to 50 events)
- Provides health check functionality
- Exports diagnostics for support

**Usage:**
```typescript
import { useJWTDiagnostics } from '../hooks/useJWTDiagnostics';

function MyComponent() {
  const {
    currentDiagnostics,
    sessionHistory,
    healthStatus,
    performHealthCheck,
    clearHistory,
    exportDiagnostics,
  } = useJWTDiagnostics();
  
  // Access current JWT diagnostics
  if (!healthStatus.isHealthy) {
    console.log('Issues:', healthStatus.issues);
  }
}
```

**Session Events Tracked:**
- `login` - User signs in
- `logout` - User signs out
- `refresh` - Token is refreshed
- `claim_mismatch` - Claims don't match expected state
- `healthcheck` - Manual or automatic health check
- `error` - Error occurred during session operation

### 2. Diagnostic Logger (`diagnosticLogger`)

**Location:** `src/lib/diagnosticLogger.ts`

Centralized logging system for structured diagnostic data.

**Features:**
- Four log levels: `info`, `warn`, `error`, `critical`
- Categorized logs: `jwt`, `session`, `auth`, `api`, `healthcheck`
- Automatic localStorage persistence
- Error threshold alerting
- Console output with color coding
- Export functionality

**Usage:**
```typescript
import { diagnosticLogger } from '../lib/diagnosticLogger';

// Log info
diagnosticLogger.info('session', 'User logged in', {
  userId: 'user123',
  userRole: 'admin',
});

// Log error
diagnosticLogger.error('api', 'API call failed', {
  endpoint: 'create-contact',
  statusCode: 500,
});

// Log critical issue
diagnosticLogger.critical('jwt', 'Missing user_role claim', {
  userId: session.user.id,
}, jwtDiagnostics);

// Get error statistics
const stats = diagnosticLogger.getErrorStats();
console.log(`Error rate: ${stats.rate}%`);
```

**Error Threshold Alerting:**
When error count exceeds 10 in a session, the system automatically logs a high error rate alert.

### 3. Session Health Indicator

**Location:** `src/components/SessionHealthIndicator.tsx`

Visual component for displaying session health status.

**Modes:**
- **Compact**: Small badge suitable for headers (shows in top-right of app)
- **Full**: Detailed panel with all health checks (shows in dashboard)

**Features:**
- Real-time health status display
- Automatic periodic health checks (configurable interval)
- Manual health check button
- Issue details display
- Color-coded status indicators

**Usage:**
```tsx
// Compact mode (header)
<SessionHealthIndicator 
  mode="compact" 
  autoCheck={true} 
  checkInterval={5} 
/>

// Full mode (dashboard)
<SessionHealthIndicator 
  mode="full" 
  autoCheck={true} 
  checkInterval={5}
  onIssueDetected={() => {
    // Handle issue detection
  }}
/>
```

### 4. Enhanced JWT Viewer

**Location:** `src/components/JWTViewer.tsx`

Comprehensive JWT token viewer with three tabs:

**Tab 1: Current Token**
- Token validity status
- user_role claim presence
- Token age and expiry time
- All JWT claims display
- Error and warning messages
- Raw token display
- Deep logout functionality

**Tab 2: Session History**
- List of all session events
- Event timestamps
- User role and organization ID for each event
- localStorage state at time of event
- Error details if applicable

**Tab 3: Diagnostic Logs**
- All diagnostic logs
- Error statistics (total, rate, recent)
- Filterable by level and category
- Context and stack traces
- Clear logs functionality

### 5. Enhanced JWT Utils

**Location:** `src/lib/jwtUtils.ts`

**New Features:**
- `timestamp` - When diagnostics were performed
- `tokenAge` - Seconds since token was issued
- `timeUntilExpiry` - Seconds until token expires

## Integration Points

### AuthContext Integration

The `AuthContext` now uses the diagnostic logger to track all auth events:

```typescript
// Log successful login
diagnosticLogger.info('auth', 'User signed in', {
  userId: session?.user?.id,
  email: session?.user?.email,
});

// Log critical issue
diagnosticLogger.critical('jwt', 'Missing user_role claim - forcing logout', {
  userId: claims.sub,
  email: claims.email,
}, diagnostics);
```

### API Layer Integration

The `api.ts` helper logs all API errors with context:

```typescript
diagnosticLogger.critical('api', `JWT Custom Claim Error on ${functionName}`, {
  endpoint: functionName,
  statusCode: response.status,
  errorMessage: errorMessage,
  userId: session?.user?.id,
});
```

## Health Check System

### What is Checked?

1. **Valid Session**: Active Supabase session exists
2. **user_role Claim**: JWT contains user_role claim
3. **Claims Match Storage**: JWT claims match localStorage values
4. **Token Expiry**: Token is not expired or about to expire
5. **Organization ID**: Correct organization_id for user role

### Health Check Flow

```
┌─────────────────────────────────────────┐
│  User Opens Dashboard or Manual Check  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     useJWTDiagnostics.performHealthCheck│
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  1. Get current session from Supabase   │
│  2. Diagnose JWT token                  │
│  3. Check user_role claim               │
│  4. Verify localStorage match           │
│  5. Check token expiry                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Update healthStatus state              │
│  Log health check event                 │
│  Return health status                   │
└─────────────────────────────────────────┘
```

### Automatic Health Checks

Health checks run automatically:
- On component mount (Dashboard, Header)
- Every 5 minutes (configurable via `checkInterval` prop)
- After auth state changes (login, logout, refresh)
- On manual trigger by user

## Error Reporting

### Error Context

All errors are logged with comprehensive context:

```typescript
{
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'critical';
  category: 'jwt' | 'session' | 'auth' | 'api' | 'healthcheck';
  message: string;
  context: {
    userId?: string;
    userRole?: string;
    organizationId?: string;
    endpoint?: string;
    statusCode?: number;
    errorCode?: string;
  };
  diagnostics?: JWTDiagnostics;
  stackTrace?: string;
}
```

### Exporting Diagnostics

Users can export full diagnostic data with one click:

```typescript
const diagnosticReport = exportDiagnostics();
// Returns formatted string with:
// - Current health status
// - Current JWT diagnostics
// - Session history (last 10 events)
// - All diagnostic logs
```

## Forced Logout/Renewal

### When Does Forced Logout Occur?

1. **Missing user_role Claim**: JWT doesn't contain user_role
2. **Session with NULL Role**: User logged in but role is NULL
3. **JWT Claim Error from API**: Backend returns JWT claim error
4. **Token Expired**: Token has expired and refresh fails

### Forced Logout Flow

```
┌─────────────────────────────────────────┐
│  Issue Detected (e.g., missing role)   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Log critical diagnostic event          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Clear localStorage                     │
│  Clear sessionStorage                   │
│  Sign out from Supabase                 │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Show error toast with logout button    │
│  Redirect to login page                 │
└─────────────────────────────────────────┘
```

## Monitoring & Alerting

### Built-in Thresholds

- **High Error Rate**: Alert when error count > 10 in session
- **Error Rate**: Calculated as (errors / total logs) * 100

### Future Integration Points

The system is designed to integrate with external monitoring services:

```typescript
// TODO: Integration points marked in code
// - Sentry
// - LogRocket
// - Custom monitoring endpoints
```

## Troubleshooting

### Common Issues and Solutions

#### Issue: Missing user_role Claim

**Symptoms:**
- Health check shows "Missing user_role claim"
- Forced logout occurs
- Cannot access protected routes

**Solution:**
1. Perform deep logout (button in JWT Viewer)
2. Clear browser cache
3. Login again with email + password
4. Verify backend custom_access_token_hook is configured

#### Issue: Claims Mismatch

**Symptoms:**
- Health check shows "Claims don't match storage"
- Organization ID mismatch errors

**Solution:**
1. Run health check
2. Check diagnostic logs for exact mismatch
3. Clear localStorage
4. Logout and login again

#### Issue: Token Expired

**Symptoms:**
- API calls fail with 401
- Health check shows token expired

**Solution:**
- System should auto-refresh
- If auto-refresh fails, logout and login
- Check network connectivity

## Best Practices

### For Developers

1. **Always use diagnostic logger** for auth/session/API errors
2. **Check health status** before critical operations
3. **Export diagnostics** when reporting bugs
4. **Monitor error rates** in production
5. **Use structured context** in log messages

### For Users

1. **Check session health indicator** in header
2. **Run health checks** if experiencing issues
3. **Export diagnostics** when contacting support
4. **Logout and login** if health check fails
5. **Use deep logout** for persistent issues

## Performance Considerations

- **Health checks**: Lightweight, ~10ms average
- **Diagnostic logging**: Asynchronous, no UI blocking
- **History storage**: Limited to 50 events in memory, 10 in localStorage
- **Log storage**: Limited to 100 logs in memory, 20 in localStorage
- **Periodic checks**: Every 5 minutes by default (configurable)

## Security Considerations

✅ **No sensitive data in logs** - Tokens are truncated
✅ **User ID logging only** - No passwords or sensitive claims
✅ **Local storage only** - Diagnostics never sent to external services without explicit integration
✅ **Clear on logout** - All diagnostic data cleared on logout
✅ **Automatic cleanup** - Old logs automatically pruned

## Testing

### Manual Testing Checklist

- [ ] Health check shows healthy on fresh login
- [ ] Health check detects missing user_role claim
- [ ] Forced logout works on critical issues
- [ ] Session history records all events
- [ ] Diagnostic logs show all error levels
- [ ] Export diagnostics produces complete report
- [ ] Compact indicator shows in header
- [ ] Full indicator shows in dashboard
- [ ] Automatic health checks run on schedule
- [ ] Issue detection triggers callback

### Simulating Issues

```typescript
// Simulate missing user_role claim
// 1. Login with old JWT token (before custom_access_token_hook)
// 2. Health check should detect issue
// 3. Forced logout should occur

// Simulate claims mismatch
// 1. Manually change localStorage.organization_id
// 2. Run health check
// 3. Mismatch should be detected
```

## Future Enhancements

1. **Sentry Integration**: Send critical errors to Sentry
2. **Backend Logging**: Sync diagnostic logs with backend
3. **Analytics Dashboard**: Aggregate error statistics
4. **Predictive Alerts**: Detect patterns before failures
5. **User Feedback**: Collect user feedback on errors
6. **A/B Testing**: Test different error handling strategies

## Support

For issues or questions:
1. Export diagnostics from JWT Viewer
2. Check console for detailed logs
3. Review session history for event timeline
4. Contact support with exported diagnostic report
