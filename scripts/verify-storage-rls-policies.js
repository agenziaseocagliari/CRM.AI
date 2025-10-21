/**
 * VERIFY STORAGE RLS POLICIES
 * Comprehensive verification and testing of Storage RLS policies
 */

import pg from 'pg';
const { Client } = pg;

// Database configuration
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

async function verifyStoragePolicies() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔍 STORAGE RLS POLICIES VERIFICATION');
    console.log('=====================================\n');
    
    await client.connect();
    console.log('✅ Connected to PostgreSQL\n');
    
    // 1. Check RLS enabled on storage.objects
    console.log('1️⃣  RLS Status Check');
    console.log('─────────────────────');
    const rlsStatus = await client.query(`
      SELECT 
        schemaname,
        tablename,
        relrowsecurity as rls_enabled
      FROM pg_class c
      JOIN pg_namespace n ON c.relnamespace = n.oid
      JOIN pg_tables t ON c.relname = t.tablename AND n.nspname = t.schemaname
      WHERE t.tablename = 'objects' AND t.schemaname = 'storage'
    `);
    
    if (rlsStatus.rows.length > 0) {
      const rls = rlsStatus.rows[0];
      console.log(`   Table: ${rls.schemaname}.${rls.tablename}`);
      console.log(`   RLS Enabled: ${rls.rls_enabled ? '✅ YES' : '❌ NO'}`);
    }
    console.log('');
    
    // 2. Count total storage policies
    console.log('2️⃣  Policy Count');
    console.log('─────────────────────');
    const policyCount = await client.query(`
      SELECT 
        COUNT(*) as total_policies,
        COUNT(CASE WHEN policyname LIKE '%insurance%' THEN 1 END) as insurance_policies
      FROM pg_policies 
      WHERE tablename = 'objects' AND schemaname = 'storage'
    `);
    
    console.log(`   Total Storage Policies: ${policyCount.rows[0].total_policies}`);
    console.log(`   Insurance Policies: ${policyCount.rows[0].insurance_policies}`);
    console.log('');
    
    // 3. List all insurance policies by operation
    console.log('3️⃣  Policies by Operation');
    console.log('─────────────────────');
    const policiesByOp = await client.query(`
      SELECT 
        cmd as operation,
        COUNT(*) as policy_count
      FROM pg_policies 
      WHERE tablename = 'objects' 
      AND schemaname = 'storage'
      AND policyname LIKE '%insurance%'
      GROUP BY cmd
      ORDER BY cmd
    `);
    
    policiesByOp.rows.forEach(row => {
      const expected = 4; // 4 buckets
      const status = row.policy_count === expected ? '✅' : '⚠️';
      console.log(`   ${status} ${row.operation}: ${row.policy_count}/${expected} policies`);
    });
    console.log('');
    
    // 4. List all insurance policies by bucket
    console.log('4️⃣  Policies by Bucket');
    console.log('─────────────────────');
    const BUCKETS = [
      'insurance-policy-documents',
      'insurance-claim-documents',
      'insurance-contact-documents',
      'insurance-general-attachments'
    ];
    
    for (const bucket of BUCKETS) {
      const bucketPolicies = await client.query(`
        SELECT COUNT(*) as policy_count
        FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
        AND policyname LIKE $1
      `, [`%${bucket.replace(/-/g, '_')}%`]);
      
      const count = bucketPolicies.rows[0].policy_count;
      const status = count === 4 ? '✅' : '⚠️';
      console.log(`   ${status} ${bucket}: ${count}/4 policies`);
    }
    console.log('');
    
    // 5. Detailed policy definitions
    console.log('5️⃣  Detailed Policy Definitions');
    console.log('─────────────────────────────────');
    const detailedPolicies = await client.query(`
      SELECT 
        policyname,
        cmd,
        permissive,
        CASE 
          WHEN qual IS NOT NULL THEN 'Yes'
          ELSE 'No'
        END as has_using_clause,
        CASE 
          WHEN with_check IS NOT NULL THEN 'Yes'
          ELSE 'No'
        END as has_with_check
      FROM pg_policies 
      WHERE tablename = 'objects' 
      AND schemaname = 'storage'
      AND policyname LIKE '%insurance%'
      ORDER BY policyname
    `);
    
    console.log(`   Total: ${detailedPolicies.rows.length} policies\n`);
    detailedPolicies.rows.forEach((policy, index) => {
      console.log(`   ${index + 1}. ${policy.policyname}`);
      console.log(`      Operation: ${policy.cmd}`);
      console.log(`      Permissive: ${policy.permissive ? 'Yes' : 'No'}`);
      console.log(`      USING clause: ${policy.has_using_clause}`);
      console.log(`      WITH CHECK: ${policy.has_with_check}`);
      if (index < detailedPolicies.rows.length - 1) console.log('');
    });
    console.log('');
    
    // 6. Sample policy SQL
    console.log('6️⃣  Sample Policy SQL');
    console.log('─────────────────────');
    const samplePolicy = await client.query(`
      SELECT 
        policyname,
        qual::text as using_clause,
        with_check::text as with_check_clause
      FROM pg_policies 
      WHERE tablename = 'objects' 
      AND schemaname = 'storage'
      AND policyname = 'insurance_policy_documents_select'
    `);
    
    if (samplePolicy.rows.length > 0) {
      const policy = samplePolicy.rows[0];
      console.log(`   Policy: ${policy.policyname}`);
      console.log(`   USING: ${policy.using_clause}`);
      console.log(`   WITH CHECK: ${policy.with_check_clause || 'N/A'}`);
    }
    console.log('');
    
    // 7. Verify organization_id check in policies
    console.log('7️⃣  Policy Security Check');
    console.log('─────────────────────');
    const securityCheck = await client.query(`
      SELECT 
        policyname,
        CASE 
          WHEN qual::text LIKE '%organization_id%' THEN 'Yes'
          WHEN with_check::text LIKE '%organization_id%' THEN 'Yes'
          ELSE 'No'
        END as has_org_check
      FROM pg_policies 
      WHERE tablename = 'objects' 
      AND schemaname = 'storage'
      AND policyname LIKE '%insurance%'
    `);
    
    const withOrgCheck = securityCheck.rows.filter(p => p.has_org_check === 'Yes').length;
    const total = securityCheck.rows.length;
    console.log(`   Policies with organization_id check: ${withOrgCheck}/${total}`);
    
    if (withOrgCheck === total) {
      console.log(`   ✅ All policies enforce organization isolation`);
    } else {
      console.log(`   ⚠️  Some policies missing organization_id check!`);
    }
    console.log('');
    
    // 8. Final Summary
    console.log('=====================================');
    console.log('📊 VERIFICATION SUMMARY');
    console.log('=====================================');
    
    const totalInsurancePolicies = policyCount.rows[0].insurance_policies;
    const expectedPolicies = 16; // 4 buckets × 4 operations
    
    console.log(`Total Insurance Policies: ${totalInsurancePolicies}/${expectedPolicies}`);
    console.log(`RLS Enabled: ${rlsStatus.rows[0]?.rls_enabled ? 'YES' : 'NO'}`);
    console.log(`Organization Isolation: ${withOrgCheck === total ? 'ENFORCED' : 'INCOMPLETE'}`);
    console.log('');
    
    if (totalInsurancePolicies === expectedPolicies && withOrgCheck === total) {
      console.log('🎉 VERIFICATION PASSED');
      console.log('✅ All Storage RLS Policies configured correctly');
      console.log('✅ Organization-based isolation fully enforced');
      console.log('✅ Storage security: PRODUCTION READY');
    } else {
      console.log('⚠️  VERIFICATION INCOMPLETE');
      console.log(`   Expected ${expectedPolicies} policies, found ${totalInsurancePolicies}`);
    }
    
  } catch (error) {
    console.error('\n❌ VERIFICATION ERROR:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Execute
verifyStoragePolicies();
