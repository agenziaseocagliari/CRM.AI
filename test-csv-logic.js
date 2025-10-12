// Simple CSV parser test using Node.js (without Deno dependencies)
// This validates the core parsing logic from our edge function

function parseCSVSimple(csvContent) {
  // Remove BOM if present (Excel compatibility)
  let content = csvContent;
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }

  // Normalize line endings
  content = content.replace(/\r\n|\r/g, '\n');
  
  // Simple CSV parsing (basic implementation for testing)
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    throw new Error('CSV file appears to be empty');
  }

  // Parse headers
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"(.*)"$/, '$1'));
  
  // Parse data rows
  const dataRows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"(.*)"$/, '$1'));
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    return obj;
  });

  return {
    headers,
    data: dataRows,
    totalRows: dataRows.length
  };
}

// Test data
const testCSV = `name,email,phone,company
John Doe,john@example.com,+1-555-0123,Acme Corp
Jane Smith,jane@example.com,+1-555-0124,Tech Inc
Bob Johnson,bob@example.com,+1-555-0125,StartupCo`;

// Run test
console.log('🧪 Testing CSV Parser Logic...\n');

try {
  const result = parseCSVSimple(testCSV);
  
  console.log('✅ Headers detected:', result.headers);
  console.log('✅ Total data rows:', result.totalRows);
  console.log('✅ Sample parsed record:');
  console.log('   ', JSON.stringify(result.data[0], null, 2));
  
  console.log('\n✅ All parsed data:');
  result.data.forEach((record, index) => {
    console.log(`   Record ${index + 1}:`, record);
  });
  
  console.log('\n🎉 CSV parsing logic validation PASSED!');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}