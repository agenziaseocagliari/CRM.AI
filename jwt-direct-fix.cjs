const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'JWTViewer.tsx');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Applying direct string replacements for JWTViewer.tsx...');

// Direct string replacements for the exact corrupted sequences we found
const directFixes = [
  // From the grep results, we know the exact corrupted strings:
  "                {diagnostics.claims.user_role === 'super_admin' && 'ðŸ" Super Admin'}",
  "                {diagnostics.claims.user_role === 'admin' && '⚙️ Admin'}",
  "                {diagnostics.claims.user_role === 'user' && '👤 Utente Standard'}",
  "                {!['super_admin', 'admin', 'user'].includes(diagnostics.claims.user_role) && `📋 ${diagnostics.claims.user_role}`}"
];

// Find and replace the role section
const roleSection = `                {diagnostics.claims.user_role === 'super_admin' && 'ðŸ" Super Admin'}
                {diagnostics.claims.user_role === 'admin' && '"š™ï¸ Admin'}
                {diagnostics.claims.user_role === 'user' && 'ðŸ'¤ Utente Standard'}
                {!['super_admin', 'admin', 'user'].includes(diagnostics.claims.user_role) && \`ðŸ"‹ \${diagnostics.claims.user_role}\`}`;

const fixedRoleSection = `                {diagnostics.claims.user_role === 'super_admin' && '🔍 Super Admin'}
                {diagnostics.claims.user_role === 'admin' && '⚙️ Admin'}
                {diagnostics.claims.user_role === 'user' && '👤 Utente Standard'}
                {!['super_admin', 'admin', 'user'].includes(diagnostics.claims.user_role) && \`📋 \${diagnostics.claims.user_role}\`}`;

// Fix the status indicators
const statusFixes = [
  { from: '"Œ No', to: '❌ No' },
  { from: '"š ï¸ TOKEN DEFECT', to: '⚠️ TOKEN DEFECT' },
  { from: 'Logout "†'', to: 'Logout →' }
];

let changesMade = 0;

// Apply role section fix
if (content.includes('ðŸ" Super Admin')) {
  console.log('🔄 Fixing role section...');
  content = content.replace(/\{diagnostics\.claims\.user_role === 'super_admin' && '[^']*Super Admin'\}/, "{diagnostics.claims.user_role === 'super_admin' && '🔍 Super Admin'}");
  content = content.replace(/\{diagnostics\.claims\.user_role === 'admin' && '[^']*Admin'\}/, "{diagnostics.claims.user_role === 'admin' && '⚙️ Admin'}");
  content = content.replace(/\{diagnostics\.claims\.user_role === 'user' && '[^']*Utente Standard'\}/, "{diagnostics.claims.user_role === 'user' && '👤 Utente Standard'}");
  content = content.replace(/\{[^}]*includes\(diagnostics\.claims\.user_role\)[^}]*\$\{diagnostics\.claims\.user_role\}`\}/, "{!['super_admin', 'admin', 'user'].includes(diagnostics.claims.user_role) && `📋 ${diagnostics.claims.user_role}`}");
  changesMade++;
}

// Apply status fixes
statusFixes.forEach(fix => {
  if (content.includes(fix.from)) {
    content = content.replace(new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.to);
    console.log(`✅ Fixed: ${fix.from} → ${fix.to}`);
    changesMade++;
  }
});

if (changesMade > 0) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`\n🎉 Applied ${changesMade} fixes to JWTViewer.tsx!`);
} else {
  console.log('\n🔍 No changes needed.');
}

// Quick verification
console.log('\n🔍 Quick verification...');
const lines = content.split('\n');
let issuesFound = 0;
lines.forEach((line, index) => {
  if (line.includes('ð') || line.includes('"') && (line.includes('š') || line.includes('Œ') || line.includes('†'))) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
    issuesFound++;
  }
});

if (issuesFound === 0) {
  console.log('✅ No obvious character corruption found!');
} else {
  console.log(`⚠️ Found ${issuesFound} lines that may still have issues.`);
}