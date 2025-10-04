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

// Character replacements
const replacements = [
  // Euro symbol fixes
  { from: /"\u201a\u00ac/g, to: '\u20ac' },
  { from: /â\u201a¬/g, to: '\u20ac' },
  
  // Arrow symbols
  { from: /"\u2020\u2014/g, to: '\u2197' }, // up arrow
  { from: /"\u2020\u02dc/g, to: '\u2198' }, // down arrow
  
  // All corrupted emoji patterns
  { from: /ðŸ[^\s]*/g, to: (match) => {
    // Map corrupted emoji to correct ones
    const emojiMap = {
      'ðŸ'¡': '💡', // lightbulb
      'ðŸ"¥': '📥', // download/export
      'ðŸ"': '🔍', // magnifying glass
      'ðŸ"'': '🔒', // lock
      'ðŸ"§': '🔧', // wrench
      'ðŸš«': '🚫', // prohibited
      'ðŸ"‹': '📋', // clipboard
      'ðŸ'‹': '👋', // waving hand
      'ðŸŒ™': '🌙', // crescent moon
      'ðŸ'¤': '👤', // bust in silhouette
      'ðŸš¨': '🚨', // police car light
      'ðŸ"„': '🔄', // counterclockwise arrows
      'ðŸ›': '🛡️' // shield
    };
    return emojiMap[match] || '?';
  }},
  
  // Other corrupted characters
  { from: /â\u0153\u2026/g, to: '\u2705' }, // checkmark
  { from: /â\u0161 \u00ef\u00b8/g, to: '\u26a0\ufe0f' }, // warning
  { from: /\u00f0\u0178\u0161\u00a8/g, to: '\ud83d\udea8' }, // siren
  { from: /â"/g, to: '\u2753' }, // question mark
  
  // Date fixes (2024 -> 2025)
  { from: /2024-01-15/g, to: '2025-01-15' },
  { from: /15\/01\/2024/g, to: '15/01/2025' }
];

console.log('🧹 Starting character cleanup...');

filesToClean.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    let changed = false;
    
    replacements.forEach(({ from, to }) => {
      const beforeReplace = content.length;
      content = content.replace(from, to);
      if (content.length !== beforeReplace || content !== content.replace(from, to)) {
        changed = true;
      }
    });
    
    if (changed) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Cleaned: ${filePath}`);
    } else {
      console.log(`ℹ️  No changes needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log('🎉 Character cleanup completed!');