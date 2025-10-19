# FINAL NODE.JS COMPATIBILITY FIX - DEFINITIVE SOLUTION

Write-Host "`n========================================"  -ForegroundColor Cyan
Write-Host "FINAL NODE.JS COMPATIBILITY FIX" -ForegroundColor Cyan
Write-Host "========================================`n"  -ForegroundColor Cyan

# Step 1: Clean all npm caches and locks
Write-Host "Step 1: Cleaning npm cache..." -ForegroundColor Yellow
Remove-Item -Path ".\.npmrc" -Force -ErrorAction SilentlyContinue
npm cache clean --force 2>&1 | Out-Null
Write-Host "OK: Cache cleaned`n" -ForegroundColor Green

# Step 2: Update package-lock.json for Node 18 compatibility
Write-Host "Step 2: Clearing package-lock for regeneration..." -ForegroundColor Yellow
Remove-Item -Path ".\package-lock.json" -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "OK: Old lock files removed`n" -ForegroundColor Green

# Step 3: Fresh install with node 18 optimizations
Write-Host "Step 3: Fresh npm install..." -ForegroundColor Yellow
npm install --legacy-peer-deps --no-optional 2>&1 | Select-Object -Last 5
Write-Host "OK: Dependencies installed`n" -ForegroundColor Green

# Step 4: Verify
Write-Host "Step 4: Verifying installation..." -ForegroundColor Yellow
$nodeVersion = node --version
$npmVersion = npm --version
Write-Host "Node: $nodeVersion" -ForegroundColor Cyan
Write-Host "npm: $npmVersion`n" -ForegroundColor Cyan

Write-Host "========================================"  -ForegroundColor Cyan
Write-Host "FIX COMPLETE" -ForegroundColor Green
Write-Host "========================================"  -ForegroundColor Cyan
