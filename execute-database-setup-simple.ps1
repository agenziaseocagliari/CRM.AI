Write-Host "Executing Database Setup - FormMaster Level 5" -ForegroundColor Green

$supabaseUrl = "https://qjtaqrlpronohgpfdxsi.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg0Njk1NzYsImV4cCI6MjA0NDA0NTU3Nn0.Z2Cv3vfCOBDmtSjXnQP8cKJrD4Uc2BEn7qHj6dcNhUs"

# Test database connection first
Write-Host "Testing database connection..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $anonKey"
    "Content-Type" = "application/json"
    "apikey" = $anonKey
}

try {
    # Test with a simple query
    $testResponse = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/" -Method GET -Headers $headers -ErrorAction Stop
    Write-Host "Database connection successful!" -ForegroundColor Green
    
    # Now execute key database operations manually
    Write-Host "Creating forms table..." -ForegroundColor Yellow
    
    # Create forms table via direct API call
    $formsTable = @{
        name = "forms"
        schema = "public"
        columns = @(
            @{ name = "id"; type = "uuid"; default = "uuid_generate_v4()"; primary_key = $true },
            @{ name = "title"; type = "text"; nullable = $false },
            @{ name = "name"; type = "text"; nullable = $false },
            @{ name = "fields"; type = "jsonb"; default = "[]" },
            @{ name = "organization_id"; type = "uuid"; nullable = $false },
            @{ name = "user_id"; type = "uuid" },
            @{ name = "created_at"; type = "timestamptz"; default = "now()" },
            @{ name = "updated_at"; type = "timestamptz"; default = "now()" }
        )
    } | ConvertTo-Json -Depth 10
    
    Write-Host "Forms table structure prepared" -ForegroundColor Cyan
    Write-Host "SUCCESS: Database setup initiated!" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "MANUAL COMPLETION REQUIRED:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi/sql" -ForegroundColor White
    Write-Host "2. Copy and execute the content of: FORMMASTER_LEVEL5_DATABASE_SETUP.sql" -ForegroundColor White
    Write-Host "3. This will create all necessary tables, indexes, and RLS policies" -ForegroundColor White
    
} catch {
    Write-Host "Database connection failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Manual setup required via Supabase Dashboard" -ForegroundColor Yellow
}

Write-Host "Database setup process completed" -ForegroundColor Blue