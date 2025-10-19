#!/bin/bash
# check-migration-versions.sh
# Pre-flight check for duplicate migration versions
# Ensures all migration files have unique version numbers

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 CHECKING MIGRATION VERSIONS FOR DUPLICATES${NC}"
echo "========================================"

MIGRATIONS_DIR="supabase/migrations"

if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo -e "${RED}❌ Migrations directory not found: $MIGRATIONS_DIR${NC}"
    exit 1
fi

# Extract version numbers from filenames
versions=$(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | \
    xargs -n1 basename | \
    sed 's/^\([0-9]*\)_.*/\1/' | \
    sort)

# Check for duplicates
duplicates=$(echo "$versions" | uniq -d)

if [ -z "$duplicates" ]; then
    echo -e "${GREEN}✅ All migration versions are unique${NC}"
    echo ""
    echo "Total migrations: $(echo "$versions" | wc -l)"
    exit 0
else
    echo -e "${RED}❌ DUPLICATE MIGRATION VERSIONS DETECTED:${NC}"
    echo ""
    echo "$duplicates" | while read -r version; do
        echo -e "${YELLOW}Version $version found in:${NC}"
        ls -1 "$MIGRATIONS_DIR"/${version}_*.sql | sed 's/^/  - /'
    done
    echo ""
    echo -e "${RED}ERROR: Fix duplicate versions before deploying${NC}"
    echo ""
    echo "Recommended actions:"
    echo "  1. Rename duplicate migration files with unique timestamps"
    echo "  2. Use format: YYYYMMDDHHmmss_description.sql"
    echo "  3. Example: 20251016120000_workflows_table.sql"
    exit 1
fi
