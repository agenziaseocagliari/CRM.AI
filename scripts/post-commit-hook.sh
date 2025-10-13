#!/bin/bash

# Git hook for auto-backup after each commit
# Place this in .git/hooks/post-commit

echo "🔄 [$(date)] Running post-commit backup..." >> /tmp/git-backup.log

# Run backup script
if /workspaces/CRM.AI/scripts/backup-to-local.sh >> /tmp/git-backup.log 2>&1; then
    echo "✅ [$(date)] Backup created after commit" >> /tmp/git-backup.log
else
    echo "❌ [$(date)] Post-commit backup failed" >> /tmp/git-backup.log
fi