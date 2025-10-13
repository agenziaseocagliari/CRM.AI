#!/bin/bash

# Restore from local backup
BACKUP_DIR="/tmp/CRM-AI-Backups"
PROJECT_DIR="/workspaces/CRM.AI"

echo "🔄 Starting disaster recovery..."

# Find latest backup
if [ "$1" ]; then
    BACKUP_FILE="$1"
else
    LATEST_BACKUP=$(ls -t "${BACKUP_DIR}"/crm-backup-*.tar.gz 2>/dev/null | head -1)
    if [ -z "$LATEST_BACKUP" ]; then
        echo "❌ No backups found in ${BACKUP_DIR}"
        echo "💡 Available backups:"
        ls -lh "${BACKUP_DIR}"/crm-backup-*.tar.gz 2>/dev/null || echo "   None found"
        exit 1
    fi
    BACKUP_FILE="$LATEST_BACKUP"
fi

echo "🔄 Restoring from: $(basename "$BACKUP_FILE")"
echo "📅 Backup date: $(stat -c %y "$BACKUP_FILE")"

# Create temporary restore directory
RESTORE_DIR="/tmp/restore-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$RESTORE_DIR"

# Extract backup
echo "📦 Extracting backup..."
if tar -xzf "$BACKUP_FILE" -C "$RESTORE_DIR"; then
    echo "✅ Backup extracted successfully"
else
    echo "❌ Failed to extract backup"
    exit 1
fi

# Find extracted directory
EXTRACTED_DIR=$(find "$RESTORE_DIR" -name "crm-backup-*" -type d | head -1)
if [ -z "$EXTRACTED_DIR" ]; then
    echo "❌ Could not find extracted backup directory"
    exit 1
fi

# Show backup manifest
if [ -f "$EXTRACTED_DIR/BACKUP_MANIFEST.txt" ]; then
    echo "📋 Backup Information:"
    cat "$EXTRACTED_DIR/BACKUP_MANIFEST.txt"
    echo ""
fi

# Confirm restore
echo "⚠️  This will overwrite current project files!"
echo "📁 Target: $PROJECT_DIR"
echo "📂 Source: $(basename "$EXTRACTED_DIR")"
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Restore cancelled"
    rm -rf "$RESTORE_DIR"
    exit 0
fi

# Backup current state first
echo "💾 Creating safety backup of current state..."
SAFETY_BACKUP="$BACKUP_DIR/safety-backup-$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf "$SAFETY_BACKUP" -C "$(dirname "$PROJECT_DIR")" "$(basename "$PROJECT_DIR")" 2>/dev/null
echo "✅ Safety backup: $(basename "$SAFETY_BACKUP")"

# Restore files
echo "🔄 Restoring files..."
cd "$PROJECT_DIR" || exit 1

# Remove old files (except .git and node_modules)
find . -mindepth 1 -maxdepth 1 ! -name '.git' ! -name 'node_modules' ! -name '.env' -exec rm -rf {} + 2>/dev/null

# Copy restored files
cp -r "$EXTRACTED_DIR"/* . 2>/dev/null
echo "✅ Files restored"

# Restore environment if available
if [ -f "$EXTRACTED_DIR/.env.backup" ]; then
    echo "🔐 Restoring environment variables..."
    cp "$EXTRACTED_DIR/.env.backup" .env 2>/dev/null
    echo "⚠️  Please verify .env has correct values"
else
    echo "⚠️  No .env backup found - you'll need to recreate it"
fi

# Restore database schema if available
if [ -f "$EXTRACTED_DIR/database-schema.sql" ]; then
    echo "💾 Database schema available for restore"
    echo "   To restore: npx supabase@latest db reset"
    echo "   Then run: psql -f database-schema.sql"
else
    echo "⚠️  No database schema backup found"
fi

# Reinstall dependencies
echo "📦 Reinstalling dependencies..."
if npm install > /dev/null 2>&1; then
    echo "✅ Dependencies installed"
else
    echo "⚠️  Dependencies installation failed - run manually"
fi

# Clean up
rm -rf "$RESTORE_DIR"

echo ""
echo "🎉 DISASTER RECOVERY COMPLETE!"
echo ""
echo "🔧 Next steps:"
echo " 1. Verify .env has correct values"
echo " 2. Check git status: git status"
echo " 3. Pull latest changes: git pull origin main"
echo " 4. Test the application"
echo " 5. Link Supabase: npx supabase@latest link --project-ref qjtaqrlpronohgpfdxsi"
echo ""
echo "📍 Safety backup: $SAFETY_BACKUP"
echo "📁 Restored from: $(basename "$BACKUP_FILE")"