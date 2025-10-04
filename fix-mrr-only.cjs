const fs = require('fs');
const path = require('path');

// Single file to fix
const filePath = 'src/components/superadmin/charts/MrrChart.tsx';

console.log(`🔍 Checking: ${filePath}`);

if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  let changeCount = 0;

  // Specific character replacements for MrrChart
  const replacements = [
    { from: 'ðŸ'¡', to: '💡' }, // corrupted lightbulb
    { from: 'ðŸ"¥', to: '📥' }, // corrupted fire to download
    { from: 'â‚¬', to: '€' },   // corrupted euro
    { from: '€â‚¬', to: '€' },  // double euro
  ];

  replacements.forEach(({ from, to }) => {
    const before = content;
    content = content.replaceAll(from, to);
    if (content !== before) {
      const count = (before.match(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      changeCount += count;
      changed = true;
      console.log(`  ✅ Replaced "${from}" → "${to}" (${count} times)`);
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Cleaned: ${filePath} (${changeCount} replacements)`);
  } else {
    console.log(`✅ No changes needed: ${filePath}`);
  }
} else {
  console.log(`❌ File not found: ${filePath}`);
}

console.log('🎉 MrrChart cleanup completed!');