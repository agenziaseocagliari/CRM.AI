#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  rootDir: process.cwd(),
  roadmapFile: 'MASTER_ROADMAP_OCT_2025.md',
  techArchFile: 'TECHNICAL_ARCHITECTURE.md',
  dailyReportDir: 'docs/daily-reports',
};

// ============================================
// MAIN FUNCTION
// ============================================
async function generateReport() {
  console.log('🚀 Starting automated documentation update...');
  console.log(`📅 Date: ${new Date().toISOString()}\n`);

  try {
    // Collect data
    const report = {
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      files: analyzeFileStructure(),
      commits: analyzeRecentCommits(),
      migrations: analyzeMigrations(),
      dependencies: analyzeDependencies(),
      metrics: calculateProjectMetrics(),
    };

    console.log('📊 Analysis complete:', JSON.stringify(report.metrics, null, 2));

    // Update documents
    updateRoadmap(report);
    updateTechArchitecture(report);
    createDailyReport(report);

    console.log('\n✅ All documentation updated successfully!');
    return 0;
  } catch (error) {
    console.error('❌ Error during documentation update:', error);
    return 1;
  }
}

// ============================================
// ANALYSIS FUNCTIONS
// ============================================

function analyzeFileStructure() {
  console.log('📁 Analyzing file structure...');

  const countFiles = (pattern) => {
    try {
      const cmd = process.platform === 'win32'
        ? `dir /s /b ${pattern} 2>nul | find /c /v ""`
        : `find . -name "${pattern}" -not -path "*/node_modules/*" | wc -l`;
      const output = execSync(cmd, { encoding: 'utf8', cwd: CONFIG.rootDir });
      return parseInt(output.trim()) || 0;
    } catch {
      return 0;
    }
  };

  return {
    tsx: countFiles('*.tsx'),
    ts: countFiles('*.ts'),
    sql: countFiles('*.sql'),
    total: countFiles('*.*'),
  };
}

function analyzeRecentCommits() {
  console.log('📝 Analyzing recent commits...');

  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const since = yesterday.toISOString().split('T')[0];

    const logCmd = `git log --since="${since}" --pretty=format:"%h|%an|%s|%ad" --date=short`;
    const output = execSync(logCmd, { encoding: 'utf8', cwd: CONFIG.rootDir });

    if (!output.trim()) return [];

    return output.trim().split('\n').map(line => {
      const [hash, author, message, date] = line.split('|');
      return { hash, author, message, date };
    });
  } catch (error) {
    console.warn('⚠️ Could not analyze commits:', error.message);
    return [];
  }
}

function analyzeMigrations() {
  console.log('🗄️ Analyzing database migrations...');

  const migrationsDir = path.join(CONFIG.rootDir, 'supabase', 'migrations');

  try {
    if (!fs.existsSync(migrationsDir)) return [];

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort()
      .reverse()
      .slice(0, 5);

    return files.map(file => {
      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      const tables = (content.match(/CREATE TABLE\s+(\w+)/gi) || [])
        .map(m => m.replace(/CREATE TABLE\s+/i, ''));
      return { file, tables, date: file.split('_')[0] };
    });
  } catch (error) {
    console.warn('⚠️ Could not analyze migrations:', error.message);
    return [];
  }
}

function analyzeDependencies() {
  console.log('📦 Analyzing dependencies...');

  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(CONFIG.rootDir, 'package.json'), 'utf8')
    );

    return {
      dependencies: Object.keys(packageJson.dependencies || {}).length,
      devDependencies: Object.keys(packageJson.devDependencies || {}).length,
      total: Object.keys(packageJson.dependencies || {}).length + 
             Object.keys(packageJson.devDependencies || {}).length,
    };
  } catch (error) {
    console.warn('⚠️ Could not analyze dependencies:', error.message);
    return { dependencies: 0, devDependencies: 0, total: 0 };
  }
}

function calculateProjectMetrics() {
  console.log('📈 Calculating project metrics...');

  const files = analyzeFileStructure();

  // Estimate lines of code
  let linesOfCode = 0;
  try {
    const cmd = process.platform === 'win32'
      ? 'powershell "(Get-ChildItem -Path src -Recurse -Include *.tsx,*.ts | Get-Content | Measure-Object -Line).Lines"'
      : 'find src -name "*.tsx" -o -name "*.ts" | xargs wc -l 2>/dev/null | tail -1 | awk \'{print $1}\'';
    const output = execSync(cmd, { encoding: 'utf8', cwd: CONFIG.rootDir });
    linesOfCode = parseInt(output.trim()) || 0;
  } catch {
    linesOfCode = files.tsx * 80 + files.ts * 60; // Estimate
  }

  return {
    totalFiles: files.total,
    typeScriptFiles: files.tsx + files.ts,
    linesOfCode,
    lastUpdate: new Date().toISOString(),
  };
}

// ============================================
// UPDATE FUNCTIONS
// ============================================

