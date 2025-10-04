const fs = require('fs');
const path = require('path');

class RobustCharacterFixer {
  constructor() {
    this.backupDir = './character-fix-backups';
    this.logFile = './character-fix-log.json';
    this.log = [];
    
    // Precise character mappings with hex codes to avoid JS parsing issues
    this.characterMappings = [
      { 
        name: 'corrupted_search',
        pattern: /\u00f0\u0178[\u201c\u201d]/g,
        replacement: '🔍',
        description: 'Corrupted search/magnifying glass emoji'
      },
      { 
        name: 'corrupted_clipboard',
        pattern: /\u00f0\u0178[\u201c\u201d][\u2039\u203a]/g,
        replacement: '📋',
        description: 'Corrupted clipboard emoji'
      },
      { 
        name: 'corrupted_lock',
        pattern: /\u00f0\u0178[\u201c\u201d][\u2018\u2019]/g,
        replacement: '🔒',
        description: 'Corrupted lock emoji'
      },
      { 
        name: 'corrupted_user',
        pattern: /\u00f0\u0178[\u2018\u2019][\u00a4]/g,
        replacement: '👤',
        description: 'Corrupted user emoji'
      },
      { 
        name: 'corrupted_shield',
        pattern: /[\u201c\u201d][\u0161\u2122][\u00ef\u00b8]/g,
        replacement: '🛡️',
        description: 'Corrupted shield emoji'
      },
      { 
        name: 'corrupted_checkmark',
        pattern: /[\u201c\u201d][\u2026]/g,
        replacement: '✅',
        description: 'Corrupted checkmark'
      },
      { 
        name: 'corrupted_warning',
        pattern: /[\u201c\u201d][\u0152]/g,
        replacement: '⚠️',
        description: 'Corrupted warning symbol'
      },
      { 
        name: 'double_question',
        pattern: /\?\?/g,
        replacement: '💡',
        description: 'Double question marks'
      },
      { 
        name: 'corrupted_euro',
        pattern: /[\u00e2\u0082\u00ac]|\u00a0\u00a3|\ufffd/g,
        replacement: '€',
        description: 'Corrupted euro symbol'
      }
    ];
  }

  createBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  createBackup(filePath) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `${path.basename(filePath)}.${timestamp}.backup`;
    const backupPath = path.join(this.backupDir, backupName);
    
    fs.copyFileSync(filePath, backupPath);
    return backupPath;
  }

  validateTSXSyntax(content) {
    // Basic validation checks for TSX files
    const checks = [
      { test: /import.*from.*['"]/g, name: 'imports' },
      { test: /export.*{/g, name: 'exports' },
      { test: /<\/[a-zA-Z]+>/g, name: 'closing_tags' },
      { test: /className=["']/g, name: 'classnames' },
      { test: /\{.*\}/g, name: 'jsx_expressions' }
    ];

    const results = {};
    let isValid = true;

    checks.forEach(({ test, name }) => {
      const matches = content.match(test);
      results[name] = matches ? matches.length : 0;
      
      // Basic sanity checks
      if (name === 'imports' && results[name] === 0) {
        isValid = false;
      }
    });

    // Check for obvious syntax errors
    const syntaxErrors = [
      /import.*[<>]/g,
      /className=.*[<>]/g,
      /from.*[<>]/g
    ];

    syntaxErrors.forEach(errorPattern => {
      if (errorPattern.test(content)) {
        isValid = false;
      }
    });

    return { isValid, results };
  }

  fixCharacters(filePath) {
    try {
      console.log(`🔧 Processing: ${filePath}`);
      
      // Create backup
      const backupPath = this.createBackup(filePath);
      console.log(`📁 Backup created: ${backupPath}`);
      
      // Read original content
      const originalContent = fs.readFileSync(filePath, 'utf8');
      let fixedContent = originalContent;
      let changesMade = [];

      // Apply character fixes
      this.characterMappings.forEach(({ name, pattern, replacement, description }) => {
        const beforeCount = (fixedContent.match(pattern) || []).length;
        if (beforeCount > 0) {
          fixedContent = fixedContent.replace(pattern, replacement);
          const afterCount = (fixedContent.match(pattern) || []).length;
          const actualChanges = beforeCount - afterCount;
          
          if (actualChanges > 0) {
            changesMade.push({
              name,
              description,
              changes: actualChanges
            });
            console.log(`  ✅ ${description}: ${actualChanges} replacements`);
          }
        }
      });

      // Validate the result if it's a TSX file
      if (filePath.endsWith('.tsx')) {
        const validation = this.validateTSXSyntax(fixedContent);
        if (!validation.isValid) {
          console.log(`  ❌ Validation failed for ${filePath}, reverting...`);
          fs.copyFileSync(backupPath, filePath);
          return {
            success: false,
            error: 'Validation failed',
            changes: changesMade,
            backupPath
          };
        }
      }

      // Write the fixed content
      if (changesMade.length > 0) {
        fs.writeFileSync(filePath, fixedContent, 'utf8');
        console.log(`  💾 Fixed ${changesMade.length} character issues in ${filePath}`);
      } else {
        console.log(`  ✨ No issues found in ${filePath}`);
      }

      const result = {
        success: true,
        changes: changesMade,
        backupPath,
        filePath
      };

      this.log.push({
        timestamp: new Date().toISOString(),
        ...result
      });

      return result;

    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
      return {
        success: false,
        error: error.message,
        filePath
      };
    }
  }

  saveLog() {
    fs.writeFileSync(this.logFile, JSON.stringify(this.log, null, 2));
    console.log(`📝 Log saved to ${this.logFile}`);
  }

  processFiles(filePatterns) {
    this.createBackupDir();
    
    const files = [];
    filePatterns.forEach(pattern => {
      const glob = require('glob');
      const matches = glob.sync(pattern);
      files.push(...matches);
    });

    console.log(`🚀 Processing ${files.length} files...`);
    
    const results = files.map(file => this.fixCharacters(file));
    
    this.saveLog();
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`\n📊 Summary:`);
    console.log(`  ✅ Successful: ${successful}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  📁 Backups stored in: ${this.backupDir}`);
    
    return results;
  }
}

// Run the fixer
const fixer = new RobustCharacterFixer();
fixer.processFiles([
  'src/components/**/*.tsx',
  'src/components/**/*.ts'
]);