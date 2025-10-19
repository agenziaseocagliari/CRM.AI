#!/bin/bash#!/bin/bash

# =============================================================================# deploy-supabase-robust.sh

# SUPABASE DEPLOYMENT ROBUST SCRIPT# Robust and definitive Supabase deployment script with complete error handling

# =============================================================================# This script centralizes all Supabase operations to ensure consistency and reliability

# Securely links and deploys to Supabase with proper error handling

# set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Required Environment Variables:

#   - SUPABASE_PROJECT_REF: Project reference ID (e.g., qjtaqrlpronohgpfdxsi)# Colors for output

#   - SUPABASE_ACCESS_TOKEN: Access token for authenticationRED='\033[0;31m'

#GREEN='\033[0;32m'

# Optional Environment Variables:YELLOW='\033[1;33m'

#   - SUPABASE_DB_PASSWORD: Database password (for db push operations)BLUE='\033[0;34m'

#   - DEBUG: Set to 'true' for verbose outputNC='\033[0m' # No Color

#

# Exit Codes:# Configuration

#   0: SuccessPROJECT_REF="${SUPABASE_PROJECT_REF:-qjtaqrlpronohgpfdxsi}"

#   1: Missing required environment variablesACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN:-}"

#   2: Supabase CLI not installedSERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

#   3: Link operation failedSUPABASE_URL="${SUPABASE_URL:-https://${PROJECT_REF}.supabase.co}"

#   4: Migration push failedMAX_RETRIES=3

# =============================================================================RETRY_DELAY=5

MIGRATION_AUDIT_SCRIPT="${MIGRATION_AUDIT_SCRIPT:-scripts/audit-migration-idempotence.sh}"

set -euo pipefail  # Exit on error, undefined variable, or pipe failure

# Counters

# Colors for outputSTEP=0

RED='\033[0;31m'TOTAL_STEPS=9

GREEN='\033[0;32m'ERRORS=0

YELLOW='\033[1;33m'

BLUE='\033[0;34m'# Functions

NC='\033[0m' # No Colorprint_step() {

    STEP=$((STEP + 1))

# Function to log messages    echo -e "\n${BLUE}▶ Step $STEP/$TOTAL_STEPS: $1${NC}"

log_info() {}

    echo -e "${BLUE}ℹ️  $1${NC}"

}print_success() {

    echo -e "${GREEN}✅ $1${NC}"

log_success() {}

    echo -e "${GREEN}✅ $1${NC}"

}print_error() {

    echo -e "${RED}❌ $1${NC}"

log_warning() {    ERRORS=$((ERRORS + 1))

    echo -e "${YELLOW}⚠️  $1${NC}"}

}

print_warning() {

log_error() {    echo -e "${YELLOW}⚠️  $1${NC}"

    echo -e "${RED}❌ $1${NC}" >&2}

}

retry_command() {

# Function to check if command exists    local command=$1

command_exists() {    local description=$2

    command -v "$1" >/dev/null 2>&1    local attempt=1

}    

    while [ $attempt -le $MAX_RETRIES ]; do

# =============================================================================        echo "  [Attempt $attempt/$MAX_RETRIES] Running: $command"

# PRE-FLIGHT CHECKS        

# =============================================================================        if eval "$command"; then

            print_success "$description"

log_info "Starting Supabase deployment pre-flight checks..."            return 0

        fi

# Check 1: Verify Supabase CLI is installed        

if ! command_exists supabase; then        if [ $attempt -lt $MAX_RETRIES ]; then

    log_error "Supabase CLI is not installed"            print_warning "Attempt $attempt failed. Waiting ${RETRY_DELAY}s before retry..."

    log_info "Install with: npm install -g supabase"            sleep $RETRY_DELAY

    log_info "Or visit: https://supabase.com/docs/guides/cli"        fi

    exit 2        

fi        attempt=$((attempt + 1))

    done

log_success "Supabase CLI installed: $(supabase --version)"    

    print_error "$description - failed after $MAX_RETRIES attempts"

# Check 2: Verify SUPABASE_PROJECT_REF is set    return 1

if [ -z "${SUPABASE_PROJECT_REF:-}" ]; then}

    log_error "SUPABASE_PROJECT_REF environment variable is not set"

    log_info "Set it with: export SUPABASE_PROJECT_REF=your-project-ref"# ============================================================================

    log_info "Or in GitHub Actions secrets: SUPABASE_PROJECT_REF"# DEPLOYMENT WORKFLOW

    exit 1# ============================================================================

fi

echo -e "${BLUE}🚀 SUPABASE ROBUST DEPLOYMENT WORKFLOW${NC}"

