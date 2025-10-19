// Test script to verify jsPDF and html2canvas integration
// Run with: node scripts/test-pdf-generation.js

import jsPDF from 'jspdf';
import 'jspdf-autotable';

console.log('🧪 Testing jsPDF + autoTable integration...\n');

try {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(16);
  doc.text('Test PDF Report', 14, 16);
  
  // Add subtitle
  doc.setFontSize(12);
  doc.text('Generated at: ' + new Date().toISOString(), 14, 24);
  
  // Create test data
  const tableData = [
    ['Item 1', 'Description 1', '€100.00'],
    ['Item 2', 'Description 2', '€200.00'],
    ['Item 3', 'Description 3', '€300.00'],
  ];
  
  // Generate table using autoTable
  doc.autoTable({
    head: [['Item', 'Description', 'Amount']],
    body: tableData,
    startY: 32,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [59, 130, 246] } // Blue color
  });
  
  // Save to file (in Node.js environment, this will just generate the blob)
  const pdfBlob = doc.output('blob');
  
  console.log('✅ PDF generated successfully!');
  console.log('   Size:', pdfBlob.size, 'bytes');
  console.log('   Type:', pdfBlob.type);
  console.log('\n✅ jsPDF + autoTable integration test PASSED\n');
  
} catch (error) {
  console.error('❌ PDF generation test FAILED:', error);
  process.exit(1);
}
