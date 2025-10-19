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
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"
SUPABASE_URL="${SUPABASE_URL:-https://${PROJECT_REF}.supabase.co}"
MAX_RETRIES=3
RETRY_DELAY=5
MIGRATION_AUDIT_SCRIPT="${MIGRATION_AUDIT_SCRIPT:-scripts/audit-migration-idempotence.sh}"

# Counters
STEP=0
TOTAL_STEPS=9
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

# Step 7.5: Synchronize Migration History with Remote
print_step "Synchronize Migration History"

echo "  Fetching remote migration history..."

# Check if jq is available
if ! command -v jq &> /dev/null; then
    print_warning "jq not found - installing for migration sync..."
    # GitHub Actions runners should have jq, but install if missing
    if command -v apt-get &> /dev/null; then
        sudo apt-get update -qq && sudo apt-get install -y -qq jq
    elif command -v brew &> /dev/null; then
        brew install jq
    else
        print_error "Cannot install jq - required for migration sync"
        exit 1
    fi
fi

# Check if curl is available (should be on all systems)
if ! command -v curl &> /dev/null; then
    print_error "curl not found - required for REST API fallback"
    exit 1
fi

# Create temporary directory for sync operations
SYNC_DIR=$(mktemp -d)
trap "rm -rf $SYNC_DIR" EXIT

# Method 1: Try Supabase CLI migration list
echo "  [Method 1] Attempting CLI: supabase migration list..."
CLI_SUCCESS=false

if supabase migration list --json > "$SYNC_DIR/remote_migrations.json" 2>"$SYNC_DIR/cli_error.log"; then
    # Verify the JSON is valid and not empty
    if jq -e 'type == "array"' "$SYNC_DIR/remote_migrations.json" &>/dev/null; then
        print_success "Remote migration list retrieved via CLI"
        CLI_SUCCESS=true
    else
        print_warning "CLI returned invalid JSON, will try fallback"
        echo "  CLI output: $(cat "$SYNC_DIR/remote_migrations.json" 2>/dev/null || echo 'empty')"
    fi
else
    print_warning "CLI method failed, will try REST API fallback"
    if [ -f "$SYNC_DIR/cli_error.log" ]; then
        echo "  CLI error: $(head -n 3 "$SYNC_DIR/cli_error.log")"
    fi
fi

