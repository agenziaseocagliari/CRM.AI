Write-Host "Deploying VERSION 12.0 - CONTEXT-AWARE AI" -ForegroundColor Green

Copy-Item "TEST_generate-form-fields.ts" "supabase\functions\generate-form-fields\index.ts" -Force
Write-Host "File copied successfully" -ForegroundColor Green

Write-Host "Attempting deployment..." -ForegroundColor Yellow

$result = & npx supabase functions deploy generate-form-fields --project-ref qjtaqrlpronohgpfdxsi 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "VERSION 12.0 DEPLOYED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "Features: Context-Aware AI, Industry Detection, Adaptive Labels" -ForegroundColor Cyan
} else {
    Write-Host "Automatic deployment failed. Manual deployment needed" -ForegroundColor Yellow
    Write-Host "Go to Supabase Dashboard and update the function manually" -ForegroundColor White
}