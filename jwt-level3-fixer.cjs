const fs = require('fs');
const path = require('path');

console.log('🚀 STRATEGIA AVANZATA LIVELLO 3B: Correzione caratteri conservativa');

const filePath = path.join(__dirname, 'src', 'components', 'JWTViewer.tsx');

// Leggiamo il file come buffer per gestire i caratteri corrotti
let content = fs.readFileSync(filePath, 'utf8');

// Mappa dei caratteri corrotti con i loro sostituti corretti
const charMap = {
    // Caratteri corrotti emoji -> emoji corretti
    'ðŸ"': '🔍',    // search emoji
    'ðŸ"‹': '📋',   // clipboard emoji  
    'ðŸ"„': '🔄',   // reload emoji
    'ðŸ"'': '🔑',   // key emoji
    'ðŸ'¤': '👤',   // user emoji
    
    // Caratteri corrotti simboli -> simboli corretti
    '"Œ': '❌',     // cross mark
    '"†'': '→',     // arrow
    '"š™ï¸': '⚙️', // gear/admin emoji
    '"š ï¸': '⚠️', // warning emoji
    '"„¹ï¸': 'ℹ️', // info emoji
    'Ã—': '×',       // multiplication sign
};

console.log('📝 Analisi file corrente...');
let totalFixes = 0;

// Applicazione delle correzioni carattere per carattere
Object.entries(charMap).forEach(([corrupted, correct]) => {
    const occurrences = (content.match(new RegExp(escapeRegExp(corrupted), 'g')) || []).length;
    if (occurrences > 0) {
        content = content.replace(new RegExp(escapeRegExp(corrupted), 'g'), correct);
        console.log(`✅ Corretto "${corrupted}" → "${correct}" (${occurrences} volte)`);
        totalFixes += occurrences;
    }
});

// Helper function per escape dei caratteri speciali regex
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

if (totalFixes > 0) {
    // Scriviamo il file corretto
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`\n🎉 SUCCESSO: Applicate ${totalFixes} correzioni a JWTViewer.tsx`);
    
    // Verifica finale
    const verifyContent = fs.readFileSync(filePath, 'utf8');
    const remainingIssues = Object.keys(charMap).filter(corrupted => 
        verifyContent.includes(corrupted)
    );
    
    if (remainingIssues.length === 0) {
        console.log('✅ PERFETTO: Tutti i caratteri corrotti sono stati eliminati!');
    } else {
        console.log(`⚠️ Rimangono ${remainingIssues.length} caratteri corrotti: ${remainingIssues.join(', ')}`);
    }
} else {
    console.log('ℹ️ Nessun carattere corrotto trovato nel file.');
}

console.log('\n🏁 Strategia Livello 3B completata!');