# Fix SQL Comments with Italian Apostrophes - Level 6 Systematic Fix
# Corrects SQLSTATE 42601 syntax errors in SQL comments

Write-Host "🔧 LEVEL 6: Fixing SQL comments with apostrophes..."

# Find all SQL files and fix Italian apostrophes in comments
Get-ChildItem -Path "supabase/migrations" -Filter "*.sql" -Recurse | ForEach-Object {
    $file = $_.FullName
    $content = Get-Content $file -Raw -Encoding UTF8
    
    # Replace single apostrophes with double apostrophes in SQL comments
    $fixedContent = $content -replace "dell'utilizzo", "dell''utilizzo"
    $fixedContent = $fixedContent -replace "dell'organizzazione", "dell''organizzazione"
    $fixedContent = $fixedContent -replace "all'", "all''"
    $fixedContent = $fixedContent -replace "un'", "un''"
    $fixedContent = $fixedContent -replace "dell'", "dell''"
    $fixedContent = $fixedContent -replace "nell'", "nell''"
    
    if ($content -ne $fixedContent) {
        Set-Content -Path $file -Value $fixedContent -Encoding UTF8 -NoNewline
        Write-Host "✅ Fixed SQL comments in: $($_.Name)"
    }
}

Write-Host "🔧 LEVEL 6: SQL comments apostrophe fix completed!"