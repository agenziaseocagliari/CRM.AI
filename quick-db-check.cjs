// quick-db-check.cjs
const fetch = require('node-fetch');

async function checkDatabase() {
  console.log('🔍 Checking contact_imports table...\n');
  
  // Direct table query without authentication to test basic access
  try {
    const altResponse = await fetch(
      'https://qjtaqrlpronohgpfdxsi.supabase.co/rest/v1/contact_imports?select=*&order=created_at.desc&limit=5',
      {
        headers: {
          'apikey': process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY2NjQyNzUsImV4cCI6MjA0MjI0MDI3NX0.c5n5G8Rn95VnpRr-EqfvgQXRcxK3m6GP1ILSnJgdQ7A',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY2NjQyNzUsImV4cCI6MjA0MjI0MDI3NX0.c5n5G8Rn95VnpRr-EqfvgQXRcxK3m6GP1ILSnJgdQ7A'
        }
      }
    );

    console.log('Response status:', altResponse.status);
    
    if (!altResponse.ok) {
      const errorText = await altResponse.text();
      console.log('❌ Database access error:', errorText);
      return;
    }

    const data = await altResponse.json();
    console.log('✅ Database accessible');
    console.log('Total imports found:', data.length);
    console.log('Latest imports:', JSON.stringify(data, null, 2));

    // Check for specific import ID
    const specificId = 'd2d6af53-4aae-4839-8e38-fe72d68fe55d';
    const specific = data.find(r => r.id === specificId);

    if (specific) {
      console.log('\n✅ Import ID from test EXISTS in database!');
      console.log('Record:', specific);
    } else {
      console.log('\n❌ Import ID from test NOT FOUND in database');
      console.log('Available IDs:', data.map(r => r.id));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDatabase();