/**
 * 🎯 CSV UPLOAD PARSER - MINIMAL TEST VERSION (NO DATABASE)
 * ========================================================
 * 
 * This version skips database integration for testing FormData parsing
 * and CSV processing functionality without database constraints
 */

// Import Deno standard CSV library
import { parse } from "https://deno.land/std@0.224.0/csv/parse.ts";

// CORS Headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Max-Age": "86400"
};

// Robust CSV parsing with Deno standard library
async function parseCSVContent(content: string) {
  try {
    // Remove UTF-8 BOM if present
    const cleanContent = content.replace(/^\uFEFF/, '');
    
    // Parse with Deno std library
    const rows = parse(cleanContent, {
      skipFirstRow: false,
      strip: true,
      separator: ',',
    });

    if (rows.length === 0) {
      throw new Error('CSV file is empty');
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    // Filter out empty rows
    const filteredDataRows = dataRows.filter((row: string[]) => 
      row.some((cell: string) => cell && cell.trim().length > 0)
    );

    return {
      headers,
      dataRows: filteredDataRows,
      totalRows: filteredDataRows.length
    };
  } catch (error) {
    throw new Error(`CSV parsing failed: ${(error as Error).message}`);
  }
}

// Field mapping detection
function detectFieldMappings(headers: string[]) {
  const knownFields = {
    email: ['email', 'e-mail', 'mail'],
    phone: ['phone', 'telephone', 'tel', 'mobile'],
    name: ['name', 'full name', 'fullname'],
    first_name: ['first name', 'firstname'],
    last_name: ['last name', 'lastname'],
    company: ['company', 'organization'],
  };

  return headers.map(header => {
    const normalized = header.toLowerCase().trim();
    
    for (const [dbField, variations] of Object.entries(knownFields)) {
      if (variations.includes(normalized)) {
        return {
          csv_column: header,
          db_field: dbField,
          confidence: 100
        };
      }
    }
    
    return {
      csv_column: header,
      db_field: null,
      confidence: 0
    };
  });
}

// Main handler
Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().substring(0, 8);
  console.log(`[csv_test:${requestId}] 🚀 Test version - No database`);

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const organizationId = formData.get('organization_id') as string;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`[csv_test:${requestId}] 📄 Processing: ${file.name} (${file.size} bytes)`);

    // Read and parse CSV
    const fileContent = await file.text();
    const { headers, dataRows, totalRows } = await parseCSVContent(fileContent);
    
    // Detect field mappings
    const detectedMappings = detectFieldMappings(headers);
    
    // Build response (NO DATABASE ACCESS)
    const response = {
      success: true,
      message: "CSV parsed successfully (test mode - no database)",
      organization_id: organizationId,
      file_info: {
        name: file.name,
        size: file.size,
        type: file.type
      },
      csv_analysis: {
        total_rows: totalRows,
        headers: headers,
        sample_data: dataRows.slice(0, 3), // First 3 rows as sample
      },
      field_mappings: detectedMappings,
      detected_fields: detectedMappings.filter(m => m.db_field).length,
      timestamp: new Date().toISOString()
    };

    console.log(`[csv_test:${requestId}] ✅ SUCCESS! Parsed ${totalRows} rows with ${detectedMappings.filter(m => m.db_field).length} detected fields`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error(`[csv_test:${requestId}] ❌ Error:`, error);
    return new Response(JSON.stringify({
      error: `CSV processing failed: ${(error as Error).message}`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});