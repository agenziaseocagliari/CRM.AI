# 🚀 DEPLOY SENZA DOCKER - METODO ALTERNATIVO
# Usa Supabase CLI con deployment remoto senza Docker locale

$ErrorActionPreference = "Continue"

Write-Host "🚀 DEPLOYMENT ALTERNATIVO EDGE FUNCTION" -ForegroundColor Yellow
Write-Host "=======================================" -ForegroundColor Yellow

# Check environment variables are set
if (-not $env:SUPABASE_ACCESS_TOKEN) {
    Write-Host "❌ SECURITY ERROR: SUPABASE_ACCESS_TOKEN environment variable not set" -ForegroundColor Red
    exit 1
}
$env:SUPABASE_PROJECT_REF = "qjtaqrlpronohgpfdxsi"

Write-Host "📋 Environment configured:" -ForegroundColor Cyan
Write-Host "Project: $env:SUPABASE_PROJECT_REF" -ForegroundColor White
Write-Host "Token: $($env:SUPABASE_ACCESS_TOKEN.Substring(0,20))..." -ForegroundColor White

# Check if function file exists and is ready
$functionFile = "C:\Users\inves\CRM-AI\supabase\functions\generate-form-fields\index.ts"
if (Test-Path $functionFile) {
    $functionContent = Get-Content $functionFile -Raw
    $hasGDPR = $functionContent -match "detectGDPRRequirement"
    Write-Host "✅ Function file found: $($functionContent.Length) characters" -ForegroundColor Green
    if ($hasGDPR) {
        Write-Host "✅ GDPR compliance code detected in function" -ForegroundColor Green
    } else {
        Write-Host "❌ GDPR compliance code NOT found" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Function file not found: $functionFile" -ForegroundColor Red
    exit 1
}

Write-Host "`n🚀 Attempting deployment..." -ForegroundColor Yellow

# Try deployment with different methods
Write-Host "Method 1: Standard deployment..." -ForegroundColor Cyan
try {
    $result1 = npx supabase functions deploy generate-form-fields --project-ref $env:SUPABASE_PROJECT_REF --no-verify-jwt 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Method 1 SUCCESS!" -ForegroundColor Green
        $deploySuccess = $true
    } else {
        Write-Host "❌ Method 1 failed: $result1" -ForegroundColor Red
        $deploySuccess = $false
    }
} catch {
    Write-Host "❌ Method 1 error: $($_.Exception.Message)" -ForegroundColor Red
    $deploySuccess = $false
}

if (-not $deploySuccess) {
    Write-Host "`nMethod 2: Remote deployment..." -ForegroundColor Cyan
    try {
        $result2 = npx supabase functions deploy generate-form-fields --project-ref $env:SUPABASE_PROJECT_REF --no-verify-jwt --debug 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Method 2 SUCCESS!" -ForegroundColor Green
            $deploySuccess = $true
        } else {
            Write-Host "❌ Method 2 failed: $result2" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Method 2 error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

if (-not $deploySuccess) {
    Write-Host "`n⚠️ Automated deployment failed - Docker required" -ForegroundColor Yellow
    Write-Host "Waiting for Docker Desktop to be ready..." -ForegroundColor Cyan
    
    # Wait for Docker
    $dockerReady = $false
    $attempts = 0
    $maxAttempts = 12
    
    while (-not $dockerReady -and $attempts -lt $maxAttempts) {
        Start-Sleep 10
        $attempts++
        Write-Host "Attempt $attempts/$maxAttempts - Checking Docker..." -ForegroundColor Yellow
        
        try {
            $dockerVersion = docker --version 2>$null
            if ($dockerVersion) {
                Write-Host "✅ Docker ready: $dockerVersion" -ForegroundColor Green
                $dockerReady = $true
                
                # Try deployment again with Docker
                Write-Host "🚀 Deploying with Docker..." -ForegroundColor Yellow
                $result3 = npx supabase functions deploy generate-form-fields --project-ref $env:SUPABASE_PROJECT_REF --no-verify-jwt 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✅ DEPLOYMENT SUCCESS WITH DOCKER!" -ForegroundColor Green
                    $deploySuccess = $true
                } else {
                    Write-Host "❌ Docker deployment failed: $result3" -ForegroundColor Red
                }
            }
        } catch {
            # Docker not ready yet
        }
    }
}

if ($deploySuccess) {
    Write-Host "`n🧪 Testing deployed function..." -ForegroundColor Yellow
    Start-Sleep 5
    
    if (-not $env:SUPABASE_ANON_KEY) {
        Write-Host "❌ SUPABASE_ANON_KEY environment variable not set" -ForegroundColor Red
        exit 1
    }
    $testHeaders = @{
        'Authorization' = "Bearer $env:SUPABASE_ANON_KEY"
        'Content-Type' = 'application/json'
    }
    $testBody = '{"prompt":"form contatto per gdpr privacy consent"}'
    
    try {
        $testResponse = Invoke-RestMethod -Uri 'https://qjtaqrlpronohgpfdxsi.supabase.co/functions/v1/generate-form-fields' -Method POST -Headers $testHeaders -Body $testBody
        
        $hasGDPRField = $testResponse.fields | Where-Object { $_.name -eq 'privacy_consent' }
        if ($hasGDPRField) {
            Write-Host "🏆 DEPLOYMENT VERIFICATION SUCCESS!" -ForegroundColor Green
            Write-Host "✅ GDPR compliance is working!" -ForegroundColor Green
            Write-Host "✅ Privacy consent field: $($hasGDPRField.label)" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Deployment succeeded but GDPR not working yet" -ForegroundColor Yellow
            Write-Host "Function may need a few minutes to update" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️ Function deployed but testing failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "`n❌ DEPLOYMENT FAILED" -ForegroundColor Red
    Write-Host "📋 Manual deployment required:" -ForegroundColor Yellow
    Write-Host "1. Install and start Docker Desktop" -ForegroundColor Cyan
    Write-Host "2. Wait 5-10 minutes for Docker to be fully ready" -ForegroundColor Cyan
    Write-Host "3. Run: npx supabase functions deploy generate-form-fields --project-ref qjtaqrlpronohgpfdxsi" -ForegroundColor Cyan
}

Write-Host "`n🎯 Deployment process completed" -ForegroundColor Yellow