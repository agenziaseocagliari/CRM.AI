// Test di connessione e autenticazione Supabase
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carica variabili ambiente
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 TESTING SUPABASE AUTHENTICATION CONNECTION')
console.log('='.repeat(50))

// Test 1: Connessione di base
console.log('\n1️⃣ Testing basic connection...')
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase URL or ANON key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
console.log('✅ Supabase client created successfully')
console.log(`🔗 URL: ${supabaseUrl}`)
console.log(`🔑 ANON Key: ${supabaseKey.substring(0, 20)}...`)

// Test 2: Service Role connection
console.log('\n2️⃣ Testing service role connection...')
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
console.log('✅ Admin client created successfully')

// Test 3: Database health check
console.log('\n3️⃣ Testing database connection...')
try {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('count(*)')
    .limit(1)
  
  if (error) {
    console.error('❌ Database connection error:', error.message)
  } else {
    console.log('✅ Database connection successful')
    console.log('📊 Profiles table accessible')
  }
} catch (err) {
  console.error('❌ Database connection failed:', err.message)
}

// Test 4: Auth status check
console.log('\n4️⃣ Testing authentication status...')
try {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.log('⚠️ No active session (expected for server-side test)')
  } else if (session) {
    console.log('✅ Active session found')
    console.log(`👤 User: ${session.user.email}`)
  } else {
    console.log('⚠️ No active session (expected for server-side test)')
  }
} catch (err) {
  console.error('❌ Auth status check failed:', err.message)
}

// Test 5: Check auth tables
console.log('\n5️⃣ Testing auth tables structure...')
try {
  // Check profiles table
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, role, created_at')
    .limit(5)
  
  if (profilesError) {
    console.error('❌ Profiles table error:', profilesError.message)
  } else {
    console.log(`✅ Profiles table: ${profiles?.length || 0} records found`)
    if (profiles && profiles.length > 0) {
      console.log('📝 Sample profile:', profiles[0])
    }
  }

  // Check organizations table
  const { data: orgs, error: orgsError } = await supabaseAdmin
    .from('organizations')
    .select('id, name, created_at')
    .limit(5)
  
  if (orgsError) {
    console.error('❌ Organizations table error:', orgsError.message)
  } else {
    console.log(`✅ Organizations table: ${orgs?.length || 0} records found`)
  }

  // Check user_organizations table
  const { data: userOrgs, error: userOrgsError } = await supabaseAdmin
    .from('user_organizations')
    .select('user_id, organization_id, role')
    .limit(5)
  
  if (userOrgsError) {
    console.error('❌ User_organizations table error:', userOrgsError.message)
  } else {
    console.log(`✅ User_organizations table: ${userOrgs?.length || 0} records found`)
  }

} catch (err) {
  console.error('❌ Auth tables check failed:', err.message)
}

console.log('\n' + '='.repeat(50))
console.log('🏁 Authentication test completed')