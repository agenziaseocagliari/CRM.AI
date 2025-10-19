# check-migration-versions.ps1
$ErrorActionPreference = 'Stop'
Write-Host ''
Write-Host 'Checking migration versions for duplicates' -ForegroundColor Blue
$migrationsDir = 'supabase\migrations'
if (-not (Test-Path $migrationsDir)) {
    Write-Host 'Error: Migrations directory not found' -ForegroundColor Red
    exit 1
}
$migrationFiles = Get-ChildItem -Path $migrationsDir -Filter '*.sql' | Sort-Object Name
if ($migrationFiles.Count -eq 0) {
    Write-Host 'Warning: No migration files found' -ForegroundColor Yellow
    exit 0
}
$versions = @{}
$duplicatesFound = $false
foreach ($file in $migrationFiles) {
    if ($file.Name -match '^(\d+)_') {
        $version = $matches[1]
        if ($versions.ContainsKey($version)) {
            if (-not $duplicatesFound) {
                Write-Host 'ERROR: Duplicate migration versions detected' -ForegroundColor Red
                $duplicatesFound = $true
            }
            Write-Host "Version $version found in:" -ForegroundColor Yellow
            Write-Host "  - $($versions[$version])"
            Write-Host "  - $($file.Name)"
        } else {
            $versions[$version] = $file.Name
        }
    }
}
if ($duplicatesFound) {
    Write-Host 'Fix duplicate versions before deploying' -ForegroundColor Red
    exit 1
} else {
    Write-Host 'All migration versions are unique' -ForegroundColor Green
    Write-Host "Total migrations: $($migrationFiles.Count)"
    exit 0
}
