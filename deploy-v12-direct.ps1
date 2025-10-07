# DEPLOY VERSION 12.0 - LEVEL 5 AI STRATEGIA SUPREMA
Write-Host "🚀 DEPLOYING VERSION 12.0 - CONTEXT-AWARE AI" -ForegroundColor Green

# Copia il file aggiornato
Copy-Item "TEST_generate-form-fields.ts" "supabase\functions\generate-form-fields\index.ts" -Force
Write-Host "✅ File copied to supabase functions directory" -ForegroundColor Green

Write-Host "🌍 Attempting deployment..." -ForegroundColor Yellow

# Direct deployment attempt
$result = & npx supabase functions deploy generate-form-fields --project-ref qjtaqrlpronohgpfdxsi 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "🎉 VERSION 12.0 DEPLOYED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "✨ Features: Context-Aware AI, Industry Detection, Adaptive Labels" -ForegroundColor Cyan
} else {
    Write-Host "⚠️ Automatic deployment failed. Using manual approach..." -ForegroundColor Yellow
    Write-Host "📋 MANUAL DEPLOYMENT NEEDED:" -ForegroundColor Yellow  
    Write-Host "1. Go to: https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi" -ForegroundColor White
    Write-Host "2. Navigate to Edge Functions > generate-form-fields" -ForegroundColor White
    Write-Host "3. Copy content from: supabase\functions\generate-form-fields\index.ts" -ForegroundColor White
    Write-Host "4. Deploy manually from dashboard" -ForegroundColor White
}