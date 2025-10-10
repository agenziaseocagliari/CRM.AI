#!/bin/bash

# Apply Form Styling Migration
# Date: October 10, 2025
# Description: Applies color customization migration to Supabase database

echo "🚀 Applying Form Styling Migration..."
echo "======================================"
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ Error: .env file not found"
    exit 1
fi

# Check if Supabase credentials are set
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Supabase credentials not found in .env"
    echo "   Required variables:"
    echo "   - VITE_SUPABASE_URL"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

echo "✅ Environment variables loaded"
echo "📍 Supabase URL: $VITE_SUPABASE_URL"
echo ""

# Execute migration using psql via Supabase connection string
# Note: This requires direct database access via connection string
# Alternative: Use Supabase CLI or API

MIGRATION_FILE="supabase/migrations/20251010_add_form_styling.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Error: Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "📄 Migration file: $MIGRATION_FILE"
echo ""
echo "⚠️  MIGRATION PREVIEW:"
echo "===================="
head -20 "$MIGRATION_FILE"
echo "... (truncated)"
echo ""

read -p "Do you want to apply this migration? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Migration cancelled"
    exit 0
fi

echo ""
echo "🔧 Applying migration..."
echo ""

# Method 1: Using Supabase REST API (recommended for Codespaces)
echo "Using Supabase REST API method..."

# Read migration SQL
MIGRATION_SQL=$(cat "$MIGRATION_FILE")

# Execute via Supabase SQL Editor API
curl -X POST \
  "${VITE_SUPABASE_URL}/rest/v1/rpc/execute_sql" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(jq -Rs . <<< "$MIGRATION_SQL")}"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "🎨 Form Styling Features Now Available:"
    echo "   - Color picker UI in Forms module"
    echo "   - 5 preset themes (Corporate, Creative, etc.)"
    echo "   - Real-time color preview"
    echo "   - Custom styling saved to database"
    echo "   - Public forms render with custom colors"
    echo ""
    echo "📝 Next Steps:"
    echo "   1. Go to Forms module (/forms)"
    echo "   2. Create new form"
    echo "   3. Generate fields with AI"
    echo "   4. Customize colors with PostAIEditor"
    echo "   5. Save and test public form"
else
    echo ""
    echo "❌ Migration failed!"
    echo "   This might be because:"
    echo "   1. Columns already exist (migration already applied)"
    echo "   2. Supabase API endpoint doesn't support SQL execution"
    echo ""
    echo "📌 ALTERNATIVE METHODS:"
    echo ""
    echo "   Method A: Supabase Dashboard SQL Editor"
    echo "   ----------------------------------------"
    echo "   1. Go to: ${VITE_SUPABASE_URL/https:\/\//https://supabase.com/dashboard/project/}/sql/new"
    echo "   2. Copy contents of: $MIGRATION_FILE"
    echo "   3. Paste and run in SQL Editor"
    echo ""
    echo "   Method B: Direct psql (if you have connection string)"
    echo "   -----------------------------------------------------"
    echo "   psql \$DATABASE_URL -f $MIGRATION_FILE"
    echo ""
fi

echo ""
echo "Done!"
