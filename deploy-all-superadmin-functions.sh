#!/bin/bash

# Deploy All Superadmin Functions
# This script deploys all superadmin edge functions to Supabase

set -e

export SUPABASE_ACCESS_TOKEN=sbp_e07c1443bcf5bd2abc264b6e2740abb92ce411e3
PROJECT_REF=qjtaqrlpronohgpfdxsi

echo "🚀 Deploying all superadmin functions to Supabase..."
echo "Project: $PROJECT_REF"
echo ""

FUNCTIONS=(
    "superadmin-create-org"
    "superadmin-dashboard-stats"
    "superadmin-list-organizations"
    "superadmin-list-users"
    "superadmin-logs"
    "superadmin-manage-payments"
    "superadmin-quota-management"
    "superadmin-system-health"
    "superadmin-update-organization"
    "superadmin-update-user"
)

for func in "${FUNCTIONS[@]}"; do
    echo "📦 Deploying $func..."
    npx supabase functions deploy "$func" --project-ref "$PROJECT_REF" --no-verify-jwt
    echo "✅ $func deployed successfully"
    echo ""
done

echo "🎉 All superadmin functions deployed successfully!"
