/**
 * Check RLS Policies on insurance_documents table
 * Diagnoses INSERT policy configuration
 */

import fs from 'fs';
import pg from 'pg';

const { Client } = pg;

async function checkRLSPolicies() {
  console.log('🔍 CHECKING RLS POLICIES ON insurance_documents\n');

  // Load credentials
  const creds = fs.readFileSync('.credentials_protected', 'utf8');
  const lines = creds.split('\n');
  const dbPassword = lines
    .find(l => l.startsWith('DB_PASSWORD='))
    .split('=')[1]
    .trim();

  const client = new Client({
    host: 'db.qjtaqrlpronohgpfdxsi.supabase.co',
    database: 'postgres',
    user: 'postgres',
    password: dbPassword,
    port: 5432,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check RLS enabled
    console.log('1️⃣  RLS STATUS');
    const rlsStatus = await client.query(`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename = 'insurance_documents';
    `);
    console.log(
      '   RLS Enabled:',
      rlsStatus.rows[0]?.rowsecurity ? '✅ YES' : '❌ NO'
    );
    console.log('');

    // Check INSERT policies
    console.log('2️⃣  INSERT POLICIES');
    const insertPolicies = await client.query(`
      SELECT
        policyname,
        cmd,
        permissive,
        qual,
        with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename = 'insurance_documents'
      AND cmd = 'INSERT';
    `);

    if (insertPolicies.rows.length === 0) {
      console.log('   ❌ NO INSERT POLICIES FOUND!');
      console.log(
        '   This is the problem - no policy allows INSERT operations'
      );
    } else {
      console.log(
        `   Found ${insertPolicies.rows.length} INSERT policy/policies:\n`
      );
      insertPolicies.rows.forEach((policy, idx) => {
        console.log(`   Policy ${idx + 1}: ${policy.policyname}`);
        console.log(`   - Command: ${policy.cmd}`);
        console.log(`   - Permissive: ${policy.permissive}`);
        console.log(`   - QUAL (filter): ${policy.qual || 'N/A'}`);
        console.log(`   - WITH CHECK: ${policy.with_check || 'N/A'}`);
        console.log('');
      });
    }

    // Check ALL policies
    console.log('3️⃣  ALL POLICIES ON insurance_documents');
    const allPolicies = await client.query(`
      SELECT policyname, cmd
      FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename = 'insurance_documents'
      ORDER BY cmd, policyname;
    `);

    console.log(`   Total policies: ${allPolicies.rows.length}`);
    const byCmd = {};
    allPolicies.rows.forEach(p => {
      if (!byCmd[p.cmd]) byCmd[p.cmd] = [];
      byCmd[p.cmd].push(p.policyname);
    });

    Object.keys(byCmd)
      .sort()
      .forEach(cmd => {
        console.log(`   - ${cmd}: ${byCmd[cmd].length} policy/policies`);
        byCmd[cmd].forEach(name => console.log(`     • ${name}`));
      });
    console.log('');

    // Check if organization_id is in JWT claims
    console.log('4️⃣  JWT CLAIMS CHECK (for test user)');
    console.log('   Testing with email: primassicurazionibari@gmail.com');

    const jwtTest = await client.query(`
      SELECT
        id,
        email,
        raw_user_meta_data,
        raw_app_meta_data
      FROM auth.users
      WHERE email = 'primassicurazionibari@gmail.com';
    `);

    if (jwtTest.rows.length > 0) {
      const user = jwtTest.rows[0];
      console.log('   User found:');
      console.log('   - ID:', user.id);
      console.log('   - Email:', user.email);
      console.log(
        '   - user_metadata:',
        JSON.stringify(user.raw_user_meta_data, null, 2)
      );
      console.log(
        '   - app_metadata:',
        JSON.stringify(user.raw_app_meta_data, null, 2)
      );

      const hasOrgInUserMeta = user.raw_user_meta_data?.organization_id;
      const hasOrgInAppMeta = user.raw_app_meta_data?.organization_id;

      console.log('');
      console.log(
        '   organization_id in user_metadata:',
        hasOrgInUserMeta ? `✅ ${hasOrgInUserMeta}` : '❌ NOT FOUND'
      );
      console.log(
        '   organization_id in app_metadata:',
        hasOrgInAppMeta ? `✅ ${hasOrgInAppMeta}` : '❌ NOT FOUND'
      );
    } else {
      console.log('   ❌ User not found');
    }
    console.log('');

    // Check profile
    console.log('5️⃣  PROFILE CHECK');
    const profile = await client.query(`
      SELECT id, organization_id, vertical, user_role
      FROM profiles
      WHERE id = 'c623942a-d4b2-4d93-b944-b8e681679704';
    `);

    if (profile.rows.length > 0) {
      console.log('   ✅ Profile found:');
      console.log('   - ID:', profile.rows[0].id);
      console.log('   - Organization ID:', profile.rows[0].organization_id);
      console.log('   - Vertical:', profile.rows[0].vertical);
      console.log('   - Role:', profile.rows[0].user_role);
    } else {
      console.log('   ❌ Profile not found');
    }
    console.log('');

    // Summary
    console.log('📊 DIAGNOSIS SUMMARY');
    console.log('═══════════════════════════════════════');

    if (insertPolicies.rows.length === 0) {
      console.log('❌ PROBLEM IDENTIFIED:');
      console.log('   No INSERT policy exists on insurance_documents table');
      console.log('   This is why uploads fail with RLS error');
      console.log('');
      console.log('🔧 SOLUTION:');
      console.log('   Create INSERT policy that checks organization_id');
      console.log('   See fix-rls-insert-policy.sql script');
    } else {
      console.log('✅ INSERT policy exists');
      console.log('');
      console.log('⚠️  CHECK:');
      console.log('   1. Verify JWT contains organization_id');
      console.log('   2. Verify storageService passes organizationId');
      console.log(
        '   3. Check policy WITH CHECK condition matches JWT structure'
      );
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

checkRLSPolicies();
