# 🚀 DIRECT DEPLOYMENT VIA API - LEVEL 5 FINAL
# Deploy Edge Function directly to Supabase using Management API

$ErrorActionPreference = "Continue"

Write-Host "🚀 FORMMASTER LEVEL 5 - DIRECT DEPLOYMENT" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

# Read the function code
$functionCode = Get-Content "C:\Users\inves\CRM-AI\FINAL_GDPR_EDGE_FUNCTION.ts" -Raw
$functionSize = $functionCode.Length

Write-Host "📋 Function code loaded: $functionSize characters" -ForegroundColor Cyan

# Test current function first
Write-Host "`n🧪 Testing current deployed function..." -ForegroundColor Yellow
$headers = @{
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2ODk0NDYsImV4cCI6MjA1MDI2NTQ0Nn0.4_KlkqOo9qhZ4RyGbNlSgf8DTJXKM7wBGhpfhkOJHSE'
    'Content-Type' = 'application/json'
}

$testBody = '{"prompt":"test gdpr privacy consent"}'

try {
    $currentResponse = Invoke-RestMethod -Uri 'https://qjtaqrlpronohgpfdxsi.supabase.co/functions/v1/generate-form-fields' -Method POST -Headers $headers -Body $testBody
    
    $hasGDPR = $currentResponse.fields | Where-Object { $_.name -eq 'privacy_consent' }
    
    if ($hasGDPR) {
        Write-Host "✅ GDPR COMPLIANCE ALREADY ACTIVE!" -ForegroundColor Green
        Write-Host "Version: $($currentResponse.meta.version)" -ForegroundColor Green
        Write-Host "GDPR Enabled: $($currentResponse.meta.gdpr_enabled)" -ForegroundColor Green
        
        # Test passed - function is already updated
        Write-Host "`n🏆 DEPLOYMENT VERIFICATION SUCCESSFUL!" -ForegroundColor Green
        Write-Host "The GDPR-enhanced function is already deployed and working!" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "❌ GDPR COMPLIANCE MISSING - Need to deploy update" -ForegroundColor Red
        Write-Host "Current version: $($currentResponse.meta.version)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Current function test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Since automated deployment isn't working, provide manual instructions
Write-Host "`n📋 MANUAL DEPLOYMENT REQUIRED" -ForegroundColor Yellow
Write-Host "=============================" -ForegroundColor Yellow
Write-Host "1. Go to: https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi/functions" -ForegroundColor Cyan
Write-Host "2. Click on 'generate-form-fields' function" -ForegroundColor Cyan  
Write-Host "3. Click 'Edit Function'" -ForegroundColor Cyan
Write-Host "4. Replace ALL code with content from: FINAL_GDPR_EDGE_FUNCTION.ts" -ForegroundColor Cyan
Write-Host "5. Click 'Deploy Function'" -ForegroundColor Cyan
Write-Host "6. Wait for deployment to complete" -ForegroundColor Cyan

Write-Host "`n🔍 VERIFICATION STEPS:" -ForegroundColor Yellow
Write-Host "1. After deployment, run this test:" -ForegroundColor Cyan
Write-Host '   Test prompt: "form contatto per gdpr compliance con consenso privacy"' -ForegroundColor White
Write-Host "2. Response should include 'privacy_consent' field" -ForegroundColor Cyan
Write-Host "3. meta.version should be '12.1'" -ForegroundColor Cyan
Write-Host "4. meta.gdpr_enabled should be true" -ForegroundColor Cyan

Write-Host "`n⚠️ AUTOMATED DEPLOYMENT BLOCKED BY:" -ForegroundColor Red
Write-Host "- Docker Desktop not available" -ForegroundColor Red
Write-Host "- Supabase CLI deployment requires Docker" -ForegroundColor Red
Write-Host "- Management API requires different authentication" -ForegroundColor Red

Write-Host "`n💡 ALTERNATIVE: Create new function via Dashboard" -ForegroundColor Yellow
Write-Host "1. Delete existing 'generate-form-fields' function" -ForegroundColor Cyan
Write-Host "2. Create new function with same name" -ForegroundColor Cyan
Write-Host "3. Paste code from FINAL_GDPR_EDGE_FUNCTION.ts" -ForegroundColor Cyan
Write-Host "4. Deploy" -ForegroundColor Cyan

Write-Host "`n🎯 STATUS: Manual deployment required to complete Level 5 implementation" -ForegroundColor Yellow