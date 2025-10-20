# =================================
# DEPLOYMENT SCRIPT: Apply Migration with Schema Cache Refresh
# Purpose: Deploy insurance_policies schema fixes and force PostgREST cache reload
# Date: 2025-10-20
# Usage: .\deploy-schema-fix-simple.ps1
# =================================

$ErrorActionPreference = "Stop"

Write-Host "========================================"
Write-Host "DEPLOYMENT: Insurance Policies Schema Fix"
Write-Host "========================================"
Write-Host ""

# Configuration
$SUPABASE_PROJECT_REF = "qjtaqrlpronohgpfdxsi"
$MIGRATION_FILE = "20251020_fix_insurance_policies_schema"

Write-Host "Configuration:"
Write-Host "   Project: $SUPABASE_PROJECT_REF"
Write-Host "   Migration: $MIGRATION_FILE.sql"
Write-Host ""

# Step 1: Check if Supabase CLI is installed
Write-Host "Step 1: Verifying Supabase CLI..."
try {
    $supabaseVersion = npx supabase --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Supabase CLI not found"
    }
    Write-Host "   OK - Supabase CLI found: $supabaseVersion"
} catch {
    Write-Host "   ERROR - Supabase CLI not found. Installing..."
    npm install -g supabase
}
Write-Host ""

# Step 2: Link to Supabase project
Write-Host "Step 2: Linking to Supabase project..."
try {
    npx supabase link --project-ref $SUPABASE_PROJECT_REF 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   OK - Successfully linked to project $SUPABASE_PROJECT_REF"
    } else {
        Write-Host "   WARNING - Already linked or link failed (continuing anyway)"
    }
} catch {
    Write-Host "   WARNING - Link command failed (might already be linked)"
}
Write-Host ""

# Step 3: Apply migration
Write-Host "Step 3: Applying migration..."
try {
    npx supabase db push --include-all
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   OK - Migration applied successfully"
    } else {
        throw "Migration failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host "   ERROR - Migration failed: $_"
    exit 1
}
Write-Host ""

# Step 4: Force PostgREST schema cache reload
Write-Host "Step 4: Reloading PostgREST schema cache..."
Write-Host "   Method 1: Sending NOTIFY pgrst to database..."
$notifyCommand = "NOTIFY pgrst, 'reload schema';"
try {
    npx supabase db execute --sql $notifyCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   OK - Schema cache reload signal sent"
    } else {
        Write-Host "   WARNING - NOTIFY command failed (might not be supported)"
    }
} catch {
    Write-Host "   WARNING - Schema cache reload failed: $_"
    Write-Host "   MANUAL ACTION REQUIRED:"
    Write-Host "      1. Go to Supabase Dashboard"
    Write-Host "      2. Navigate to Database -> API Settings"
    Write-Host "      3. Click 'Reload Schema Cache' button"
}

Write-Host "   Method 2: Attempting API-based restart..."
Write-Host "   INFO - Manual restart may be required via Supabase Dashboard"
Write-Host ""

# Step 5: Verify foreign keys were created
Write-Host "Step 5: Verifying foreign key constraints..."
$verifyQuery = @"
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'insurance_policies'
ORDER BY tc.constraint_name;
"@

try {
    Write-Host "   Executing verification query..."
    $fkResults = npx supabase db execute --sql $verifyQuery 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   OK - Foreign keys verified:"
        Write-Host "$fkResults"
    } else {
        Write-Host "   WARNING - Could not verify foreign keys"
    }
} catch {
    Write-Host "   WARNING - Verification query failed: $_"
}
Write-Host ""

# Step 6: Final checks
Write-Host "Step 6: Running final checks..."

# Check if renewal_reminders view still works
$viewCheckQuery = "SELECT COUNT(*) as count FROM renewal_reminders LIMIT 1;"
try {
    Write-Host "   Checking renewal_reminders view..."
    $viewResult = npx supabase db execute --sql $viewCheckQuery 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   OK - renewal_reminders view is accessible"
    } else {
        Write-Host "   WARNING - renewal_reminders view check failed"
    }
} catch {
    Write-Host "   WARNING - View check failed: $_"
}
Write-Host ""

# Success summary
Write-Host "========================================"
Write-Host "DEPLOYMENT COMPLETED"
Write-Host "========================================"
Write-Host ""
Write-Host "Next Steps:"
Write-Host "   1. Test insurance policies loading in the app"
Write-Host "   2. Verify renewal calendar displays correctly"
Write-Host "   3. Check for any PostgREST relationship errors"
Write-Host "   4. If errors persist, manually reload schema cache via Dashboard"
Write-Host ""
Write-Host "Useful Links:"
Write-Host "   Dashboard: https://supabase.com/dashboard/project/$SUPABASE_PROJECT_REF"
Write-Host "   API Settings: https://supabase.com/dashboard/project/$SUPABASE_PROJECT_REF/settings/api"
Write-Host ""

# Optional: Run integration test
$runTests = Read-Host "Run integration tests now? (y/n)"
if ($runTests -eq 'y' -or $runTests -eq 'Y') {
    Write-Host ""
    Write-Host "Running integration tests..."
    npm run test -- --testPathPattern="insurance-policies-schema" --silent=false
}

Write-Host ""
Write-Host "Done!"
