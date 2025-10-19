# Test npm ci with retry logic

Write-Host "NPM INSTALL TEST" -ForegroundColor Cyan
Write-Host ""

$NodeVersion = node -v
$NpmVersion = npm -v

Write-Host "Node: $NodeVersion"
Write-Host "npm: $NpmVersion"
Write-Host ""

$MaxAttempts = 3
$Attempt = 1

while ($Attempt -le $MaxAttempts) {
    Write-Host "Attempt $Attempt of $MaxAttempts..." -ForegroundColor Yellow
    
    npm ci --legacy-peer-deps --no-fund --no-audit
    $ExitCode = $LASTEXITCODE
    
    if ($ExitCode -eq 0) {
        Write-Host "SUCCESS!" -ForegroundColor Green
        exit 0
    }
    else {
        Write-Host "FAILED: Code $ExitCode" -ForegroundColor Red
        
        if ($Attempt -lt $MaxAttempts) {
            $WaitTime = $Attempt * 5
            Write-Host "Retrying in ${WaitTime}s..."
            Start-Sleep -Seconds $WaitTime
        }
    }
    
    $Attempt++
}

exit 1
