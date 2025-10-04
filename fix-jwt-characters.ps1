# PowerShell script to safely replace corrupted characters in JWTViewer.tsx
# This uses binary-safe replacement to avoid text encoding issues

$filePath = "src/components/JWTViewer.tsx"

Write-Host "🔧 Fixing corrupted characters in JWTViewer.tsx..."

if (Test-Path $filePath) {
    # Read file as bytes to preserve encoding
    $content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)
    
    # Track changes
    $originalContent = $content
    $changeCount = 0
    
    # Define replacements (using Unicode escape sequences)
    $replacements = @{
        # Bug emoji: ðŸ› -> 🐛
        [char]0x00f0 + [char]0x0178 + [char]0x203a = [char]0x1F41B
        # Clipboard emoji: ðŸ"‹ -> 📋  
        [char]0x00f0 + [char]0x0178 + [char]0x201d + [char]0x2039 = [char]0x1F4CB
        # Lock emoji: ðŸ" -> 🔒
        [char]0x00f0 + [char]0x0178 + [char]0x201d = [char]0x1F512
        # Search emoji: ðŸ" -> 🔍
        [char]0x00f0 + [char]0x0178 + [char]0x201c = [char]0x1F50D
        # User emoji: ðŸ'¤ -> 👤
        [char]0x00f0 + [char]0x0178 + [char]0x2019 + [char]0x00a4 = [char]0x1F464
    }
    
    # Apply replacements
    foreach ($pair in $replacements.GetEnumerator()) {
        $before = $content
        $content = $content -replace [regex]::Escape($pair.Key), $pair.Value
        if ($content -ne $before) {
            $changeCount++
            Write-Host "  ✅ Replaced corrupted character → correct emoji"
        }
    }
    
    # Also try simple text replacements for visible corrupted patterns
    $textReplacements = @{
        '"…' = '✅'    # checkmark
        '"Œ' = '⚠️'    # warning
        '"š™ï¸' = '🛡️'  # shield
    }
    
    foreach ($pair in $textReplacements.GetEnumerator()) {
        $before = $content
        $content = $content.Replace($pair.Key, $pair.Value)
        if ($content -ne $before) {
            $changeCount++
            Write-Host "  ✅ Fixed text pattern: $($pair.Key) → $($pair.Value)"
        }
    }
    
    # Write back if changes were made
    if ($content -ne $originalContent) {
        [System.IO.File]::WriteAllText($filePath, $content, [System.Text.Encoding]::UTF8)
        Write-Host "✅ Fixed $changeCount corrupted characters in $filePath"
    } else {
        Write-Host "ℹ️ No corrupted characters found in $filePath"
    }
} else {
    Write-Host "❌ File not found: $filePath"
}

Write-Host "🎉 Character cleanup completed!"