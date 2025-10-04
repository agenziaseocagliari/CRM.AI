# Complete Character Fix PowerShell Script
# This script fixes all corrupted character encodings across the CRM application
param(
    [switch]$DryRun = $false
)

Write-Host "🚀 Starting complete character corruption fix..." -ForegroundColor Green

# Define all files to fix
$filesToFix = @(
    "src\components\Settings.tsx",
    "src\components\superadmin\SuperAdminHeader.tsx",
    "src\components\superadmin\SuperAdminLayout.tsx", 
    "src\components\TwoFactorAuth\TwoFactorSetup.tsx",
    "src\components\TwoFactorAuth\TwoFactorSettings.tsx",
    "src\components\ForgotPassword.tsx",
    "src\lib\ai\promptTemplates.ts"
)

# Define character replacements (using Unicode escape sequences to avoid corruption)
$replacements = @(
    @{ Pattern = [char]0xF0 + [char]0x9F + [char]0x94 + [char]0x8D; Replacement = "🔍"; Name = "search icon" },           # ðŸ"
    @{ Pattern = [char]0xF0 + [char]0x9F + [char]0x94 + [char]0x92; Replacement = "🔒"; Name = "lock icon" },             # ðŸ"'  
    @{ Pattern = [char]0xF0 + [char]0x9F + [char]0x94 + [char]0xA7; Replacement = "🔧"; Name = "wrench icon" },           # ðŸ"§
    @{ Pattern = [char]0xF0 + [char]0x9F + [char]0x93 + [char]0x8B; Replacement = "📋"; Name = "clipboard icon" },        # ðŸ"‹
    @{ Pattern = [char]0xF0 + [char]0x9F + [char]0x91 + [char]0x8B; Replacement = "👋"; Name = "waving hand" },           # ðŸ'‹
    @{ Pattern = [char]0xF0 + [char]0x9F + [char]0x92 + [char]0xA1; Replacement = "💡"; Name = "lightbulb" },             # ðŸ'¡
    @{ Pattern = [char]0xF0 + [char]0x9F + [char]0x91 + [char]0xA4; Replacement = "👤"; Name = "user icon" },             # ðŸ'¤
    @{ Pattern = [char]0xF0 + [char]0x9F + [char]0x94 + [char]0x84; Replacement = "🔄"; Name = "reload icon" },           # ðŸ"„
    @{ Pattern = [char]0xF0 + [char]0x9F + [char]0x9A + [char]0xA8; Replacement = "🚨"; Name = "alert icon" },            # ðŸš¨
    @{ Pattern = [char]0xF0 + [char]0x9F + [char]0x9B + [char]0xA1; Replacement = "🛡️"; Name = "shield icon" },          # ðŸ›
    @{ Pattern = "š ï¸"; Replacement = "⚠️"; Name = "warning triangle" },
    @{ Pattern = [char]0x201C + [char]0x152; Replacement = "⚠️"; Name = "alternative warning" },                          # "Œ
    @{ Pattern = [char]0x201C + [char]0x0161 + [char]0x2122 + [char]0xEF; Replacement = "🛡️"; Name = "alternative shield" }, # "š™ï¸
    @{ Pattern = [char]0x2026; Replacement = "..."; Name = "ellipsis" }                                                    # …
)

$totalProcessed = 0
$totalFixed = 0
$results = @()

foreach ($filePath in $filesToFix) {
    Write-Host "`n🔧 Processing file: $filePath" -ForegroundColor Cyan
    
    if (-not (Test-Path $filePath)) {
        Write-Host "❌ File not found: $filePath" -ForegroundColor Red
        $results += @{ File = $filePath; Status = "Not Found"; Replacements = 0 }
        continue
    }
    
    try {
        $content = Get-Content $filePath -Raw -Encoding UTF8
        $originalContent = $content
        $fileReplacements = 0
        
        foreach ($replacement in $replacements) {
            $beforeCount = ($content | Select-String -Pattern ([regex]::Escape($replacement.Pattern)) -AllMatches).Matches.Count
            if ($beforeCount -gt 0) {
                $content = $content -replace ([regex]::Escape($replacement.Pattern)), $replacement.Replacement
                $afterCount = ($content | Select-String -Pattern ([regex]::Escape($replacement.Pattern)) -AllMatches).Matches.Count
                $replacedCount = $beforeCount - $afterCount
                
                if ($replacedCount -gt 0) {
                    Write-Host "  ✅ Fixed $($replacement.Name): $replacedCount replacements" -ForegroundColor Green
                    $fileReplacements += $replacedCount
                }
            }
        }
        
        if ($content -ne $originalContent) {
            if (-not $DryRun) {
                Set-Content $filePath $content -Encoding UTF8
                Write-Host "✅ Successfully updated $filePath with $fileReplacements fixes" -ForegroundColor Green
            } else {
                Write-Host "🔍 [DRY RUN] Would fix $fileReplacements issues in $filePath" -ForegroundColor Yellow
            }
            $totalFixed++
            $results += @{ File = $filePath; Status = "Fixed"; Replacements = $fileReplacements }
        } else {
            Write-Host "ℹ️  No corrupted characters found in $filePath" -ForegroundColor Gray
            $results += @{ File = $filePath; Status = "Clean"; Replacements = 0 }
        }
        
        $totalProcessed++
        
    } catch {
        Write-Host "❌ Error processing $filePath`: $($_.Exception.Message)" -ForegroundColor Red
        $results += @{ File = $filePath; Status = "Error"; Replacements = 0; Error = $_.Exception.Message }
    }
}

# Summary
Write-Host "`n📊 SUMMARY:" -ForegroundColor Magenta
Write-Host "Files processed: $totalProcessed" -ForegroundColor White
Write-Host "Files fixed: $totalFixed" -ForegroundColor White

if ($DryRun) {
    Write-Host "`n🔍 DRY RUN completed. No files were actually modified." -ForegroundColor Yellow
    Write-Host "Run without -DryRun to apply the fixes." -ForegroundColor Yellow
} elseif ($totalFixed -gt 0) {
    Write-Host "`n✅ All character corruption issues have been fixed!" -ForegroundColor Green
    Write-Host "`n📝 Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Test the build: npm run build" -ForegroundColor White
    Write-Host "   2. Commit changes: git add . && git commit -m 'fix: eliminate all character corruption'" -ForegroundColor White
    Write-Host "   3. Push to production: git push" -ForegroundColor White
} else {
    Write-Host "`nℹ️  No character corruption found in any files." -ForegroundColor Gray
}

# Detail results
Write-Host "`n📋 Detailed Results:" -ForegroundColor Cyan
$results | ForEach-Object {
    $status = switch ($_.Status) {
        "Fixed" { "✅ Fixed ($($_.Replacements))" }
        "Clean" { "✨ Clean" }
        "Not Found" { "❌ Not Found" }
        "Error" { "❌ Error" }
    }
    Write-Host "  $($_.File): $status" -ForegroundColor White
}