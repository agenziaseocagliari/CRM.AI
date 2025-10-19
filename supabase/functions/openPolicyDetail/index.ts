import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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
    );

    const { policy_id } = await req.json();

    if (!policy_id) {
      return new Response(
        JSON.stringify({ 
          error: 'Policy ID is required',
          code: 'MISSING_POLICY_ID'
        }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    console.log('🔍 [openPolicyDetail] Fetching policy with ID:', policy_id);

    // Fetch policy with related data
    const { data: policy, error } = await supabaseClient
      .from('insurance_policies')
      .select(`
        *,
        contact:contacts(id, name, email, phone, company),
        created_by_user:profiles(email)
      `)
      .eq('id', policy_id)
      .single();

    if (error) {
      console.error('❌ [openPolicyDetail] Database error:', error);
      
      if (error.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ 
            error: 'Polizza non trovata',
            code: 'POLICY_NOT_FOUND',
            policy_id 
          }),
          { 
            status: 404, 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          error: 'Errore nel recupero della polizza',
          code: 'DATABASE_ERROR',
          details: error.message 
        }),
        { 
          status: 500, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    if (!policy) {
      console.error('❌ [openPolicyDetail] No policy data returned');
      return new Response(
        JSON.stringify({ 
          error: 'Polizza non trovata',
          code: 'POLICY_NOT_FOUND',
          policy_id 
        }),
        { 
          status: 404, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    console.log('✅ [openPolicyDetail] Policy fetched successfully:', policy.policy_number);

    return new Response(
      JSON.stringify({ 
        success: true,
        policy,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('❌ [openPolicyDetail] Unexpected error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Errore interno del server',
        code: 'INTERNAL_ERROR',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});