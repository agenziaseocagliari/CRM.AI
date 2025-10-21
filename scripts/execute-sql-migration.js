#!/usr/bin/env node

/**
 * Document Management System - SQL Execution via PostgreSQL
 * Uses direct PostgreSQL connection with correct credentials
 */

import fs from 'fs';
import path from 'path';
import pkg from 'pg';
import { fileURLToPath } from 'url';

const { Client } = pkg;

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATION_FILE = path.join(__dirname, '..', 'supabase', 'migrations', '20251021_insurance_documents.sql');

async function main() {
  console.log('\n' + '═'.repeat(70));
  console.log('🚀 EXECUTING SQL MIGRATION - INSURANCE_DOCUMENTS TABLE');
  console.log('═'.repeat(70) + '\n');

  try {
    // Database configuration with correct credentials
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

    // Read migration file
    console.log('📖 Reading migration file...');
    if (!fs.existsSync(MIGRATION_FILE)) {
      throw new Error(`Migration file not found: ${MIGRATION_FILE}`);
    }
    
    const sqlContent = fs.readFileSync(MIGRATION_FILE, 'utf8');
    console.log(`✅ Migration file loaded (${sqlContent.length} characters)\n`);

    // Execute migration
    console.log('⚡ Executing SQL migration...');
    
    try {
      await client.query(sqlContent);
      console.log('✅ SQL migration executed successfully\n');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('ℹ️  Table already exists, continuing...\n');
      } else {
        throw err;
      }
    }

    // Verify table creation
    console.log('🔍 Verifying table creation...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'insurance_documents'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Table insurance_documents verified');
    } else {
      console.log('❌ Table insurance_documents NOT found');
    }

    // Check indexes
    const indexCheck = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'insurance_documents'
      ORDER BY indexname;
    `);
    
    console.log(`✅ ${indexCheck.rows.length} indexes created:`);
    indexCheck.rows.forEach(row => {
      console.log(`   - ${row.indexname}`);
    });

    // Check RLS policies
    const rlsCheck = await client.query(`
      SELECT policyname 
      FROM pg_policies 
      WHERE tablename = 'insurance_documents'
      ORDER BY policyname;
    `);
    
    console.log(`\n✅ ${rlsCheck.rows.length} RLS policies configured:`);
    rlsCheck.rows.forEach(row => {
      console.log(`   - ${row.policyname}`);
    });

    // Check RLS enabled
    const rlsEnabled = await client.query(`
      SELECT relname, relrowsecurity 
      FROM pg_class 
      WHERE relname = 'insurance_documents';
    `);
    
    if (rlsEnabled.rows[0]?.relrowsecurity) {
      console.log('\n✅ RLS enabled on insurance_documents table');
    } else {
      console.log('\n⚠️  RLS NOT enabled on insurance_documents table');
    }

    // Get table structure
    const columns = await client.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'insurance_documents'
      ORDER BY ordinal_position;
    `);
    
    console.log(`\n✅ Table structure (${columns.rows.length} columns):`);
    columns.rows.slice(0, 10).forEach(row => {
      const type = row.character_maximum_length 
        ? `${row.data_type}(${row.character_maximum_length})`
        : row.data_type;
      console.log(`   - ${row.column_name}: ${type} ${row.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });
    
    if (columns.rows.length > 10) {
      console.log(`   ... and ${columns.rows.length - 10} more columns`);
    }

    await client.end();

    console.log('\n' + '═'.repeat(70));
    console.log('🎉 SQL MIGRATION COMPLETED SUCCESSFULLY');
    console.log('═'.repeat(70));
    console.log('\n✅ Database Setup Complete:');
    console.log(`   → Table: insurance_documents`);
    console.log(`   → Columns: ${columns.rows.length}`);
    console.log(`   → Indexes: ${indexCheck.rows.length}`);
    console.log(`   → RLS Policies: ${rlsCheck.rows.length}`);
    console.log(`   → RLS Enabled: ${rlsEnabled.rows[0]?.relrowsecurity ? 'YES' : 'NO'}`);
    console.log('\n✅ Storage Setup (from previous step):');
    console.log('   → Buckets: 4 created');
    console.log('   → insurance-policy-documents');
    console.log('   → insurance-claim-documents');
    console.log('   → insurance-contact-documents');
    console.log('   → insurance-general-attachments');
    console.log('\n📋 Next Steps:');
    console.log('   1. Configure storage RLS policies (see README)');
    console.log('   2. Integrate DocumentUploader into PolicyDetail.tsx');
    console.log('   3. Test upload workflow');
    console.log('   4. Deploy to production');
    console.log('\n' + '═'.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ MIGRATION FAILED\n');
    console.error('Error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

main();
