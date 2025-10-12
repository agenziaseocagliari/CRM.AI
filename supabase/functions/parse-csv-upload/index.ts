import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { parse } from "https://deno.land/std@0.208.0/csv/mod.ts"
import { distance } from 'npm:fastest-levenshtein@1.0.16'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ParsedCSVData {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

interface FieldMapping {
  db_field: string;
  confidence: number;
  csv_column?: string;
}

interface ValidationIssue {
  row: number;
  field: string;
  error?: string;
  warning?: string;
}

interface ValidationResult {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

interface UploadResponse {
  success: boolean;
  import_id?: string;
  preview?: {
    headers: string[];
    rows: Record<string, string>[];
    total_rows: number;
  };
  detected_mappings?: Record<string, FieldMapping>;
  validation?: {
    total_errors: number;
    total_warnings: number;
    sample_issues?: ValidationIssue[];
  };
  file_info?: {
    filename: string;
    size: number;
    uploaded_at?: string;
  };
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Parse multipart form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    const organizationId = formData.get('organization_id') as string

    // Validate required fields
    if (!file) {
      return new Response(
        JSON.stringify({ success: false, error: 'No file provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!organizationId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Organization ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate file type
    const filename = file.name.toLowerCase()
    const isValidExtension = filename.endsWith('.csv')
    const isValidMimeType = file.type === 'text/csv' || file.type === 'application/csv' || file.type === 'text/plain'
    
    if (!isValidExtension && !isValidMimeType) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid file type. Only CSV files are allowed.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB.` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Read file content
    let fileContent: string
    try {
      fileContent = await file.text()
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to read file content' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Handle UTF-8 BOM (Excel compatibility)
    if (fileContent.charCodeAt(0) === 0xFEFF) {
      fileContent = fileContent.slice(1)
    }

    // Basic validation - ensure file has content
    if (!fileContent.trim()) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'File is empty' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse CSV content
    let parsedData: ParsedCSVData
    try {
      parsedData = await parseCSVContent(fileContent)
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to parse CSV: ${error.message}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate parsed data
    if (parsedData.headers.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'CSV file has no headers' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (parsedData.totalRows === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'CSV file has no data rows' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Detect field mappings
    const detectedMappings = detectFieldMappings(parsedData.headers)
    
    // Validate preview data (first 50 rows for performance)
    const previewRows = parsedData.rows.slice(0, 50)
    const validationResult = validateRows(previewRows, detectedMappings)

    // Get user from auth context
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create import record in database
    const { data: importRecord, error: dbError } = await supabaseClient
      .from('contact_imports')
      .insert({
        organization_id: organizationId,
        uploaded_by: user.id,
        filename: file.name,
        file_size: file.size,
        total_rows: parsedData.totalRows,
        status: 'preview_ready',
        field_mapping: detectedMappings,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create import record' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Return successful response with preview data
    const response: UploadResponse = {
      success: true,
      import_id: importRecord.id,
      preview: {
        headers: parsedData.headers,
        rows: parsedData.rows.slice(0, 10), // First 10 rows for preview
        total_rows: parsedData.totalRows
      },
      detected_mappings: detectedMappings,
      validation: {
        total_errors: validationResult.errors.length,
        total_warnings: validationResult.warnings.length,
        sample_issues: [...validationResult.errors.slice(0, 3), ...validationResult.warnings.slice(0, 3)]
      },
      file_info: {
        filename: file.name,
        size: file.size,
        uploaded_at: new Date().toISOString()
      }
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Field detection using fuzzy matching
function detectFieldMappings(headers: string[]): Record<string, FieldMapping> {
  const knownFields = {
    email: ['email', 'e-mail', 'mail', 'email address', 'e_mail', 'electronic mail'],
    phone: ['phone', 'telephone', 'tel', 'mobile', 'cell', 'phone number', 'cellular', 'contact number'],
    name: ['name', 'full name', 'fullname', 'contact name', 'person', 'client name'],
    first_name: ['first name', 'firstname', 'fname', 'given name', 'first', 'prename'],
    last_name: ['last name', 'lastname', 'lname', 'surname', 'family name', 'last'],
    company: ['company', 'organization', 'business', 'employer', 'firm', 'org', 'corporation'],
    address: ['address', 'street', 'location', 'addr', 'street address'],
    city: ['city', 'town', 'locality', 'municipality'],
    state: ['state', 'province', 'region', 'county'],
    zip: ['zip', 'zipcode', 'postal', 'postal code', 'postcode'],
    country: ['country', 'nation', 'nationality'],
    notes: ['notes', 'note', 'comments', 'comment', 'description', 'remarks']
  };

  const mappings: Record<string, FieldMapping> = {};
  const threshold = 3; // Maximum Levenshtein distance for fuzzy matching

  headers.forEach(header => {
    const normalizedHeader = header.toLowerCase().trim();
    let bestMatch: { field: string; confidence: number } | null = null;

    // Check each known field
    for (const [dbField, variations] of Object.entries(knownFields)) {
      for (const variation of variations) {
        // Exact match (case-insensitive)
        if (normalizedHeader === variation) {
          bestMatch = { field: dbField, confidence: 100 };
          break;
        }
        
        // Fuzzy match using Levenshtein distance
        const dist = distance(normalizedHeader, variation);
        if (dist <= threshold) {
          const confidence = Math.max(0, Math.round((1 - dist / Math.max(normalizedHeader.length, variation.length)) * 100));
          if (!bestMatch || confidence > bestMatch.confidence) {
            bestMatch = { field: dbField, confidence };
          }
        }
      }
      
      if (bestMatch?.confidence === 100) break; // Perfect match found
    }

    // Only include matches with confidence >= 50%
    if (bestMatch && bestMatch.confidence >= 50) {
      mappings[header] = {
        db_field: bestMatch.field,
        confidence: bestMatch.confidence,
        csv_column: header
      };
    }
  });

  return mappings;
}

// Data validation for preview rows
function validateRows(rows: Record<string, string>[], mappings: Record<string, FieldMapping>): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  
  // Find email and phone mappings
  const emailMapping = Object.entries(mappings).find(([_, mapping]) => mapping.db_field === 'email');
  const phoneMapping = Object.entries(mappings).find(([_, mapping]) => mapping.db_field === 'phone');
  const nameMapping = Object.entries(mappings).find(([_, mapping]) => mapping.db_field === 'name');

  rows.forEach((row, index) => {
    const rowNumber = index + 1;

    // Email validation
    if (emailMapping) {
      const [emailColumn] = emailMapping;
      const email = row[emailColumn]?.trim();
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          errors.push({
            row: rowNumber,
            field: 'email',
            error: 'Invalid email format'
          });
        }
      } else {
        warnings.push({
          row: rowNumber,
          field: 'email',
          warning: 'Email field is empty'
        });
      }
    }

    // Phone validation
    if (phoneMapping) {
      const [phoneColumn] = phoneMapping;
      const phone = row[phoneColumn]?.trim();
      if (phone) {
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length < 7) {
          warnings.push({
            row: rowNumber,
            field: 'phone',
            warning: 'Phone number too short'
          });
        } else if (cleanPhone.length > 15) {
          warnings.push({
            row: rowNumber,
            field: 'phone',
            warning: 'Phone number too long'
          });
        }
      }
    }

    // Name validation
    if (nameMapping) {
      const [nameColumn] = nameMapping;
      const name = row[nameColumn]?.trim();
      if (!name) {
        warnings.push({
          row: rowNumber,
          field: 'name',
          warning: 'Name field is empty'
        });
      } else if (name.length < 2) {
        warnings.push({
          row: rowNumber,
          field: 'name',
          warning: 'Name too short'
        });
      }
    }
  });

  return { errors, warnings };
}

async function parseCSVContent(content: string): Promise<ParsedCSVData> {
  try {
    // Normalize line endings
    content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    
    // Parse CSV using Deno's standard library
    const parsed = parse(content, {
      skipFirstRow: false, // We'll handle headers manually
      strip: true, // Remove leading/trailing whitespace
    })

    if (parsed.length === 0) {
      throw new Error('No data found in CSV')
    }

    // Extract headers (first row)
    const headers = parsed[0] as string[]
    
    // Clean and validate headers
    const cleanHeaders = headers.map(header => 
      String(header || '').trim()
    ).filter(header => header.length > 0)

    if (cleanHeaders.length === 0) {
      throw new Error('No valid headers found')
    }

    // Extract data rows (remaining rows)
    const dataRows = parsed.slice(1)
    
    // Convert rows to objects, skipping empty rows
    const rows: Record<string, string>[] = []
    
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i] as string[]
      
      // Skip empty rows (all values empty or undefined)
      const hasData = row.some(cell => cell && String(cell).trim().length > 0)
      if (!hasData) {
        continue
      }

      // Create object with headers as keys
      const rowObj: Record<string, string> = {}
      
      cleanHeaders.forEach((header, index) => {
        const cellValue = row[index]
        rowObj[header] = cellValue ? String(cellValue).trim() : ''
      })
      
      rows.push(rowObj)
    }

    return {
      headers: cleanHeaders,
      rows: rows,
      totalRows: rows.length
    }
    
  } catch (error) {
    throw new Error(`CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/* To ship, run:
supabase functions deploy parse-csv-upload
*/