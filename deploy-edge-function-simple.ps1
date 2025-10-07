Write-Host "Deploying Edge Function VERSION 12.0" -ForegroundColor Green

$projectRef = "qjtaqrlpronohgpfdxsi"
$functionContent = Get-Content "supabase\functions\generate-form-fields\index.ts" -Raw

Write-Host "Function content loaded: $($functionContent.Length) characters" -ForegroundColor Yellow

# Try Supabase CLI deployment with token
$env:SUPABASE_ACCESS_TOKEN = "sbp_fff530abe5d66befcd1efb7761f13f06b3f6169f"

Write-Host "Attempting Supabase CLI deployment..." -ForegroundColor Yellow

try {
    $result = & npx supabase functions deploy generate-form-fields --project-ref $projectRef --no-verify-jwt 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS: Edge Function deployed!" -ForegroundColor Green
        Write-Host "VERSION 12.0 with Context-Aware AI is now LIVE!" -ForegroundColor Cyan
    } else {
        Write-Host "CLI deployment failed, trying alternative..." -ForegroundColor Yellow
        Write-Host "Output: $result" -ForegroundColor Red
        
        # Try without Docker requirement
        $env:SUPABASE_DOCKER_DESKTOP_REQUIRED = "false"
        $result2 = & npx supabase functions deploy generate-form-fields --project-ref $projectRef --legacy 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "SUCCESS: Alternative deployment worked!" -ForegroundColor Green
        } else {
            Write-Host "All automated methods failed" -ForegroundColor Red
            Write-Host "Manual deployment required via Supabase Dashboard" -ForegroundColor Yellow
            Write-Host "URL: https://supabase.com/dashboard/project/$projectRef/functions" -ForegroundColor White
        }
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Deployment attempt completed" -ForegroundColor Blue