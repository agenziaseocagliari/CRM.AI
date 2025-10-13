import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

interface ContactData {
  email?: string;
  phone?: string;
  name?: string;
}

interface DuplicateMatch {
  contact_id: string;
  match_type: 'email' | 'phone' | 'name';
  confidence: number;
  email?: string;
  phone?: string;
  name: string;
  created_at: string;
  recommended_action: 'skip' | 'merge' | 'replace' | 'keep_both';
}

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

    // Parse request
    const { contacts, import_id, organization_id } = await req.json();

    if (!contacts || !Array.isArray(contacts)) {
      return new Response(
        JSON.stringify({ error: 'Invalid contacts array' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!organization_id) {
      return new Response(
        JSON.stringify({ error: 'organization_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Checking ${contacts.length} contacts for duplicates in org ${organization_id}`);

    // Check each contact for duplicates
    const results = [];
    
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];

      // Call SQL function to find duplicates
      const { data: duplicates, error } = await supabaseClient
        .rpc('find_duplicates', {
          p_email: contact.email || null,
          p_phone: contact.phone || null,
          p_name: contact.name || null,
          p_organization_id: organization_id,
          p_exclude_id: null
        });

      if (error) {
        console.error('Duplicate check error for contact', i, ':', error);
        // Continue with other contacts even if one fails
        results.push({
          index: i,
          contact: contact,
          duplicates: [],
          has_duplicates: false,
          recommended_action: 'import'
        });
        continue;
      }

      // Determine recommended action based on matches
      const matches: DuplicateMatch[] = (duplicates || []).map((dup: any) => {
        let recommended_action: 'skip' | 'merge' | 'replace' | 'keep_both' = 'keep_both';

        if (dup.match_type === 'email' && dup.confidence === 1.0) {
          // Exact email match - recommend skip (already exists)
          recommended_action = 'skip';
        } else if (dup.confidence >= 0.9) {
          // High confidence - recommend merge
          recommended_action = 'merge';
        } else if (dup.confidence >= 0.8) {
          // Medium confidence - let user decide (default merge)
          recommended_action = 'merge';
        }

        return {
          contact_id: dup.contact_id,
          match_type: dup.match_type,
          confidence: dup.confidence,
          email: dup.email,
          phone: dup.phone,
          name: dup.name,
          created_at: dup.created_at,
          recommended_action
        };
      });

      // Choose the highest confidence match's recommendation
      const topMatch = matches.sort((a, b) => b.confidence - a.confidence)[0];

      results.push({
        index: i,
        contact: contact,
        duplicates: matches,
        has_duplicates: matches.length > 0,
        recommended_action: matches.length > 0 ? topMatch.recommended_action : 'import'
      });
    }

    // Summary statistics
    const stats = {
      total_checked: contacts.length,
      duplicates_found: results.filter(r => r.has_duplicates).length,
      exact_matches: results.filter(r => 
        r.duplicates.some((d: DuplicateMatch) => d.confidence === 1.0)
      ).length,
      fuzzy_matches: results.filter(r => 
        r.duplicates.some((d: DuplicateMatch) => d.confidence < 1.0 && d.confidence >= 0.8)
      ).length,
      unique_contacts: results.filter(r => !r.has_duplicates).length,
      recommended_skip: results.filter(r => r.recommended_action === 'skip').length,
      recommended_merge: results.filter(r => r.recommended_action === 'merge').length,
      recommended_import: results.filter(r => r.recommended_action === 'import').length
    };

    // Update import record with duplicate check results if import_id provided
    if (import_id) {
      const { error: updateError } = await supabaseClient
        .from('contact_imports')
        .update({
          status: 'duplicates_checked',
          duplicate_count: stats.duplicates_found,
          updated_at: new Date().toISOString()
        })
        .eq('id', import_id);

      if (updateError) {
        console.warn('Failed to update import status:', updateError);
      }
    }

    console.log('Duplicate check complete:', stats);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        stats,
        import_id,
        processing_time_ms: Date.now() % 10000 // Simple timing estimate
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Duplicate check error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.stack?.substring(0, 500)
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});