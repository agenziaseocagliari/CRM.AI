#!/bin/bash

# =====================================================
# Super Admin Security Test Script
# =====================================================
# Tests authentication, authorization, and audit logging
# for Super Admin edge functions
#
# Usage: ./scripts/test-superadmin.sh
#
# Prerequisites:
# - SUPABASE_URL environment variable set
# - SUPABASE_ANON_KEY environment variable set
# - SUPER_ADMIN_JWT environment variable set (JWT token of super admin user)
# - NORMAL_USER_JWT environment variable set (JWT token of normal user)
# =====================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}=== Checking Prerequisites ===${NC}"
    
    if [ -z "$SUPABASE_URL" ]; then
        echo -e "${RED}❌ SUPABASE_URL not set${NC}"
        echo "Export it: export SUPABASE_URL='https://your-project.supabase.co'"
        exit 1
    fi
    
    if [ -z "$SUPABASE_ANON_KEY" ]; then
        echo -e "${RED}❌ SUPABASE_ANON_KEY not set${NC}"
        echo "Export it: export SUPABASE_ANON_KEY='your-anon-key'"
        exit 1
    fi
    
    if [ -z "$SUPER_ADMIN_JWT" ]; then
        echo -e "${YELLOW}⚠️  SUPER_ADMIN_JWT not set - skipping authorized tests${NC}"
    fi
    
    if [ -z "$NORMAL_USER_JWT" ]; then
        echo -e "${YELLOW}⚠️  NORMAL_USER_JWT not set - skipping unauthorized tests${NC}"
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}\n"
}

# Test function without authentication
test_no_auth() {
    echo -e "${BLUE}=== Test 1: No Authentication (should fail 403) ===${NC}"
    
    response=$(curl -s -w "\n%{http_code}" \
        -X POST "$SUPABASE_URL/functions/v1/superadmin-dashboard-stats" \
        -H "apikey: $SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json" \
        -d '{}')
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" == "403" ] || [ "$http_code" == "401" ]; then
        echo -e "${GREEN}✅ Correctly rejected: HTTP $http_code${NC}"
        echo "Response: $body"
    else
        echo -e "${RED}❌ SECURITY ISSUE: Accepted without auth (HTTP $http_code)${NC}"
        echo "Response: $body"
    fi
    echo ""
}

# Test function with normal user JWT
test_normal_user() {
    if [ -z "$NORMAL_USER_JWT" ]; then
        echo -e "${YELLOW}⚠️  Skipping normal user test (NORMAL_USER_JWT not set)${NC}\n"
        return
    fi
    
    echo -e "${BLUE}=== Test 2: Normal User Authentication (should fail 403) ===${NC}"
    
    response=$(curl -s -w "\n%{http_code}" \
        -X POST "$SUPABASE_URL/functions/v1/superadmin-dashboard-stats" \
        -H "Authorization: Bearer $NORMAL_USER_JWT" \
        -H "apikey: $SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json" \
        -d '{}')
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" == "403" ]; then
        echo -e "${GREEN}✅ Correctly rejected normal user: HTTP $http_code${NC}"
        echo "Response: $body"
    else
        echo -e "${RED}❌ SECURITY ISSUE: Normal user got access (HTTP $http_code)${NC}"
        echo "Response: $body"
    fi
    echo ""
}

# Test function with super admin JWT
test_super_admin() {
    if [ -z "$SUPER_ADMIN_JWT" ]; then
        echo -e "${YELLOW}⚠️  Skipping super admin test (SUPER_ADMIN_JWT not set)${NC}\n"
        return
    fi
    
    echo -e "${BLUE}=== Test 3: Super Admin Authentication (should succeed 200) ===${NC}"
    
    response=$(curl -s -w "\n%{http_code}" \
        -X POST "$SUPABASE_URL/functions/v1/superadmin-dashboard-stats" \
        -H "Authorization: Bearer $SUPER_ADMIN_JWT" \
        -H "apikey: $SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json" \
        -d '{}')
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" == "200" ]; then
        echo -e "${GREEN}✅ Super admin access granted: HTTP $http_code${NC}"
        echo "Response preview: $(echo "$body" | head -c 200)..."
    else
        echo -e "${RED}❌ Super admin access denied (HTTP $http_code)${NC}"
        echo "Response: $body"
        echo "Possible issues:"
        echo "- User doesn't have role='super_admin' in profiles table"
        echo "- JWT token expired or invalid"
        echo "- Edge function not deployed correctly"
    fi
    echo ""
}

# Test list users endpoint
test_list_users() {
    if [ -z "$SUPER_ADMIN_JWT" ]; then
        echo -e "${YELLOW}⚠️  Skipping list users test${NC}\n"
        return
    fi
    
    echo -e "${BLUE}=== Test 4: List Users Endpoint ===${NC}"
    
    response=$(curl -s -w "\n%{http_code}" \
        -X POST "$SUPABASE_URL/functions/v1/superadmin-list-users" \
        -H "Authorization: Bearer $SUPER_ADMIN_JWT" \
        -H "apikey: $SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json" \
        -d '{"limit": 5}')
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" == "200" ]; then
        echo -e "${GREEN}✅ List users successful: HTTP $http_code${NC}"
        echo "Response preview: $(echo "$body" | head -c 200)..."
    else
        echo -e "${RED}❌ List users failed (HTTP $http_code)${NC}"
        echo "Response: $body"
    fi
    echo ""
}

