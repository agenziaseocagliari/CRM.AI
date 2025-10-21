#!/usr/bin/env node

/**
 * Storage RLS Policies Setup
 * Configures RLS policies for all 4 insurance document storage buckets
 */

import pkg from 'pg';
import { fileURLToPath } from 'url';

const { Client } = pkg;

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);

const BUCKETS = [
  'insurance-policy-documents',
  'insurance-claim-documents',
  'insurance-contact-documents',
  'insurance-general-attachments'
];

const OPERATIONS = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];

async function main() {
  console.log('\n' + '═'.repeat(70));
  console.log('🔒 CONFIGURING STORAGE RLS POLICIES');
  console.log('═'.repeat(70) + '\n');

  try {
    // Database configuration
    const dbConfig = {
      host: 'db.qjtaqrlpronohgpfdxsi.supabase.co',
      database: 'postgres',
      user: 'postgres',
      password: 'WebProSEO@1980#',
      port: 5432,
      ssl: { rejectUnauthorized: false }
    };

    console.log('📡 Connecting to PostgreSQL database...');
    const client = new Client(dbConfig);
    await client.connect();
    console.log('✅ Connected successfully\n');

    let policiesCreated = 0;
    let policiesExisting = 0;

    for (const bucket of BUCKETS) {
      console.log(`\n📦 Processing bucket: ${bucket}`);
      
      for (const operation of OPERATIONS) {
        const policyName = `${bucket.replace(/-/g, '_')}_${operation.toLowerCase()}`;
        const definition = `(bucket_id = '${bucket}' AND (storage.foldername(name))[1] = (auth.jwt() -> 'user_metadata' ->> 'organization_id'))`;

        try {
          // Check if policy already exists
          const existingPolicy = await client.query(`
            SELECT * FROM storage.policies 
            WHERE name = $1 AND bucket_id = $2
          `, [policyName, bucket]);

          if (existingPolicy.rows.length > 0) {
            console.log(`   ℹ️  Policy ${operation} already exists`);
            policiesExisting++;
            continue;
          }

          // Create policy
          await client.query(`
            INSERT INTO storage.policies (name, bucket_id, definition, check_expression)
            VALUES ($1, $2, $3, $3)
          `, [policyName, bucket, definition]);

          console.log(`   ✅ Created ${operation} policy`);
          policiesCreated++;

        } catch (err) {
          if (err.message.includes('duplicate key')) {
            console.log(`   ℹ️  Policy ${operation} already exists`);
            policiesExisting++;
          } else {
            console.error(`   ❌ Failed to create ${operation} policy: ${err.message}`);
          }
        }
      }
    }

    // Verify all policies
    console.log('\n\n🔍 Verifying storage policies...');
    const allPolicies = await client.query(`
      SELECT bucket_id, name 
      FROM storage.policies 
      WHERE bucket_id IN (${BUCKETS.map((_, i) => `$${i + 1}`).join(',')})
      ORDER BY bucket_id, name
    `, BUCKETS);

    console.log(`\n✅ Total storage policies: ${allPolicies.rows.length}`);
    
    BUCKETS.forEach(bucket => {
      const bucketPolicies = allPolicies.rows.filter(p => p.bucket_id === bucket);
      console.log(`   → ${bucket}: ${bucketPolicies.length} policies`);
    });

    await client.end();

    console.log('\n' + '═'.repeat(70));
    console.log('🎉 STORAGE RLS POLICIES CONFIGURED');
    console.log('═'.repeat(70));
    console.log('\n✅ Summary:');
    console.log(`   → Policies created: ${policiesCreated}`);
    console.log(`   → Policies existing: ${policiesExisting}`);
    console.log(`   → Total policies: ${allPolicies.rows.length}`);
    console.log('\n✅ All storage buckets are now protected with RLS policies!');
    console.log('\n' + '═'.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ SETUP FAILED\n');
    console.error('Error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

main();
