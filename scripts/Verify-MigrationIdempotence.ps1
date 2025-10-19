# PowerShell Migration Idempotence Verification Script
# Checks all SQL migration files for missing DROP statements

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "MIGRATION IDEMPOTENCE VERIFICATION" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$migrationsPath = "supabase/migrations"
$issues = @()
$allGood = $true

# Get all SQL migration files
$migrationFiles = Get-ChildItem -Path $migrationsPath -Filter "*.sql" | Sort-Object Name

Write-Host "Checking $($migrationFiles.Count) migration files...`n" -ForegroundColor Yellow

foreach ($file in $migrationFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    $fileName = $file.Name
    $fileIssues = @()
    
    # Check for CREATE TRIGGER without DROP TRIGGER IF EXISTS
    $triggers = $content | Select-String 'CREATE\s+(?:OR\s+REPLACE\s+)?TRIGGER\s+' -AllMatches
    $dropTriggers = $content | Select-String 'DROP\s+TRIGGER\s+IF\s+EXISTS' -AllMatches
    
    if ($triggers.Matches.Count -gt 0 -and $dropTriggers.Matches.Count -eq 0) {
        $fileIssues += "❌ Missing DROP TRIGGER IF EXISTS ($($triggers.Matches.Count) triggers found)"
        $allGood = $false
    }
    
    # Check for CREATE POLICY without DROP POLICY IF EXISTS
    $policies = $content | Select-String 'CREATE\s+POLICY\s+' -AllMatches
    $dropPolicies = $content | Select-String 'DROP\s+POLICY\s+IF\s+EXISTS' -AllMatches
    
    # Each CREATE POLICY should have a corresponding DROP POLICY IF EXISTS
    if ($policies.Matches.Count -gt 0 -and $dropPolicies.Matches.Count -lt $policies.Matches.Count) {
        $missing = $policies.Matches.Count - $dropPolicies.Matches.Count
        $fileIssues += "❌ Missing DROP POLICY IF EXISTS ($missing out of $($policies.Matches.Count) policies)"
        $allGood = $false
    }
    
    # Check for CREATE FUNCTION without DROP FUNCTION IF EXISTS
    $functions = $content | Select-String 'CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+' -AllMatches
    $dropFunctions = $content | Select-String 'DROP\s+FUNCTION\s+IF\s+EXISTS' -AllMatches
    
    if ($functions.Matches.Count -gt 0 -and $dropFunctions.Matches.Count -eq 0) {
        $fileIssues += "⚠️ Missing DROP FUNCTION IF EXISTS ($($functions.Matches.Count) functions found)"
    }
    
    if ($fileIssues.Count -gt 0) {
        Write-Host "FILE: $fileName" -ForegroundColor Red
        foreach ($issue in $fileIssues) {
            Write-Host "  $issue"
        }
        $issues += @{ File = $fileName; Issues = $fileIssues }
    } else {
        Write-Host "✅ $fileName - IDEMPOTENT" -ForegroundColor Green
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "✅ ALL MIGRATIONS ARE IDEMPOTENT AND SAFE" -ForegroundColor Green
} else {
    Write-Host "⚠️ SOME MIGRATIONS HAVE IDEMPOTENCE ISSUES" -ForegroundColor Red
    Write-Host "`nSummary of Issues:" -ForegroundColor Yellow
    foreach ($issue in $issues) {
        Write-Host "`n  - $($issue.File)" -ForegroundColor Red
        foreach ($problemStatement in $issue.Issues) {
            Write-Host "    $problemStatement"
        }
    }
}
Write-Host "========================================`n" -ForegroundColor Cyan
