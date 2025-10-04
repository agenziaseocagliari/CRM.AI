const fs = require('fs');

// Simple, targeted approach for specific problematic files
const targetFiles = [
  'src/components/JWTViewer.tsx',
  'src/components/Settings.tsx',
  'src/components/superadmin/charts/UserGrowthChart.tsx',
  'src/components/superadmin/charts/MrrChart.tsx'
];

const simpleReplacements = [
  // Simple text-based replacements that are safe
  { from: '??', to: '💡' },                    // Double question marks
  { from: 'ðŸ"', to: '🔍' },                    // Search emoji  
  { from: 'ðŸ"‹', to: '📋' },                   // Clipboard emoji
  { from: 'ðŸ"', to: '🔒' },                    // Lock emoji  
  { from: 'ðŸ'¤', to: '👤' },                   // User emoji
  { from: '"…', to: '✅' },                     // Checkmark
  { from: '"Œ', to: '⚠️' },                    // Warning
  { from: '"š™ï¸', to: '🛡️' },                  // Shield
];

console.log('🎯 Starting targeted character fixes...');

targetFiles.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  Skipping ${filePath} (not found)`);
    return;
  }

  console.log(`🔧 Processing: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changeCount = 0;
  
  simpleReplacements.forEach(({ from, to }) => {
    const originalCount = (content.match(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    if (originalCount > 0) {
      content = content.split(from).join(to);
      const newCount = (content.match(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      const actualChanges = originalCount - newCount;
      if (actualChanges > 0) {
        changeCount += actualChanges;
        console.log(`  ✅ "${from}" → "${to}" (${actualChanges} times)`);
      }
    }
  });
  
  if (changeCount > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  💾 Applied ${changeCount} fixes to ${filePath}`);
  } else {
    console.log(`  ✨ No issues found in ${filePath}`);
  }
});

console.log('🎉 Targeted fixes completed!');