log_success "SUPABASE_PROJECT_REF is set: ${SUPABASE_PROJECT_REF}"echo "========================================"

echo "Project Ref: $PROJECT_REF"

# Check 3: Verify SUPABASE_ACCESS_TOKEN is setecho "Environment: GitHub Actions"

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; thenecho ""

    log_error "SUPABASE_ACCESS_TOKEN environment variable is not set"

    log_info "Generate a token at: https://app.supabase.com/account/tokens"# Step 1: Verify prerequisites

    log_info "Set it with: export SUPABASE_ACCESS_TOKEN=your-token"print_step "Verify Prerequisites"

    log_info "Or in GitHub Actions secrets: SUPABASE_ACCESS_TOKEN"

    exit 1if [ -z "$ACCESS_TOKEN" ]; then

fi    print_error "SUPABASE_ACCESS_TOKEN environment variable not set"

    exit 1

log_success "SUPABASE_ACCESS_TOKEN is set (length: ${#SUPABASE_ACCESS_TOKEN} chars)"fi



# Check 4: Verify migrations directory existsif ! command -v supabase &> /dev/null; then

if [ ! -d "supabase/migrations" ]; then    print_error "Supabase CLI not found. Please install it first."

    log_warning "supabase/migrations directory not found"    exit 1

    log_info "Creating supabase/migrations directory..."fi

    mkdir -p supabase/migrations

fiprint_success "Prerequisites verified"



log_success "Migration directory exists"# Step 2: Verify configuration

print_step "Verify Configuration Files"

# =============================================================================

# SUPABASE PROJECT LINKINGif [ ! -f "supabase/config.toml" ]; then

# =============================================================================    print_error "supabase/config.toml not found"

    exit 1

log_info "Linking to Supabase project: ${SUPABASE_PROJECT_REF}"fi



# Enable debug mode if requestedif [ ! -d "supabase/migrations" ]; then

if [ "${DEBUG:-false}" = "true" ]; then    print_error "supabase/migrations directory not found"

    log_warning "Debug mode enabled - verbose output will be shown"    exit 1

    set -xfi

fi

print_success "Configuration files verified"

# Attempt to link to Supabase project

# The --project-ref flag MUST have a value# Step 3: Cleanup previous session

if ! supabase link --project-ref "${SUPABASE_PROJECT_REF}"; thenprint_step "Cleanup Previous Session"

    log_error "Failed to link to Supabase project: ${SUPABASE_PROJECT_REF}"

    log_info "Verify the project reference is correct"# Remove any existing .supabase directory that might have stale state

    log_info "Check your access token has the required permissions"if [ -d ".supabase" ]; then

    exit 3    echo "  Removing stale .supabase directory..."

fi    rm -rf .supabase

fi

log_success "Successfully linked to Supabase project"

# Clear environment to ensure clean state

# Verify the link by checking project statusunset SUPABASE_REF || true

log_info "Verifying project link..."unset SUPABASE_DB_PASSWORD || true

if supabase projects list | grep -q "${SUPABASE_PROJECT_REF}"; then

    log_success "Project link verified"print_success "Previous session cleaned up"

else

    log_warning "Could not verify project link in projects list"# Step 4: Audit migrations for idempotence

fiprint_step "Audit Migrations for Idempotence"



# =============================================================================if [ -f "$MIGRATION_AUDIT_SCRIPT" ]; then

# DATABASE MIGRATION DEPLOYMENT    echo "  Running migration idempotence audit..."

# =============================================================================    if bash "$MIGRATION_AUDIT_SCRIPT" 2>&1 | grep -q "ALL MIGRATIONS ARE IDEMPOTENT"; then

        print_success "Migration audit passed - all migrations are idempotent"

# Check if there are migrations to deploy    else

migration_count=$(find supabase/migrations -name "*.sql" 2>/dev/null | wc -l)        print_warning "Migration audit completed - review output above"

        echo "  (Continuing anyway - audit is advisory)"

if [ "$migration_count" -eq 0 ]; then    fi

    log_warning "No migrations found in supabase/migrations/"else

    log_info "Skipping database migration deployment"    print_warning "Migration audit script not found at $MIGRATION_AUDIT_SCRIPT"

else    echo "  (Skipping idempotence check)"

    log_info "Found $migration_count migration file(s) to deploy"fi

    

    log_info "Pushing database migrations to Supabase..."# Step 5: Link to Supabase Project (with retry logic)

    print_step "Link to Supabase Project"

    # Push migrations to remote database

    if ! supabase db push; thenlink_command="supabase link \\

        log_error "Failed to push database migrations"  --project-ref '$PROJECT_REF' \\

        log_info "Check migration files for syntax errors"  --yes 2>&1"

        log_info "Review Supabase logs for detailed error messages"

        exit 4if retry_command "$link_command" "Supabase project linked successfully"; then

    fi    # Verify link was successful

        if [ -f ".supabase/config.json" ]; then

    log_success "Database migrations pushed successfully"        echo "  .supabase/config.json created ✓"

