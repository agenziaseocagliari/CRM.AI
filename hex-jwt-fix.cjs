const fs = require('fs');

console.log('🔧 Hex-based JWT character fixer...');

const filePath = 'src/components/JWTViewer.tsx';

// Read as buffer first
const buffer = fs.readFileSync(filePath);
let content = buffer.toString('utf8');

// Make backup
const backupPath = `${filePath}.hex-backup-${Date.now()}`;
fs.writeFileSync(backupPath, content, 'utf8');
console.log('💾 Hex backup created');

// Use hex patterns to avoid JavaScript parsing issues
const hexFixes = [
  // Main title - specific hex sequence for "ðŸ" JWT"
  {
    search: Buffer.from('ðŸ" JWT Session Diagnostics', 'utf8'),
    replace: Buffer.from('🔍 JWT Session Diagnostics', 'utf8'),
    name: 'main title'
  }
];

let totalChanges = 0;
let workingBuffer = buffer;

hexFixes.forEach(({ search, replace, name }) => {
  const index = workingBuffer.indexOf(search);
  if (index !== -1) {
    // Replace the bytes
    const before = workingBuffer.subarray(0, index);
    const after = workingBuffer.subarray(index + search.length);
    workingBuffer = Buffer.concat([before, replace, after]);
    console.log(`✅ Fixed ${name} at position ${index}`);
    totalChanges++;
  }
});

if (totalChanges > 0) {
  // Write back the fixed buffer
  fs.writeFileSync(filePath, workingBuffer);
  console.log(`🎉 Applied ${totalChanges} hex-level fixes!`);
  
  // Verify it's readable
  const verification = fs.readFileSync(filePath, 'utf8');
  if (verification.includes('🔍 JWT Session Diagnostics')) {
    console.log('✅ Verification successful - title is now: 🔍 JWT Session Diagnostics');
  } else {
    console.log('⚠️  Title verification failed');
  }
} else {
  console.log('ℹ️  No hex patterns found to fix');
}

console.log('✨ Hex-based fix completed!');