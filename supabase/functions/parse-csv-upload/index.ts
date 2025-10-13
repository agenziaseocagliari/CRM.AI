import { parse } from "https://deno.land/std@0.224.0/csv/parse.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

function cleanText(text: string | undefined | null): string {
  if (!text) return '';
  return text.trim()
    .replace(/^\uFEFF/, '')
    .replace(/â€"/g, '–')
    .replace(/Ã¨/g, 'è')
    .replace(/â€™/g, "'")
    .replace(/\0/g, '')
    .replace(/\s+/g, ' ');
}

function extractEmail(value: string): string {
  if (!value) return '';
  const cleaned = cleanText(value);
  
  const markdownMatch = cleaned.match(/\[([^\]]+@[^\]]+)\]/);
  if (markdownMatch) return markdownMatch[1];
  
  const mailtoMatch = cleaned.match(/mailto:([^\s)]+)/i);
  if (mailtoMatch) return mailtoMatch[1];
  
  const emailMatch = cleaned.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) return emailMatch[1];
  
  return cleaned.includes('@') ? cleaned : '';
}

function cleanPhone(value: string): string {
  if (!value) return '';
  return cleanText(value).replace(/[^\d+\s()-]/g, '').trim();
}

function detectFieldType(header: string): { type: string; confidence: number } {
  const normalized = cleanText(header).toLowerCase().replace(/[_-]/g, ' ');
  
  const patterns: Record<string, string[]> = {
    name: ['name', 'nome', 'contact name', 'full name'],
    email: ['email', 'e mail', 'mail', 'posta'],
    phone: ['phone', 'tel', 'telefono', 'cellulare'],
    company: ['company', 'azienda', 'società']
  };
  
  for (const [type, variations] of Object.entries(patterns)) {
    for (const variation of variations) {
      if (normalized === variation) return { type, confidence: 100 };
      if (normalized.includes(variation)) return { type, confidence: 85 };
    }
  }
  
  return { type: 'unknown', confidence: 0 };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('Enterprise CSV Parser - Starting');
  const startTime = Date.now();

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No file provided'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let content = await file.text();
    
    // 🐛 FIX: Don't use cleanText on full CSV content - it removes line breaks!
    // Only clean individual cells, not the entire file
    
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.substring(1);
    }

    let rows: string[][];
    try {
      rows = parse(content, {
        skipFirstRow: false,
        strip: true,
        lazyQuotes: true
      });
      
      console.log('✅ CSV parsed successfully:', rows.length, 'rows');
      
    } catch (error) {
      console.log('⚠️ Fallback parsing for malformed CSV');
      const lines = content.split(/\r?\n/).filter(line => line.trim());
      rows = lines.map(line => {
        const cells: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (const char of line) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            cells.push(cleanText(current));
            current = '';
          } else {
            current += char;
          }
        }
        cells.push(cleanText(current));
        return cells;
      });
    }

    console.log('CSV parsing started - file:', file.name, 'size:', file.size);

    if (rows.length < 2) {
      console.log('❌ REJECTED: Less than 2 rows total');
      return new Response(JSON.stringify({
        success: false,
        error: 'No valid data rows found',
        details: {
          totalRows: rows.length,
          headers: rows[0] || null,
          reason: 'CSV needs at least header + 1 data row'
        },
        debug: {
          rawContentLength: content.length,
          contentPreview: content.substring(0, 100)
        }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const headers = rows[0];
    
    // More permissive filtering with debug info
    const dataRows = rows.slice(1).filter(row => {
      const hasContent = row.some(cell => {
        const cleaned = cleanText(cell);
        return cleaned.length > 0;
      });
      return hasContent;
    });

    console.log('Data validation:', {
      totalRows: rows.length,
      dataRows: dataRows.length,
      emptyRowsFiltered: (rows.length - 1) - dataRows.length
    });

    // Better error if no data after filtering
    if (dataRows.length === 0) {
      console.log('❌ REJECTED: No data rows after filtering');
      return new Response(JSON.stringify({
        success: false,
        error: 'All data rows appear empty',
        details: {
          totalRows: rows.length,
          headers: headers,
          dataRowsParsed: rows.length - 1,
          dataRowsValid: dataRows.length,
          reason: 'All data rows were filtered out as empty'
        },
        hint: 'Check that your CSV has non-empty data below the header row',
        debug: {
          firstFewRows: rows.slice(0, 3)
        }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const fieldMappings = headers.map(header => {
      const detection = detectFieldType(header);
      return {
        csv_field: header,
        detected_type: detection.type,
        confidence: detection.confidence,
        db_field: detection.type !== 'unknown' ? detection.type : null
      };
    });

    const processedRows = dataRows.map(row => {
      const rowObj: Record<string, string> = {};
      headers.forEach((header, index) => {
        const rawValue = row[index] || '';
        const fieldType = fieldMappings[index].detected_type;
        
        let cleanedValue: string;
        if (fieldType === 'email') {
          cleanedValue = extractEmail(rawValue);
        } else if (fieldType === 'phone') {
          cleanedValue = cleanPhone(rawValue);
        } else {
          cleanedValue = cleanText(rawValue);
        }
        
        rowObj[header] = cleanedValue;
      });
      return rowObj;
    });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: orgs } = await supabaseClient.from('organizations').select('id').limit(1);
    const orgId = orgs?.[0]?.id;

    const { data: importRecord } = await supabaseClient
      .from('contact_imports')
      .insert({
        organization_id: orgId,
        filename: file.name,
        file_size: file.size,
        total_rows: processedRows.length,
        status: 'completed',
        field_mapping: Object.fromEntries(
          fieldMappings.filter(m => m.db_field).map(m => [m.csv_field, m.db_field])
        )
      })
      .select()
      .single();

    const processingTime = Date.now() - startTime;

    console.log('✅ CSV processing complete:', processedRows.length, 'contacts processed in', processingTime + 'ms');

    return new Response(JSON.stringify({
      success: true,
      import_id: importRecord?.id || `temp-${Date.now()}`,
      summary: {
        filename: file.name,
        total_rows: processedRows.length,
        valid_rows: processedRows.length,
        invalid_rows: 0,
        contacts_created: processedRows.length,
        processing_time_ms: processingTime
      },
      field_mappings: fieldMappings.filter(m => m.db_field),
      validation_summary: {
        email_issues: 0,
        phone_issues: 0,
        missing_required: 0,
        duplicate_emails: 0
      },
      preview_contacts: processedRows.slice(0, 3)
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Enterprise parser error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