function updateRoadmap(report) {
  console.log('📝 Updating ROADMAP...');

  const roadmapPath = path.join(CONFIG.rootDir, CONFIG.roadmapFile);

  if (!fs.existsSync(roadmapPath)) {
    console.warn(`⚠️ ${CONFIG.roadmapFile} not found, skipping`);
    return;
  }

  let content = fs.readFileSync(roadmapPath, 'utf8');

  // Find changelog section
  const changelogMarker = '## 📝 CHANGELOG (Most Recent First)';
  const changelogIndex = content.indexOf(changelogMarker);

  if (changelogIndex === -1) {
    console.warn('⚠️ CHANGELOG section not found in ROADMAP');
    return;
  }

  // Generate changelog entry
  const today = new Date().toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  let newEntry = `\n\n### **${today}** - Automated Daily Update 🤖\n\n`;

  // Analyze commits for changes
  const changes = [];
  report.commits.forEach(commit => {
    const msg = commit.message.toLowerCase();
    if (msg.includes('feat:') || msg.includes('feature:')) {
      changes.push(`✅ ${commit.message}`);
    } else if (msg.includes('fix:')) {
      changes.push(`🔧 ${commit.message}`);
    } else if (msg.includes('docs:')) {
      changes.push(`📚 ${commit.message}`);
    } else if (!msg.includes('[skip ci]')) {
      changes.push(`🔄 ${commit.message}`);
    }
  });

  if (changes.length === 0) {
    changes.push('🔄 Project maintenance and routine updates');
  }

  newEntry += changes.map(c => `- ${c}`).join('\n');

  // Add metrics
  newEntry += `\n\n**Daily Metrics**:\n`;
  newEntry += `- Total files: ${report.metrics.totalFiles}\n`;
  newEntry += `- TypeScript files: ${report.metrics.typeScriptFiles}\n`;
  newEntry += `- Lines of code: ~${report.metrics.linesOfCode.toLocaleString()}\n`;
  newEntry += `- Commits today: ${report.commits.length}\n`;
  newEntry += `- Recent migrations: ${report.migrations.length}\n`;
  newEntry += `- Dependencies: ${report.dependencies.total}`;

  // Insert after marker
  const insertPosition = changelogIndex + changelogMarker.length;
  content = content.slice(0, insertPosition) + newEntry + content.slice(insertPosition);

  fs.writeFileSync(roadmapPath, content, 'utf8');
  console.log('✅ ROADMAP updated successfully');
}

function updateTechArchitecture(report) {
  console.log('🏗️ Updating TECHNICAL_ARCHITECTURE...');

  const techArchPath = path.join(CONFIG.rootDir, CONFIG.techArchFile);

  if (!fs.existsSync(techArchPath)) {
    console.warn(`⚠️ ${CONFIG.techArchFile} not found, skipping`);
    return;
  }

  let content = fs.readFileSync(techArchPath, 'utf8');

  // Update "Last Updated" timestamp
  const dateStr = new Date().toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  content = content.replace(
    /\*\*Last Updated\*\*: .*/,
    `**Last Updated**: ${dateStr}`
  );

  // Update metrics section if exists
  if (content.includes('## 📊 PROJECT METRICS')) {
    const metricsUpdate = `## 📊 PROJECT METRICS

**Total Files**: ${report.metrics.totalFiles}  
**TypeScript Files**: ${report.metrics.typeScriptFiles}  
**Lines of Code**: ~${report.metrics.linesOfCode.toLocaleString()}  
**Database Migrations**: ${report.migrations.length}+  
**Dependencies**: ${report.dependencies.total}  
**Last Analysis**: ${report.timestamp}

`;

    content = content.replace(
      /## 📊 PROJECT METRICS[\s\S]*?(?=\n## |\n---|\Z)/,
      metricsUpdate
    );
  }

  fs.writeFileSync(techArchPath, content, 'utf8');
  console.log('✅ TECHNICAL_ARCHITECTURE updated successfully');
}

function createDailyReport(report) {
  console.log('📊 Creating daily report...');

  const reportDir = path.join(CONFIG.rootDir, CONFIG.dailyReportDir);

  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportFile = path.join(reportDir, `DAILY_${report.date}.md`);

  const reportContent = `# 📊 Daily Report - ${report.date}

**Generated**: ${new Date().toLocaleString('it-IT')}

## 📈 Summary

| Metric | Value |
|--------|-------|
| Total Files | ${report.metrics.totalFiles} |
| TypeScript Files | ${report.metrics.typeScriptFiles} |
| Lines of Code | ~${report.metrics.linesOfCode.toLocaleString()} |
| Commits (24h) | ${report.commits.length} |
| Database Migrations | ${report.migrations.length} |
| Dependencies | ${report.dependencies.total} |

## 📝 Recent Commits (Last 24h)

${report.commits.length > 0
  ? report.commits.map(c => `- \`${c.hash}\` ${c.author}: ${c.message} (${c.date})`).join('\n')
  : 'No commits in the last 24 hours'
}

## 🗄️ Recent Database Migrations

${report.migrations.length > 0
  ? report.migrations.map(m => `- **${m.file}**\n  - Tables: ${m.tables.join(', ') || 'none'}`).join('\n')
  : 'No recent migrations'
}

## 📦 Dependencies

- **Production**: ${report.dependencies.dependencies}
- **Development**: ${report.dependencies.devDependencies}
- **Total**: ${report.dependencies.total}

## 📁 File Structure

- **TSX Components**: ${report.files.tsx}
- **TypeScript Files**: ${report.files.ts}
- **SQL Migrations**: ${report.files.sql}
- **Total Project Files**: ${report.files.total}

---
✨ *Generated automatically by Documentation Bot*
`;

  fs.writeFileSync(reportFile, reportContent, 'utf8');
  console.log(`✅ Daily report created: ${reportFile}`);
}

// ============================================
// EXECUTE
// ============================================

// Always execute when run directly
if (true) {
  generateReport()
    .then(code => process.exit(code))
    .catch(err => {
      console.error('💥 Fatal error:', err);
      process.exit(1);
    });
}

export { generateReport };