const fs = require('fs');
const path = require('path');

// List of files to clean
const filesToClean = [
  'src/components/superadmin/charts/MrrChart.tsx',
  'src/components/superadmin/charts/UserGrowthChart.tsx',
  'src/components/Dashboard.tsx',
  'src/components/Opportunities.tsx',
  'src/components/Settings.tsx',
  'src/components/ForgotPassword.tsx',
  'src/components/superadmin/SuperAdminLayout.tsx',
  'src/components/superadmin/SuperAdminHeader.tsx',
  'src/components/JWTViewer.tsx',
  'src/lib/ai/promptTemplates.ts',
  'src/components/superadmin/SystemHealthDashboard.tsx'
];

// Simple regex replacements
const replacements = [
  // Specific corrupted emoji patterns
  { from: /ðŸ'¡/g, to: '💡' },
  { from: /ðŸ"¥/g, to: '📥' },
  { from: /ðŸ"/g, to: '🔍' },
  { from: /ðŸ"'/g, to: '🔒' },
  { from: /ðŸ"§/g, to: '🔧' },
  { from: /ðŸš«/g, to: '🚫' },
  { from: /ðŸ"‹/g, to: '📋' },
  { from: /ðŸ'‹/g, to: '👋' },
  { from: /ðŸŒ™/g, to: '🌙' },
  { from: /ðŸ'¤/g, to: '👤' },
  { from: /ðŸš¨/g, to: '🚨' },
  { from: /ðŸ"„/g, to: '🔄' },
  { from: /ðŸ›/g, to: '🛡️' },
  { from: /â˜€ï¸/g, to: '☀️' },
  
  // Date fixes
  { from: /2024-01-15/g, to: '2025-01-15' },
  { from: /15\/01\/2024/g, to: '15/01/2025' }
];

console.log('🧹 Starting comprehensive character cleanup...');

filesToClean.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    let changed = false;
    let changeCount = 0;
    
    replacements.forEach(({ from, to }) => {
      const matches = content.match(from);
      if (matches) {
        content = content.replace(from, to);
        changed = true;
        changeCount += matches.length;
      }
    });
    
    if (changed) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Cleaned: ${filePath} (${changeCount} replacements)`);
    } else {
      console.log(`ℹ️  No changes needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log('🎉 Comprehensive character cleanup completed!');