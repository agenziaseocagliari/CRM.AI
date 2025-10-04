# PowerShell script for safe character replacement in JWTViewer.tsx
$filePath = "src\components\JWTViewer.tsx"

Write-Host "🔧 Starting safe character replacement in JWTViewer.tsx"

if (-not (Test-Path $filePath)) {
    Write-Host "❌ File not found: $filePath"
    exit 1
}

# Read file content
$content = Get-Content $filePath -Raw -Encoding UTF8

# Count original corrupted characters
$originalCorrupted = 0
$originalCorrupted += ($content | Select-String -Pattern "ðŸ" -AllMatches).Matches.Count
$originalCorrupted += ($content | Select-String -Pattern '"…' -AllMatches).Matches.Count  
$originalCorrupted += ($content | Select-String -Pattern '"Œ' -AllMatches).Matches.Count

Write-Host "📊 Found $originalCorrupted corrupted character sequences"

if ($originalCorrupted -eq 0) {
    Write-Host "✨ No corrupted characters found!"
    exit 0
}

# Make backup
$backupPath = "$filePath.safe-backup-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss')"
Copy-Item $filePath $backupPath
Write-Host "💾 Backup created: $backupPath"

# Perform replacements one by one
$replacements = @(
    @{ From = 'ðŸ"'; To = '🔍'; Name = 'search icon' },
    @{ From = '"…'; To = '✅'; Name = 'checkmark' },
    @{ From = '"Œ'; To = '⚠️'; Name = 'warning' },
    @{ From = 'ðŸ"‹'; To = '📋'; Name = 'clipboard' },
    @{ From = 'ðŸ'¤'; To = '👤'; Name = 'user icon' },
    @{ From = '"š™ï¸'; To = '🛡️'; Name = 'shield' }
)

$totalChanges = 0

foreach ($replacement in $replacements) {
    $before = ($content | Select-String -Pattern ([regex]::Escape($replacement.From)) -AllMatches).Matches.Count
    if ($before -gt 0) {
        $content = $content -replace [regex]::Escape($replacement.From), $replacement.To
        $after = ($content | Select-String -Pattern ([regex]::Escape($replacement.From)) -AllMatches).Matches.Count
        $changed = $before - $after
        if ($changed -gt 0) {
            Write-Host "  ✅ $($replacement.Name): $changed replacements"
            $totalChanges += $changed
        }
    }
}

if ($totalChanges -gt 0) {
    # Write back to file with UTF8 encoding
    $content | Set-Content -Path $filePath -Encoding UTF8 -NoNewline
    Write-Host "🎉 Successfully applied $totalChanges character fixes!"
    
    # Verify the file is still valid TypeScript
    Write-Host "🔍 Verifying file integrity..."
    $verification = Get-Content $filePath -Raw
    if ($verification.Length -gt 0 -and $verification.Contains("export const JWTViewer")) {
        Write-Host "✅ File integrity verified!"
    } else {
        Write-Host "❌ File integrity check failed, restoring backup..."
        Copy-Item $backupPath $filePath
        exit 1
    }
} else {
    Write-Host "ℹ️  No changes were needed"
}

Write-Host "🎯 Character replacement completed successfully!"