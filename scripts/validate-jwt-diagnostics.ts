/**
 * JWT Diagnostics Validation Script
 * 
 * This script validates the JWT diagnostics implementation by checking:
 * - All required files exist
 * - Type definitions are correct
 * - Diagnostic logger works correctly
 * - JWT utilities work as expected
 * 
 * Usage: npx tsx scripts/validate-jwt-diagnostics.ts
 */

import { existsSync } from 'fs';
import { resolve } from 'path';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  // console.log(`${color}${message}${colors.reset}`);
}

function checkFileExists(path: string): boolean {
  const fullPath = resolve(process.cwd(), path);
  const exists = existsSync(fullPath);
  
  if (exists) {
    log(`  ✅ ${path}`, colors.green);
  } else {
    log(`  ❌ ${path} - NOT FOUND`, colors.red);
  }
  
  return exists;
}

async function validateDiagnosticsImplementation() {
  log('\n🔍 JWT Diagnostics Implementation Validation\n', colors.bright);
  
  let allPassed = true;
  
  // Check required files
  log('Step 1: Checking Required Files', colors.cyan);
  const requiredFiles = [
    'src/hooks/useJWTDiagnostics.ts',
    'src/lib/diagnosticLogger.ts',
    'src/components/SessionHealthIndicator.tsx',
    'docs/JWT_SESSION_DIAGNOSTICS_GUIDE.md',
  ];
  
  for (const file of requiredFiles) {
    if (!checkFileExists(file)) {
      allPassed = false;
    }
  }
  
  // Check updated files
  log('\nStep 2: Checking Updated Files', colors.cyan);
  const updatedFiles = [
    'src/lib/jwtUtils.ts',
    'src/contexts/AuthContext.tsx',
    'src/lib/api.ts',
    'src/components/JWTViewer.tsx',
    'src/components/Dashboard.tsx',
    'src/components/Header.tsx',
  ];
  
  for (const file of updatedFiles) {
    if (!checkFileExists(file)) {
      allPassed = false;
    }
  }
  
  // Import and test diagnostic logger
  log('\nStep 3: Testing Diagnostic Logger', colors.cyan);
  try {
    const { diagnosticLogger } = await import('../src/lib/diagnosticLogger.js');
    
    // Test logging
    diagnosticLogger.info('test', 'Test info message', { test: true });
    diagnosticLogger.warn('test', 'Test warning message');
    diagnosticLogger.error('test', 'Test error message');
    
    // Check logs
    const logs = diagnosticLogger.getLogs();
    if (logs.length >= 3) {
      log('  ✅ Diagnostic logger works correctly', colors.green);
    } else {
      log('  ❌ Diagnostic logger did not log messages', colors.red);
      allPassed = false;
    }
    
    // Test export
    const exported = diagnosticLogger.exportLogs();
    if (exported.includes('Diagnostic Logs Export')) {
      log('  ✅ Export functionality works', colors.green);
    } else {
      log('  ❌ Export functionality failed', colors.red);
      allPassed = false;
    }
    
    // Clean up test logs
    diagnosticLogger.clearLogs();
  } catch (error: any) {
    log(`  ❌ Failed to test diagnostic logger: ${error.message}`, colors.red);
    allPassed = false;
  }
  
  // Test JWT utilities
  log('\nStep 4: Testing JWT Utilities', colors.cyan);
  try {
    const { diagnoseJWT, decodeJWT } = await import('../src/lib/jwtUtils.js');
    
    // Test with mock JWT (invalid format to test error handling)
    const diagnostics = diagnoseJWT('invalid.jwt.token');
    
    if (!diagnostics.isValid && diagnostics.errors.length > 0) {
      log('  ✅ JWT error handling works', colors.green);
    } else {
      log('  ❌ JWT error handling failed', colors.red);
      allPassed = false;
    }
    
    // Test with valid JWT structure (still invalid signature but valid format)
    const mockJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.signature';
    const validDiagnostics = diagnoseJWT(mockJWT);
    
    if (validDiagnostics.isValid && !validDiagnostics.hasUserRole) {
      log('  ✅ JWT diagnostics detects missing user_role', colors.green);
    } else {
      log('  ❌ JWT diagnostics failed to detect missing user_role', colors.red);
      allPassed = false;
    }
    
    // Check timestamp and new fields
    if (validDiagnostics.timestamp && validDiagnostics.tokenAge !== undefined) {
      log('  ✅ Enhanced JWT diagnostics fields present', colors.green);
    } else {
      log('  ❌ Enhanced JWT diagnostics fields missing', colors.red);
      allPassed = false;
    }
  } catch (error: any) {
    log(`  ❌ Failed to test JWT utilities: ${error.message}`, colors.red);
    allPassed = false;
  }
  
  // Summary
  log('\n' + '='.repeat(60), colors.cyan);
  if (allPassed) {
    log('✅ ALL VALIDATIONS PASSED', colors.green);
    log('\nThe JWT diagnostics implementation is complete and functional.', colors.bright);
  } else {
    log('❌ SOME VALIDATIONS FAILED', colors.red);
    log('\nPlease review the errors above and fix any issues.', colors.yellow);
    process.exit(1);
  }
  log('='.repeat(60) + '\n', colors.cyan);
}

// Run validation
validateDiagnosticsImplementation().catch((error) => {
  log(`\n❌ Validation script failed: ${error.message}`, colors.red);
  // console.error(error);
  process.exit(1);
});

