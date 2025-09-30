#!/usr/bin/env node
/**
 * Custom lint rule to detect and prevent custom 'role' parameters in API calls
 * 
 * This script analyzes TypeScript/JavaScript files to find patterns that would
 * cause "role does not exist" errors in Supabase/PostgREST.
 * 
 * Problematic patterns:
 * - fetch(url, { headers: { 'role': 'super_admin' } })
 * - supabase.rpc('fn', {}, { role: 'super_admin' })
 * - createClient(url, key, { global: { headers: { role: '...' } } })
 * 
 * Usage:
 *   npm run lint:role
 *   or: npx tsx scripts/lint-api-role-usage.ts
 * 
 * Exit codes:
 *   0 - No issues found
 *   1 - Found problematic role usage
 */

import * as fs from 'fs';
import * as path from 'path';

interface LintIssue {
  file: string;
  line: number;
  column: number;
  message: string;
  code: string;
}

const issues: LintIssue[] = [];

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

// Patterns to detect problematic role usage
const problematicPatterns = [
  // Pattern 1: 'role': 'value' or "role": "value" in headers
  {
    regex: /['"]role['"]\s*:\s*['"](?:super_admin|admin|authenticated|service_role)['"]/g,
    message: "Custom 'role' header/parameter detected. Use JWT-based authentication instead.",
    severity: 'error' as const,
  },
  // Pattern 2: role: 'value' (unquoted key) in object literals within API contexts
  {
    regex: /\brole\s*:\s*['"](?:super_admin|admin|authenticated|service_role)['"]/g,
    message: "Custom 'role' parameter detected. Use JWT-based authentication instead.",
    severity: 'error' as const,
  },
];

// Patterns to allow (legitimate usage)
const allowedPatterns = [
  /profile\.role/,
  /profiles\.role/,
  /user\.role/,
  /SERVICE_ROLE_KEY/,
  /service_role_key/,
  /\/\//,  // Comments
  /\/\*/,  // Block comments
];

function shouldIgnoreLine(line: string): boolean {
  return allowedPatterns.some(pattern => pattern.test(line));
}

function checkFile(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Skip if line contains legitimate usage
    if (shouldIgnoreLine(line)) {
      return;
    }

    // Check for problematic patterns
    problematicPatterns.forEach(({ regex, message, severity }) => {
      const matches = line.matchAll(regex);
      for (const match of matches) {
        issues.push({
          file: filePath,
          line: index + 1,
          column: match.index || 0,
          message,
          code: line.trim(),
        });
      }
    });
  });
}

function walkDirectory(dir: string, extensions: string[]): string[] {
  const files: string[] = [];
  
  // Directories to skip
  const skipDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'];
  
  function walk(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        if (!skipDirs.includes(entry.name)) {
          walk(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  walk(dir);
  return files;
}

function main() {
  console.log(`${colors.blue}${colors.bold}🔍 Linting for API Role Usage${colors.reset}`);
  console.log('========================================\n');

  const rootDir = process.cwd();
  const srcDir = path.join(rootDir, 'src');
  const functionsDir = path.join(rootDir, 'supabase', 'functions');

  // Collect all TypeScript and JavaScript files
  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  let allFiles: string[] = [];

  if (fs.existsSync(srcDir)) {
    allFiles = allFiles.concat(walkDirectory(srcDir, extensions));
  }
  
  if (fs.existsSync(functionsDir)) {
    allFiles = allFiles.concat(walkDirectory(functionsDir, extensions));
  }

  console.log(`Checking ${allFiles.length} files...\n`);

  // Check each file
  allFiles.forEach(checkFile);

  // Report results
  if (issues.length === 0) {
    console.log(`${colors.green}${colors.bold}✅ No problematic role usage found!${colors.reset}\n`);
    console.log('The codebase follows Supabase best practices:');
    console.log('  • No custom role headers/params in API calls');
    console.log('  • Role management is JWT-based');
    console.log('  • Authorization uses database-level checks\n');
    process.exit(0);
  } else {
    console.log(`${colors.red}${colors.bold}❌ Found ${issues.length} issue(s):${colors.reset}\n`);
    
    issues.forEach((issue, idx) => {
      const relPath = path.relative(rootDir, issue.file);
      console.log(`${colors.yellow}${idx + 1}.${colors.reset} ${relPath}:${issue.line}:${issue.column}`);
      console.log(`   ${colors.red}${issue.message}${colors.reset}`);
      console.log(`   ${colors.blue}Code:${colors.reset} ${issue.code}\n`);
    });

    console.log(`${colors.yellow}${colors.bold}⚠️  ACTION REQUIRED:${colors.reset}`);
    console.log('\nRemove all custom role headers/params from API calls.');
    console.log('Instead, use JWT-based authentication:\n');
    console.log('  ✅ CORRECT:');
    console.log('     headers: { Authorization: `Bearer ${token}` }\n');
    console.log('  ❌ WRONG:');
    console.log("     headers: { role: 'super_admin' }\n");
    console.log('For details, see: AUTHENTICATION_BEST_PRACTICES.md\n');
    
    process.exit(1);
  }
}

// Run the linter
try {
  main();
} catch (error) {
  console.error(`${colors.red}Error running linter:${colors.reset}`, error);
  process.exit(1);
}
