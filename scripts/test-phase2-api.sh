#!/bin/bash

# Phase 2 API Testing Script
# This script tests the BOE system API endpoints

echo "=== Phase 2 BOE System API Testing ==="
echo "Testing backend at: http://localhost:4000"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="$3"
    
    echo -n "Testing $name... "
    
    # Make request and capture status code
    response=$(curl -s -w "%{http_code}" "$url" -o /tmp/response.json)
    status_code="${response: -3}"
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}PASS${NC} (Status: $status_code)"
        ((PASSED++))
    else
        echo -e "${RED}FAIL${NC} (Expected: $expected_status, Got: $status_code)"
        echo "Response: $(cat /tmp/response.json)"
        ((FAILED++))
    fi
}

# Test basic connectivity
echo "1. Testing Basic Connectivity"
test_endpoint "Backend Health" "http://localhost:4000/api/programs" "200"

# Test BOE-related endpoints
echo ""
echo "2. Testing BOE System Endpoints"

# Get a program ID for testing
PROGRAM_ID=$(curl -s http://localhost:4000/api/programs | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 2>/dev/null)

if [ -n "$PROGRAM_ID" ]; then
    echo "Using program ID: $PROGRAM_ID"
    
    # Test BOE endpoint
    test_endpoint "BOE" "http://localhost:4000/api/programs/$PROGRAM_ID/boe" "200"
    
    # Test BOE templates endpoint
    test_endpoint "BOE Templates" "http://localhost:4000/api/boe-templates" "200"
    
    # Test WBS templates endpoint (via settings)
    test_endpoint "WBS Templates" "http://localhost:4000/api/settings/wbs-templates" "200"
    
    # Test time allocations endpoint (new feature)
    test_endpoint "Time Allocations" "http://localhost:4000/api/programs/$PROGRAM_ID/time-allocations" "200"
    
else
    echo -e "${YELLOW}Warning: No program ID found, skipping program-specific tests${NC}"
fi

# Test other related endpoints
echo ""
echo "3. Testing Related System Endpoints"

test_endpoint "Cost Categories" "http://localhost:4000/api/cost-categories" "200"
test_endpoint "Vendors" "http://localhost:4000/api/vendors" "200"
test_endpoint "Currencies" "http://localhost:4000/api/currencies" "200"
test_endpoint "Fiscal Years" "http://localhost:4000/api/fiscal-years" "200"

# Test error handling
echo ""
echo "4. Testing Error Handling"

test_endpoint "Invalid Program ID" "http://localhost:4000/api/programs/invalid-uuid/boe" "400"
test_endpoint "Non-existent Program" "http://localhost:4000/api/programs/11111111-1111-1111-8111-111111111111/boe" "404"

# Summary
echo ""
echo "=== Test Summary ==="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: $((PASSED + FAILED))"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed! Phase 2 API is working correctly.${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please check the API endpoints.${NC}"
    exit 1
fi 