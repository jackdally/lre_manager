#!/bin/bash

# Minimal test script to debug hanging issues

set -e

echo "🚀 Starting Debug Test Script"
echo "=========================================="

# Configuration
BASE_URL="http://localhost:4000/api"
PROGRAM_NAME="BOE-081-Complete-Test"
PROGRAM_CODE="BOE081C"
VENDOR_NAME="TechCorp Solutions"
CATEGORY_NAME="Development"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Test 1: Check if backend is responding
print_status "Test 1: Checking backend connectivity..."
if curl -s --max-time 10 "$BASE_URL/programs" > /dev/null; then
    print_success "Backend is responding"
else
    print_warning "Backend is not responding"
    exit 1
fi

# Test 2: Check if jq is working
print_status "Test 2: Checking jq functionality..."
if command -v jq &> /dev/null; then
    print_success "jq is available"
    echo '{"test": "value"}' | jq -r '.test' > /dev/null && print_success "jq is working"
else
    print_warning "jq is not available"
fi

# Test 3: Test vendor API
print_status "Test 3: Testing vendor API..."
VENDORS_RESPONSE=$(curl -s --max-time 10 "$BASE_URL/vendors")
if [ $? -eq 0 ]; then
    print_success "Vendor API is responding"
    echo "Response length: ${#VENDORS_RESPONSE} characters"
else
    print_warning "Vendor API failed"
fi

# Test 4: Test jq with vendor response
print_status "Test 4: Testing jq with vendor response..."
if [ -n "$VENDORS_RESPONSE" ]; then
    if echo "$VENDORS_RESPONSE" | jq -e '.vendors' > /dev/null 2>&1; then
        print_success "jq can parse vendor response"
        VENDOR_COUNT=$(echo "$VENDORS_RESPONSE" | jq '.vendors | length')
        print_success "Found $VENDOR_COUNT vendors"
    else
        print_warning "jq cannot parse vendor response"
    fi
fi

# Test 5: Test vendor creation
print_status "Test 5: Testing vendor creation..."
VENDOR_RESPONSE=$(curl -s --max-time 10 -X POST \
    -H "Content-Type: application/json" \
    -d '{"name":"Debug Test Vendor","isActive":true}' \
    "$BASE_URL/vendors")

if [ $? -eq 0 ]; then
    print_success "Vendor creation API call completed"
    echo "Response: $VENDOR_RESPONSE"
else
    print_warning "Vendor creation API call failed"
fi

print_success "Debug test completed successfully!" 