// Test file for CSV parser functionality
import { parse } from "https://deno.land/std@0.224.0/csv/mod.ts";

// Test CSV parsing function (extracted from our edge function)
async function parseCSVContent(fileContent: string): Promise<{
  headers: string[];
  data: Record<string, string>[];
  totalRows: number;
}> {
  try {
    // Remove BOM if present (Excel compatibility)
    let content = fileContent;
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
    }

    // Normalize line endings
    content = content.replace(/\r\n|\r/g, '\n');

    // Parse CSV using Deno standard library
    const records = parse(content, {
      skipFirstRow: false,
      stripBom: true,
    });

    if (records.length === 0) {
      throw new Error('CSV file appears to be empty');
    }

    // First row contains headers
    const headers = records[0] as string[];
    const dataRows = records.slice(1) as string[][];

    // Convert rows to objects with header keys
    const data = dataRows.map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((header, index) => {
        obj[header.trim()] = (row[index] || '').trim();
      });
      return obj;
    });

    return {
      headers: headers.map(h => h.trim()),
      data,
      totalRows: dataRows.length
    };
  } catch (error) {
    throw new Error(`CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Test data
const testCSV = `name,email,phone,company
John Doe,john@example.com,+1-555-0123,Acme Corp
Jane Smith,jane@example.com,+1-555-0124,Tech Inc
Bob Johnson,bob@example.com,+1-555-0125,StartupCo`;

// Run test
console.log('Testing CSV Parser...');
try {
  const result = await parseCSVContent(testCSV);
  console.log('✅ Headers:', result.headers);
  console.log('✅ Total rows:', result.totalRows);
  console.log('✅ Sample data:', result.data[0]);
  console.log('✅ All data:', JSON.stringify(result.data, null, 2));
} catch (error) {
  console.error('❌ Error:', error);
}