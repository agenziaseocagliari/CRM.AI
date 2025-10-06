# PowerShell script per deployare le Edge Functions direttamente
# Engineering Fellow access script

Write-Host "ENGINEERING FELLOW - Deploying Edge Functions directly..." -ForegroundColor Green

# Leggi il contenuto della funzione
$functionContent = Get-Content "supabase\functions\generate-form-fields\index.ts" -Raw

Write-Host "Function content loaded: $($functionContent.Length) characters" -ForegroundColor Yellow

# Target info
$supabaseUrl = "https://qjtaqrlpronohgpfdxsi.supabase.co"
$projectRef = "qjtaqrlpronohgpfdxsi"

Write-Host "Target: $supabaseUrl" -ForegroundColor Cyan
Write-Host "Project: $projectRef" -ForegroundColor Cyan

Write-Host "MANUAL DEPLOYMENT REQUIRED:" -ForegroundColor Red
Write-Host "1. Open Supabase Dashboard: https://supabase.com/dashboard/project/$projectRef" -ForegroundColor White
Write-Host "2. Go to Edge Functions section" -ForegroundColor White  
Write-Host "3. Find 'generate-form-fields' function" -ForegroundColor White
Write-Host "4. Replace content with the updated version from local file" -ForegroundColor White
Write-Host "5. Deploy the function manually" -ForegroundColor White

Write-Host "The key fix applied:" -ForegroundColor Green
Write-Host "- Replaced supabaseClient.functions.invoke with direct fetch" -ForegroundColor White
Write-Host "- This should resolve the 500 Internal Server Error" -ForegroundColor White

Write-Host "Function is ready for manual deployment!" -ForegroundColor Green