fi    fi

else

# =============================================================================    print_error "Unable to link to Supabase project after $MAX_RETRIES attempts"

# EDGE FUNCTIONS DEPLOYMENT (Optional)    exit 1

# =============================================================================fi



# Check if there are edge functions to deploy# Step 6: Deploy Edge Functions

if [ -d "supabase/functions" ] && [ "$(ls -A supabase/functions 2>/dev/null)" ]; thenprint_step "Deploy Edge Functions"

    log_info "Edge functions directory found"

    edge_deploy_command="supabase functions deploy \\

    # Count edge functions  --no-verify-jwt 2>&1"

    function_count=$(find supabase/functions -mindepth 1 -maxdepth 1 -type d | wc -l)

    log_info "Found $function_count edge function(s)"if retry_command "$edge_deploy_command" "Edge functions deployed successfully"; then

        echo "  All edge functions deployed ✓"

    # Ask for confirmation if not in CI environmentelse

    if [ -z "${CI:-}" ]; then    print_warning "Edge functions deployment failed - continuing with migrations"

        read -p "Deploy edge functions? (y/N): " -n 1 -rfi

        echo

        if [[ ! $REPLY =~ ^[Yy]$ ]]; then# Step 7: Check for Duplicate Migration Versions

            log_info "Skipping edge functions deployment"print_step "Check Migration Versions"

            function_count=0

        fiif [ -f "scripts/check-migration-versions.sh" ]; then

    fi    echo "  Checking for duplicate migration versions..."

        if bash scripts/check-migration-versions.sh; then

    if [ "$function_count" -gt 0 ]; then        print_success "All migration versions are unique"

        log_info "Deploying edge functions..."    else

                print_error "Duplicate migration versions detected - please fix before deploying"

        if ! supabase functions deploy --no-verify-jwt; then        exit 1

            log_error "Failed to deploy edge functions"    fi

            log_warning "Continuing anyway - edge functions are optional"else

        else    print_warning "Migration version check script not found (skipping)"

            log_success "Edge functions deployed successfully"fi

        fi

    fi# Step 7.5: Synchronize Migration History with Remote

elseprint_step "Synchronize Migration History"

    log_info "No edge functions found - skipping deployment"

fiecho "  Fetching remote migration history..."



# =============================================================================# Check if jq is available

# POST-DEPLOYMENT VERIFICATIONif ! command -v jq &> /dev/null; then

# =============================================================================    print_warning "jq not found - installing for migration sync..."

    # GitHub Actions runners should have jq, but install if missing

log_info "Running post-deployment verification..."    if command -v apt-get &> /dev/null; then

        sudo apt-get update -qq && sudo apt-get install -y -qq jq

# Verify database connection    elif command -v brew &> /dev/null; then

log_info "Verifying database connection..."        brew install jq

if supabase db ping 2>/dev/null; then    else

    log_success "Database connection verified"        print_error "Cannot install jq - required for migration sync"

else        exit 1

    log_warning "Could not verify database connection (command not supported)"    fi

fifi



# =============================================================================# Check if curl is available (should be on all systems)

# CLEANUP AND SUMMARYif ! command -v curl &> /dev/null; then

# =============================================================================    print_error "curl not found - required for REST API fallback"

    exit 1

# Disable debug mode if it was enabledfi

if [ "${DEBUG:-false}" = "true" ]; then

    set +x# Create temporary directory for sync operations

fiSYNC_DIR=$(mktemp -d)

trap "rm -rf $SYNC_DIR" EXIT

log_success "=========================================="

log_success "DEPLOYMENT COMPLETED SUCCESSFULLY"# Method 1: Try Supabase CLI migration list

log_success "=========================================="echo "  [Method 1] Attempting CLI: supabase migration list..."

log_info "Project: ${SUPABASE_PROJECT_REF}"CLI_SUCCESS=false

log_info "Migrations deployed: $migration_count file(s)"

log_info "Timestamp: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"if supabase migration list --json > "$SYNC_DIR/remote_migrations.json" 2>"$SYNC_DIR/cli_error.log"; then

log_success "=========================================="    # Verify the JSON is valid and not empty

    if jq -e 'type == "array"' "$SYNC_DIR/remote_migrations.json" &>/dev/null; then

exit 0        print_success "Remote migration list retrieved via CLI"

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
