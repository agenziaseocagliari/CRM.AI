#!/bin/bash

# Secure Environment Setup for CRM.AI
# Sets up environment variables from secure source

echo "🔐 Setting up secure environment for CRM.AI"
echo "=============================================="

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ ERROR: .env.local file not found"
    echo "💡 Please create .env.local from .env.template"
    echo "   and fill in your Supabase credentials"
    exit 1
fi

# Source the environment file
echo "📂 Loading environment variables from .env.local..."
source .env.local

# Validate required variables
REQUIRED_VARS=(
    "SUPABASE_ACCESS_TOKEN"
    "VITE_SUPABASE_URL" 
    "VITE_SUPABASE_ANON_KEY"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "❌ ERROR: Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "💡 Please add these to your .env.local file"
    exit 1
fi

echo "✅ Environment variables validated successfully"
echo "🎯 Ready for secure operations"
echo ""
echo "Available commands:"
echo "  ./scripts/migrate-db.sh     - Apply database migrations"
echo "  ./scripts/inspect-schema.sh - Inspect database schema" 
echo "  npm run build              - Build application"