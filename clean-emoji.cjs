const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'superadmin', 'SystemHealthDashboard.tsx');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Replace corrupted emoji characters with simple text
const replacements = [
  { from: /âœ…/g, to: '✓' },
  { from: /âš ï¸/g, to: '!' },
  { from: /ðŸš¨/g, to: '✗' },
  { from: /â"/g, to: '?' },
  { from: /ðŸ"Š/g, to: 'CHART' },
  { from: /ðŸ"ˆ/g, to: 'TREND' },
  { from: /âš¡/g, to: 'SPEED' },
  // Additional safety replacements for any other corrupted characters
  { from: /[^\x00-\x7F]/g, to: '?' }
];

replacements.forEach(({ from, to }) => {
  content = content.replace(from, to);
});

// Write the cleaned content back
fs.writeFileSync(filePath, content, 'utf8');

console.log('File cleaned successfully!');