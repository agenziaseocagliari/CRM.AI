// Quick debug test for CSV function
const FormData = require('form-data');
const fs = require('fs');

async function debugCSVFunction() {
  console.log('🔍 DEBUGGING CSV FUNCTION WITH CREDENTIALS');
  
  try {
    // Create test FormData
    const formData = new FormData();
    
    // Add a simple CSV content
    const csvContent = 'Email,Name,Phone\ntest@example.com,Test User,555-1234\n';
    formData.append('file', csvContent, {
      filename: 'test.csv',
      contentType: 'text/csv'
    });
    
    // Add organization ID (use system admin ID)
    formData.append('organization_id', '00000000-0000-0000-0000-000000000001');
    
    console.log('📤 Making request to CSV parser...');
    
    const response = await fetch(
      'https://qjtaqrlpronohgpfdxsi.supabase.co/functions/v1/parse-csv-upload',
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY2NjQyNzUsImV4cCI6MjA0MjI0MDI3NX0.c5n5G8Rn95VnpRr-EqfvgQXRcxK3m6GP1ILSnJgdQ7A'
        },
        body: formData
      }
    );
    
    console.log('📊 Response Status:', response.status);
    console.log('📋 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📄 Response Body:', responseText);
    
    // Try to parse as JSON
    try {
      const jsonResponse = JSON.parse(responseText);
      console.log('✅ Parsed JSON Response:', JSON.stringify(jsonResponse, null, 2));
    } catch (e) {
      console.log('❌ Response is not JSON');
    }
    
  } catch (error) {
    console.error('💥 Request failed:', error);
  }
}

debugCSVFunction();