# DEPLOY EDGE FUNCTION - SIMPLE VERSION

Write-Host "🚀 FORMMASTER DEPLOYMENT - LEVEL 5" -ForegroundColor Yellow

# Set environment
$env:SUPABASE_ACCESS_TOKEN = "sbp_fff530abe5d66befcd1efb7761f13f06b3f6169f"

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