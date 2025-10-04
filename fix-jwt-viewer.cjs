const fs = require('fs');

const fixJWTViewer = () => {
  const filePath = 'src/components/JWTViewer.tsx';
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ JWTViewer.tsx not found');
    return;
  }
  
  console.log('🔧 Fixing JWTViewer.tsx characters...');
  
  let content = fs.readFileSync(filePath, 'utf8');
  let totalFixes = 0;
  
  // Specific fixes for JWT Viewer
  const fixes = [
    // Different variations of corrupted search emoji
    { from: 'ðŸ"', to: '🔍', name: 'search emoji (lock variant)' },
    { from: 'ðŸ"', to: '🔍', name: 'search emoji (main)' },
    // Corrupted clipboard emoji
    { from: 'ðŸ"‹', to: '📋', name: 'clipboard emoji' },
    // Corrupted user emoji  
    { from: 'ðŸ'¤', to: '👤', name: 'user emoji' },
    // Corrupted lock emoji
    { from: 'ðŸ"'', to: '🔒', name: 'lock emoji' },
    // Corrupted warning/alert emoji
    { from: 'ðŸš¨', to: '🚨', name: 'alert emoji' },
    // Corrupted reload emoji
    { from: 'ðŸ"„', to: '🔄', name: 'reload emoji' },
  ];
  
  fixes.forEach(({ from, to, name }) => {
    const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, to);
      totalFixes += matches.length;
      console.log(`  ✅ Fixed ${matches.length} ${name} occurrences`);
    }
  });
  
  if (totalFixes > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`💾 Applied ${totalFixes} total fixes to JWTViewer.tsx`);
    console.log('🎉 JWTViewer character corruption fixed!');
  } else {
    console.log('✨ No corrupted characters found in JWTViewer.tsx');
  }
};

fixJWTViewer();