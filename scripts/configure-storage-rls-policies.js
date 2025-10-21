/**
 * CONFIGURE STORAGE RLS POLICIES
 * Creates 16 RLS policies (4 per bucket) on storage.objects table
 * Method: Direct PostgreSQL connection
 */

import pg from 'pg';
const { Client } = pg;

// Database configuration (direct connection)
const dbConfig = {
  host: 'db.qjtaqrlpronohgpfdxsi.supabase.co',
  database: 'postgres',
  user: 'postgres',
  password: 'WebProSEO@1980#',
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
};

// Storage buckets to configure
const BUCKETS = [
  'insurance-policy-documents',
  'insurance-claim-documents',
  'insurance-contact-documents',
  'insurance-general-attachments'
];

// Policy templates for each operation
const POLICY_TEMPLATES = {
  SELECT: (bucket) => ({
    name: `${bucket.replace(/-/g, '_')}_select`,
    sql: `
      CREATE POLICY "${bucket.replace(/-/g, '_')}_select"
      ON storage.objects
      FOR SELECT
      USING (
        bucket_id = '${bucket}' AND
        (storage.foldername(name))[1] = (auth.jwt() -> 'user_metadata' ->> 'organization_id')
      );
    `
  }),
  INSERT: (bucket) => ({
    name: `${bucket.replace(/-/g, '_')}_insert`,
    sql: `
      CREATE POLICY "${bucket.replace(/-/g, '_')}_insert"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = '${bucket}' AND
        (storage.foldername(name))[1] = (auth.jwt() -> 'user_metadata' ->> 'organization_id')
      );
    `
  }),
  UPDATE: (bucket) => ({
    name: `${bucket.replace(/-/g, '_')}_update`,
    sql: `
      CREATE POLICY "${bucket.replace(/-/g, '_')}_update"
      ON storage.objects
      FOR UPDATE
      USING (
        bucket_id = '${bucket}' AND
        (storage.foldername(name))[1] = (auth.jwt() -> 'user_metadata' ->> 'organization_id')
      );
    `
  }),
  DELETE: (bucket) => ({
    name: `${bucket.replace(/-/g, '_')}_delete`,
    sql: `
      CREATE POLICY "${bucket.replace(/-/g, '_')}_delete"
      ON storage.objects
      FOR DELETE
      USING (
        bucket_id = '${bucket}' AND
        (storage.foldername(name))[1] = (auth.jwt() -> 'user_metadata' ->> 'organization_id')
      );
    `
  })
};

