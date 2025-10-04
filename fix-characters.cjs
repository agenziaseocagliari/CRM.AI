const fs = require('fs');
const path = require('path');

// List of files to clean
const filesToClean = [
  'src/components/superadmin/charts/MrrChart.tsx',
  'src/components/superadmin/charts/UserGrowthChart.tsx',
  'src/components/Dashboard.tsx',
  'src/components/Opportunities.tsx'
];

// Character replacements
const replacements = [
  // Euro symbol fixes
  { from: /"\u201a\u00ac/g, to: '\u20ac' },
  { from: /â\u201a¬/g, to: '\u20ac' },
  
  // Arrow symbols
  { from: /"\u2020\u2014/g, to: '\u2197' }, // up arrow
  { from: /"\u2020\u02dc/g, to: '\u2198' }, // down arrow
  
  // Emoji fixes
  { from: /\u00f0\u0178"\u00a5/g, to: '\ud83d\udce5' }, //  fire -> download
  { from: /\u00f0\u0178'\u00a1/g, to: '\ud83d\udca1' }, // lightbulb
  { from: /"\u0161 \u00ef\u00b8/g, to: '\u26a0\ufe0f' }, // warning
  
  // Other corrupted characters
  { from: /â\u0153\u2026/g, to: '\u2705' }, // checkmark
  { from: /â\u0161 \u00ef\u00b8/g, to: '\u26a0\ufe0f' }, // warning
  { from: /\u00f0\u0178\u0161\u00a8/g, to: '\ud83d\udea8' }, // siren
  { from: /â"/g, to: '\u2753' } // question mark
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