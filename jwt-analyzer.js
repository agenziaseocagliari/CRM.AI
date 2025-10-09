// JWT Token Analyzer per verificare scadenza token Supabase
function decodeJWT(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format')
    }
    
    const header = JSON.parse(atob(parts[0]))
    const payload = JSON.parse(atob(parts[1]))
    
    return { header, payload }
  } catch (error) {
    console.error('❌ Error decoding JWT:', error.message)
    return null
  }
}

function analyzeToken(name, token) {
  console.log(`\n🔍 Analyzing ${name}...`)
  console.log('=' .repeat(40))
  
  const decoded = decodeJWT(token)
  if (!decoded) {
    console.log('❌ Failed to decode token')
    return false
  }
  
  const { header, payload } = decoded
  
  console.log('📋 Header:', JSON.stringify(header, null, 2))
  console.log('📋 Payload:', JSON.stringify(payload, null, 2))
  
  // Check expiration
  if (payload.exp) {
    const expirationDate = new Date(payload.exp * 1000)
    const now = new Date()
    const isExpired = now > expirationDate
    
    console.log(`⏰ Issued At: ${new Date(payload.iat * 1000).toLocaleString()}`)
    console.log(`⏰ Expires At: ${expirationDate.toLocaleString()}`)
    console.log(`⏰ Current Time: ${now.toLocaleString()}`)
    
    if (isExpired) {
      console.log('❌ TOKEN IS EXPIRED!')
      const hoursExpired = Math.round((now - expirationDate) / (1000 * 60 * 60 * 24))
      console.log(`🕐 Token expired ${hoursExpired} days ago`)
      return false
    } else {
      const hoursRemaining = Math.round((expirationDate - now) / (1000 * 60 * 60 * 24))
      console.log(`✅ Token is valid for ${hoursRemaining} more days`)
      return true
    }
  } else {
    console.log('⚠️ No expiration found in token')
    return true
  }
}

// Token from .env file
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzg2NjQsImV4cCI6MjA3MzAxNDY2NH0.kFo4Cj6rrAY4SLcLLwXyTOLi7YhLMHMKSXpqS9RzCmQ'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0'

console.log('🔍 SUPABASE JWT TOKEN ANALYSIS')
console.log('=' .repeat(60))

const anonValid = analyzeToken('ANON KEY', supabaseAnonKey)
const serviceValid = analyzeToken('SERVICE ROLE KEY', serviceRoleKey)

console.log('\n🎯 SUMMARY')
console.log('=' .repeat(30))
console.log(`ANON Key: ${anonValid ? '✅ VALID' : '❌ INVALID/EXPIRED'}`)
console.log(`Service Key: ${serviceValid ? '✅ VALID' : '❌ INVALID/EXPIRED'}`)

if (!anonValid || !serviceValid) {
  console.log('\n🚨 AUTHENTICATION ISSUE IDENTIFIED!')
  console.log('📝 SOLUTION: Regenerate expired tokens in Supabase dashboard')
  console.log('🔗 URL: https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi/settings/api')
}