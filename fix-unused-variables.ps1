# Fix unused variables by prefixing with underscore
$files = @(
    "scripts\lint-api-role-usage.ts",
    "scripts\validate-jwt-diagnostics.ts", 
    "scripts\verify-jwt-custom-claims.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Fixing unused variables in: $file"
        $content = Get-Content $file -Raw -Encoding UTF8
        # Fix common unused variable patterns
        $content = $content -replace "severity\)", "_severity)"
        $content = $content -replace "decodeJWT\s*=", "_decodeJWT ="
        $content = $content -replace "\berror\)", "_error)"
        $content = $content -replace "catch\s*\(\s*error\s*\)", "catch (_error)"
        Set-Content $file $content -Encoding UTF8
    }
}
