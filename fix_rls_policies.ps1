Write-Host "Making RLS policies idempotent..." -ForegroundColor Yellow

$migrationFiles = Get-ChildItem "supabase\migrations\*.sql"
$totalFiles = 0
$modifiedFiles = 0

foreach ($file in $migrationFiles) {
    $totalFiles++
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    $content = $content -replace '(?m)^(\s*)(CREATE POLICY\s+"([^"]+)"\s+ON\s+(\w+(?:\.\w+)?))', '$1DROP POLICY IF EXISTS "$3" ON $4;$1$1$2'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($file.Name)" -ForegroundColor Green
        $modifiedFiles++
    } else {
        Write-Host "Skipped: $($file.Name)" -ForegroundColor Gray
    }
}

Write-Host "Total files: $totalFiles, Modified: $modifiedFiles" -ForegroundColor Cyan