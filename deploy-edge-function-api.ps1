# SUPABASE EDGE FUNCTION DEPLOYMENT VIA API
# ========================================

Write-Host "🚀 DEPLOYING EDGE FUNCTION VIA API - VERSION 12.0" -ForegroundColor Green

$projectRef = "qjtaqrlpronohgpfdxsi"
$accessToken = $env:SUPABASE_ACCESS_TOKEN
if (-not $accessToken) {
    Write-Host "❌ SECURITY ERROR: SUPABASE_ACCESS_TOKEN environment variable not set" -ForegroundColor Red
    exit 1
}

# Read the function content
$functionContent = Get-Content "supabase\functions\generate-form-fields\index.ts" -Raw

Write-Host "📁 Function content loaded: $($functionContent.Length) characters" -ForegroundColor Yellow

# Prepare the API request
$headers = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
    "apikey" = $env:SUPABASE_ANON_KEY
}

$body = @{
    name = "generate-form-fields"
    source = $functionContent
    entrypoint = "index.ts"
} | ConvertTo-Json -Depth 10

try {
    Write-Host "🌍 Attempting API deployment..." -ForegroundColor Yellow
    
    # Try direct function update via Management API
    $uri = "https://api.supabase.com/v1/projects/$projectRef/functions/generate-form-fields"
    $response = Invoke-RestMethod -Uri $uri -Method PATCH -Headers $headers -Body $body -ErrorAction Stop
    
    Write-Host "✅ EDGE FUNCTION DEPLOYED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "🎯 VERSION 12.0 with Context-Aware AI is now LIVE!" -ForegroundColor Cyan
    Write-Host "Function URL: https://$projectRef.supabase.co/functions/v1/generate-form-fields" -ForegroundColor White
    
} catch {
    Write-Host "⚠️ API deployment failed, trying alternative method..." -ForegroundColor Yellow
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Alternative: Direct CLI with specific parameters
    Write-Host "🔄 Trying Supabase CLI deployment..." -ForegroundColor Yellow
    
    try {
        $env:SUPABASE_ACCESS_TOKEN = $accessToken
        $cliResult = & npx supabase functions deploy generate-form-fields --project-ref $projectRef --no-verify-jwt --debug 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ CLI DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
        } else {
            Write-Host "❌ CLI deployment also failed" -ForegroundColor Red
            Write-Host "Output: $cliResult" -ForegroundColor Yellow
            
            # Manual instructions
            Write-Host "`n📋 MANUAL DEPLOYMENT REQUIRED:" -ForegroundColor Yellow
            Write-Host "1. Go to: https://supabase.com/dashboard/project/$projectRef/functions" -ForegroundColor White
            Write-Host "2. Select 'generate-form-fields' function" -ForegroundColor White
            Write-Host "3. Copy content from: supabase\functions\generate-form-fields\index.ts" -ForegroundColor White
            Write-Host "4. Paste and deploy in the web editor" -ForegroundColor White
        }
    } catch {
        Write-Host "❌ All deployment methods failed" -ForegroundColor Red
        Write-Host "Manual deployment via Supabase Dashboard required" -ForegroundColor Yellow
    }
}