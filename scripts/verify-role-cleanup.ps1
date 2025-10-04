# PostgreSQL Role Cleanup Verification Script (PowerShell version)
Write-Host "🔍 PostgreSQL Role Cleanup Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$errorCount = 0
$warningCount = 0

# Check 1: No 'TO super_admin' references
Write-Host "Check 1: No 'TO super_admin' references"
$superAdminRefs = Select-String -Path "supabase/migrations/*.sql" -Pattern "TO super_admin" -AllMatches
if ($superAdminRefs) {
    Write-Host "  ❌ FAIL: Found problematic references:" -ForegroundColor Red
    $superAdminRefs | ForEach-Object { Write-Host "$($_.Filename):$($_.LineNumber):$($_.Line.Trim())" -ForegroundColor Red }
    $errorCount++
} else {
    Write-Host "  ✅ PASS" -ForegroundColor Green
}

# Check 2: No 'TO authenticated' references
Write-Host ""
Write-Host "Check 2: No 'TO authenticated' references"
$authenticatedRefs = Select-String -Path "supabase/migrations/*.sql" -Pattern "TO authenticated" -AllMatches
if ($authenticatedRefs) {
    Write-Host "  ❌ FAIL: Found problematic references:" -ForegroundColor Red
    $authenticatedRefs | ForEach-Object { Write-Host "$($_.Filename):$($_.LineNumber):$($_.Line.Trim())" -ForegroundColor Red }
    $errorCount++
} else {
    Write-Host "  ✅ PASS" -ForegroundColor Green
}

# Check 3: No 'TO service_role' references
Write-Host ""
Write-Host "Check 3: No 'TO service_role' references"
$serviceRoleRefs = Select-String -Path "supabase/migrations/*.sql" -Pattern "TO service_role" -AllMatches
if ($serviceRoleRefs) {
    Write-Host "  ❌ FAIL: Found problematic references:" -ForegroundColor Red
    $serviceRoleRefs | ForEach-Object { Write-Host "$($_.Filename):$($_.LineNumber):$($_.Line.Trim())" -ForegroundColor Red }
    $errorCount++
} else {
    Write-Host "  ✅ PASS" -ForegroundColor Green
}

# Check 4: No GRANT statements to DB roles
Write-Host ""
Write-Host "Check 4: No GRANT statements to DB roles"
$grantRefs = Select-String -Path "supabase/migrations/*.sql" -Pattern "GRANT.*TO (authenticated|service_role|super_admin)" -AllMatches
if ($grantRefs) {
    Write-Host "  ❌ FAIL: Found problematic references:" -ForegroundColor Red
    $grantRefs | ForEach-Object { Write-Host "$($_.Filename):$($_.LineNumber):$($_.Line.Trim())" -ForegroundColor Red }
    $errorCount++
} else {
    Write-Host "  ✅ PASS" -ForegroundColor Green
}

# Check 5: All RLS policies use TO public
Write-Host ""
Write-Host "Check 5: All RLS policies use TO public"
$policies = Select-String -Path "supabase/migrations/*.sql" -Pattern "CREATE POLICY.*FOR.*TO" -AllMatches
$publicPolicies = Select-String -Path "supabase/migrations/*.sql" -Pattern "CREATE POLICY.*FOR.*TO public" -AllMatches

if ($policies.Count -gt 0) {
    if ($publicPolicies.Count -eq $policies.Count) {
        Write-Host "  ✅ PASS" -ForegroundColor Green
        Write-Host "  Policies with TO public: $($publicPolicies.Count)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  WARNING: Policy count mismatch" -ForegroundColor Yellow
        Write-Host "  Total policies: $($policies.Count)" -ForegroundColor Yellow
        Write-Host "  Policies with TO public: $($publicPolicies.Count)" -ForegroundColor Yellow
        $warningCount++
    }
} else {
    Write-Host "  ✅ PASS (No policies found)" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total checks: 5"

if ($errorCount -gt 0) {
    Write-Host ""
    Write-Host "❌ ERRORS: $errorCount" -ForegroundColor Red
}

if ($warningCount -gt 0) {
    Write-Host "⚠️  WARNINGS: $warningCount" -ForegroundColor Yellow
}

if ($errorCount -eq 0 -and $warningCount -eq 0) {
    Write-Host ""
    Write-Host "✅ ALL CHECKS PASSED!" -ForegroundColor Green
    exit 0
} elseif ($errorCount -gt 0) {
    Write-Host ""
    Write-Host "Please fix the issues above before deploying." -ForegroundColor Red
    exit 1
} else {
    Write-Host ""
    Write-Host "Warnings found but no critical errors." -ForegroundColor Yellow
    exit 0
}