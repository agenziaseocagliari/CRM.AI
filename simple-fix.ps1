# Simple Character Fix Script
Write-Host "Starting character fix..." -ForegroundColor Green

$files = @(
    "src\components\Settings.tsx",
    "src\components\superadmin\SuperAdminHeader.tsx", 
    "src\components\superadmin\SuperAdminLayout.tsx",
    "src\components\TwoFactorAuth\TwoFactorSetup.tsx",
    "src\components\TwoFactorAuth\TwoFactorSettings.tsx",
    "src\components\ForgotPassword.tsx",
    "src\lib\ai\promptTemplates.ts"
)

$totalFixed = 0

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Processing $file..."
        
        $content = Get-Content $file -Raw -Encoding UTF8
        $originalLength = $content.Length
        
        # Use generic pattern to find and replace corrupted emojis
        $content = $content -creplace '\xF0\x9F[\x80-\xBF][\x80-\xBF]', '🔍'
        
        # Replace specific known corrupted patterns with simple regex
        $content = $content -replace 'Ã°Å¸â€', '🔍'
        $content = $content -replace 'Ã°Å¸â€™', '🔒'  
        $content = $content -replace 'Ã°Å¸â€œ', '🔧'
        $content = $content -replace 'Ã°Å¸â€¹', '📋'
        $content = $content -replace 'Ã°Å¸â€™Â‹', '👋'
        $content = $content -replace 'Ã°Å¸â€™Â¡', '💡'
        $content = $content -replace 'Ã°Å¸â€™Â¤', '👤'
        $content = $content -replace 'Ã°Å¸â€œÂ„', '🔄'
        $content = $content -replace 'Ã°Å¸Å¡Â¨', '🚨'
        $content = $content -replace 'Ã°Å¸â€ Â¡', '🛡️'
        $content = $content -replace 'Å¡Â Ã¯Â¸', '⚠️'
        $content = $content -replace 'â€œÅ'', '⚠️'
        $content = $content -replace 'â€¦', '...'
        
        if ($content.Length -ne $originalLength) {
            Set-Content $file $content -Encoding UTF8
            Write-Host "Fixed $file" -ForegroundColor Green
            $totalFixed++
        } else {
            Write-Host "No changes needed for $file" -ForegroundColor Gray
        }
    } else {
        Write-Host "File not found: $file" -ForegroundColor Red
    }
}

Write-Host "Total files fixed: $totalFixed" -ForegroundColor Cyan