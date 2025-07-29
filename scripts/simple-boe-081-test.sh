#!/bin/bash

# Simplified BOE-081 Test Script
# This script creates a basic BOE scenario for testing

set -e

echo "🚀 Starting Simplified BOE-081 Test Scenario"
echo "=========================================="

# Configuration
BASE_URL="http://localhost:4000/api"
PROGRAM_NAME="BOE-081-Simple-Test"
PROGRAM_CODE="BOE081S"
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

# Helper function to extract ID from JSON response
extract_id() {
    local response="$1"
    if command -v jq &> /dev/null; then
        echo "$response" | jq -r '.id'
    else
        echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4
    fi
}

# Helper function to check if ID is valid
is_valid_id() {
    local id="$1"
    if [ -z "$id" ] || [ "$id" = "null" ] || [ "$id" = "undefined" ]; then
        return 1
    fi
    return 0
}

# Step 1: Create or find Program
print_status "Step 1: Creating test program..."

# Check if program already exists
PROGRAMS_RESPONSE=$(curl -s --max-time 10 "$BASE_URL/programs")
if echo "$PROGRAMS_RESPONSE" | jq -e ".[] | select(.code == \"$PROGRAM_CODE\")" > /dev/null 2>&1; then
    print_warning "Program with code $PROGRAM_CODE already exists"
    PROGRAM_ID=$(echo "$PROGRAMS_RESPONSE" | jq -r ".[] | select(.code == \"$PROGRAM_CODE\") | .id" | head -1)
    print_success "Using existing program with ID: $PROGRAM_ID"
else
    print_status "Creating new program..."
    PROGRAM_RESPONSE=$(curl -s --max-time 10 -X POST \
        -H "Content-Type: application/json" \
        -d "{
            \"code\": \"$PROGRAM_CODE\",
            \"name\": \"$PROGRAM_NAME\",
            \"description\": \"Simple test program for BOE-081\",
            \"status\": \"active\",
            \"startDate\": \"2025-01-01\",
            \"endDate\": \"2025-12-31\",
            \"totalBudget\": 100000,
            \"type\": \"Period of Performance\",
            \"program_manager\": \"Test Manager\"
        }" \
        "$BASE_URL/programs")

    echo "Program Response: $PROGRAM_RESPONSE"
    PROGRAM_ID=$(extract_id "$PROGRAM_RESPONSE")

    if ! is_valid_id "$PROGRAM_ID"; then
        echo "Failed to create program or extract ID"
        echo "Response: $PROGRAM_RESPONSE"
        exit 1
    fi

    print_success "Created program with ID: $PROGRAM_ID"
fi

# Step 2: Create or find Vendor
print_status "Step 2: Creating vendor..."

# Check if vendor already exists
VENDORS_RESPONSE=$(curl -s --max-time 10 "$BASE_URL/vendors")
if echo "$VENDORS_RESPONSE" | jq -e ".vendors[] | select(.name == \"$VENDOR_NAME\")" > /dev/null 2>&1; then
    print_warning "Vendor with name $VENDOR_NAME already exists"
    VENDOR_ID=$(echo "$VENDORS_RESPONSE" | jq -r ".vendors[] | select(.name == \"$VENDOR_NAME\") | .id" | head -1)
    print_success "Using existing vendor with ID: $VENDOR_ID"
else
    print_status "Creating new vendor..."
    VENDOR_RESPONSE=$(curl -s --max-time 10 -X POST \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"$VENDOR_NAME\",
            \"isActive\": true
        }" \
        "$BASE_URL/vendors")

    echo "Vendor Response: $VENDOR_RESPONSE"
    VENDOR_ID=$(extract_id "$VENDOR_RESPONSE")

    if ! is_valid_id "$VENDOR_ID"; then
        print_warning "Failed to create vendor, will use existing vendor"
        VENDOR_ID=$(echo "$VENDORS_RESPONSE" | jq -r '.vendors[0].id' 2>/dev/null)
    else
        print_success "Created vendor with ID: $VENDOR_ID"
    fi
fi

print_success "Using vendor with ID: $VENDOR_ID"

# Step 3: Create or find Cost Category
print_status "Step 3: Creating cost category..."

# Check if cost category already exists
CATEGORIES_RESPONSE=$(curl -s --max-time 10 "$BASE_URL/cost-categories")
if echo "$CATEGORIES_RESPONSE" | jq -e ".[] | select(.code == \"DEV\")" > /dev/null 2>&1; then
    print_warning "Cost category with code DEV already exists"
    CATEGORY_ID=$(echo "$CATEGORIES_RESPONSE" | jq -r ".[] | select(.code == \"DEV\") | .id" | head -1)
    print_success "Using existing cost category with ID: $CATEGORY_ID"
else
    print_status "Creating new cost category..."
    CATEGORY_RESPONSE=$(curl -s --max-time 10 -X POST \
        -H "Content-Type: application/json" \
        -d "{
            \"code\": \"DEV\",
            \"name\": \"$CATEGORY_NAME\",
            \"description\": \"Development cost category\",
            \"isActive\": true
        }" \
        "$BASE_URL/cost-categories")

    echo "Category Response: $CATEGORY_RESPONSE"
    CATEGORY_ID=$(extract_id "$CATEGORY_RESPONSE")

    if ! is_valid_id "$CATEGORY_ID"; then
        print_warning "Failed to create category, will use existing category"
        CATEGORY_ID=$(echo "$CATEGORIES_RESPONSE" | jq -r '.[0].id' 2>/dev/null)
    else
        print_success "Created cost category with ID: $CATEGORY_ID"
    fi
fi

print_success "Using cost category with ID: $CATEGORY_ID"

print_success "✅ Simplified BOE-081 test completed successfully!"
print_success "Program ID: $PROGRAM_ID"
print_success "Vendor ID: $VENDOR_ID"
print_success "Category ID: $CATEGORY_ID"
print_success "Ready for manual BOE creation and testing!" 