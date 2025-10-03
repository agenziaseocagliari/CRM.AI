$files = @(
    "src\App.tsx",
    "src\components\CalendarView.tsx",
    "src\components\ContactEventsList.tsx",
    "src\components\Dashboard.tsx",
    "src\components\DebugPanel.tsx",
    "src\components\Forms.tsx",
    "src\components\JWTViewer.tsx",
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
        Write-Host "Processing $file"
        $content = Get-Content $file -Raw -Encoding UTF8
        $content = $content -replace "â™", "'"
        $content = $content -replace "âœ", '"'
        $content = $content -replace "â", '"'
        $content = $content -replace "Ã¨", "è"
        $content = $content -replace "Ã ", "à"
        $content = $content -replace "Ã©", "é"
        $content = $content -replace "Ã¬", "ì"
        $content = $content -replace "Ã²", "ò"
        $content = $content -replace "Ã¹", "ù"
        $content = $content -replace "Ã§", "ç"
        $content = $content -replace "âš ï¸", "⚠️"
        $content = $content -replace "Ãˆ", "È"
        $content = $content -replace "Ã‰", "É"
        Set-Content $file $content -Encoding UTF8 -NoNewline
    }
}
