#!/bin/bash

# CRM.AI Database Migration Script
# Applies pending migrations to Supabase database safely

set -e  # Exit on any error

echo "🔍 CRM.AI Database Migration Script"
echo "==================================="

# Check required environment variables
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "❌ ERROR: SUPABASE_ACCESS_TOKEN environment variable not set"
    echo "💡 Please run: source .env.local"
    exit 1
fi

if [ -z "$SUPABASE_PROJECT_REF" ]; then
    export SUPABASE_PROJECT_REF="qjtaqrlpronohgpfdxsi"
fi

echo "✅ Environment variables validated"
echo "📋 Project: $SUPABASE_PROJECT_REF"

# Check migration files exist
if [ ! -d "supabase/migrations" ]; then
    echo "❌ ERROR: supabase/migrations directory not found"
    exit 1
fi

echo "🔄 Applying migrations with --include-all flag..."
echo "📁 Migration files:"
ls -la supabase/migrations/

# Apply migrations
npx supabase db push --include-all --linked

if [ $? -eq 0 ]; then
    echo "✅ Migrations applied successfully!"
    echo "🎉 Database is up to date"
else
    echo "❌ Migration failed!"
    exit 1
fi