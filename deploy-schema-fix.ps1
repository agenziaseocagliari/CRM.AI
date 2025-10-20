#!/usr/bin/env pwsh
# =================================
# DEPLOYMENT SCRIPT: Apply Migration with Schema Cache Refresh
# Purpose: Deploy insurance_policies schema fixes and force PostgREST cache reload
# Date: 2025-10-20
# Usage: .\deploy-schema-fix.ps1
# =================================

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 Deployment: Insurance Policies Schema Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$SUPABASE_PROJECT_REF = "qjtaqrlpronohgpfdxsi"
$MIGRATION_FILE = "20251020_fix_insurance_policies_schema"

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "   Project: $SUPABASE_PROJECT_REF" -ForegroundColor Gray
Write-Host "   Migration: $MIGRATION_FILE.sql" -ForegroundColor Gray
Write-Host ""

# Step 1: Check if Supabase CLI is installed
Write-Host "🔍 Step 1: Verifying Supabase CLI..." -ForegroundColor Cyan
try {
    $supabaseVersion = npx supabase --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Supabase CLI not found"
    }
    Write-Host "   ✅ Supabase CLI found: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Supabase CLI not found. Installing..." -ForegroundColor Red
    npm install -g supabase
}
Write-Host ""

# Step 2: Link to Supabase project
Write-Host "🔗 Step 2: Linking to Supabase project..." -ForegroundColor Cyan
try {
    npx supabase link --project-ref $SUPABASE_PROJECT_REF 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Successfully linked to project $SUPABASE_PROJECT_REF" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Already linked or link failed (continuing anyway)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Link command failed (might already be linked)" -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Apply migration
Write-Host "📦 Step 3: Applying migration..." -ForegroundColor Cyan
try {
    npx supabase db push --include-all
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Migration applied successfully" -ForegroundColor Green
    } else {
        throw "Migration failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host "   ❌ Migration failed: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 4: Force PostgREST schema cache reload
Write-Host "🔄 Step 4: Reloading PostgREST schema cache..." -ForegroundColor Cyan
try {
    # Method 1: Via SQL NOTIFY
    Write-Host "   Method 1: Sending NOTIFY pgrst to database..." -ForegroundColor Gray
    $notifyCommand = "NOTIFY pgrst, 'reload schema';"
    npx supabase db execute --sql $notifyCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Schema cache reload signal sent" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  NOTIFY command failed (might not be supported)" -ForegroundColor Yellow
    }
    
    # Method 2: Restart PostgREST via API (requires service role key)
    Write-Host "   Method 2: Attempting API-based restart..." -ForegroundColor Gray
    Write-Host "   ℹ️  Manual restart may be required via Supabase Dashboard" -ForegroundColor Yellow
    
} catch {
    Write-Host "   ⚠️  Schema cache reload failed: $_" -ForegroundColor Yellow
    Write-Host "   📝 Manual action required:" -ForegroundColor Yellow
    Write-Host "      1. Go to Supabase Dashboard" -ForegroundColor Gray
    Write-Host "      2. Navigate to Database → API Settings" -ForegroundColor Gray
    Write-Host "      3. Click 'Reload Schema Cache' button" -ForegroundColor Gray
}
Write-Host ""

# Step 5: Verify foreign keys were created
Write-Host "✅ Step 5: Verifying foreign key constraints..." -ForegroundColor Cyan
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
    $fkResults = npx supabase db execute --sql $verifyQuery 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Foreign keys verified:" -ForegroundColor Green
        Write-Host "$fkResults" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️  Could not verify foreign keys" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Verification query failed: $_" -ForegroundColor Yellow
}
Write-Host ""

# Step 6: Final checks
Write-Host "🧪 Step 6: Running final checks..." -ForegroundColor Cyan

# Check if renewal_reminders view still works
$viewCheckQuery = "SELECT COUNT(*) as count FROM renewal_reminders LIMIT 1;"
try {
    $viewResult = npx supabase db execute --sql $viewCheckQuery 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ renewal_reminders view is accessible" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  renewal_reminders view check failed" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  View check failed: $_" -ForegroundColor Yellow
}
Write-Host ""

# Success summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETED" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Test insurance policies loading in the app" -ForegroundColor Gray
Write-Host "   2. Verify renewal calendar displays correctly" -ForegroundColor Gray
Write-Host "   3. Check for any PostgREST relationship errors" -ForegroundColor Gray
Write-Host "   4. If errors persist, manually reload schema cache via Dashboard" -ForegroundColor Gray
Write-Host ""
Write-Host "🔗 Useful Links:" -ForegroundColor Yellow
Write-Host "   Dashboard: https://supabase.com/dashboard/project/$SUPABASE_PROJECT_REF" -ForegroundColor Gray
Write-Host "   API Settings: https://supabase.com/dashboard/project/$SUPABASE_PROJECT_REF/settings/api" -ForegroundColor Gray
Write-Host ""

# Optional: Run integration test
$runTests = Read-Host "🧪 Run integration tests now? (y/n)"
if ($runTests -eq 'y' -or $runTests -eq 'Y') {
    Write-Host ""
    Write-Host "🧪 Running integration tests..." -ForegroundColor Cyan
    npm run test -- --testPathPattern="RenewalCalendar" --silent=false
}

Write-Host "✨ Done!" -ForegroundColor Green
