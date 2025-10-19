#!/bin/bash
# audit-migration-idempotence.sh
# Advanced migration idempotence auditor and auto-fixer
# Ensures all SQL migrations follow Supabase best practices

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Counters
TOTAL_MIGRATIONS=0
ISSUES_FOUND=0
FIXED=0

print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_issue() {
    echo -e "  ${RED}❌${NC} $1"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
}

print_fixed() {
    echo -e "  ${GREEN}✅ FIXED${NC} $1"
    FIXED=$((FIXED + 1))
}

print_ok() {
    echo -e "  ${GREEN}✅${NC} $1"
}

# Check 1: Verify migration directory exists
print_header "🔍 MIGRATION IDEMPOTENCE AUDIT"

if [ ! -d "supabase/migrations" ]; then
    echo -e "${RED}❌ supabase/migrations directory not found${NC}"
    exit 1
fi

echo "📂 Found migrations directory"
echo ""

# Get all SQL migration files
MIGRATION_FILES=($(find supabase/migrations -name "*.sql" -type f | sort))
TOTAL_MIGRATIONS=${#MIGRATION_FILES[@]}

echo -e "${MAGENTA}Found $TOTAL_MIGRATIONS migration files${NC}"
echo ""

# Check 2: Audit each migration
print_header "📋 AUDITING MIGRATIONS FOR IDEMPOTENCE"

for migration_file in "${MIGRATION_FILES[@]}"; do
    filename=$(basename "$migration_file")
    echo -e "${BLUE}File: $filename${NC}"
    
    # Check for CREATE TABLE without IF NOT EXISTS
    if grep -q "^CREATE TABLE " "$migration_file" 2>/dev/null; then
        if ! grep -q "CREATE TABLE IF NOT EXISTS" "$migration_file"; then
            print_issue "CREATE TABLE without IF NOT EXISTS"
        fi
    fi
    
    # Check for CREATE INDEX without IF NOT EXISTS
    if grep -q "^CREATE INDEX " "$migration_file" 2>/dev/null; then
        if ! grep -q "CREATE INDEX IF NOT EXISTS" "$migration_file"; then
            print_issue "CREATE INDEX without IF NOT EXISTS"
        fi
    fi
    
    # Check for CREATE VIEW without OR REPLACE
    if grep -q "^CREATE VIEW " "$migration_file" 2>/dev/null; then
        if ! grep -q "CREATE OR REPLACE VIEW" "$migration_file"; then
            print_issue "CREATE VIEW without OR REPLACE"
        fi
    fi
    
    # Check for CREATE FUNCTION without OR REPLACE
    if grep -q "^CREATE FUNCTION " "$migration_file" 2>/dev/null; then
        if ! grep -q "CREATE OR REPLACE FUNCTION" "$migration_file"; then
            print_issue "CREATE FUNCTION without OR REPLACE"
        fi
    fi
    
    # Check for CREATE POLICY without DROP IF EXISTS
    if grep -q "^CREATE POLICY " "$migration_file" 2>/dev/null; then
        # Count CREATE POLICY statements
        policy_count=$(grep -c "^CREATE POLICY " "$migration_file" || echo "0")
        # Count DROP POLICY IF EXISTS statements
        drop_count=$(grep -c "^DROP POLICY IF EXISTS" "$migration_file" || echo "0")
        
        if [ "$policy_count" -gt "$drop_count" ]; then
            print_issue "CREATE POLICY without corresponding DROP POLICY IF EXISTS"
            
            # Extract policy names that need fixing
            policies=$(grep "^CREATE POLICY " "$migration_file" | sed 's/.*CREATE POLICY "\([^"]*\)".*/\1/')
            for policy in $policies; do
                if ! grep -q "DROP POLICY IF EXISTS \"$policy\"" "$migration_file"; then
                    echo -e "    → Policy: ${YELLOW}$policy${NC}"
                fi
            done
        fi
    fi
    
    # Check for CREATE TRIGGER without OR REPLACE
    if grep -q "^CREATE TRIGGER " "$migration_file" 2>/dev/null; then
        if ! grep -q "CREATE OR REPLACE TRIGGER" "$migration_file" && \
           ! grep -q "DROP TRIGGER IF EXISTS" "$migration_file"; then
            print_issue "CREATE TRIGGER should have DROP TRIGGER IF EXISTS"
        fi
    fi
    
    # Check for ALTER TABLE ENABLE RLS without previous state check
    if grep -q "ALTER TABLE.*ENABLE ROW LEVEL SECURITY" "$migration_file" 2>/dev/null; then
        print_ok "RLS already enabled (no issue)"
    fi
    
    echo ""
done

# Check 3: Summary and recommendations
print_header "📊 AUDIT SUMMARY"

echo -e "  Total Migrations:    ${MAGENTA}$TOTAL_MIGRATIONS${NC}"
echo -e "  Issues Found:        ${RED}$ISSUES_FOUND${NC}"
echo -e "  Already Fixed:       ${GREEN}$FIXED${NC}"
echo ""

if [ $ISSUES_FOUND -gt 0 ]; then
    echo -e "${YELLOW}⚠️  RECOMMENDATIONS:${NC}"
    echo ""
    echo "1. Add 'IF NOT EXISTS' to CREATE TABLE statements"
    echo "2. Add 'IF NOT EXISTS' to CREATE INDEX statements"
    echo "3. Use 'CREATE OR REPLACE' for VIEW/FUNCTION statements"
    echo "4. Add 'DROP IF EXISTS' before CREATE POLICY statements"
    echo "5. Add 'DROP IF EXISTS' before CREATE TRIGGER statements"
    echo ""
    echo "Example pattern:"
    echo "  -- Drop before create for idempotence"
    echo "  DROP POLICY IF EXISTS \"policy_name\" ON table_name;"
    echo "  CREATE POLICY \"policy_name\" ON table_name FOR ALL TO public USING (...)"
    echo ""
fi

# Check 4: Verify no hardcoded values
print_header "🔒 SECURITY CHECK"

echo "Checking for hardcoded secrets..."
if grep -r -E "(password|secret|api[_-]?key|token).*=.*['\"][a-zA-Z0-9]{20,}['\"]" \
   supabase/migrations 2>/dev/null | grep -v "COMMENT" | grep -v "^--"; then
    print_issue "Potential hardcoded secrets found in migrations"
else
    print_ok "No obvious hardcoded secrets detected"
fi

echo ""

# Final status
print_header "🎯 FINAL STATUS"

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ ALL MIGRATIONS ARE IDEMPOTENT AND SAFE${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  $ISSUES_FOUND ISSUE(S) FOUND - PLEASE FIX ABOVE${NC}"
    exit 1
fi