# Test list organizations endpoint
test_list_organizations() {
    if [ -z "$SUPER_ADMIN_JWT" ]; then
        echo -e "${YELLOW}⚠️  Skipping list organizations test${NC}\n"
        return
    fi
    
    echo -e "${BLUE}=== Test 5: List Organizations Endpoint ===${NC}"
    
    response=$(curl -s -w "\n%{http_code}" \
        -X POST "$SUPABASE_URL/functions/v1/superadmin-list-organizations" \
        -H "Authorization: Bearer $SUPER_ADMIN_JWT" \
        -H "apikey: $SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json" \
        -d '{"limit": 5}')
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" == "200" ]; then
        echo -e "${GREEN}✅ List organizations successful: HTTP $http_code${NC}"
        echo "Response preview: $(echo "$body" | head -c 200)..."
    else
        echo -e "${RED}❌ List organizations failed (HTTP $http_code)${NC}"
        echo "Response: $body"
    fi
    echo ""
}

# Test audit logs endpoint
test_audit_logs() {
    if [ -z "$SUPER_ADMIN_JWT" ]; then
        echo -e "${YELLOW}⚠️  Skipping audit logs test${NC}\n"
        return
    fi
    
    echo -e "${BLUE}=== Test 6: Audit Logs Endpoint ===${NC}"
    
    response=$(curl -s -w "\n%{http_code}" \
        -X POST "$SUPABASE_URL/functions/v1/superadmin-logs" \
        -H "Authorization: Bearer $SUPER_ADMIN_JWT" \
        -H "apikey: $SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json" \
        -d '{"limit": 10}')
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" == "200" ]; then
        echo -e "${GREEN}✅ Audit logs retrieval successful: HTTP $http_code${NC}"
        echo "Response preview: $(echo "$body" | head -c 200)..."
        
        # Check if logs contain entries from previous tests
        if echo "$body" | grep -q "dashboard"; then
            echo -e "${GREEN}✅ Audit logging working - found recent dashboard access${NC}"
        else
            echo -e "${YELLOW}⚠️  No dashboard logs found - may be first run${NC}"
        fi
    else
        echo -e "${RED}❌ Audit logs failed (HTTP $http_code)${NC}"
        echo "Response: $body"
    fi
    echo ""
}

# Test all endpoints are deployed
test_all_endpoints_deployed() {
    echo -e "${BLUE}=== Test 7: All Super Admin Endpoints Deployed ===${NC}"
    
    endpoints=(
        "superadmin-dashboard-stats"
        "superadmin-list-users"
        "superadmin-update-user"
        "superadmin-list-organizations"
        "superadmin-update-organization"
        "superadmin-manage-payments"
        "superadmin-create-org"
        "superadmin-logs"
    )
    
    deployed=0
    not_deployed=0
    
    for endpoint in "${endpoints[@]}"; do
        response=$(curl -s -w "\n%{http_code}" \
            -X POST "$SUPABASE_URL/functions/v1/$endpoint" \
            -H "apikey: $SUPABASE_ANON_KEY" \
            -H "Content-Type: application/json" \
            -d '{}' 2>/dev/null || echo "000")
        
        http_code=$(echo "$response" | tail -n 1)
        
        # Any response other than 000 (connection failed) means it's deployed
        if [ "$http_code" != "000" ] && [ ! -z "$http_code" ]; then
            echo -e "${GREEN}✅ $endpoint (HTTP $http_code)${NC}"
            ((deployed++))
        else
            echo -e "${RED}❌ $endpoint (NOT DEPLOYED)${NC}"
            ((not_deployed++))
        fi
    done
    
    echo ""
    echo "Deployed: $deployed / ${#endpoints[@]}"
    
    if [ $not_deployed -eq 0 ]; then
        echo -e "${GREEN}✅ All Super Admin endpoints deployed${NC}"
    else
        echo -e "${RED}❌ $not_deployed endpoints not deployed${NC}"
    fi
    echo ""
}

# Print summary
print_summary() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}    SUPER ADMIN SECURITY TEST SUMMARY${NC}"
    echo -e "${BLUE}========================================${NC}\n"
    
    echo "Tests completed. Review results above."
    echo ""
    echo "Next steps:"
    echo "1. If tests failed, check edge function logs in Supabase Dashboard"
    echo "2. Verify super admin user has role='super_admin' in profiles table"
    echo "3. Check SUPER_ADMIN_IMPLEMENTATION.md for troubleshooting"
    echo ""
    echo "To set up a super admin user:"
    echo "  UPDATE profiles SET role = 'super_admin' WHERE email = 'your@email.com';"
    echo ""
}

# Main execution
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}    SUPER ADMIN SECURITY TEST SUITE${NC}"
    echo -e "${BLUE}========================================${NC}\n"
    
    check_prerequisites
    test_all_endpoints_deployed
    test_no_auth
    test_normal_user
    test_super_admin
    test_list_users
    test_list_organizations
    test_audit_logs
    print_summary
}

# Run main
main
