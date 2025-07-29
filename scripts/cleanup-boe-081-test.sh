#!/bin/bash

# Cleanup script for BOE-081 test data
# This script removes existing test data to allow fresh creation

set -e

echo "🧹 Starting BOE-081 Test Data Cleanup"
echo "====================================="

# Configuration
BASE_URL="http://localhost:4000/api"
PROGRAM_CODE="BOE.0810"
VENDOR_NAME="TechCorp Solutions"

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

# Step 1: Find and delete program
print_status "Step 1: Looking for existing program with code: $PROGRAM_CODE"

PROGRAMS_RESPONSE=$(curl -s "$BASE_URL/programs")
if echo "$PROGRAMS_RESPONSE" | jq -e ".[] | select(.code == \"$PROGRAM_CODE\")" > /dev/null 2>&1; then
    PROGRAM_ID=$(echo "$PROGRAMS_RESPONSE" | jq -r ".[] | select(.code == \"$PROGRAM_CODE\") | .id" | head -1)
    PROGRAM_NAME=$(echo "$PROGRAMS_RESPONSE" | jq -r ".[] | select(.code == \"$PROGRAM_CODE\") | .name" | head -1)
    
    print_warning "Found existing program: $PROGRAM_NAME (ID: $PROGRAM_ID)"
    
    # Use the comprehensive deletion service
    print_status "Deleting program using comprehensive deletion service..."
    DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/programs/$PROGRAM_ID")
    print_success "Successfully deleted program and all related data"
    echo "Deletion details: $DELETE_RESPONSE"
else
    print_success "No existing program with code $PROGRAM_CODE found"
fi

# Step 2: Find and delete vendor
print_status "Step 2: Looking for existing vendor with name: $VENDOR_NAME"

VENDORS_RESPONSE=$(curl -s "$BASE_URL/vendors")
if echo "$VENDORS_RESPONSE" | jq -e ".vendors[] | select(.name == \"$VENDOR_NAME\")" > /dev/null 2>&1; then
    VENDOR_ID=$(echo "$VENDORS_RESPONSE" | jq -r ".vendors[] | select(.name == \"$VENDOR_NAME\") | .id" | head -1)
    
    print_warning "Found existing vendor: $VENDOR_NAME (ID: $VENDOR_ID)"
    
    print_status "Deleting vendor..."
    DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/vendors/$VENDOR_ID")
    print_success "Successfully deleted vendor"
else
    print_success "No existing vendor with name $VENDOR_NAME found"
fi

# Step 3: Find and delete cost category
print_status "Step 3: Looking for existing cost category with code: DEV"

CATEGORIES_RESPONSE=$(curl -s "$BASE_URL/cost-categories")
if echo "$CATEGORIES_RESPONSE" | jq -e ".[] | select(.code == \"DEV\")" > /dev/null 2>&1; then
    CATEGORY_ID=$(echo "$CATEGORIES_RESPONSE" | jq -r ".[] | select(.code == \"DEV\") | .id" | head -1)
    
    print_warning "Found existing cost category: DEV (ID: $CATEGORY_ID)"
    
    print_status "Deleting cost category..."
    DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/cost-categories/$CATEGORY_ID")
    print_success "Successfully deleted cost category"
else
    print_success "No existing cost category with code DEV found"
fi

print_success "✅ BOE-081 test data cleanup completed successfully!"
print_success "Ready to run the complete test script again!" 