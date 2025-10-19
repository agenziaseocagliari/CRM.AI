#!/bin/bash
# deploy-supabase-robust.sh
# Robust and definitive Supabase deployment script with complete error handling
# This script centralizes all Supabase operations to ensure consistency and reliability

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_REF="${SUPABASE_PROJECT_REF:-qjtaqrlpronohgpfdxsi}"
ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN:-}"
MAX_RETRIES=3
RETRY_DELAY=5
MIGRATION_AUDIT_SCRIPT="${MIGRATION_AUDIT_SCRIPT:-scripts/audit-migration-idempotence.sh}"

# Counters
STEP=0
TOTAL_STEPS=8
ERRORS=0

# Functions
print_step() {
    STEP=$((STEP + 1))
    echo -e "\n${BLUE}▶ Step $STEP/$TOTAL_STEPS: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ERRORS=$((ERRORS + 1))
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

retry_command() {
    local command=$1
    local description=$2
    local attempt=1
    
    while [ $attempt -le $MAX_RETRIES ]; do
        echo "  [Attempt $attempt/$MAX_RETRIES] Running: $command"
        
        if eval "$command"; then
            print_success "$description"
            return 0
        fi
        
        if [ $attempt -lt $MAX_RETRIES ]; then
            print_warning "Attempt $attempt failed. Waiting ${RETRY_DELAY}s before retry..."
            sleep $RETRY_DELAY
        fi
        
        attempt=$((attempt + 1))
    done
    
    print_error "$description - failed after $MAX_RETRIES attempts"
    return 1
}

# ============================================================================
# DEPLOYMENT WORKFLOW
# ============================================================================

echo -e "${BLUE}🚀 SUPABASE ROBUST DEPLOYMENT WORKFLOW${NC}"
echo "========================================"
echo "Project Ref: $PROJECT_REF"
echo "Environment: GitHub Actions"
echo ""

# Step 1: Verify prerequisites
print_step "Verify Prerequisites"

if [ -z "$ACCESS_TOKEN" ]; then
    print_error "SUPABASE_ACCESS_TOKEN environment variable not set"
    exit 1
fi

if ! command -v supabase &> /dev/null; then
    print_error "Supabase CLI not found. Please install it first."
    exit 1
fi

print_success "Prerequisites verified"

# Step 2: Verify configuration
print_step "Verify Configuration Files"

if [ ! -f "supabase/config.toml" ]; then
    print_error "supabase/config.toml not found"
    exit 1
fi

if [ ! -d "supabase/migrations" ]; then
    print_error "supabase/migrations directory not found"
    exit 1
fi

print_success "Configuration files verified"

# Step 3: Cleanup previous session
print_step "Cleanup Previous Session"

# Remove any existing .supabase directory that might have stale state
if [ -d ".supabase" ]; then
    echo "  Removing stale .supabase directory..."
    rm -rf .supabase
fi

# Clear environment to ensure clean state
unset SUPABASE_REF || true
unset SUPABASE_DB_PASSWORD || true

print_success "Previous session cleaned up"

# Step 4: Audit migrations for idempotence
print_step "Audit Migrations for Idempotence"

if [ -f "$MIGRATION_AUDIT_SCRIPT" ]; then
    echo "  Running migration idempotence audit..."
    if bash "$MIGRATION_AUDIT_SCRIPT" 2>&1 | grep -q "ALL MIGRATIONS ARE IDEMPOTENT"; then
        print_success "Migration audit passed - all migrations are idempotent"
    else
        print_warning "Migration audit completed - review output above"
        echo "  (Continuing anyway - audit is advisory)"
    fi
else
    print_warning "Migration audit script not found at $MIGRATION_AUDIT_SCRIPT"
    echo "  (Skipping idempotence check)"
fi

# Step 5: Link to Supabase Project (with retry logic)
print_step "Link to Supabase Project"

link_command="supabase link \\
  --project-ref '$PROJECT_REF' \\
  --yes 2>&1"

if retry_command "$link_command" "Supabase project linked successfully"; then
    # Verify link was successful
    if [ -f ".supabase/config.json" ]; then
        echo "  .supabase/config.json created ✓"
    fi
else
    print_error "Unable to link to Supabase project after $MAX_RETRIES attempts"
    exit 1
fi

# Step 6: Deploy Edge Functions
print_step "Deploy Edge Functions"

edge_deploy_command="supabase functions deploy \\
  --no-verify-jwt 2>&1"

if retry_command "$edge_deploy_command" "Edge functions deployed successfully"; then
    echo "  All edge functions deployed ✓"
else
    print_warning "Edge functions deployment failed - continuing with migrations"
fi

# Step 7: Check for Duplicate Migration Versions
print_step "Check Migration Versions"

if [ -f "scripts/check-migration-versions.sh" ]; then
    echo "  Checking for duplicate migration versions..."
    if bash scripts/check-migration-versions.sh; then
        print_success "All migration versions are unique"
    else
        print_error "Duplicate migration versions detected - please fix before deploying"
        exit 1
    fi
else
    print_warning "Migration version check script not found (skipping)"
fi

# Step 8: Push Database Migrations
print_step "Push Database Migrations"

# First attempt: standard push
db_push_command="supabase db push \\
  --yes 2>&1"

if retry_command "$db_push_command" "Database migrations pushed successfully"; then
    echo "  All pending migrations have been applied ✓"
else
    # Check if error is due to already-applied migrations
    if supabase db push --yes 2>&1 | grep -q "duplicate key value violates unique constraint"; then
        print_warning "Some migrations already applied (this is expected for idempotent migrations)"
        echo "  Verifying database state..."
        
        # Verify the database is in a good state
        if supabase db pull --yes 2>&1 | grep -q "Successfully pulled"; then
            print_success "Database is in sync with migrations"
        else
            print_error "Database state verification failed"
            exit 1
        fi
    else
        print_warning "Database push completed with warnings (this may be expected for idempotent migrations)"
    fi
fi

# ============================================================================
# DEPLOYMENT SUMMARY
# ============================================================================

echo ""
echo -e "${BLUE}📊 DEPLOYMENT SUMMARY${NC}"
echo "========================================"
echo -e "  Project:    $PROJECT_REF"
echo -e "  CLI Status: $(supabase --version 2>/dev/null || echo 'Unknown')"
echo -e "  Errors:     $ERRORS"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ DEPLOYMENT COMPLETED SUCCESSFULLY${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Verify migrations were applied: supabase db pull"
    echo "  2. Run tests: npm test"
    echo "  3. Deploy to Vercel: npx vercel --prod"
    exit 0
else
    echo -e "${RED}❌ DEPLOYMENT COMPLETED WITH $ERRORS ERROR(S)${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check SUPABASE_ACCESS_TOKEN is valid"
    echo "  2. Verify project ref is correct: $PROJECT_REF"
    echo "  3. Check Supabase CLI version: supabase --version"
    echo "  4. Review error messages above"
    exit 1
fi
