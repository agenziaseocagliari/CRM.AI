#!/bin/bash
# verify-role-cleanup.sh
# Comprehensive verification script for PostgreSQL role reference cleanup
# Ensures no problematic database role references exist in the codebase

echo "🔍 PostgreSQL Role Cleanup Verification"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0
TOTAL_CHECKS=0

# Function to run a check
run_check() {
    local check_name=$1
    local pattern=$2
    local file_types=$3
    local search_paths=$4
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    echo -e "${BLUE}Check $TOTAL_CHECKS: $check_name${NC}"
    
    # Build grep command with file type filters
    local grep_includes=""
    for ext in $file_types; do
        grep_includes="$grep_includes --include=*.$ext"
    done
    
    # Search for pattern, excluding documentation examples and other verification scripts
    local results=$(eval "grep -rEn \"$pattern\" $grep_includes $search_paths 2>/dev/null" | \
        grep -v "COMMENT ON" | \
        grep -v "Never use" | \
        grep -v "internal Postgres" | \
        grep -v "Best Practice" | \
        grep -v "what NOT to do" | \
        grep -v "what \*\*NOT\*\* to do" | \
        grep -v "grep" | \
        grep -v "Check for" | \
        grep -v "verify-role-cleanup.sh" | \
        grep -v "verify-rls-policies.sh" || true)
    
    if [ -z "$results" ]; then
        echo -e "  ${GREEN}✅ PASS${NC}"
    else
        echo -e "  ${RED}❌ FAIL: Found problematic references:${NC}"
        echo "$results" | head -5
        ERRORS=$((ERRORS + 1))
    fi
    echo ""
}

# Check 1: TO super_admin in SQL/scripts
run_check "No 'TO super_admin' references" \
    "TO\s+super_admin" \
    "sql ts js sh yml yaml" \
    "supabase/migrations supabase/functions scripts .github"

# Check 2: TO authenticated in SQL/scripts
run_check "No 'TO authenticated' references" \
    "TO\s+authenticated" \
    "sql ts js sh yml yaml" \
    "supabase/migrations supabase/functions scripts .github"

# Check 3: TO service_role in SQL/scripts
run_check "No 'TO service_role' references" \
    "TO\s+service_role" \
    "sql ts js sh yml yaml" \
    "supabase/migrations supabase/functions scripts .github"

# Check 4: SET ROLE statements
run_check "No 'SET ROLE' statements" \
    "SET\s+ROLE\s+(super_admin|authenticated|service_role)" \
    "sql ts js sh yml yaml" \
    "supabase/migrations supabase/functions scripts .github"

# Check 5: CREATE ROLE statements
run_check "No 'CREATE ROLE' statements" \
    "CREATE\s+ROLE\s+(super_admin|authenticated|service_role)" \
    "sql ts js sh yml yaml" \
    "supabase/migrations supabase/functions scripts .github"

# Check 6: ALTER ROLE statements
run_check "No 'ALTER ROLE' statements" \
    "ALTER\s+ROLE\s+(super_admin|authenticated|service_role)" \
    "sql ts js sh yml yaml" \
    "supabase/migrations supabase/functions scripts .github"

# Check 7: DROP ROLE statements
run_check "No 'DROP ROLE' statements" \
    "DROP\s+ROLE\s+(super_admin|authenticated|service_role)" \
    "sql ts js sh yml yaml" \
    "supabase/migrations supabase/functions scripts .github"

# Check 8: GRANT to problematic roles
run_check "No GRANT statements to DB roles" \
    "GRANT\s+.*\s+TO\s+(super_admin|authenticated|service_role)" \
    "sql ts js sh yml yaml" \
    "supabase/migrations supabase/functions scripts .github"

# Check 9: Connection strings with role parameter
echo -e "${BLUE}Check 9: No role parameters in connection strings${NC}"
role_in_conn=$(grep -rn "role=" supabase/functions src --include="*.ts" --include="*.js" 2>/dev/null | \
    grep -v "profile.role" | \
    grep -v "profiles.role" | \
    grep -v "role: " | \
    grep -v "// role" | \
    grep -v '\[role="' || true)
if [ -z "$role_in_conn" ]; then
    echo -e "  ${GREEN}✅ PASS${NC}"
else
    echo -e "  ${RED}❌ FAIL: Found role in connection strings:${NC}"
    echo "$role_in_conn" | head -5
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 10: Verify all policies use TO public
echo -e "${BLUE}Check 10: All RLS policies use TO public${NC}"
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
total_policies=$(grep "CREATE POLICY" supabase/migrations/*.sql 2>/dev/null | wc -l)
policies_with_public=$(grep -A 3 "CREATE POLICY" supabase/migrations/*.sql 2>/dev/null | grep "TO public" | wc -l)

if [ "$total_policies" -eq "$policies_with_public" ] && [ "$total_policies" -gt 0 ]; then
    echo -e "  ${GREEN}✅ PASS: All $total_policies policies use TO public${NC}"
else
    echo -e "  ${YELLOW}⚠️  WARNING: Policy count mismatch${NC}"
    echo "  Total policies: $total_policies"
    echo "  Policies with TO public: $policies_with_public"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Summary
echo "========================================"
echo -e "${BLUE}VERIFICATION SUMMARY${NC}"
echo "========================================"
echo "Total checks: $TOTAL_CHECKS"
echo "Total policies verified: $total_policies"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED!${NC}"
    echo ""
    echo "The codebase is clean and ready for deployment."
    echo "No problematic PostgreSQL role references found."
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  WARNINGS: $WARNINGS${NC}"
    echo "No errors, but there are warnings to review."
    exit 0
else
    echo -e "${RED}❌ ERRORS: $ERRORS${NC}"
    echo -e "${YELLOW}⚠️  WARNINGS: $WARNINGS${NC}"
    echo ""
    echo "Please fix the issues above before deploying."
    exit 1
fi
