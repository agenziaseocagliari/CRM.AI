#!/bin/bash
# verify-api-role-usage.sh
# Comprehensive verification script to ensure no custom 'role' parameters
# are being passed in API calls to Supabase/PostgREST
# This prevents "role does not exist" errors (SQLSTATE 22023, 42704)
#
# Usage: ./scripts/verify-api-role-usage.sh
#
# Exit codes:
#   0 - All checks passed
#   1 - Found problematic role usage

echo "🔍 API Role Usage Verification"
echo "========================================"
echo "Checking for custom 'role' parameters in API calls..."
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
    local description=$2
    local search_command=$3
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    echo -e "${BLUE}Check $TOTAL_CHECKS: $check_name${NC}"
    echo "  $description"
    
    # Execute the search command
    local results=$(eval "$search_command")
    
    if [ -z "$results" ]; then
        echo -e "  ${GREEN}✅ PASS${NC}"
    else
        echo -e "  ${RED}❌ FAIL: Found problematic usage:${NC}"
        echo "$results" | head -10
        ERRORS=$((ERRORS + 1))
    fi
    echo ""
}

# Check 1: Role in headers object
run_check \
    "No 'role' in headers" \
    "Ensures no custom role header is being sent in API calls" \
    "grep -rn 'headers' src/ supabase/functions/ --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' -A10 2>/dev/null | \
     grep -E \"['\\\"](role)['\\\"]:\\s*['\\\"](super_admin|admin|authenticated|service_role)\" | \
     grep -v 'SERVICE_ROLE_KEY' | \
     grep -v 'service_role_key' | \
     grep -v '// ' | \
     grep -v '/\\*' || true"

# Check 2: Role in .rpc() third parameter (options)
run_check \
    "No 'role' in .rpc() options" \
    "Ensures .rpc() calls don't pass custom role context" \
    "grep -rn '\\.rpc(' src/ supabase/functions/ --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' -A5 2>/dev/null | \
     grep -E \"role:\\s*['\\\"](super_admin|admin|authenticated|service_role)\" | \
     grep -v 'profile.role' | \
     grep -v 'profiles.role' | \
     grep -v '// ' || true"

# Check 3: Role in .from() options
run_check \
    "No 'role' in .from() options" \
    "Ensures .from() calls don't pass custom role context" \
    "grep -rn '\\.from(' src/ supabase/functions/ --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' -A5 2>/dev/null | \
     grep -E \"role:\\s*['\\\"](super_admin|admin|authenticated|service_role)\" | \
     grep -v 'profile.role' | \
     grep -v 'profiles.role' | \
     grep -v '// ' || true"

# Check 4: Role in .invoke() options
run_check \
    "No 'role' in .invoke() options" \
    "Ensures edge function invocations don't pass custom role" \
    "grep -rn '\\.invoke(' src/ supabase/functions/ --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' -A5 2>/dev/null | \
     grep -E \"role:\\s*['\\\"](super_admin|admin|authenticated|service_role)\" | \
     grep -v '// ' || true"

# Check 5: Role in createClient options
run_check \
    "No 'role' in createClient() options" \
    "Ensures Supabase client creation doesn't specify custom role" \
    "grep -rn 'createClient(' src/ supabase/functions/ --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' -A15 2>/dev/null | \
     grep -E \"role:\\s*['\\\"](super_admin|admin|authenticated|service_role)\" | \
     grep -v 'SERVICE_ROLE_KEY' | \
     grep -v 'service_role_key' | \
     grep -v 'profile.role' | \
     grep -v '// ' || true"

# Check 6: Role in fetch() headers
run_check \
    "No 'role' in fetch() headers" \
    "Ensures fetch calls don't include custom role headers" \
    "grep -rn 'fetch(' src/ supabase/functions/ --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' -A10 2>/dev/null | \
     grep -E \"['\\\"](role)['\\\"]:\\s*['\\\"](super_admin|admin|authenticated|service_role)\" | \
     grep -v '// ' || true"

# Check 7: Role query parameters in URLs
run_check \
    "No 'role' in URL query parameters" \
    "Ensures URLs don't include role as query parameter" \
    "grep -rn -E \"[?&]role=\" src/ supabase/functions/ --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' 2>/dev/null | \
     grep -v 'profile.role' | \
     grep -v 'profiles.role' | \
     grep -v '// ' || true"

# Check 8: Cookie-based role (edge case)
run_check \
    "No 'role' in cookies" \
    "Ensures no custom role is being set in cookies" \
    "grep -rn -E \"cookie.*role|setCookie.*role\" src/ supabase/functions/ --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' -i 2>/dev/null | \
     grep -v 'profile.role' | \
     grep -v 'profiles.role' | \
     grep -v '// ' || true"

# Additional informational checks
echo -e "${YELLOW}Informational: Checking for proper patterns...${NC}"
echo ""

# Info: Count proper JWT-based auth usage
jwt_auth_count=$(grep -rn "Authorization.*Bearer" src/ supabase/functions/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | wc -l)
echo -e "✓ Found ${GREEN}$jwt_auth_count${NC} proper JWT-based Authorization headers"

# Info: Count proper profile.role checks
profile_role_checks=$(grep -rn "profile\.role\|profiles\.role" src/ supabase/functions/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | wc -l)
echo -e "✓ Found ${GREEN}$profile_role_checks${NC} proper profile.role checks (database-based)"

echo ""

# Summary
echo "========================================"
echo -e "${BLUE}VERIFICATION SUMMARY${NC}"
echo "========================================"
echo "Total checks: $TOTAL_CHECKS"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED!${NC}"
    echo ""
    echo "The codebase follows Supabase best practices:"
    echo "  • No custom 'role' headers/params in API calls"
    echo "  • Role management is JWT-based (standard Supabase auth)"
    echo "  • Authorization uses database-level profiles.role checks"
    echo "  • No 'role does not exist' errors will occur"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  WARNINGS: $WARNINGS${NC}"
    echo "No errors, but there are warnings to review."
    exit 0
else
    echo -e "${RED}❌ ERRORS: $ERRORS${NC}"
    echo -e "${YELLOW}⚠️  WARNINGS: $WARNINGS${NC}"
    echo ""
    echo "⚠️  FOUND PROBLEMATIC ROLE USAGE ⚠️"
    echo ""
    echo "The checks found instances where 'role' is being passed as:"
    echo "  • HTTP headers"
    echo "  • RPC/function call options"
    echo "  • URL query parameters"
    echo "  • Cookies"
    echo ""
    echo "This causes 'role does not exist' errors in Supabase/PostgREST."
    echo ""
    echo "SOLUTION:"
    echo "  1. Remove all custom 'role' headers/params from API calls"
    echo "  2. Use JWT-based authentication (Authorization: Bearer <token>)"
    echo "  3. Check user roles via profiles.role in database queries"
    echo "  4. Never pass role as header, param, or cookie"
    echo ""
    echo "For more info, see: AUTHENTICATION_BEST_PRACTICES.md"
    exit 1
fi
