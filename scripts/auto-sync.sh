#!/bin/bash

# Auto-sync workspace to local PC every 30 minutes
LOG_FILE="/tmp/auto-sync.log"

echo "🚀 Auto-sync service started at $(date)" >> "$LOG_FILE"

while true; do
    echo "🔄 [$(date)] Auto-syncing to local PC..." | tee -a "$LOG_FILE"
    
    # Run backup
    if ./scripts/backup-to-local.sh >> "$LOG_FILE" 2>&1; then
        echo "✅ [$(date)] Backup successful" | tee -a "$LOG_FILE"
    else
        echo "❌ [$(date)] Backup failed" | tee -a "$LOG_FILE"
    fi
    
    # Git commit and push if there are changes
    if [[ -n $(git status -s 2>/dev/null) ]]; then
        echo "📝 [$(date)] Changes detected, committing..." | tee -a "$LOG_FILE"
        
        git add . >> "$LOG_FILE" 2>&1
        if git commit -m "auto-save: $(date +%Y-%m-%d\ %H:%M:%S)" >> "$LOG_FILE" 2>&1; then
            echo "📤 [$(date)] Attempting to push..." | tee -a "$LOG_FILE"
            
            if git push origin main >> "$LOG_FILE" 2>&1; then
                echo "✅ [$(date)] Changes committed and pushed" | tee -a "$LOG_FILE"
            else
                echo "⚠️ [$(date)] Push failed, but commit successful" | tee -a "$LOG_FILE"
            fi
        else
            echo "⚠️ [$(date)] Commit failed" | tee -a "$LOG_FILE"
        fi
    else
        echo "💤 [$(date)] No changes to commit" >> "$LOG_FILE"
    fi
    
    # Wait 30 minutes (1800 seconds)
    echo "⏳ [$(date)] Sleeping for 30 minutes..." >> "$LOG_FILE"
    sleep 1800
done