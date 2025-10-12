# Add DROP POLICY IF EXISTS before each CREATE POLICY in migration file
$content = Get-Content -Path "supabase/migrations/20261012000002_contact_import_complete.sql"
$newContent = @()

foreach ($line in $content) {
    if ($line -match "^CREATE POLICY") {
        # Extract policy name and table name
        if ($line -match 'CREATE POLICY "([^"]+)" ON ([^\s]+)') {
            $policyName = $matches[1]
            $tableName = $matches[2]
            $dropLine = "DROP POLICY IF EXISTS `"$policyName`" ON $tableName;"
            $newContent += $dropLine
        }
    }
    $newContent += $line
}

$newContent | Out-File -FilePath "supabase/migrations/20261012000002_contact_import_complete.sql" -Encoding UTF8
Write-Host "Added DROP POLICY IF EXISTS statements to migration file"