// Build Analyzer for Guardian AI CRM
// Analyzes bundle size, chunks, and optimization opportunities

const fs = require('fs');
const path = require('path');

class BuildAnalyzer {
  constructor(distPath = './dist') {
    this.distPath = distPath;
    this.analysis = {
      totalSize: 0,
      chunks: [],
      assets: [],
      recommendations: []
    };
  }

  analyzeBundle() {
    console.log('📊 Starting bundle analysis...');

    if (!fs.existsSync(this.distPath)) {
      console.error('❌ Dist folder not found. Run npm run build first.');
      return;
    }

    this.analyzeBundleSize();
    this.analyzeChunks();
    this.analyzeAssets();
    this.generateRecommendations();
    this.generateReport();
  }

  analyzeBundleSize() {
    const getDirectorySize = (dirPath) => {
      let totalSize = 0;
      const files = fs.readdirSync(dirPath);

      files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          totalSize += getDirectorySize(filePath);
        } else {
          totalSize += stat.size;
        }
      });

      return totalSize;
    };

    this.analysis.totalSize = getDirectorySize(this.distPath);
    console.log(`📦 Total bundle size: ${this.analysis.totalSize}`);
  }

  analyzeChunks() {
    const jsDir = path.join(this.distPath, 'js');
    if (!fs.existsSync(jsDir)) return;

    const jsFiles = fs.readdirSync(jsDir).filter(file => file.endsWith('.js'));

    jsFiles.forEach(file => {
      const filePath = path.join(jsDir, file);
      const stat = fs.statSync(filePath);

      this.analysis.chunks.push({
        name: file,
        size: stat.size,
        type: this.getChunkType(file)
      });
    });

    // Sort by size
    this.analysis.chunks.sort((a, b) => b.size - a.size);

    console.log('🧩 Chunk analysis:');
    this.analysis.chunks.slice(0, 5).forEach(chunk => {
      console.log(`  ${chunk.name}: ${(chunk.size / 1024).toFixed(2)}KB`);
    });
  }

  analyzeAssets() {
    const analyzeDirectory = (dirPath, category) => {
      if (!fs.existsSync(dirPath)) return;

      const files = fs.readdirSync(dirPath);
      files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isFile()) {
          this.analysis.assets.push({
            name: file,
            path: filePath,
            size: stat.size,
            category
          });
        }
      });
    };

    // Analyze different asset types
    analyzeDirectory(path.join(this.distPath, 'images'), 'image');
    analyzeDirectory(path.join(this.distPath, 'fonts'), 'font');
    analyzeDirectory(path.join(this.distPath, 'styles'), 'css');

    console.log('📊 Assets analyzed:', this.analysis.assets.length);
  }

  getChunkType(filename) {
    if (filename.includes('vendor')) return 'vendor';
    if (filename.includes('main') || filename.includes('index')) return 'main';
    if (filename.includes('lazy') || filename.includes('async')) return 'lazy';
    return 'other';
  }

  generateRecommendations() {
    const largeChunks = this.analysis.chunks.filter(chunk => chunk.size > 500000); // 500KB
    const largeAssets = this.analysis.assets.filter(asset => asset.size > 100000); // 100KB

    if (largeChunks.length > 0) {
      this.analysis.recommendations.push({
        type: 'chunk-splitting',
        message: `Consider splitting large chunks: ${largeChunks.map(c => c.name).join(', ')}`,
        impact: 'high'
      });
    }

    if (largeAssets.length > 0) {
      this.analysis.recommendations.push({
        type: 'asset-optimization',
        message: `Optimize large assets: ${largeAssets.map(a => a.name).join(', ')}`,
        impact: 'medium'
      });
    }

    if (this.analysis.totalSize > 2000000) { // 2MB
      this.analysis.recommendations.push({
        type: 'bundle-size',
        message: 'Total bundle size exceeds 2MB. Consider lazy loading and code splitting.',
        impact: 'high'
      });
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      analysis: this.analysis,
      performance: {
        score: this.calculatePerformanceScore(),
        grade: this.getPerformanceGrade()
      }
    };

    // Save to file
    const reportPath = path.join(this.distPath, 'bundle-analysis.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\\n📋 Bundle Analysis Report:');
    console.log(`Performance Score: ${report.performance.score}/100 (${report.performance.grade})`);
    console.log(`Total Size: ${this.analysis.totalSize}`);
    console.log(`Chunks: ${this.analysis.chunks.length}`);
    console.log(`Assets: ${this.analysis.assets.length}`);

    if (this.analysis.recommendations.length > 0) {
      console.log('\\n⚠️ Recommendations:');
      this.analysis.recommendations.forEach(rec => {
        console.log(`  • ${rec}`);
      });
    }

    console.log(`\\n📄 Full report saved to: ${reportPath}`);
  }

  calculatePerformanceScore() {
    let score = 100;

    // Deduct points for large bundle
    if (this.analysis.totalSize > 1000000) score -= 20; // 1MB
    if (this.analysis.totalSize > 2000000) score -= 30; // 2MB

    // Deduct points for large chunks
    const largeChunks = this.analysis.chunks.filter(c => c.size > 500000);
    score -= largeChunks.length * 10;

    // Deduct points for too many chunks
    if (this.analysis.chunks.length > 10) score -= 10;

    return Math.max(0, score);
  }

  getPerformanceGrade() {
    const score = this.calculatePerformanceScore();
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// CLI interface
if (require.main === module) {
  const analyzer = new BuildAnalyzer();
  analyzer.analyzeBundle();
}

module.exports = BuildAnalyzer;
