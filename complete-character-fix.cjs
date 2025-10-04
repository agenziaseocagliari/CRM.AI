const fs = require('fs');
const path = require('path');

// Complete mapping of all corrupted characters we've found
const characterMap = [
    // Emoji fixes
    { from: 'ðŸ"', to: '🔍' },      // search/magnifying glass
    { from: 'ðŸ"'', to: '🔒' },     // lock
    { from: 'ðŸ"§', to: '🔧' },     // wrench/tools
    { from: 'ðŸ"‹', to: '📋' },     // clipboard
    { from: 'ðŸ'‹', to: '👋' },     // waving hand
    { from: 'ðŸ'¡', to: '💡' },     // lightbulb
    { from: 'ðŸ'¤', to: '👤' },     // user silhouette
    { from: 'ðŸ"„', to: '🔄' },     // reload/refresh
    { from: 'ðŸš¨', to: '🚨' },     // alert/siren
    { from: 'ðŸ›', to: '🛡️' },      // shield
    
    // Special corrupted patterns
    { from: 'š ï¸', to: '⚠️' },      // warning triangle
    { from: '"Œ', to: '⚠️' },       // alternative warning
    { from: '"š™ï¸', to: '🛡️' },    // alternative shield
    { from: '…', to: '...' },       // ellipsis
];

const filesToFix = [
    'src/components/Settings.tsx',
    'src/components/superadmin/SuperAdminHeader.tsx', 
    'src/components/superadmin/SuperAdminLayout.tsx',
    'src/components/TwoFactorAuth/TwoFactorSetup.tsx',
    'src/components/TwoFactorAuth/TwoFactorSettings.tsx',
    'src/components/ForgotPassword.tsx',
    'src/lib/ai/promptTemplates.ts'
];

async function fixFile(filePath) {
    console.log(`\n🔧 Fixing file: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${filePath}`);
        return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let replacements = 0;
    
    // Apply all character replacements
    for (const [corrupted, clean] of Object.entries(characterMap)) {
        const beforeLength = content.length;
        content = content.replace(new RegExp(escapeRegExp(corrupted), 'g'), clean);
        const afterLength = content.length;
        
        if (beforeLength !== afterLength) {
            const count = (originalContent.match(new RegExp(escapeRegExp(corrupted), 'g')) || []).length;
            if (count > 0) {
                console.log(`  ✅ Replaced "${corrupted}" → "${clean}" (${count} times)`);
                replacements += count;
            }
        }
    }
    
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Successfully fixed ${replacements} character issues in ${filePath}`);
        return true;
    } else {
        console.log(`ℹ️  No corrupted characters found in ${filePath}`);
        return false;
    }
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function main() {
    console.log('🚀 Starting complete character corruption fix...\n');
    
    let totalFixed = 0;
    const results = [];
    
    for (const filePath of filesToFix) {
        try {
            const fixed = await fixFile(filePath);
            results.push({ file: filePath, fixed });
            if (fixed) totalFixed++;
        } catch (error) {
            console.error(`❌ Error fixing ${filePath}:`, error.message);
            results.push({ file: filePath, fixed: false, error: error.message });
        }
    }
    
    console.log('\n📊 Summary:');
    console.log(`Files processed: ${filesToFix.length}`);
    console.log(`Files fixed: ${totalFixed}`);
    
    if (totalFixed > 0) {
        console.log('\n✅ All character corruption issues have been fixed!');
        console.log('📝 Next steps:');
        console.log('   1. Test the build: npm run build');
        console.log('   2. Commit changes: git add . && git commit -m "fix: eliminate all character corruption"');
        console.log('   3. Push to production: git push');
    } else {
        console.log('\nℹ️  No character corruption found in any files.');
    }
}

main().catch(console.error);