# Schedule backup every hour using Windows Task Scheduler
param(
    [string]$TaskName = "CRM-AI Auto Backup",
    [int]$IntervalHours = 1
)

Write-Host "📅 Setting up scheduled backup task..." -ForegroundColor Cyan

try {
    # Define the action
    $ScriptPath = "C:\Users\inves\CRM-AI\scripts\backup-to-local.ps1"
    $Action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
        -Argument "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ScriptPath`""

    # Define the trigger (every hour)
    $Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) `
        -RepetitionInterval (New-TimeSpan -Hours $IntervalHours)

    # Define the principal (run as current user)
    $Principal = New-ScheduledTaskPrincipal -UserId "$env:USERNAME" `
        -LogonType Interactive -RunLevel Highest

    # Define settings
    $Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
        -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 1)

    # Register the task
    Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger `
        -Principal $Principal -Settings $Settings -Force `
        -Description "Automatic backup of CRM-AI project every $IntervalHours hour(s)"

    Write-Host "✅ Scheduled task created successfully!" -ForegroundColor Green
    Write-Host "📋 Task Name: $TaskName" -ForegroundColor Yellow
    Write-Host "⏰ Interval: Every $IntervalHours hour(s)" -ForegroundColor Yellow
    Write-Host "📂 Script: $ScriptPath" -ForegroundColor Yellow
    
    # Show task info
    Get-ScheduledTask -TaskName $TaskName | Format-Table TaskName, State, NextRunTime
    
} catch {
    Write-Host "❌ Failed to create scheduled task: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "🔧 Make sure you run this script as Administrator" -ForegroundColor Yellow
}

# Create systemd service for Linux (alternative)
$SystemdService = @"
[Unit]
Description=CRM-AI Auto Backup Service
After=network.target

[Service]
Type=simple
User=$env:USERNAME
WorkingDirectory=/workspaces/CRM.AI
ExecStart=/workspaces/CRM.AI/scripts/auto-sync.sh
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
"@

$SystemdService | Out-File -FilePath ".\scripts\crm-ai-backup.service" -Encoding UTF8
Write-Host "📄 Created systemd service file: scripts/crm-ai-backup.service" -ForegroundColor Green
Write-Host "   To use on Linux: sudo cp scripts/crm-ai-backup.service /etc/systemd/system/" -ForegroundColor Yellow