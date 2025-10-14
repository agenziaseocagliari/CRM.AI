// Emergency script to create contact_notes table
// Run this to apply the migration to the live database

import { createClient } from '@supabase/supabase-js';

// This will be run once to create the contact_notes table
const supabaseUrl =
  process.env.REACT_APP_SUPABASE_URL ||
  'https://qjtaqrlpronohgpfdxsi.supabase.co';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNzE2NTQ3OSwiZXhwIjoyMDQyNzQxNDc5fQ.FUqpJQKy-JysV5lBKamDVP5rkhYDzCRhRisOvkx4WpM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createContactNotesTable() {
  console.log('🔧 Creating contact_notes table...');

  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      -- Create contact_notes table for enhanced contact detail functionality
      CREATE TABLE IF NOT EXISTS contact_notes (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
          note TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          created_by UUID REFERENCES auth.users(id)
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_contact_notes_contact_id ON contact_notes(contact_id);
      CREATE INDEX IF NOT EXISTS idx_contact_notes_created_at ON contact_notes(created_at DESC);

      -- Enable Row Level Security
      ALTER TABLE contact_notes ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Users can view notes for their organization's contacts" ON contact_notes;
      DROP POLICY IF EXISTS "Users can create notes for their organization's contacts" ON contact_notes;
      DROP POLICY IF EXISTS "Users can update their own notes" ON contact_notes;
      DROP POLICY IF EXISTS "Users can delete their own notes" ON contact_notes;

      -- RLS Policies for contact_notes (simplified)
      CREATE POLICY "Enable read for authenticated users" ON contact_notes 
      FOR SELECT TO authenticated USING (true);

      CREATE POLICY "Enable insert for authenticated users" ON contact_notes 
      FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

      CREATE POLICY "Enable update for own notes" ON contact_notes 
      FOR UPDATE TO authenticated USING (auth.uid() = created_by);

      CREATE POLICY "Enable delete for own notes" ON contact_notes 
      FOR DELETE TO authenticated USING (auth.uid() = created_by);

      -- Update trigger for updated_at
      CREATE OR REPLACE FUNCTION update_contact_notes_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_contact_notes_updated_at ON contact_notes;
      CREATE TRIGGER update_contact_notes_updated_at
          BEFORE UPDATE ON contact_notes
          FOR EACH ROW EXECUTE FUNCTION update_contact_notes_updated_at();
    `,
  });

  if (error) {
    console.error('❌ Error creating contact_notes table:', error);
  } else {
    console.log('✅ Contact_notes table created successfully!');
  }
}

// Check if table exists first
async function checkTableExists() {
  console.log('🔍 Checking if contact_notes table exists...');

  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', 'contact_notes');

  if (error) {
    console.error('❌ Error checking table:', error);
    return false;
  }

  const exists = data && data.length > 0;
  console.log(`📊 contact_notes table exists: ${exists}`);
  return exists;
}

async function main() {
  try {
    const exists = await checkTableExists();

    if (!exists) {
      await createContactNotesTable();

      // Verify table was created
      const nowExists = await checkTableExists();
      if (nowExists) {
        console.log('🎉 SUCCESS: contact_notes table is ready!');
      } else {
        console.log('❌ FAILED: Table creation failed');
      }
    } else {
      console.log('✅ contact_notes table already exists!');
    }
  } catch (error) {
    console.error('💥 FATAL ERROR:', error);
  }
}

main();
