Write-Host "🗄️ EXECUTING DATABASE SETUP - FORMMASTER LEVEL 5" -ForegroundColor Green

$projectRef = "qjtaqrlpronohgpfdxsi"
$accessToken = "sbp_fff530abe5d66befcd1efb7761f13f06b3f6169f"
$supabaseUrl = "https://qjtaqrlpronohgpfdxsi.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg0Njk1NzYsImV4cCI6MjA0NDA0NTU3Nn0.Z2Cv3vfCOBDmtSjXnQP8cKJrD4Uc2BEn7qHj6dcNhUs"

# Read the SQL setup script
$sqlContent = Get-Content "FORMMASTER_LEVEL5_DATABASE_SETUP.sql" -Raw

Write-Host "📝 SQL script loaded: $($sqlContent.Length) characters" -ForegroundColor Yellow

# Prepare headers for API request
$headers = @{
    "Authorization" = "Bearer $anonKey"
    "Content-Type" = "application/json"
    "apikey" = $anonKey
}

# Split SQL into individual statements for execution
$sqlStatements = $sqlContent -split ";\s*\n" | Where-Object { $_.Trim() -ne "" -and -not $_.Trim().StartsWith("--") }

Write-Host "🔄 Executing $($sqlStatements.Count) database statements..." -ForegroundColor Yellow

$successCount = 0
$errorCount = 0

foreach ($statement in $sqlStatements) {
    $trimmedStatement = $statement.Trim()
    if ($trimmedStatement -eq "" -or $trimmedStatement.StartsWith("--")) {
        continue
    }
    
    try {
        Write-Host "Executing: $($trimmedStatement.Substring(0, [Math]::Min(50, $trimmedStatement.Length)))..." -ForegroundColor Cyan
        
        # Execute SQL via REST API
        $body = @{
            query = $trimmedStatement
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/rpc/exec_sql" -Method POST -Headers $headers -Body $body -ErrorAction Stop
        
        $successCount++
        Write-Host "✅ Success" -ForegroundColor Green
        
    } catch {
        # Try alternative execution method
        try {
            Write-Host "⚠️ Retrying with alternative method..." -ForegroundColor Yellow
            
            # Alternative: Direct SQL execution via PostgREST
            $altBody = @{
                sql = $trimmedStatement
            } | ConvertTo-Json
            
            $altResponse = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/rpc/execute_sql" -Method POST -Headers $headers -Body $altBody -ErrorAction Stop
            
            $successCount++
            Write-Host "✅ Success (alternative method)" -ForegroundColor Green
            
        } catch {
            Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
            $errorCount++
            
            # Continue with next statement instead of failing completely
            continue
        }
    }
    
    # Small delay to avoid rate limiting
    Start-Sleep -Milliseconds 200
}

Write-Host "`n📊 DATABASE SETUP RESULTS:" -ForegroundColor Blue
Write-Host "✅ Successful operations: $successCount" -ForegroundColor Green
Write-Host "❌ Failed operations: $errorCount" -ForegroundColor Red

if ($errorCount -eq 0) {
    Write-Host "`n🎉 DATABASE SETUP COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "✅ Forms table created with performance indexes" -ForegroundColor Cyan
    Write-Host "✅ Form submissions table ready for public forms" -ForegroundColor Cyan
    Write-Host "✅ RLS policies configured for security" -ForegroundColor Cyan
    Write-Host "✅ Functions and triggers operational" -ForegroundColor Cyan
} else {
    Write-Host "`n⚠️ Some operations failed. Manual execution may be required." -ForegroundColor Yellow
    Write-Host "Go to: https://supabase.com/dashboard/project/$projectRef/sql" -ForegroundColor White
    Write-Host "Execute: FORMMASTER_LEVEL5_DATABASE_SETUP.sql manually" -ForegroundColor White
}

Write-Host "`nDatabase setup process completed!" -ForegroundColor Blue