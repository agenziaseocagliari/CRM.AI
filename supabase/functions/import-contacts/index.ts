import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { import_id, mappings, duplicateResolutions, contacts } = await req.json();

    console.log(`Importing ${contacts.length} contacts`);

    // Get organization (TODO: from user session)
    const { data: orgs } = await supabaseClient
      .from('organizations')
      .select('id')
      .limit(1)
      .single();

    if (!orgs) {
      throw new Error('No organization found');
    }

    const organizationId = orgs.id;

    // Process each contact based on duplicate resolution
    const results = {
      imported: 0,
      skipped: 0,
      merged: 0,
      replaced: 0,
      errors: 0
    };

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      const resolution = duplicateResolutions?.[i] || 'import';

      try {
        // Apply field mappings
        const mappedContact: any = {
          organization_id: organizationId,
        };

        mappings.forEach((mapping: any) => {
          if (mapping.dbField && contact[mapping.csvColumn]) {
            mappedContact[mapping.dbField] = contact[mapping.csvColumn];
          }
        });

        // Handle duplicate resolution
        if (resolution === 'skip') {
          results.skipped++;
          continue;
        }

        if (resolution === 'import' || resolution === 'keep_both') {
          // Insert new contact
          const { error } = await supabaseClient
            .from('contacts')
            .insert(mappedContact);

          if (error) {
            console.error('Insert error:', error);
            results.errors++;
          } else {
            results.imported++;
          }
        }

        // TODO: Implement merge and replace logic
        // For now, treat as import
        if (resolution === 'merge' || resolution === 'replace') {
          const { error } = await supabaseClient
            .from('contacts')
            .insert(mappedContact);

          if (error) {
            console.error('Insert error:', error);
            results.errors++;
          } else {
            results.imported++;
            results.merged++;
          }
        }

      } catch (err: any) {
        console.error('Contact processing error:', err);
        results.errors++;
      }
    }

    // Update import record
    if (import_id) {
      await supabaseClient
        .from('contact_imports')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          imported_count: results.imported,
          skipped_count: results.skipped,
          error_count: results.errors
        })
        .eq('id', import_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        imported_count: results.imported
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});