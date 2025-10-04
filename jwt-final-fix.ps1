# PowerShell script per correggere i caratteri corrotti in JWTViewer.tsx
$filePath = "src\components\JWTViewer.tsx"
$content = Get-Content $filePath -Encoding UTF8 -Raw

# Correzioni con escape dei caratteri problematici
$content = $content -replace 'ðŸ" Super Admin', '🔍 Super Admin'
$content = $content -replace 'ðŸ''¤ Utente Standard', '👤 Utente Standard'  
$content = $content -replace 'ðŸ"‹', '📋'
$content = $content -replace '"\x9C No', '❌ No'
$content = $content -replace 'Logout "\x86''', 'Logout →'

# Admin role - correzione specifica
$content = $content -replace '"\x9A™ï¸ Admin', '⚙️ Admin'
$content = $content -replace '"\x9A ï¸ TOKEN DEFECT', '⚠️ TOKEN DEFECT'

Set-Content $filePath $content -Encoding UTF8
Write-Host "✅ Correzioni applicate a JWTViewer.tsx"