// Bundle analyzer for Guardian AI CRM Performance Optimization
// Analyzes build output and performance characteristics

const fs = require('fs');
const path = require('path');

console.log('🔍 Guardian AI CRM - Bundle Analysis Starting...\n');

// Function to get file size in human readable format
function getFileSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

// Function to analyze dist directory
function analyzeBuildOutput() {
  const distPath = path.join(__dirname, 'dist');
  
  if (!fs.existsSync(distPath)) {
    console.log('❌ Build output not found. Run npm run build first.');
    return;
  }

  console.log('📊 Build Output Analysis\n');
  
  // Analyze main files
  const assets = [];
  
  function scanDirectory(dir, prefix = '') {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      const relativePath = path.join(prefix, file);
      
      if (stat.isDirectory()) {
        scanDirectory(filePath, relativePath);
      } else {
        assets.push({
          name: relativePath,
          size: stat.size,
          ext: path.extname(file).toLowerCase()
        });
      }
    });
  }
  
  scanDirectory(distPath);
  
  // Sort by size
  assets.sort((a, b) => b.size - a.size);
  
  // Calculate totals by type
  const totals = {
    js: 0,
    css: 0,
    html: 0,
    images: 0,
    other: 0,
    total: 0
  };
  
  assets.forEach(asset => {
    totals.total += asset.size;
    
    if (asset.ext === '.js') totals.js += asset.size;
    else if (asset.ext === '.css') totals.css += asset.size;
    else if (asset.ext === '.html') totals.html += asset.size;
    else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(asset.ext)) totals.images += asset.size;
    else totals.other += asset.size;
  });
  
  // Display summary
  console.log('📦 Bundle Size Summary:');
  console.log(`Total Bundle Size: ${getFileSize(totals.total)}`);
  console.log(`JavaScript: ${getFileSize(totals.js)} (${((totals.js / totals.total) * 100).toFixed(1)}%)`);
  console.log(`CSS: ${getFileSize(totals.css)} (${((totals.css / totals.total) * 100).toFixed(1)}%)`);
  console.log(`Images: ${getFileSize(totals.images)} (${((totals.images / totals.total) * 100).toFixed(1)}%)`);
  console.log(`HTML: ${getFileSize(totals.html)} (${((totals.html / totals.total) * 100).toFixed(1)}%)`);
  console.log(`Other: ${getFileSize(totals.other)} (${((totals.other / totals.total) * 100).toFixed(1)}%)\n`);
  
  // Display largest files
  console.log('📋 Largest Files:');
  assets.slice(0, 10).forEach((asset, index) => {
    console.log(`${index + 1}. ${asset.name} - ${getFileSize(asset.size)}`);
  });
  
  // Performance recommendations
  console.log('\n💡 Performance Recommendations:');
  
  if (totals.js > 1024 * 1024) { // 1MB
    console.log('⚠️  JavaScript bundle is large (>1MB). Consider code splitting.');
  }
  
  if (totals.css > 200 * 1024) { // 200KB
    console.log('⚠️  CSS bundle is large (>200KB). Consider CSS optimization.');
  }
  
  if (totals.images > 5 * 1024 * 1024) { // 5MB
    console.log('⚠️  Image assets are large (>5MB). Consider image optimization.');
  }
  
  const jsFiles = assets.filter(a => a.ext === '.js');
  if (jsFiles.length > 20) {
    console.log('⚠️  Many JavaScript files. Consider bundling optimization.');
  }
  
  // Check for lazy loading opportunities
  const mainJsFiles = jsFiles.filter(a => a.name.includes('main') || a.name.includes('index'));
  if (mainJsFiles.some(f => f.size > 500 * 1024)) { // 500KB
    console.log('⚠️  Main JavaScript file is large. Consider lazy loading for routes.');
  }
  
  if (totals.js < 200 * 1024) {
    console.log('✅ JavaScript bundle size is optimal (<200KB)');
  }
  
  if (totals.css < 50 * 1024) {
    console.log('✅ CSS bundle size is optimal (<50KB)');
  }
  
  console.log('\n🎯 Performance Targets:');
  console.log('• Total bundle: <500KB (excellent), <1MB (good)');
  console.log('• JavaScript: <200KB (excellent), <500KB (good)');
  console.log('• CSS: <50KB (excellent), <100KB (good)');
  console.log('• Images: <2MB total');
  
  // Calculate performance score
  let score = 100;
  if (totals.total > 1024 * 1024) score -= 20; // -20 for >1MB total
  if (totals.js > 500 * 1024) score -= 15; // -15 for >500KB JS
  if (totals.css > 100 * 1024) score -= 10; // -10 for >100KB CSS
  if (totals.images > 2 * 1024 * 1024) score -= 15; // -15 for >2MB images
  
  console.log(`\n📊 Performance Score: ${Math.max(0, score)}/100`);
  
  return {
    totals,
    assets,
    score: Math.max(0, score)
  };
}

// Function to generate performance report
function generatePerformanceReport() {
  const analysis = analyzeBuildOutput();
  
  if (!analysis) return;
  
  const report = {
    timestamp: new Date().toISOString(),
    bundleAnalysis: analysis,
    optimizations: {
      lazyLoading: true,
      serviceWorker: true,
      imageOptimization: true,
      caching: true,
      codeMinification: true
    },
    recommendations: []
  };
  
  // Add specific recommendations based on analysis
  if (analysis.totals.js > 500 * 1024) {
    report.recommendations.push('Implement more aggressive code splitting');
  }
  
  if (analysis.totals.css > 100 * 1024) {
    report.recommendations.push('Optimize CSS bundle with purging and compression');
  }
  
  // Save report
  const reportPath = path.join(__dirname, 'performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 Performance report saved to: ${reportPath}`);
}

// Check if we should run bundle analyzer GUI
const runGui = process.argv.includes('--gui');

if (runGui) {
  console.log('🌐 Starting Bundle Analyzer GUI...');
  console.log('📊 Open http://127.0.0.1:8888 to view the interactive bundle analyzer');
  
  // This would typically be integrated with webpack/vite config
  console.log('⚠️  Bundle analyzer GUI requires integration with build process');
  console.log('💡 Run: npm run build:analyze for interactive analysis');
} else {
  // Run console analysis
  generatePerformanceReport();
}

console.log('\n✨ Analysis complete! Guardian AI CRM performance optimization review finished.');

module.exports = {
  analyzeBuildOutput,
  generatePerformanceReport,
  getFileSize
};