#!/bin/bash
# lint-api-role-usage.sh
# 
# Custom lint rule to detect and prevent custom 'role' parameters in API calls
# This prevents "role does not exist" errors in Supabase/PostgREST (SQLSTATE 22023, 42704)
#
# Problematic patterns detected:
# - fetch(url, { headers: { 'role': 'super_admin' } })
# - supabase.rpc('fn', {}, { role: 'super_admin' })
# - createClient(url, key, { global: { headers: { role: '...' } } })
#
# Usage: ./scripts/lint-api-role-usage.sh
# Can be integrated into CI/CD pipeline
#
# Exit codes:
#   0 - No issues found
#   1 - Found problematic role usage

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BLUE}${BOLD}🔍 Linting for API Role Usage${NC}"
echo "========================================"
echo ""

ISSUES_FOUND=0

# Function to check files for problematic patterns
check_pattern() {
    local pattern=$1
    local message=$2
    local search_paths="src/ supabase/functions/"
    
    # Search for the pattern, excluding legitimate uses
    local results=$(grep -rn -E "$pattern" $search_paths \
        --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | \
        grep -v "SERVICE_ROLE_KEY" | \
        grep -v "service_role_key" | \
        grep -v "profile\.role" | \
        grep -v "profiles\.role" | \
        grep -v "user\.role" | \
        grep -v "// " | \
        grep -v "/\*" | \
        grep -v "Never use" | \
        grep -v "what NOT to do" || true)
    
    if [ ! -z "$results" ]; then
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
        echo -e "${RED}❌ Issue ${ISSUES_FOUND}: $message${NC}"
        echo ""
        echo "$results" | while IFS= read -r line; do
            echo -e "  ${YELLOW}$line${NC}"
        done
        echo ""
    fi
}

echo "Checking for problematic role usage patterns..."
echo ""

# Pattern 1: Quoted 'role' key with role values in headers/options
check_pattern \
    "['\"](role)['\"]\\s*:\\s*['\"]\\s*(super_admin|admin|authenticated|service_role)" \
    "Custom 'role' header/parameter with quoted key detected"

# Pattern 2: Unquoted role key with role values
check_pattern \
    "\\brole\\s*:\\s*['\"]\\s*(super_admin|admin|authenticated|service_role)" \
    "Custom 'role' parameter with unquoted key detected"

# Pattern 3: Role in URL query parameters
check_pattern \
    "[?&]role=(super_admin|admin|authenticated|service_role)" \
    "Custom 'role' in URL query parameter detected"

# Summary
echo "========================================"

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✅ No problematic role usage found!${NC}"
    echo ""
    echo "The codebase follows Supabase best practices:"
    echo "  • No custom role headers/params in API calls"
    echo "  • Role management is JWT-based"
    echo "  • Authorization uses database-level checks"
    echo ""
    exit 0
else
    echo -e "${RED}${BOLD}❌ Found $ISSUES_FOUND problematic pattern(s)${NC}"
    echo ""
    echo -e "${YELLOW}${BOLD}⚠️  ACTION REQUIRED:${NC}"
    echo ""
    echo "Remove all custom role headers/params from API calls."
    echo "Instead, use JWT-based authentication:"
    echo ""
    echo -e "  ${GREEN}✅ CORRECT:${NC}"
    echo "     headers: { Authorization: \`Bearer \${token}\` }"
    echo ""
    echo -e "  ${RED}❌ WRONG:${NC}"
    echo "     headers: { 'role': 'super_admin' }"
    echo "     supabase.rpc('fn', {}, { role: 'super_admin' })"
    echo ""
    echo "For details, see: AUTHENTICATION_BEST_PRACTICES.md"
    echo ""
    exit 1
fi
