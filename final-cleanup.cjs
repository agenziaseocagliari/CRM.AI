const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🧹 Starting comprehensive character cleanup...');

// Define character mappings
const charMappings = {
    'ðŸ"§': '🔧',  // tools
    'ðŸ"'': '🔒',  // lock
    'ðŸ"‹': '📋',  // clipboard
    'ðŸ"': '🔍',   // search
    'ðŸ'‹': '👋',   // wave
    'ðŸ'¡': '💡',   // lightbulb
    'ðŸ'¤': '👤',   // user
    'ðŸ"„': '📄',   // document
    'ðŸ"'': '🔐',   // key
    'â‚¬': '€',    // euro
    '€â‚¬': '€',   // double euro
};

// Get all TypeScript React files
const files = glob.sync('src/**/*.{tsx,ts}', { cwd: process.cwd() });

let totalReplacements = 0;
let filesChanged = 0;

files.forEach(filePath => {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        let fileReplacements = 0;

        Object.entries(charMappings).forEach(([corrupted, correct]) => {
            const before = content;
            content = content.split(corrupted).join(correct);
            if (content !== before) {
                const count = before.split(corrupted).length - 1;
                fileReplacements += count;
                console.log(`  ✅ ${filePath}: "${corrupted}" → "${correct}" (${count} times)`);
            }
        });

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            filesChanged++;
            totalReplacements += fileReplacements;
            console.log(`📝 Updated: ${filePath} (${fileReplacements} replacements)`);
        }
    }
});

console.log(`\n🎉 Cleanup completed!`);
console.log(`📊 Files processed: ${files.length}`);
console.log(`📝 Files changed: ${filesChanged}`);
console.log(`🔄 Total replacements: ${totalReplacements}`);