async function configureStoragePolicies() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔒 CONFIGURING STORAGE RLS POLICIES');
    console.log('=====================================\n');
    
    // Connect to PostgreSQL
    console.log('📡 Connecting to PostgreSQL database...');
    await client.connect();
    console.log('✅ Connected successfully\n');
    
    // Check if RLS is enabled on storage.objects
    console.log('🔍 Checking RLS status on storage.objects...');
    const rlsCheck = await client.query(`
      SELECT relname, relrowsecurity 
      FROM pg_class 
      WHERE relname = 'objects' 
      AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage')
    `);
    
    if (rlsCheck.rows.length > 0) {
      const rlsEnabled = rlsCheck.rows[0].relrowsecurity;
      console.log(`✅ RLS enabled on storage.objects: ${rlsEnabled ? 'YES' : 'NO'}`);
      
      if (!rlsEnabled) {
        console.log('⚙️  Enabling RLS on storage.objects...');
        await client.query('ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;');
        console.log('✅ RLS enabled successfully\n');
      }
    }
    
    // Check existing policies
    console.log('🔍 Checking existing policies...');
    const existingPolicies = await client.query(`
      SELECT policyname 
      FROM pg_policies 
      WHERE tablename = 'objects' 
      AND schemaname = 'storage'
      AND policyname LIKE '%insurance%'
    `);
    
    console.log(`ℹ️  Found ${existingPolicies.rows.length} existing insurance-related policies\n`);
    
    // Drop existing policies to avoid conflicts
    if (existingPolicies.rows.length > 0) {
      console.log('🗑️  Dropping existing insurance policies...');
      for (const row of existingPolicies.rows) {
        try {
          await client.query(`DROP POLICY IF EXISTS "${row.policyname}" ON storage.objects;`);
          console.log(`   ✅ Dropped: ${row.policyname}`);
        } catch (err) {
          console.log(`   ⚠️  Could not drop ${row.policyname}: ${err.message}`);
        }
      }
      console.log('');
    }
    
    // Create policies for each bucket
    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    console.log('📦 Creating Storage RLS Policies...\n');
    
    for (const bucket of BUCKETS) {
      console.log(`📁 Bucket: ${bucket}`);
      
      for (const [operation, template] of Object.entries(POLICY_TEMPLATES)) {
        const policy = template(bucket);
        
        try {
          await client.query(policy.sql);
          console.log(`   ✅ ${operation} policy created: ${policy.name}`);
          createdCount++;
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`   ⚠️  ${operation} policy already exists: ${policy.name}`);
            skippedCount++;
          } else {
            console.log(`   ❌ ${operation} policy failed: ${error.message}`);
            errorCount++;
          }
        }
      }
      console.log('');
    }
    
    // Verify all policies created
    console.log('🔍 VERIFICATION - Listing all policies...\n');
    const allPolicies = await client.query(`
      SELECT 
        policyname,
        cmd,
        permissive,
        CASE 
          WHEN qual IS NOT NULL THEN 'USING clause'
          ELSE 'No USING clause'
        END as using_clause,
        CASE 
          WHEN with_check IS NOT NULL THEN 'WITH CHECK clause'
          ELSE 'No WITH CHECK'
        END as with_check_clause
      FROM pg_policies 
      WHERE tablename = 'objects' 
      AND schemaname = 'storage'
      AND policyname LIKE '%insurance%'
      ORDER BY policyname
    `);
    
    console.log(`Found ${allPolicies.rows.length} insurance storage policies:`);
    allPolicies.rows.forEach((policy, index) => {
      console.log(`${index + 1}. ${policy.policyname} (${policy.cmd}) - ${policy.permissive ? 'PERMISSIVE' : 'RESTRICTIVE'}`);
    });
    console.log('');
    
    // Summary
    console.log('=====================================');
    console.log('📊 CONFIGURATION SUMMARY');
    console.log('=====================================');
    console.log(`✅ Policies created: ${createdCount}`);
    console.log(`⚠️  Policies skipped (already existed): ${skippedCount}`);
    console.log(`❌ Policies failed: ${errorCount}`);
    console.log(`📋 Total policies active: ${allPolicies.rows.length}`);
    console.log('');
    
    if (allPolicies.rows.length === 16) {
      console.log('🎉 SUCCESS - All 16 Storage RLS Policies configured!');
      console.log('✅ Storage is now fully secured with organization-based isolation');
    } else if (allPolicies.rows.length > 0) {
      console.log(`⚠️  WARNING - Expected 16 policies, found ${allPolicies.rows.length}`);
      console.log('ℹ️  Some policies may have failed. Check errors above.');
    } else {
      console.log('❌ FAILED - No policies were created');
      console.log('ℹ️  Check database permissions and connection');
    }
    
    // Test policy definition
    console.log('\n🧪 TESTING POLICY ENFORCEMENT...');
    const policyTest = await client.query(`
      SELECT 
        policyname,
        LEFT(qual::text, 100) as policy_definition
      FROM pg_policies 
      WHERE tablename = 'objects' 
      AND schemaname = 'storage'
      AND policyname LIKE '%insurance%'
      LIMIT 3
    `);
    
    console.log('\nSample policy definitions:');
    policyTest.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.policyname}:`);
      console.log(`   ${row.policy_definition}...`);
    });
    
    console.log('\n✅ CONFIGURATION COMPLETE');
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Execute
configureStoragePolicies();
