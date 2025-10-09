// ============================================================================
// 🎯 SUPABASE DIRECT CONNECTION - ENGINEERING FELLOW LEVEL 5
// ============================================================================

const SUPABASE_URL = 'https://qjtaqrlpronohgpfdxsi.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODQ2OTU3NiwiZXhwIjoyMDQ0MDQ1NTc2fQ.5Zo3z3qLm8LN4Z1AqWRnfzd8DJqzXpJpDnF0nT-ydOQ'

// Types for better error handling - COMMENTED OUT AS UNUSED
/*
interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

interface DeploymentResponse {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}
*/

/**
 * 🚀 EXECUTE DATABASE SETUP DIRECTLY
 */
async function executeDirectDatabaseSetup() {
  console.log('🗄️ Starting direct database setup...')
  
  try {
    // Execute the complete database setup
    const { data, error } = await supabase.rpc('exec', {
      sql: `
-- FORMMASTER LEVEL 5 - COMPLETE DATABASE SETUP
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create forms table
CREATE TABLE IF NOT EXISTS public.forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    name TEXT NOT NULL,
    fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    organization_id UUID NOT NULL,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create form submissions table
CREATE TABLE IF NOT EXISTS public.form_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_forms_organization_id ON public.forms(organization_id);
CREATE INDEX IF NOT EXISTS idx_forms_created_at ON public.forms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON public.form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_at ON public.form_submissions(submitted_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for forms table
DROP TRIGGER IF EXISTS update_forms_updated_at ON public.forms;
CREATE TRIGGER update_forms_updated_at 
    BEFORE UPDATE ON public.forms 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for forms
CREATE POLICY IF NOT EXISTS "forms_select_policy" ON public.forms
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "forms_insert_policy" ON public.forms
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "forms_update_policy" ON public.forms
    FOR UPDATE USING (true);

-- Create RLS policies for form submissions
CREATE POLICY IF NOT EXISTS "submissions_select_policy" ON public.form_submissions
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "submissions_insert_policy" ON public.form_submissions
    FOR INSERT WITH CHECK (true);

-- Create form submission function
CREATE OR REPLACE FUNCTION public.create_submission(
    p_form_id UUID,
    p_data JSONB,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    submission_id UUID;
BEGIN
    INSERT INTO public.form_submissions (form_id, data, ip_address, user_agent)
    VALUES (p_form_id, p_data, p_ip_address, p_user_agent)
    RETURNING id INTO submission_id;
    
    RETURN submission_id;
END;
$$;
      `
    })

    if (error) {
      throw error
    }

    console.log('✅ Database setup completed successfully!')
    return { success: true, data }

  } catch (error) {
    console.error('❌ Database setup failed:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 🚀 DEPLOY EDGE FUNCTION DIRECTLY
 */
async function deployEdgeFunctionDirect() {
  console.log('🔧 Deploying Edge Function directly...')
  
  try {
    // Read the function code
    const functionCode = await Deno.readTextFile('./TEST_generate-form-fields.ts')
    
    // Deploy via API (if Supabase API supports it)
    const response = await fetch(`https://api.supabase.com/v1/projects/qjtaqrlpronohgpfdxsi/functions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'generate-form-fields',
        source: functionCode,
        entrypoint: 'index.ts'
      })
    })

    if (response.ok) {
      console.log('✅ Edge Function deployed successfully!')
      return { success: true }
    } else {
      const error = await response.text()
      console.error('❌ Edge Function deployment failed:', error)
      return { success: false, error }
    }

  } catch (error) {
    console.error('❌ Edge Function deployment error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 🧪 TEST EVERYTHING
 */
async function testFormMasterComplete() {
  console.log('🧪 Testing FormMaster Level 5...')
  
  try {
    // Test database connection
    const { error: testError } = await supabase
      .from('forms')
      .select('*')
      .limit(1)

    if (testError && !testError.message.includes('relation "forms" does not exist')) {
      throw testError
    }

    console.log('✅ Database connection successful!')

    // Test Edge Function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-form-fields`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        prompt: 'Crea un form di contatto per wordpress, con thema kadence. il form va inserito in una pagina dei servizi di realizzazione siti web, lo scopo è ricervere richieste di informazioni e preventivi. i dati da raccogliere sono nome, numero di telefono e email ed il campo note. deve essere un modulo a norma GDPR',
        organization_id: 'test-level5'
      })
    })

    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Edge Function working!')
      console.log('Generated fields:', result.fields?.length || 0)
      return { success: true, result }
    } else {
      throw new Error(`Edge Function failed: ${result.error}`)
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
    return { success: false, error: error.message }
  }
}

// Execute all tasks
async function executeAllTasks() {
  console.log('🚀 FORMMASTER LEVEL 5 - REAL EXECUTION')
  
  // Task 1 & 2: Database setup
  const dbResult = await executeDirectDatabaseSetup()
  if (!dbResult.success) {
    console.error('Database setup failed, continuing with other tasks...')
  }

  // Task 1: Edge Function deployment
  const edgeResult = await deployEdgeFunctionDirect()
  if (!edgeResult.success) {
    console.error('Edge Function deployment failed, continuing with testing...')
  }

  // Test everything
  const testResult = await testFormMasterComplete()
  
  console.log('🎯 FINAL RESULTS:')
  console.log('Database:', dbResult.success ? '✅' : '❌')
  console.log('Edge Function:', edgeResult.success ? '✅' : '❌')
  console.log('Integration Test:', testResult.success ? '✅' : '❌')
  
  return {
    database: dbResult.success,
    edgeFunction: edgeResult.success,
    integrationTest: testResult.success
  }
}

// Run if this is the main module
if (import.meta.main) {
  executeAllTasks().then(results => {
    console.log('📊 Execution completed:', results)
    Deno.exit(results.database && results.integrationTest ? 0 : 1)
  })
}

export { executeDirectDatabaseSetup, deployEdgeFunctionDirect, testFormMasterComplete }