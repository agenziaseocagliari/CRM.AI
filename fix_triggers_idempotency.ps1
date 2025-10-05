# 🔧 LEVEL 6 SYSTEMATIC FIX: Universal Trigger Idempotency Script
# Applies DROP TRIGGER IF EXISTS pattern to ALL trigger creations
# Prevents SQLSTATE 42710 (trigger already exists) errors

Write-Host "🚀 Starting Level 6 Systematic Trigger Idempotency Fix..." -ForegroundColor Green

$triggers = @(
    @{
        File = "supabase/migrations/20240911000000_credits_schema.sql"
        TriggerName = "update_organization_credits_updated_at"
        TableName = "organization_credits"
    },
    @{
        File = "supabase/migrations/20250102000000_create_agents_and_integrations.sql"
        TriggerName = "update_automation_agents_updated_at"
        TableName = "automation_agents"
    },
    @{
        File = "supabase/migrations/20250102000000_create_agents_and_integrations.sql"
        TriggerName = "update_api_integrations_updated_at"
        TableName = "api_integrations"
    },
    @{
        File = "supabase/migrations/20250102000000_create_agents_and_integrations.sql"
        TriggerName = "update_workflow_definitions_updated_at"
        TableName = "workflow_definitions"
    },
    @{
        File = "supabase/migrations/20250103000000_incident_response_system.sql"
        TriggerName = "update_incidents_updated_at"
        TableName = "incidents"
    },
    @{
        File = "supabase/migrations/20250103000000_incident_response_system.sql"
        TriggerName = "update_notification_rules_updated_at"
        TableName = "notification_rules"
    },
    @{
        File = "supabase/migrations/20250103000000_incident_response_system.sql"
        TriggerName = "update_escalation_rules_updated_at"
        TableName = "escalation_rules"
    },
    @{
        File = "supabase/migrations/20250103000000_incident_response_system.sql"
        TriggerName = "update_rollback_procedures_updated_at"
        TableName = "rollback_procedures"
    },
    @{
        File = "supabase/migrations/20250103000001_enhanced_workflow_orchestration.sql"
        TriggerName = "trigger_auto_version_workflow"
        TableName = "workflow_definitions"
    },
    @{
        File = "supabase/migrations/20250122000000_create_integrations_table.sql"
        TriggerName = "update_integrations_updated_at"
        TableName = "integrations"
    },
    @{
        File = "supabase/migrations/20251002000002_create_enhanced_audit_logging.sql"
        TriggerName = "audit_log_search_vector_update"
        TableName = "audit_logs"
    },
    @{
        File = "supabase/migrations/20251005000000_vertical_account_types_system.sql"
        TriggerName = "update_vertical_account_configs_updated_at"
        TableName = "vertical_account_configs"
    },
    @{
        File = "supabase/migrations/20251005000000_vertical_account_types_system.sql"
        TriggerName = "update_vertical_templates_updated_at"
        TableName = "vertical_templates"
    },
    @{
        File = "supabase/migrations/20251005000000_vertical_account_types_system.sql"
        TriggerName = "update_enterprise_customizations_updated_at"
        TableName = "enterprise_customizations"
    },
    @{
        File = "supabase/migrations/20251005000001_create_usage_tracking_system.sql"
        TriggerName = "update_subscription_tiers_updated_at"
        TableName = "subscription_tiers"
    },
    @{
        File = "supabase/migrations/20251005000001_create_usage_tracking_system.sql"
        TriggerName = "update_organization_subscriptions_updated_at"
        TableName = "organization_subscriptions"
    },
    @{
        File = "supabase/migrations/20251005000001_create_usage_tracking_system.sql"
        TriggerName = "update_usage_quotas_updated_at"
        TableName = "usage_quotas"
    },
    @{
        File = "supabase/migrations/20251005000001_create_usage_tracking_system.sql"
        TriggerName = "init_quota_on_subscription"
        TableName = "organization_subscriptions"
    },
    @{
        File = "supabase/migrations/20251005000008_testing_environment_setup.sql"
        TriggerName = "testing_organizations_log"
        TableName = "testing_organizations"
    },
    @{
        File = "supabase/migrations/20251005000008_testing_environment_setup.sql"
        TriggerName = "testing_customizations_log"
        TableName = "testing_customizations"
    }
)

$totalFixed = 0

foreach ($trigger in $triggers) {
    Write-Host "🔧 Processing $($trigger.File) - $($trigger.TriggerName)..." -ForegroundColor Yellow
    
    # Read file content
    $content = Get-Content $trigger.File -Raw -Encoding UTF8
    
    # Create the DROP TRIGGER IF EXISTS statement
    $dropStatement = "DROP TRIGGER IF EXISTS $($trigger.TriggerName) ON $($trigger.TableName);"
    
    # Find CREATE TRIGGER and add DROP before it
    $createPattern = [regex]::Escape("CREATE TRIGGER $($trigger.TriggerName)")
    
    if ($content -match $createPattern) {
        # Add DROP statement before CREATE TRIGGER if not already present
        if ($content -notmatch [regex]::Escape("DROP TRIGGER IF EXISTS $($trigger.TriggerName)")) {
            $replaceTarget = "CREATE TRIGGER $($trigger.TriggerName)"
            $replaceWith = "$dropStatement`r`n`r`nCREATE TRIGGER $($trigger.TriggerName)"
            $content = $content -replace [regex]::Escape($replaceTarget), $replaceWith
            
            # Write back to file
            $content | Set-Content $trigger.File -Encoding UTF8 -NoNewline
            $totalFixed++
            Write-Host "✅ Fixed: $($trigger.TriggerName)" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Already fixed: $($trigger.TriggerName)" -ForegroundColor Blue
        }
    } else {
        Write-Host "❌ Pattern not found: $($trigger.TriggerName)" -ForegroundColor Red
    }
}

Write-Host "`n🎯 LEVEL 6 SYSTEMATIC FIX COMPLETED!" -ForegroundColor Green
Write-Host "✅ Total triggers made idempotent: $totalFixed" -ForegroundColor Green
Write-Host "🔥 All database trigger conflicts should now be resolved!" -ForegroundColor Green
Write-Host "📊 Ready for GitHub Actions deployment test..." -ForegroundColor Green