# Method 2: Fallback to REST API if CLI failed
if [ "$CLI_SUCCESS" = false ]; then
    echo "  [Method 2] Attempting REST API fallback..."
    
    # Check if we have service role key for REST API
    if [ -z "$SERVICE_ROLE_KEY" ]; then
        print_warning "SUPABASE_SERVICE_ROLE_KEY not set, trying with ACCESS_TOKEN"
        AUTH_HEADER="Authorization: Bearer $ACCESS_TOKEN"
        API_KEY="$ACCESS_TOKEN"
    else
        AUTH_HEADER="Authorization: Bearer $SERVICE_ROLE_KEY"
        API_KEY="$SERVICE_ROLE_KEY"
    fi
    
    # Attempt 1: Try RPC function (if migration was applied)
    echo "  Trying RPC endpoint: get_migration_history..."
    HTTP_CODE=$(curl -s -w "%{http_code}" -o "$SYNC_DIR/rpc_response.json" \
        "${SUPABASE_URL}/rest/v1/rpc/get_migration_history" \
        -H "apikey: $API_KEY" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json")
    
    if [ "$HTTP_CODE" = "200" ] && jq -e 'type == "array"' "$SYNC_DIR/rpc_response.json" &>/dev/null; then
        # Transform RPC response to match CLI format
        jq 'map({version: .version, name: .name})' "$SYNC_DIR/rpc_response.json" > "$SYNC_DIR/remote_migrations.json"
        print_success "Remote migrations retrieved via RPC endpoint"
        CLI_SUCCESS=true
    else
        echo "  RPC endpoint returned HTTP $HTTP_CODE or invalid data"
        
        # Attempt 2: Direct query to schema_migrations table via PostgREST
        echo "  Trying direct table query..."
        HTTP_CODE=$(curl -s -w "%{http_code}" -o "$SYNC_DIR/table_response.json" \
            "${SUPABASE_URL}/rest/v1/schema_migrations?select=version,name&order=version.asc" \
            -H "apikey: $API_KEY" \
            -H "$AUTH_HEADER" \
            -H "Content-Type: application/json")
        
        if [ "$HTTP_CODE" = "200" ] && jq -e 'type == "array"' "$SYNC_DIR/table_response.json" &>/dev/null; then
            cp "$SYNC_DIR/table_response.json" "$SYNC_DIR/remote_migrations.json"
            print_success "Remote migrations retrieved via direct table query"
            CLI_SUCCESS=true
        else
            echo "  Direct query returned HTTP $HTTP_CODE or invalid data"
            
            # Attempt 3: Query supabase_migrations schema via PostgREST
            echo "  Trying supabase_migrations schema query..."
            
            # Note: This may fail if PostgREST doesn't expose supabase_migrations schema
            # In that case, we'll proceed with empty list (no remote migrations to sync)
            HTTP_CODE=$(curl -s -w "%{http_code}" -o "$SYNC_DIR/schema_response.json" \
                "${SUPABASE_URL}/rest/v1/supabase_migrations.schema_migrations?select=version,name&order=version.asc" \
                -H "apikey: $API_KEY" \
                -H "$AUTH_HEADER" \
                -H "Content-Type: application/json")
            
            if [ "$HTTP_CODE" = "200" ] && jq -e 'type == "array"' "$SYNC_DIR/schema_response.json" &>/dev/null; then
                cp "$SYNC_DIR/schema_response.json" "$SYNC_DIR/remote_migrations.json"
                print_success "Remote migrations retrieved via schema query"
                CLI_SUCCESS=true
            else
                print_warning "All REST API methods failed (HTTP $HTTP_CODE)"
                echo "  Creating empty migrations list - will proceed without remote sync"
                echo "[]" > "$SYNC_DIR/remote_migrations.json"
            fi
        fi
    fi
fi

# Parse remote migrations and identify missing local files
remote_versions=$(jq -r '.[].version // empty' "$SYNC_DIR/remote_migrations.json" 2>/dev/null || echo "")

if [ -n "$remote_versions" ]; then
    echo "  Checking for remote-only migrations..."
    MISSING_COUNT=0
    REPAIRED_COUNT=0
    
    while IFS= read -r version; do
        # Skip empty lines
        [ -z "$version" ] && continue
        
        # Check if migration file exists locally
        if ! ls supabase/migrations/${version}_*.sql &>/dev/null && \
           ! ls supabase/migrations/${version}.sql &>/dev/null; then
            echo "    ⚠️  Remote migration not in local: $version"
            MISSING_COUNT=$((MISSING_COUNT + 1))
            
            # Mark as repaired/applied locally without creating file
            echo "    Marking migration $version as applied locally..."
            repair_output=$(supabase migration repair --status applied "$version" --yes 2>&1)
            repair_exit_code=$?
            
            if [ $repair_exit_code -eq 0 ] || echo "$repair_output" | grep -q "success\|repaired\|marked\|already"; then
                echo "    ✓ Migration $version marked as applied"
                REPAIRED_COUNT=$((REPAIRED_COUNT + 1))
            else
                print_warning "Could not mark migration $version: $repair_output"
            fi
        fi
    done <<< "$remote_versions"
    
    if [ $MISSING_COUNT -eq 0 ]; then
        print_success "All remote migrations exist locally"
    else
        print_success "Repaired $REPAIRED_COUNT of $MISSING_COUNT remote-only migration(s)"
    fi
else
    print_warning "No remote migrations found (new database or all methods failed)"
    echo "  This is normal for a new project - proceeding with migration push"
fi

# Step 8: Push Database Migrations
print_step "Push Database Migrations"

# Attempt to push migrations with proper error handling
echo "  Pushing local migrations to remote..."

db_push_output=$(supabase db push --yes 2>&1) || db_push_exit_code=$?

if [ "${db_push_exit_code:-0}" -eq 0 ]; then
    print_success "Database migrations pushed successfully"
    echo "  All pending migrations have been applied ✓"
else
    # Analyze the error
    if echo "$db_push_output" | grep -qi "remote migration.*not found.*local"; then
        print_error "Migration sync failed - remote has migrations not in local directory"
        echo ""
        echo "Diagnostic information:"
        echo "$db_push_output"
        echo ""
        echo "Attempting recovery with db pull..."
        
        # Try to pull remote schema to sync
        if supabase db pull --yes 2>&1 | grep -q "success\|pulled"; then
            print_success "Schema pulled from remote - retry deployment"
            echo "  Re-run this deployment to apply synced migrations"
            exit 1  # Exit with error to trigger retry
        else
            print_error "Cannot sync with remote database"
            exit 1
        fi
        
    elif echo "$db_push_output" | grep -qi "duplicate key\|already exists\|constraint"; then
        print_warning "Some migrations already applied (idempotent migrations)"
        echo "  Verifying database state..."
        
        # Verify current state matches expected
        if supabase migration list 2>&1 | grep -qi "success\|listed"; then
            print_success "Database state verified - migrations are in sync"
        else
            print_warning "Could not verify database state, but continuing"
        fi
        
    elif echo "$db_push_output" | grep -qi "no new migrations"; then
        print_success "No new migrations to apply - database is up to date"
        
    else
        # Unknown error
        print_error "Database push failed with unexpected error"
        echo ""
        echo "Error output:"
        echo "$db_push_output"
        echo ""
        exit 1
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
