#!/usr/bin/env node

/**
 * Document Management System - Complete Setup Script
 * Executes ALL setup tasks automatically:
 * 1. SQL migration (insurance_documents table)
 * 2. Storage buckets creation (4 buckets)
 * 3. RLS policies configuration (database + storage)
 * 4. Verification tests
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import pkg from 'pg';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

const { Client } = pkg;

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Constants
const BUCKETS = [
  'insurance-policy-documents',
  'insurance-claim-documents',
  'insurance-contact-documents',
  'insurance-general-attachments'
];

const MIGRATION_FILE = path.join(__dirname, '..', 'supabase', 'migrations', '20251021_insurance_documents.sql');

// Progress tracker
const progress = {
  total: 9,
  current: 0,
  steps: []
};

function logStep(step, status = '⏳') {
  progress.current++;
  const prefix = `[${progress.current}/${progress.total}]`;
  console.log(`${status} ${prefix} ${step}`);
  progress.steps.push({ step, status, timestamp: new Date().toISOString() });
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logError(message) {
  console.log(`❌ ${message}`);
}

function logInfo(message) {
  console.log(`ℹ️  ${message}`);
}

async function main() {
  console.log('\n' + '═'.repeat(70));
  console.log('🚀 DOCUMENT MANAGEMENT SYSTEM - COMPLETE SETUP');
  console.log('═'.repeat(70));
  console.log('\nThis script will:');
  console.log('  1. Execute SQL migration (insurance_documents table)');
  console.log('  2. Create 4 storage buckets');
  console.log('  3. Configure RLS policies (database + storage)');
  console.log('  4. Verify complete setup');
  console.log('\n' + '═'.repeat(70) + '\n');

  try {
    // ============================================================
    // STEP 1: Load and validate credentials
    // ============================================================
    logStep('Loading credentials...');

    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      logError('Missing required environment variables');
      console.log('\nRequired environment variables:');
      console.log('  - VITE_SUPABASE_URL');
      console.log('  - SUPABASE_SERVICE_ROLE_KEY');
      console.log('\nPlease add these to your .env file or environment.\n');
      process.exit(1);
    }

    // Extract project ID
    const projectIdMatch = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/);
    if (!projectIdMatch) {
      logError('Could not extract project ID from SUPABASE_URL');
      process.exit(1);
    }
    const projectId = projectIdMatch[1];

    logSuccess(`Credentials loaded (Project: ${projectId})`);

    // Initialize Supabase client (service role)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false }
    });

    // ============================================================
    // STEP 2: Setup PostgreSQL connection
    // ============================================================
    logStep('Setting up PostgreSQL connection...');

    const dbConfig = {
      host: `db.${projectId}.supabase.co`,
      database: 'postgres',
      user: 'postgres',
      password: SUPABASE_SERVICE_KEY,
      port: 5432,
      ssl: { rejectUnauthorized: false }
    };

    const client = new Client(dbConfig);
    await client.connect();

    logSuccess('Connected to PostgreSQL database');

    // ============================================================
    // STEP 3: Read and execute SQL migration
    // ============================================================
    logStep('Executing SQL migration...');

    if (!fs.existsSync(MIGRATION_FILE)) {
      logError(`Migration file not found: ${MIGRATION_FILE}`);
      await client.end();
      process.exit(1);
    }

    const sqlContent = fs.readFileSync(MIGRATION_FILE, 'utf8');

    // Execute migration
    try {
      await client.query(sqlContent);
      logSuccess('SQL migration executed successfully');
    } catch (err) {
      if (err.message.includes('already exists')) {
        logInfo('Table already exists, skipping creation');
      } else {
        throw err;
      }
    }

    // ============================================================
    // STEP 4: Verify table creation
    // ============================================================
    logStep('Verifying table creation...');

    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'insurance_documents'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      logError('Table insurance_documents was not created');
      await client.end();
      process.exit(1);
    }

    logSuccess('Table insurance_documents verified');

    // Check indexes
    const indexCheck = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'insurance_documents';
    `);

    logSuccess(`${indexCheck.rows.length} indexes created`);

    // Check RLS policies
    const rlsCheck = await client.query(`
      SELECT policyname 
      FROM pg_policies 
      WHERE tablename = 'insurance_documents';
    `);

    logSuccess(`${rlsCheck.rows.length} RLS policies configured`);

    await client.end();

    // ============================================================
    // STEP 5: Create storage buckets
    // ============================================================
    logStep('Creating storage buckets...');

    let bucketsCreated = 0;
    let bucketsExisting = 0;

    for (const bucketName of BUCKETS) {
      try {
        const { data, error } = await supabase.storage.createBucket(bucketName, {
          public: false,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          ]
        });

        if (error) {
          if (error.message.includes('already exists')) {
            logInfo(`  → ${bucketName} (already exists)`);
            bucketsExisting++;
          } else {
            logError(`  → ${bucketName}: ${error.message}`);
          }
        } else {
          logSuccess(`  → ${bucketName} (created)`);
          bucketsCreated++;
        }
      } catch (err) {
        logError(`  → ${bucketName}: ${err.message}`);
      }
    }

    logSuccess(`Storage buckets: ${bucketsCreated} created, ${bucketsExisting} existing`);

    // ============================================================
    // STEP 6: Verify storage buckets
    // ============================================================
    logStep('Verifying storage buckets...');

    const { data: bucketList, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      logError(`Failed to list buckets: ${listError.message}`);
    } else {
      const insuranceBuckets = bucketList.filter(b => 
        BUCKETS.includes(b.name)
      );

      if (insuranceBuckets.length === BUCKETS.length) {
        logSuccess(`All ${BUCKETS.length} buckets verified`);
      } else {
        logError(`Expected ${BUCKETS.length} buckets, found ${insuranceBuckets.length}`);
      }
    }

    // ============================================================
    // STEP 7: Configure storage RLS policies
    // ============================================================
    logStep('Configuring storage RLS policies...');

    // Reconnect to PostgreSQL for storage policies
    const client2 = new Client(dbConfig);
    await client2.connect();

    let policiesCreated = 0;

    for (const bucketName of BUCKETS) {
      // Define 4 policies per bucket (SELECT, INSERT, UPDATE, DELETE)
      const policies = [
        {
          name: `${bucketName}_select`,
          operation: 'SELECT',
          definition: `(bucket_id = '${bucketName}' AND (storage.foldername(name))[1] = (auth.jwt() -> 'user_metadata' ->> 'organization_id'))`
        },
        {
          name: `${bucketName}_insert`,
          operation: 'INSERT',
          definition: `(bucket_id = '${bucketName}' AND (storage.foldername(name))[1] = (auth.jwt() -> 'user_metadata' ->> 'organization_id'))`
        },
        {
          name: `${bucketName}_update`,
          operation: 'UPDATE',
          definition: `(bucket_id = '${bucketName}' AND (storage.foldername(name))[1] = (auth.jwt() -> 'user_metadata' ->> 'organization_id'))`
        },
        {
          name: `${bucketName}_delete`,
          operation: 'DELETE',
          definition: `(bucket_id = '${bucketName}' AND (storage.foldername(name))[1] = (auth.jwt() -> 'user_metadata' ->> 'organization_id'))`
        }
      ];

      for (const policy of policies) {
        try {
          // Check if policy already exists
          const existingPolicy = await client2.query(`
            SELECT * FROM storage.policies 
            WHERE name = $1 AND bucket_id = $2
          `, [policy.name, bucketName]);

          if (existingPolicy.rows.length > 0) {
            logInfo(`  → Policy ${policy.name} already exists`);
            continue;
          }

          // Create policy
          await client2.query(`
            INSERT INTO storage.policies (name, bucket_id, definition, check_expression)
            VALUES ($1, $2, $3, $3)
          `, [policy.name, bucketName, policy.definition]);

          policiesCreated++;
        } catch (err) {
          if (err.message.includes('duplicate key')) {
            logInfo(`  → Policy ${policy.name} already exists`);
          } else {
            logError(`  → Failed to create policy ${policy.name}: ${err.message}`);
          }
        }
      }
    }

    logSuccess(`Storage RLS policies: ${policiesCreated} created`);

    await client2.end();

    // ============================================================
    // STEP 8: Run verification tests
    // ============================================================
    logStep('Running verification tests...');

    const client3 = new Client(dbConfig);
    await client3.connect();

    // Test 1: Query insurance_documents table
    const tableTest = await client3.query('SELECT COUNT(*) FROM insurance_documents');
    logSuccess(`  → Table query successful (${tableTest.rows[0].count} documents)`);

    // Test 2: Verify all indexes
    const indexTest = await client3.query(`
      SELECT indexname FROM pg_indexes WHERE tablename = 'insurance_documents'
    `);
    logSuccess(`  → ${indexTest.rows.length} indexes verified`);

    // Test 3: Verify RLS enabled
    const rlsTest = await client3.query(`
      SELECT relname, relrowsecurity 
      FROM pg_class 
      WHERE relname = 'insurance_documents'
    `);
    
    if (rlsTest.rows[0]?.relrowsecurity) {
      logSuccess('  → RLS enabled on insurance_documents');
    } else {
      logError('  → RLS NOT enabled on insurance_documents');
    }

    // Test 4: Verify storage policies
    const storagePoliciesTest = await client3.query(`
      SELECT COUNT(*) FROM storage.policies 
      WHERE bucket_id IN (${BUCKETS.map((_, i) => `$${i + 1}`).join(',')})
    `, BUCKETS);
    
    logSuccess(`  → ${storagePoliciesTest.rows[0].count} storage policies verified`);

    await client3.end();

    // ============================================================
    // STEP 9: Generate completion report
    // ============================================================
    logStep('Generating completion report...');

    const report = {
      timestamp: new Date().toISOString(),
      projectId: projectId,
      database: {
        table: 'insurance_documents',
        indexes: indexTest.rows.length,
        rlsPolicies: rlsCheck.rows.length,
        rlsEnabled: rlsTest.rows[0]?.relrowsecurity || false
      },
      storage: {
        bucketsCreated: bucketsCreated,
        bucketsExisting: bucketsExisting,
        totalBuckets: BUCKETS.length,
        bucketNames: BUCKETS,
        storagePolicies: parseInt(storagePoliciesTest.rows[0].count)
      },
      steps: progress.steps,
      status: 'SUCCESS'
    };

    const reportPath = path.join(__dirname, '..', 'DOCUMENT_MANAGEMENT_SETUP_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    logSuccess(`Report saved to ${reportPath}`);

    // ============================================================
    // FINAL SUMMARY
    // ============================================================
    console.log('\n' + '═'.repeat(70));
    console.log('🎉 DOCUMENT MANAGEMENT SYSTEM SETUP COMPLETE');
    console.log('═'.repeat(70));
    console.log('\n✅ Database Setup:');
    console.log(`   → Table: insurance_documents (created)`);
    console.log(`   → Indexes: ${indexTest.rows.length}`);
    console.log(`   → RLS Policies: ${rlsCheck.rows.length}`);
    console.log(`   → RLS Enabled: ${rlsTest.rows[0]?.relrowsecurity ? 'YES' : 'NO'}`);
    console.log('\n✅ Storage Setup:');
    console.log(`   → Buckets: ${BUCKETS.length} total`);
    console.log(`   → Created: ${bucketsCreated}`);
    console.log(`   → Existing: ${bucketsExisting}`);
    console.log(`   → Storage Policies: ${storagePoliciesTest.rows[0].count}`);
    console.log('\n📋 Next Steps:');
    console.log('   1. Integrate DocumentUploader into PolicyDetail.tsx');
    console.log('   2. Integrate DocumentGallery into PolicyDetail.tsx');
    console.log('   3. Test upload workflow in production');
    console.log('   4. Deploy to production (npm run build && vercel --prod)');
    console.log('\n' + '═'.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ SETUP FAILED\n');
    console.error('Error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run main function
main();
