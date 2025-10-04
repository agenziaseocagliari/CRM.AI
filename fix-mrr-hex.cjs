const fs = require('fs');

// Read the file
const filePath = 'src/components/superadmin/charts/MrrChart.tsx';
console.log(`🔍 Checking: ${filePath}`);

if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  let changeCount = 0;

  // Use hex codes for problematic characters
  const replacements = [
    { from: '\u00f0\u009f\u2019\u00a1', to: '💡' }, // corrupted lightbulb
    { from: '\u00f0\u009f\u201d\u00a5', to: '📥' }, // corrupted fire to download
    { from: '\u00e2\u0082\u00ac', to: '€' },         // corrupted euro
  ];

  replacements.forEach(({ from, to }) => {
    const before = content;
    content = content.split(from).join(to);
    if (content !== before) {
      const count = before.split(from).length - 1;
      changeCount += count;
      changed = true;
      console.log(`  ✅ Replaced corrupted character → "${to}" (${count} times)`);
    }
  });

  // Also try searching for the specific text patterns we know exist
  const textReplacements = [
    { search: /Nota: Questi dati sono generati per dimostrazione/, replacement: '💡 Nota: Questi dati sono generati per dimostrazione' },
    { search: /Esporta CSV/g, replacement: '📥 Esporta CSV' }
  ];

  textReplacements.forEach(({ search, replacement }) => {
    if (search.test(content)) {
      content = content.replace(search, replacement);
      changed = true;
      changeCount++;
      console.log(`  ✅ Fixed text pattern`);
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