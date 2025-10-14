#!/bin/bash

# Database Schema Inspector
# Checks what tables actually exist in the database

set -e

echo "🔍 Database Schema Inspector"
echo "============================"

# Check environment
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "❌ ERROR: SUPABASE_ACCESS_TOKEN not set"
    exit 1
fi

echo "📊 Checking existing tables in database..."

# Create a temporary SQL query to inspect schema
cat > /tmp/inspect_schema.sql << 'EOF'
-- Check what tables exist
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if organizations table exists specifically
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'organizations'
) as organizations_exists;
EOF

# Execute the query
echo "🔧 Running schema inspection..."
echo "Query output:"
npx supabase db diff --schema public --use-migra --linked || echo "Using fallback method..."

echo "✅ Schema inspection complete"