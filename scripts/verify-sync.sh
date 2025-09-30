#!/bin/bash

# =====================================================
# Guardian AI CRM - Verification & Sync Script
# =====================================================
# This script automates verification checks for
# GitHub ↔️ Supabase synchronization
# =====================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
}

print_error() {
    echo -e "${RED}✗${NC} $1"
    ((CHECKS_FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((CHECKS_WARNING++))
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# =====================================================
# 1. Repository Integrity Check
# =====================================================
check_repository_integrity() {
    print_section "1️⃣  Repository Integrity Check"
    
    # Check if we're in a git repository
    if git rev-parse --git-dir > /dev/null 2>&1; then
        print_success "Git repository detected"
    else
        print_error "Not in a git repository"
        return 1
    fi
    
    # Check for uncommitted changes
    if [[ -z $(git status --porcelain) ]]; then
        print_success "No uncommitted changes"
    else
        print_warning "Uncommitted changes detected"
        git status --short
    fi
    
    # Check if .github/workflows exists
    if [ -d ".github/workflows" ]; then
        print_success ".github/workflows directory exists"
        
        # Check for deploy workflow
        if [ -f ".github/workflows/deploy-supabase.yml" ]; then
            print_success "deploy-supabase.yml workflow found"
        else
            print_error "deploy-supabase.yml workflow NOT found"
        fi
    else
        print_error ".github/workflows directory NOT found"
    fi
    
    # Check for duplicate shared directory
    if [ -d "supabase/functions/shared" ]; then
        print_error "Duplicate 'shared/' directory found (should only have '_shared/')"
    else
        print_success "No duplicate 'shared/' directory"
    fi
    
    # Check _shared directory
    if [ -d "supabase/functions/_shared" ]; then
        print_success "_shared directory exists"
        
        # Check for required shared files
        for file in cors.ts supabase.ts google.ts diagnostics.ts; do
            if [ -f "supabase/functions/_shared/$file" ]; then
                print_success "_shared/$file exists"
            else
                print_error "_shared/$file NOT found"
            fi
        done
    else
        print_error "_shared directory NOT found"
    fi
}

# =====================================================
# 2. TypeScript & Build Check
# =====================================================
check_typescript_build() {
    print_section "2️⃣  TypeScript & Build Check"
    
    # Check if node_modules exists
    if [ -d "node_modules" ]; then
        print_success "node_modules directory exists"
    else
        print_warning "node_modules NOT found. Run: npm install"
    fi
    
    # Check if package.json exists
    if [ -f "package.json" ]; then
        print_success "package.json found"
        
        # Run TypeScript check
        print_info "Running TypeScript lint check..."
        if npm run lint > /dev/null 2>&1; then
            print_success "TypeScript lint check passed"
        else
            print_error "TypeScript lint check FAILED"
            echo "Run: npm run lint for details"
        fi
    else
        print_error "package.json NOT found"
    fi
}

# =====================================================
# 3. Edge Functions Inventory
# =====================================================
check_edge_functions() {
    print_section "3️⃣  Edge Functions Inventory"
    
    if [ -d "supabase/functions" ]; then
        print_success "Edge functions directory exists"
        
        # Count functions (excluding _shared and shared)
        FUNCTION_COUNT=$(find supabase/functions -mindepth 1 -maxdepth 1 -type d ! -name '_shared' ! -name 'shared' | wc -l)
        print_info "Found $FUNCTION_COUNT edge functions"
        
        # Expected functions
        EXPECTED_FUNCTIONS=(
            "google-auth-url"
            "google-token-exchange"
            "check-google-token-status"
            "create-google-event"
            "update-google-event"
            "delete-google-event"
            "get-google-calendar-events"
            "create-crm-event"
            "get-all-crm-events"
            "consume-credits"
            "process-automation-request"
            "score-contact-lead"
            "generate-email-content"
            "generate-whatsapp-message"
            "generate-form-fields"
            "send-email"
            "send-welcome-email"
            "send-whatsapp-message"
            "schedule-event-reminders"
            "process-scheduled-reminders"
            "test-org-settings"
            "run-debug-query"
        )
        
        # Check each expected function
        for func in "${EXPECTED_FUNCTIONS[@]}"; do
            if [ -f "supabase/functions/$func/index.ts" ]; then
                print_success "$func"
            else
                print_error "$func NOT found"
            fi
        done
        
        if [ "$FUNCTION_COUNT" -eq "${#EXPECTED_FUNCTIONS[@]}" ]; then
            print_success "All $FUNCTION_COUNT functions present"
        else
            print_warning "Expected ${#EXPECTED_FUNCTIONS[@]} functions, found $FUNCTION_COUNT"
        fi
    else
        print_error "supabase/functions directory NOT found"
    fi
}

# =====================================================
# 4. Documentation Check
# =====================================================
check_documentation() {
    print_section "4️⃣  Documentation Check"
    
    # Check for required documentation files
    DOC_FILES=(
        "README.md"
        "SUPERVISION_REPORT.md"
        "EDGE_FUNCTIONS_API.md"
        "SYNC_CHECKLIST.md"
        ".env.example"
    )
    
    for doc in "${DOC_FILES[@]}"; do
        if [ -f "$doc" ]; then
            # Check if file is not empty
            if [ -s "$doc" ]; then
                print_success "$doc exists and not empty"
            else
                print_warning "$doc exists but is EMPTY"
            fi
        else
            print_error "$doc NOT found"
        fi
    done
}

# =====================================================
# 5. Migrations Check
# =====================================================
check_migrations() {
    print_section "5️⃣  Database Migrations Check"
    
    if [ -d "supabase/migrations" ]; then
        print_success "Migrations directory exists"
        
        MIGRATION_COUNT=$(find supabase/migrations -name "*.sql" | wc -l)
        print_info "Found $MIGRATION_COUNT migration files"
        
        # Check for empty migrations
        EMPTY_MIGRATIONS=0
        while IFS= read -r migration; do
            if [ ! -s "$migration" ]; then
                print_warning "Empty migration: $(basename $migration)"
                ((EMPTY_MIGRATIONS++))
            fi
        done < <(find supabase/migrations -name "*.sql")
        
        if [ "$EMPTY_MIGRATIONS" -eq 0 ]; then
            print_success "No empty migrations found"
        else
            print_warning "$EMPTY_MIGRATIONS empty migration(s) found - should be populated"
        fi
    else
        print_error "supabase/migrations directory NOT found"
    fi
}

# =====================================================
# 6. Security Check
# =====================================================
check_security() {
    print_section "6️⃣  Security Check"
    
    # Check for accidentally committed secrets
    print_info "Checking for potential secrets in code..."
    
    # Patterns to search for
    SECRET_PATTERNS=(
        "api[_-]?key.*=.*['\"][a-zA-Z0-9]{30,}['\"]"
        "password.*=.*['\"][^'\"]{8,}['\"]"
        "secret.*=.*['\"][a-zA-Z0-9]{20,}['\"]"
    )
    
    SECRETS_FOUND=0
    for pattern in "${SECRET_PATTERNS[@]}"; do
        if grep -r -E "$pattern" \
            --exclude-dir=node_modules \
            --exclude-dir=.git \
            --exclude="*.lock" \
            --exclude="verify-sync.sh" \
            --exclude="deploy-supabase.yml" \
            . > /dev/null 2>&1; then
            ((SECRETS_FOUND++))
        fi
    done
    
    if [ "$SECRETS_FOUND" -eq 0 ]; then
        print_success "No obvious secrets detected in code"
    else
        print_warning "Potential secrets detected - manual review recommended"
    fi
    
    # Check .gitignore
    if [ -f ".gitignore" ]; then
        if grep -q "\.env$" .gitignore && grep -q "node_modules" .gitignore; then
            print_success ".gitignore properly configured"
        else
            print_warning ".gitignore may need updates"
        fi
    else
        print_error ".gitignore NOT found"
    fi
}

# =====================================================
# 7. Supabase CLI Check (if available)
# =====================================================
check_supabase_cli() {
    print_section "7️⃣  Supabase CLI Check (Optional)"
    
    if command -v supabase &> /dev/null; then
        print_success "Supabase CLI installed"
        
        # Check if linked to project
        if supabase status &> /dev/null; then
            print_success "Linked to Supabase project"
        else
            print_warning "Not linked to Supabase project. Run: supabase link"
        fi
    else
        print_warning "Supabase CLI not installed (optional for local development)"
        print_info "Install with: npm install -g supabase"
    fi
}

# =====================================================
# Generate Report Summary
# =====================================================
generate_summary() {
    print_section "📊 Verification Summary"
    
    TOTAL_CHECKS=$((CHECKS_PASSED + CHECKS_FAILED + CHECKS_WARNING))
    
    echo ""
    echo "Total Checks: $TOTAL_CHECKS"
    echo -e "${GREEN}Passed: $CHECKS_PASSED${NC}"
    echo -e "${YELLOW}Warnings: $CHECKS_WARNING${NC}"
    echo -e "${RED}Failed: $CHECKS_FAILED${NC}"
    echo ""
    
    if [ "$CHECKS_FAILED" -eq 0 ]; then
        if [ "$CHECKS_WARNING" -eq 0 ]; then
            echo -e "${GREEN}✓ All checks passed! Repository is in excellent state.${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠ Some warnings found. Review them for improvements.${NC}"
            return 0
        fi
    else
        echo -e "${RED}✗ Some checks failed. Please review and fix issues.${NC}"
        return 1
    fi
}

# =====================================================
# Main Execution
# =====================================================
main() {
    echo ""
    echo "╔════════════════════════════════════════════════════╗"
    echo "║   Guardian AI CRM - Sync Verification Script      ║"
    echo "║   Automated checks for GitHub ↔️ Supabase         ║"
    echo "╚════════════════════════════════════════════════════╝"
    echo ""
    
    # Run all checks
    check_repository_integrity
    check_typescript_build
    check_edge_functions
    check_documentation
    check_migrations
    check_security
    check_supabase_cli
    
    # Generate summary
    generate_summary
    
    exit $?
}

# Run main function
main
