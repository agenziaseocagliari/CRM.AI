# DEPLOY EDGE FUNCTION - SIMPLE VERSION

Write-Host "🚀 FORMMASTER DEPLOYMENT - LEVEL 5" -ForegroundColor Yellow

# Set environment
# Check SUPABASE_ACCESS_TOKEN is set in environment
if (-not $env:SUPABASE_ACCESS_TOKEN) {
    Write-Host "❌ SECURITY ERROR: SUPABASE_ACCESS_TOKEN environment variable not set" -ForegroundColor Red
    exit 1
}

# Check function file
$functionFile = "C:\Users\inves\CRM-AI\supabase\functions\generate-form-fields\index.ts"
if (Test-Path $functionFile) {
    Write-Host "✅ Function file found" -ForegroundColor Green
} else {
    Write-Host "❌ Function file missing" -ForegroundColor Red
    exit 1
}

# Try deployment
Write-Host "🚀 Deploying Edge Function..." -ForegroundColor Yellow
npx supabase functions deploy generate-form-fields --project-ref qjtaqrlpronohgpfdxsi --no-verify-jwt