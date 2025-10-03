# Fix all irregular whitespace errors from ESLint log
$files = @(
    "src\components\JWTViewer.tsx",
    "src\components\Forms.tsx",
    "src\components\DebugPanel.tsx",
    "src\components\Dashboard.tsx",
    "src\components\ContactEventsList.tsx",
    "src\components\CalendarView.tsx",
    "src\App.tsx",
    "src\components\MainLayout.tsx",
    "src\components\Opportunities.tsx",
    "src\components\ResetPassword.tsx",
    "src\components\Settings.tsx",
    "src\components\TwoFactorAuth\TwoFactorSettings.tsx",
    "src\components\TwoFactorAuth\TwoFactorSetup.tsx",
    "src\components\superadmin\Customers.tsx",
    "src\components\superadmin\charts\MrrChart.tsx",
    "src\components\superadmin\charts\UserGrowthChart.tsx",
    "src\hooks\useCrmData.ts",
    "src\lib\loginTracker.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Fixing: $file"
        $content = Get-Content $file -Raw -Encoding UTF8
        # Replace common irregular whitespace characters
        $content = $content -replace '\u00A0', ' '  # Non-breaking space
        $content = $content -replace '\u2000', ' '  # En quad
        $content = $content -replace '\u2001', ' '  # Em quad
        $content = $content -replace '\u2002', ' '  # En space
        $content = $content -replace '\u2003', ' '  # Em space
        $content = $content -replace '\u2004', ' '  # Three-per-em space
        $content = $content -replace '\u2005', ' '  # Four-per-em space
        $content = $content -replace '\u2006', ' '  # Six-per-em space
        $content = $content -replace '\u2007', ' '  # Figure space
        $content = $content -replace '\u2008', ' '  # Punctuation space
        $content = $content -replace '\u2009', ' '  # Thin space
        $content = $content -replace '\u200A', ' '  # Hair space
        $content = $content -replace '\u200B', ''   # Zero width space
        $content = $content -replace '\u2028', "`n" # Line separator
        $content = $content -replace '\u2029', "`n" # Paragraph separator
        $content = $content -replace '\uFEFF', ''   # Byte order mark
        # Fix corrupted characters
        $content = $content -replace '"šï¸', '⚠️'
        $content = $content -replace 'giÃ ', 'già '
        $content = $content -replace 'perché', 'perché'
        $content = $content -replace 'può', 'può'
        $content = $content -replace 'più', 'più'
        Set-Content $file $content -Encoding UTF8
    }
}
