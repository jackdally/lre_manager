#!/bin/bash

# Step-by-step test script to identify hanging issues

set -e

echo "🚀 Starting Step-by-Step Test"
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

# Step 0: Cleanup (simplified)
print_status "Step 0: Checking for existing program..."
PROGRAMS_RESPONSE=$(curl -s --max-time 10 "$BASE_URL/programs")
print_success "Fetched programs"

if echo "$PROGRAMS_RESPONSE" | jq -e ".[] | select(.code == \"$PROGRAM_CODE\")" > /dev/null 2>&1; then
    print_warning "Program $PROGRAM_CODE exists, skipping creation"
    PROGRAM_ID=$(echo "$PROGRAMS_RESPONSE" | jq -r ".[] | select(.code == \"$PROGRAM_CODE\") | .id" | head -1)
    print_success "Using existing program: $PROGRAM_ID"
else
    print_status "Step 1: Creating program..."
    PROGRAM_RESPONSE=$(curl -s --max-time 10 -X POST \
        -H "Content-Type: application/json" \
        -d "{
            \"code\": \"$PROGRAM_CODE\",
            \"name\": \"$PROGRAM_NAME\",
            \"description\": \"Complete test program for BOE-081 with allocations\",
            \"status\": \"active\",
            \"startDate\": \"2025-01-01\",
            \"endDate\": \"2025-12-31\",
            \"totalBudget\": 200000,
            \"type\": \"Period of Performance\",
            \"program_manager\": \"Test Manager\"
        }" \
        "$BASE_URL/programs")
    
    print_success "Program creation completed"
    PROGRAM_ID=$(echo "$PROGRAM_RESPONSE" | jq -r '.id')
    print_success "Created program: $PROGRAM_ID"
fi

# Step 2: Vendor (simplified)
print_status "Step 2: Checking for existing vendor..."
VENDORS_RESPONSE=$(curl -s --max-time 10 "$BASE_URL/vendors")
print_success "Fetched vendors"

if echo "$VENDORS_RESPONSE" | jq -e ".vendors[] | select(.name == \"$VENDOR_NAME\")" > /dev/null 2>&1; then
    print_warning "Vendor $VENDOR_NAME exists, skipping creation"
    VENDOR_ID=$(echo "$VENDORS_RESPONSE" | jq -r ".vendors[] | select(.name == \"$VENDOR_NAME\") | .id" | head -1)
    print_success "Using existing vendor: $VENDOR_ID"
else
    print_status "Creating vendor..."
    VENDOR_RESPONSE=$(curl -s --max-time 10 -X POST \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"$VENDOR_NAME\",
            \"isActive\": true
        }" \
        "$BASE_URL/vendors")
    
    print_success "Vendor creation completed"
    VENDOR_ID=$(echo "$VENDOR_RESPONSE" | jq -r '.id')
    print_success "Created vendor: $VENDOR_ID"
fi

# Step 3: Cost Category (simplified)
print_status "Step 3: Checking for existing cost category..."
CATEGORIES_RESPONSE=$(curl -s --max-time 10 "$BASE_URL/cost-categories")
print_success "Fetched cost categories"

if echo "$CATEGORIES_RESPONSE" | jq -e ".[] | select(.code == \"DEV\")" > /dev/null 2>&1; then
    print_warning "Cost category DEV exists, skipping creation"
    CATEGORY_ID=$(echo "$CATEGORIES_RESPONSE" | jq -r ".[] | select(.code == \"DEV\") | .id" | head -1)
    print_success "Using existing cost category: $CATEGORY_ID"
else
    print_status "Creating cost category..."
    CATEGORY_RESPONSE=$(curl -s --max-time 10 -X POST \
        -H "Content-Type: application/json" \
        -d "{
            \"code\": \"DEV\",
            \"name\": \"$CATEGORY_NAME\",
            \"description\": \"Development cost category\",
            \"isActive\": true
        }" \
        "$BASE_URL/cost-categories")
    
    print_success "Cost category creation completed"
    CATEGORY_ID=$(echo "$CATEGORY_RESPONSE" | jq -r '.id')
    print_success "Created cost category: $CATEGORY_ID"
fi

print_success "Step-by-step test completed successfully!"
print_success "Program ID: $PROGRAM_ID"
print_success "Vendor ID: $VENDOR_ID"
print_success "Category ID: $CATEGORY_ID" 