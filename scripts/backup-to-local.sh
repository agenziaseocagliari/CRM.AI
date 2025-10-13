#!/bin/bash

# Automatic backup to local PC (Linux/Dev Container version)
# Configuration
LOCAL_BACKUP_DIR="/tmp/CRM-AI-Backups"  # Adjusted for dev container
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="crm-backup-${TIMESTAMP}"

echo "🔄 Starting backup to local storage..."

# Create backup directory if not exists
mkdir -p "${LOCAL_BACKUP_DIR}"

# Create timestamped backup
BACKUP_PATH="${LOCAL_BACKUP_DIR}/${BACKUP_NAME}"
mkdir -p "${BACKUP_PATH}"

# Copy critical files
echo "📁 Copying project files..."
rsync -av --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'dist' \
  --exclude '.next' \
  --exclude 'build' \
  --exclude '.env' \
  . "${BACKUP_PATH}/"

# Backup database schema
echo "💾 Exporting database schema..."
if command -v supabase >/dev/null 2>&1; then
  npx supabase@latest db dump --project-ref qjtaqrlpronohgpfdxsi \
    --schema public > "${BACKUP_PATH}/database-schema.sql" 2>/dev/null || \
    echo "⚠️ Database backup failed (credentials may be needed)"
else
  echo "⚠️ Supabase CLI not available for database backup"
fi

# Create backup manifest
cat > "${BACKUP_PATH}/BACKUP_MANIFEST.txt" << EOF
Backup Created: ${TIMESTAMP}
Git Commit: $(git rev-parse HEAD 2>/dev/null || echo "No git repo")
Branch: $(git branch --show-current 2>/dev/null || echo "No git repo")
Files: $(find "${BACKUP_PATH}" -type f 2>/dev/null | wc -l)
Size: $(du -sh "${BACKUP_PATH}" 2>/dev/null | cut -f1)
EOF

# Compress backup
echo "🗜️ Compressing backup..."
tar -czf "${LOCAL_BACKUP_DIR}/${BACKUP_NAME}.tar.gz" -C "${LOCAL_BACKUP_DIR}" "${BACKUP_NAME}"
rm -rf "${BACKUP_PATH}"

echo "✅ Backup complete: ${BACKUP_NAME}.tar.gz"
echo "📍 Location: ${LOCAL_BACKUP_DIR}"
echo "📊 Size: $(ls -lh "${LOCAL_BACKUP_DIR}/${BACKUP_NAME}.tar.gz" | awk '{print $5}')"

# Keep only last 10 backups
echo "🧹 Cleaning old backups..."
cd "${LOCAL_BACKUP_DIR}"
ls -t crm-backup-*.tar.gz | tail -n +11 | xargs -r rm -f
echo "📈 Total backups: $(ls crm-backup-*.tar.gz 2>/dev/null | wc -l)"