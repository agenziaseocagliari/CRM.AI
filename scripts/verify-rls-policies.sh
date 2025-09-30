#!/bin/bash
# verify-rls-policies.sh
# Verification script to check RLS policies use TO public pattern

echo "🔍 Verifying RLS Policy Compliance"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Check for TO authenticated, TO super_admin, TO service_role in migration files
echo "1. Checking for invalid TO clauses in migration files..."
INVALID_TO_CLAUSES=$(grep -rn "TO authenticated\|TO super_admin\|TO service_role" supabase/migrations/*.sql 2>/dev/null | grep -v "GRANT" | grep -v "COMMENT" | grep -v "Best Practice" | grep -v "Never use" | grep -v "internal Postgres roles")
if [ -n "$INVALID_TO_CLAUSES" ]; then
    echo -e "${RED}❌ FAIL: Found invalid TO clauses (TO authenticated/super_admin/service_role) in migration files:${NC}"
    echo "$INVALID_TO_CLAUSES"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ PASS: No invalid TO clauses found in migration files${NC}"
fi
echo ""

# Check that all CREATE POLICY statements have TO public
echo "2. Checking that all CREATE POLICY statements have TO public..."
POLICIES_WITHOUT_TO_PUBLIC=$(grep -rn "CREATE POLICY" supabase/migrations/*.sql | while read -r line; do
    file=$(echo "$line" | cut -d: -f1)
    linenum=$(echo "$line" | cut -d: -f2)
    
    # Get the policy definition (next 10 lines)
    policy_def=$(sed -n "${linenum},$((linenum + 10))p" "$file")
    
    # Check if TO public appears in the definition
    if ! echo "$policy_def" | grep -q "TO public"; then
        echo "$file:$linenum: Missing TO public clause"
    fi
done)

if [ -n "$POLICIES_WITHOUT_TO_PUBLIC" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Some policies may not explicitly specify TO public:${NC}"
    echo "$POLICIES_WITHOUT_TO_PUBLIC"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ PASS: All CREATE POLICY statements include TO public${NC}"
fi
echo ""

# Check for custom profile claim filters
echo "3. Checking for custom profile claim filters (profiles.role)..."
POLICIES_COUNT=$(grep -c "CREATE POLICY" supabase/migrations/*.sql 2>/dev/null | awk -F: '{sum+=$2} END {print sum}')
PROFILE_CHECKS=$(grep -c "profiles.role" supabase/migrations/*.sql 2>/dev/null | awk -F: '{sum+=$2} END {print sum}')

if [ "$PROFILE_CHECKS" -gt 0 ]; then
    echo -e "${GREEN}✅ PASS: Found $PROFILE_CHECKS profile.role references in policies${NC}"
else
    echo -e "${YELLOW}⚠️  WARNING: No profiles.role references found${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check migration file naming convention
echo "4. Checking migration file naming convention..."
INVALID_MIGRATIONS=$(find supabase/migrations -name "*.sql" ! -name "[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]_*.sql" 2>/dev/null)
if [ -n "$INVALID_MIGRATIONS" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Some migration files don't follow naming convention:${NC}"
    echo "$INVALID_MIGRATIONS"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ PASS: All migration files follow naming convention${NC}"
fi
echo ""

# Check for WITH CHECK (true) which is too permissive
echo "5. Checking for overly permissive policies..."
PERMISSIVE_POLICIES=$(grep -rn "WITH CHECK (true)" supabase/migrations/*.sql 2>/dev/null)
if [ -n "$PERMISSIVE_POLICIES" ]; then
    echo -e "${RED}❌ FAIL: Found overly permissive policies with WITH CHECK (true):${NC}"
    echo "$PERMISSIVE_POLICIES"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ PASS: No overly permissive policies found${NC}"
fi
echo ""

# Check documentation mentions TO public strategy
echo "6. Checking documentation for TO public strategy..."
if grep -q "TO public" README.md && grep -q "TO public" MIGRATION_ROBUSTNESS_GUIDE.md; then
    echo -e "${GREEN}✅ PASS: Documentation includes TO public strategy${NC}"
else
    echo -e "${YELLOW}⚠️  WARNING: Documentation may not adequately cover TO public strategy${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Summary
echo "=================================="
echo "Summary:"
echo "  Total policies found: $POLICIES_COUNT"
echo "  Profile claim filters: $PROFILE_CHECKS"
echo "  Errors: $ERRORS"
echo "  Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All critical checks passed!${NC}"
    echo ""
    echo "RLS Policy Best Practices:"
    echo "  1. ✅ Always use TO public (never TO authenticated/super_admin/service_role)"
    echo "  2. ✅ Always filter by custom profile claims (profiles.role = 'super_admin')"
    echo "  3. ✅ Avoid WITH CHECK (true) - use proper authorization checks"
    echo "  4. ✅ Wrap policy modifications in DO blocks with table existence checks"
    echo ""
    exit 0
else
    echo -e "${RED}❌ $ERRORS critical error(s) found. Please fix before deployment.${NC}"
    exit 1
fi
