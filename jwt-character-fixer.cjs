const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'JWTViewer.tsx');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔍 Analyzing JWTViewer.tsx for corrupted characters...');

// Byte-level replacements for corrupted characters
const fixes = [
  // Super Admin emoji - corrupted "ðŸ"" to "🔍"
  { from: /ðŸ" Super Admin/g, to: '🔍 Super Admin', name: 'Super Admin emoji' },
  
  // User emoji - corrupted "ðŸ'¤" to "👤"  
  { from: /ðŸ'¤ Utente Standard/g, to: '👤 Utente Standard', name: 'User emoji' },
  
  // Clipboard emoji - corrupted "ðŸ"‹" to "📋"
  { from: /ðŸ"‹/g, to: '📋', name: 'Clipboard emoji' },
  
  // Admin tools emoji - corrupted ""š™ï¸" to "⚙️"
  { from: /"š™ï¸ Admin/g, to: '⚙️ Admin', name: 'Admin tools emoji' },
  
  // Warning emoji - corrupted ""š ï¸" to "⚠️"
  { from: /"š ï¸ TOKEN DEFECT/g, to: '⚠️ TOKEN DEFECT', name: 'Warning emoji' },
  
  // Cross mark - corrupted ""Œ" to "❌"
  { from: /"Œ No/g, to: '❌ No', name: 'Cross mark' },
  
  // Arrow - corrupted "†'" to "→"
  { from: /Logout "†'/g, to: 'Logout →', name: 'Arrow symbol' }
];

let fixCount = 0;
fixes.forEach(fix => {
  const beforeCount = (content.match(fix.from) || []).length;
  content = content.replace(fix.from, fix.to);
  const afterCount = (content.match(fix.from) || []).length;
  const replacements = beforeCount - afterCount;
  
  if (replacements > 0) {
    console.log(`✅ Fixed ${fix.name}: ${replacements} replacements`);
    fixCount += replacements;
  }
});

if (fixCount > 0) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`\n🎉 Successfully applied ${fixCount} character fixes to JWTViewer.tsx!`);
} else {
  console.log('\n🔍 No corrupted characters found to fix.');
}

// Verify the fixes
console.log('\n🔍 Verifying fixes...');
const verifyContent = fs.readFileSync(filePath, 'utf8');
const stillCorrupted = [
  /ðŸ[^🔍]/g,
  /"[šŒ†]/g,
  /[ðñò]/g
];

let remainingIssues = 0;
stillCorrupted.forEach((pattern, i) => {
  const matches = verifyContent.match(pattern) || [];
  if (matches.length > 0) {
    console.log(`⚠️ Pattern ${i+1} still has ${matches.length} issues:`, matches);
    remainingIssues += matches.length;
  }
});

if (remainingIssues === 0) {
  console.log('✅ All character corruptions appear to be fixed!');
} else {
  console.log(`⚠️ ${remainingIssues} corrupted characters still remain`);
}