import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🗄️ Setting up database tables...')

    // Create forms table
    const { error: formsError } = await supabaseClient.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.forms (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title TEXT NOT NULL,
          name TEXT NOT NULL,
          fields JSONB NOT NULL DEFAULT '[]'::jsonb,
          organization_id UUID NOT NULL,
          user_id UUID,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (formsError) {
      console.error('Forms table error:', formsError)
    } else {
      console.log('✅ Forms table created')
    }

    // Create form_submissions table
    const { error: submissionsError } = await supabaseClient.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.form_submissions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE,
          data JSONB NOT NULL DEFAULT '{}'::jsonb,
          submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          ip_address INET,
          user_agent TEXT
        );
      `
    })

    if (submissionsError) {
      console.error('Submissions table error:', submissionsError)
    } else {
      console.log('✅ Form submissions table created')
    }

    // Create indexes
    const { error: indexError } = await supabaseClient.rpc('exec', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_forms_organization_id ON public.forms(organization_id);
        CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON public.form_submissions(form_id);
      `
    })

    if (indexError) {
      console.error('Index error:', indexError)
    } else {
      console.log('✅ Indexes created')
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Database setup completed',
        tables_created: ['forms', 'form_submissions'],
        indexes_created: ['idx_forms_organization_id', 'idx_form_submissions_form_id']
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Database setup error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        message: 'Database setup failed'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})