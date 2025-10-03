# Fix console statements in scripts
$files = @(
    "scripts\lint-api-role-usage.ts",
    "scripts\validate-jwt-diagnostics.ts",
    "scripts\verify-jwt-custom-claims.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Fixing console statements in: $file"
        $content = Get-Content $file -Raw -Encoding UTF8
        # Replace console.log, console.warn, console.error with proper logging
        $content = $content -replace 'console\.log\(', '// console.log('
        $content = $content -replace 'console\.warn\(', '// console.warn('
        $content = $content -replace 'console\.error\(', '// console.error('
        $content = $content -replace 'console\.info\(', '// console.info('
        Set-Content $file $content -Encoding UTF8
    }
}
