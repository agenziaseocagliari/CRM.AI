# Automatic backup to local PC (Windows PowerShell version)
param(
    [string]$LocalBackupDir = "C:\Users\inves\CRM-AI-Backups"
)

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupName = "crm-backup-$Timestamp"
$BackupPath = Join-Path $LocalBackupDir $BackupName

Write-Host "🔄 Starting backup to local PC..." -ForegroundColor Cyan

# Create backup directory
New-Item -ItemType Directory -Force -Path $BackupPath | Out-Null

# Copy project files (exclude node_modules, .git, etc.)
Write-Host "📁 Copying project files..." -ForegroundColor Yellow
$ExcludeDirs = @('node_modules', '.git', 'dist', '.next', 'build', '.env')

try {
    Get-ChildItem -Path . -Recurse | Where-Object {
        $item = $_
        -not ($ExcludeDirs | Where-Object { $item.FullName -like "*\$_\*" -or $item.Name -eq $_ })
    } | ForEach-Object {
        $relativePath = $_.FullName.Replace((Get-Location).Path, "")
        $destinationPath = Join-Path $BackupPath $relativePath
        $destinationDir = Split-Path $destinationPath -Parent
        
        if (-not (Test-Path $destinationDir)) {
            New-Item -ItemType Directory -Force -Path $destinationDir | Out-Null
        }
        
        if (-not $_.PSIsContainer) {
            Copy-Item $_.FullName $destinationPath -Force
        }
    }
    Write-Host "✅ Files copied successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Some files could not be copied: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Backup database schema
Write-Host "💾 Exporting database schema..." -ForegroundColor Yellow
try {
    $schemaOutput = & npx supabase@latest db dump --project-ref qjtaqrlpronohgpfdxsi --schema public 2>&1
    $schemaOutput | Out-File -FilePath "$BackupPath\database-schema.sql" -Encoding UTF8
    Write-Host "✅ Database schema exported" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Database backup failed (credentials may be needed)" -ForegroundColor Yellow
}

# Create manifest
Write-Host "📋 Creating backup manifest..." -ForegroundColor Yellow
try {
    $GitCommit = & git rev-parse HEAD 2>&1
    $GitBranch = & git branch --show-current 2>&1
    $FileCount = (Get-ChildItem -Path $BackupPath -Recurse -File).Count
    $BackupSize = "{0:N2} MB" -f ((Get-ChildItem -Path $BackupPath -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB)

    @"
Backup Created: $Timestamp
Git Commit: $GitCommit
Branch: $GitBranch
Files: $FileCount
Size: $BackupSize
"@ | Out-File "$BackupPath\BACKUP_MANIFEST.txt" -Encoding UTF8
} catch {
    Write-Host "⚠️ Could not create complete manifest" -ForegroundColor Yellow
}

# Compress
Write-Host "🗜️ Compressing backup..." -ForegroundColor Yellow
try {
    Compress-Archive -Path $BackupPath -DestinationPath "$LocalBackupDir\$BackupName.zip" -Force
    Remove-Item -Recurse -Force $BackupPath
    
    $CompressedSize = "{0:N2} MB" -f ((Get-Item "$LocalBackupDir\$BackupName.zip").Length / 1MB)
    Write-Host "✅ Backup complete: $BackupName.zip ($CompressedSize)" -ForegroundColor Green
} catch {
    Write-Host "❌ Compression failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Clean old backups
Write-Host "🧹 Cleaning old backups..." -ForegroundColor Yellow
try {
    $allBackups = Get-ChildItem -Path $LocalBackupDir -Filter "crm-backup-*.zip" | Sort-Object CreationTime -Descending
    if ($allBackups.Count -gt 10) {
        $oldBackups = $allBackups | Select-Object -Skip 10
        $oldBackups | Remove-Item -Force
        Write-Host "🗑️ Removed $($oldBackups.Count) old backups" -ForegroundColor Green
    }
    Write-Host "📈 Total backups: $($allBackups.Count)" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Could not clean old backups" -ForegroundColor Yellow
}

Write-Host "📍 Location: $LocalBackupDir" -ForegroundColor Green