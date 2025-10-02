#!/usr/bin/env node

/**
 * Vercel Metrics Monitor
 * 
 * Script per monitorare l'utilizzo delle risorse Vercel e generare report.
 * 
 * Prerequisiti:
 * - VERCEL_TOKEN: Token API Vercel
 * - VERCEL_TEAM_ID: ID del team Vercel (opzionale per account personali)
 * 
 * Uso:
 *   node scripts/vercel-metrics.js
 *   VERCEL_TOKEN=xxx VERCEL_TEAM_ID=yyy node scripts/vercel-metrics.js
 */

const https = require('https');

// Configurazione
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const TEAM_ID = process.env.VERCEL_TEAM_ID;
const PROJECT_NAME = 'crm-ai'; // Modifica con il nome del tuo progetto

// Colori per output console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Esegue chiamata API Vercel
 */
function vercelApiRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: endpoint,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          reject(new Error(`API error: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

/**
 * Ottiene lista deployments
 */
async function getDeployments() {
  const teamParam = TEAM_ID ? `&teamId=${TEAM_ID}` : '';
  const endpoint = `/v6/deployments?projectName=${PROJECT_NAME}${teamParam}&limit=100`;
  return await vercelApiRequest(endpoint);
}

/**
 * Ottiene informazioni progetto
 */
async function getProjectInfo() {
  const teamParam = TEAM_ID ? `?teamId=${TEAM_ID}` : '';
  const endpoint = `/v9/projects/${PROJECT_NAME}${teamParam}`;
  return await vercelApiRequest(endpoint);
}

/**
 * Calcola metriche dai deployments
 */
function calculateMetrics(deployments) {
  const now = Date.now();
  const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

  const metrics = {
    total: {
      all: 0,
      production: 0,
      preview: 0,
    },
    last7Days: {
      all: 0,
      production: 0,
      preview: 0,
    },
    last30Days: {
      all: 0,
      production: 0,
      preview: 0,
    },
    status: {
      ready: 0,
      error: 0,
      building: 0,
      canceled: 0,
    },
    activePreview: 0,
    oldestPreview: null,
  };

  deployments.forEach(deployment => {
    const createdAt = deployment.created || deployment.createdAt || 0;
    const isProduction = deployment.target === 'production';
    const isPreview = !isProduction;
    const state = deployment.state || deployment.readyState;

    // Total counts
    metrics.total.all++;
    if (isProduction) metrics.total.production++;
    if (isPreview) metrics.total.preview++;

    // Time-based counts
    if (createdAt >= sevenDaysAgo) {
      metrics.last7Days.all++;
      if (isProduction) metrics.last7Days.production++;
      if (isPreview) metrics.last7Days.preview++;
    }

    if (createdAt >= thirtyDaysAgo) {
      metrics.last30Days.all++;
      if (isProduction) metrics.last30Days.production++;
      if (isPreview) metrics.last30Days.preview++;
    }

    // Status counts
    if (state === 'READY') metrics.status.ready++;
    else if (state === 'ERROR') metrics.status.error++;
    else if (state === 'BUILDING') metrics.status.building++;
    else if (state === 'CANCELED') metrics.status.canceled++;

    // Active preview count
    if (isPreview && state === 'READY') {
      metrics.activePreview++;
      if (!metrics.oldestPreview || createdAt < metrics.oldestPreview) {
        metrics.oldestPreview = createdAt;
      }
    }
  });

  return metrics;
}

/**
 * Stampa report formattato
 */
function printReport(metrics, projectInfo) {
  console.log('\n' + colors.cyan + colors.bright + '═'.repeat(70) + colors.reset);
  console.log(colors.cyan + colors.bright + '  📊 VERCEL DEPLOYMENT METRICS - Guardian AI CRM' + colors.reset);
  console.log(colors.cyan + colors.bright + '═'.repeat(70) + colors.reset + '\n');

  // Project Info
  console.log(colors.bright + '📦 Project Information' + colors.reset);
  console.log(`   Name: ${colors.blue}${projectInfo.name || 'N/A'}${colors.reset}`);
  console.log(`   Framework: ${colors.blue}${projectInfo.framework || 'N/A'}${colors.reset}`);
  console.log(`   Created: ${colors.blue}${projectInfo.createdAt ? new Date(projectInfo.createdAt).toLocaleDateString() : 'N/A'}${colors.reset}\n`);

  // Deployment Summary
  console.log(colors.bright + '🚀 Deployment Summary' + colors.reset);
  console.log(`   Total Deployments: ${colors.blue}${metrics.total.all}${colors.reset}`);
  console.log(`   ├─ Production: ${colors.green}${metrics.total.production}${colors.reset}`);
  console.log(`   └─ Preview: ${colors.yellow}${metrics.total.preview}${colors.reset}\n`);

  // Recent Activity
  console.log(colors.bright + '📅 Recent Activity' + colors.reset);
  console.log(`   Last 7 Days: ${colors.blue}${metrics.last7Days.all}${colors.reset} deployments`);
  console.log(`   ├─ Production: ${colors.green}${metrics.last7Days.production}${colors.reset}`);
  console.log(`   └─ Preview: ${colors.yellow}${metrics.last7Days.preview}${colors.reset}`);
  console.log(`   \n   Last 30 Days: ${colors.blue}${metrics.last30Days.all}${colors.reset} deployments`);
  console.log(`   ├─ Production: ${colors.green}${metrics.last30Days.production}${colors.reset}`);
  console.log(`   └─ Preview: ${colors.yellow}${metrics.last30Days.preview}${colors.reset}\n`);

  // Status Distribution
  console.log(colors.bright + '✅ Deployment Status' + colors.reset);
  console.log(`   Ready: ${colors.green}${metrics.status.ready}${colors.reset}`);
  console.log(`   Error: ${colors.red}${metrics.status.error}${colors.reset}`);
  console.log(`   Building: ${colors.yellow}${metrics.status.building}${colors.reset}`);
  console.log(`   Canceled: ${colors.yellow}${metrics.status.canceled}${colors.reset}\n`);

  // Active Previews
  console.log(colors.bright + '👁️  Active Preview Environments' + colors.reset);
  console.log(`   Active Previews: ${colors.blue}${metrics.activePreview}${colors.reset}`);
  
  if (metrics.oldestPreview) {
    const age = Math.floor((Date.now() - metrics.oldestPreview) / (1000 * 60 * 60 * 24));
    const ageColor = age > 7 ? colors.red : age > 3 ? colors.yellow : colors.green;
    console.log(`   Oldest Preview: ${ageColor}${age} days old${colors.reset}`);
  }
  console.log();

  // Success Rate
  const totalRecent = metrics.last30Days.all;
  const successRate = totalRecent > 0 
    ? ((metrics.status.ready / totalRecent) * 100).toFixed(1)
    : 0;
  const successColor = successRate >= 95 ? colors.green : successRate >= 80 ? colors.yellow : colors.red;
  
  console.log(colors.bright + '📈 Build Success Rate (30 days)' + colors.reset);
  console.log(`   ${successColor}${successRate}%${colors.reset} (${metrics.status.ready}/${totalRecent} successful)\n`);

  // Warnings & Recommendations
  const warnings = [];
  
  if (metrics.activePreview > 10) {
    warnings.push(`⚠️  ${colors.yellow}Too many active previews (${metrics.activePreview}). Consider cleanup.${colors.reset}`);
  }
  
  if (metrics.oldestPreview && (Date.now() - metrics.oldestPreview) > (7 * 24 * 60 * 60 * 1000)) {
    warnings.push(`⚠️  ${colors.yellow}Old preview environments detected. Run cleanup workflow.${colors.reset}`);
  }
  
  if (successRate < 90) {
    warnings.push(`⚠️  ${colors.yellow}Build success rate is low (${successRate}%). Review failed builds.${colors.reset}`);
  }
  
  if (metrics.last7Days.preview > 20) {
    warnings.push(`⚠️  ${colors.yellow}High preview deployment rate (${metrics.last7Days.preview}/week). Check branch strategy.${colors.reset}`);
  }

  if (warnings.length > 0) {
    console.log(colors.bright + '⚠️  Warnings & Recommendations' + colors.reset);
    warnings.forEach(warning => console.log(`   ${warning}`));
    console.log();
  } else {
    console.log(colors.green + colors.bright + '✅ All metrics look good!' + colors.reset + '\n');
  }

  // Cost Estimation (rough)
  console.log(colors.bright + '💰 Estimated Monthly Usage' + colors.reset);
  const monthlyDeploys = Math.round((metrics.last30Days.all / 30) * 30);
  const estimatedBuildMinutes = monthlyDeploys * 2; // Assume 2 min average per build
  
  console.log(`   Projected Deployments/Month: ${colors.blue}~${monthlyDeploys}${colors.reset}`);
  console.log(`   Estimated Build Minutes: ${colors.blue}~${estimatedBuildMinutes} min${colors.reset}`);
  
  const withinHobbyLimits = estimatedBuildMinutes < 6000;
  const limitColor = withinHobbyLimits ? colors.green : colors.red;
  console.log(`   Hobby Plan Limit: ${limitColor}${estimatedBuildMinutes}/6000 min (${((estimatedBuildMinutes/6000)*100).toFixed(1)}%)${colors.reset}\n`);

  console.log(colors.cyan + colors.bright + '═'.repeat(70) + colors.reset + '\n');
}

/**
 * Main
 */
async function main() {
  console.log(colors.cyan + '\n🔍 Fetching Vercel metrics...\n' + colors.reset);

  if (!VERCEL_TOKEN) {
    console.error(colors.red + '❌ Error: VERCEL_TOKEN environment variable is required' + colors.reset);
    console.log('\nUsage:');
    console.log('  VERCEL_TOKEN=xxx node scripts/vercel-metrics.js\n');
    process.exit(1);
  }

  try {
    // Fetch data
    const [deploymentsData, projectInfo] = await Promise.all([
      getDeployments(),
      getProjectInfo(),
    ]);

    const deployments = deploymentsData.deployments || [];

    if (deployments.length === 0) {
      console.log(colors.yellow + '⚠️  No deployments found for this project' + colors.reset);
      return;
    }

    // Calculate metrics
    const metrics = calculateMetrics(deployments);

    // Print report
    printReport(metrics, projectInfo);

  } catch (error) {
    console.error(colors.red + '❌ Error fetching metrics:' + colors.reset, error.message);
    console.log('\nTroubleshooting:');
    console.log('  1. Verify VERCEL_TOKEN is valid');
    console.log('  2. Check project name matches your Vercel project');
    console.log('  3. If using team account, set VERCEL_TEAM_ID\n');
    process.exit(1);
  }
}

// Run
main();
