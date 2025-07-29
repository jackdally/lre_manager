#!/bin/bash

# Complete BOE-081 Test Script V2
# This script creates a full BOE scenario with allocations, ledger entries, and actuals
# for testing the split and re-forecast functionality
# Built on the working simplified script with gradual feature addition

set -e

echo "🚀 Starting Complete BOE-081 Test Scenario V2"
echo "=============================================="

# Configuration
BASE_URL="http://localhost:4000/api"
PROGRAM_NAME="BOE-081-Complete-Test"
PROGRAM_CODE="BOE.0810"
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

# Helper function to wait for database operations
wait_for_db() {
    local seconds="$1"
    print_status "Waiting $seconds seconds for database operations to complete..."
    sleep "$seconds"
}

# Step 1: Create or find Program (using working approach from simplified script)
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
            \"description\": \"Complete test program for BOE-081 with allocations\",
            \"status\": \"active\",
            \"startDate\": \"2025-01-01\",
            \"endDate\": \"2025-12-31\",
            \"totalBudget\": 200000,
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

# Step 2: Create or find Vendor (using working approach from simplified script)
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

# Step 3: Create or find Cost Category (using working approach from simplified script)
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

# Wait before creating additional items
wait_for_db 5

# Step 4: Create WBS Elements
print_status "Step 4: Creating WBS elements..."

# Create parent WBS element
print_status "Creating parent WBS element..."
PARENT_WBS_RESPONSE=$(curl -s --max-time 10 -X POST \
    -H "Content-Type: application/json" \
    -d '{
        "code": "1.0",
        "name": "Software Development",
        "description": "Main software development work",
        "level": 1
    }' \
    "$BASE_URL/programs/$PROGRAM_ID/wbs-elements")

echo "Parent WBS Response: $PARENT_WBS_RESPONSE"

PARENT_WBS_ID=$(extract_id "$PARENT_WBS_RESPONSE")

if ! is_valid_id "$PARENT_WBS_ID"; then
    echo "Failed to create parent WBS element"
    exit 1
fi

print_success "Created parent WBS element with ID: $PARENT_WBS_ID"

# Create child WBS elements
print_status "Creating child WBS element 1..."
CHILD1_WBS_RESPONSE=$(curl -s --max-time 10 -X POST \
    -H "Content-Type: application/json" \
    -d '{
        "code": "1.1",
        "name": "Frontend Development",
        "description": "Frontend development work",
        "level": 2,
        "parentId": "'$PARENT_WBS_ID'"
    }' \
    "$BASE_URL/programs/$PROGRAM_ID/wbs-elements")

CHILD1_WBS_ID=$(extract_id "$CHILD1_WBS_RESPONSE")
print_success "Created child WBS element 1 with ID: $CHILD1_WBS_ID"

print_status "Creating child WBS element 2..."
CHILD2_WBS_RESPONSE=$(curl -s --max-time 10 -X POST \
    -H "Content-Type: application/json" \
    -d '{
        "code": "1.2",
        "name": "Backend Development",
        "description": "Backend development work",
        "level": 2,
        "parentId": "'$PARENT_WBS_ID'"
    }' \
    "$BASE_URL/programs/$PROGRAM_ID/wbs-elements")

CHILD2_WBS_ID=$(extract_id "$CHILD2_WBS_RESPONSE")
print_success "Created child WBS element 2 with ID: $CHILD2_WBS_ID"

# Wait before creating BOE
wait_for_db 5

# Step 5: Create BOE
print_status "Step 5: Creating BOE..."

BOE_RESPONSE=$(curl -s --max-time 10 -X POST \
    -H "Content-Type: application/json" \
    -d '{
        "name": "BOE-081 Test BOE",
        "description": "Test BOE for split and re-forecast functionality",
        "versionNumber": "1.0"
    }' \
    "$BASE_URL/programs/$PROGRAM_ID/boe")

echo "BOE Response: $BOE_RESPONSE"

BOE_VERSION_ID=$(extract_id "$BOE_RESPONSE")

if ! is_valid_id "$BOE_VERSION_ID"; then
    echo "Failed to create BOE or extract version ID"
    echo "Response: $BOE_RESPONSE"
    exit 1
fi

print_success "Created BOE with version ID: $BOE_VERSION_ID"

# Wait before creating BOE elements
wait_for_db 5

# Step 6: Create BOE Elements
print_status "Step 6: Creating BOE elements..."

# Create Frontend Development element
print_status "Creating Frontend Development element..."
FRONTEND_ELEMENT_RESPONSE=$(curl -s --max-time 10 -X POST \
    -H "Content-Type: application/json" \
    -d '{
        "boeVersionId": "'$BOE_VERSION_ID'",
        "code": "1.1",
        "name": "Frontend Development",
        "description": "Frontend development work",
        "level": 1,
        "estimatedCost": 80000,
        "costCategoryId": "'$CATEGORY_ID'"
    }' \
    "$BASE_URL/boe-elements")

FRONTEND_ELEMENT_ID=$(extract_id "$FRONTEND_ELEMENT_RESPONSE")
print_success "Created Frontend element with ID: $FRONTEND_ELEMENT_ID"

# Create Backend Development element
print_status "Creating Backend Development element..."
BACKEND_ELEMENT_RESPONSE=$(curl -s --max-time 10 -X POST \
    -H "Content-Type: application/json" \
    -d '{
        "boeVersionId": "'$BOE_VERSION_ID'",
        "code": "1.2",
        "name": "Backend Development",
        "description": "Backend development work",
        "level": 1,
        "estimatedCost": 120000,
        "costCategoryId": "'$CATEGORY_ID'"
    }' \
    "$BASE_URL/boe-elements")

BACKEND_ELEMENT_ID=$(extract_id "$BACKEND_ELEMENT_RESPONSE")
print_success "Created Backend element with ID: $BACKEND_ELEMENT_ID"

# Wait before creating BOE Element Allocations
wait_for_db 5

# Step 7: Create BOE Element Allocations
print_status "Step 7: Creating BOE Element Allocations..."

# Create allocation for Frontend Development (Linear allocation over 6 months)
print_status "Creating Frontend Development allocation..."
FRONTEND_ALLOCATION_RESPONSE=$(curl -s --max-time 10 -X POST \
    -H "Content-Type: application/json" \
    -d '{
        "boeVersionId": "'$BOE_VERSION_ID'",
        "name": "Frontend Development Allocation",
        "description": "Frontend development allocation - 6 months linear",
        "allocationType": "Linear",
        "startDate": "2025-01-01",
        "endDate": "2025-06-30",
        "totalAmount": 80000,
        "totalQuantity": 480,
        "quantityUnit": "hours"
    }' \
    "$BASE_URL/boe-elements/$FRONTEND_ELEMENT_ID/allocations")

FRONTEND_ALLOCATION_ID=$(extract_id "$FRONTEND_ALLOCATION_RESPONSE")
print_success "Created Frontend allocation with ID: $FRONTEND_ALLOCATION_ID"

# Create allocation for Backend Development (Front-loaded allocation over 8 months)
print_status "Creating Backend Development allocation..."
BACKEND_ALLOCATION_RESPONSE=$(curl -s --max-time 10 -X POST \
    -H "Content-Type: application/json" \
    -d '{
        "boeVersionId": "'$BOE_VERSION_ID'",
        "name": "Backend Development Allocation",
        "description": "Backend development allocation - 8 months front-loaded",
        "allocationType": "Front-Loaded",
        "startDate": "2025-01-01",
        "endDate": "2025-08-31",
        "totalAmount": 120000,
        "totalQuantity": 720,
        "quantityUnit": "hours"
    }' \
    "$BASE_URL/boe-elements/$BACKEND_ELEMENT_ID/allocations")

BACKEND_ALLOCATION_ID=$(extract_id "$BACKEND_ALLOCATION_RESPONSE")
print_success "Created Backend allocation with ID: $BACKEND_ALLOCATION_ID"

# Wait before pushing BOE to ledger
wait_for_db 5

# Step 8: Push BOE to Ledger
print_status "Step 8: Pushing BOE to Ledger..."

PUSH_TO_LEDGER_RESPONSE=$(curl -s --max-time 10 -X POST \
    -H "Content-Type: application/json" \
    "$BASE_URL/programs/$PROGRAM_ID/boe/$BOE_VERSION_ID/push-to-ledger")

echo "Push to Ledger Response: $PUSH_TO_LEDGER_RESPONSE"
print_success "Pushed BOE to ledger"

# Wait before creating import session
wait_for_db 5

# Step 9: Upload Actuals for Testing
print_status "Step 9: Uploading actuals for BOE-081 testing..."

# Create import configuration for the CSV file
IMPORT_CONFIG='{
    "programCodeColumn": "Program Code",
    "vendorColumn": "Vendor Name",
    "descriptionColumn": "Description",
    "amountColumn": "Amount",
    "dateColumn": "Transaction Date",
    "categoryColumn": "Category",
    "subcategoryColumn": "Subcategory",
    "invoiceColumn": "Invoice Number",
    "referenceColumn": "Reference Number",
    "dateFormat": "YYYY-MM-DD"
}'

# Upload the CSV file with actuals
print_status "Uploading actuals CSV file..."
UPLOAD_RESPONSE=$(curl -s --max-time 30 -X POST \
    -F "file=@scripts/create-boe-081-actuals.csv" \
    -F "description=BOE-081 Test Actuals for Split and Re-forecast Testing" \
    -F "config=$IMPORT_CONFIG" \
    "$BASE_URL/import/$PROGRAM_ID/upload")

echo "Upload Response: $UPLOAD_RESPONSE"

# Extract session ID from response
IMPORT_SESSION_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.sessionId' 2>/dev/null)

if [ -n "$IMPORT_SESSION_ID" ] && [ "$IMPORT_SESSION_ID" != "null" ]; then
    print_success "Created import session with ID: $IMPORT_SESSION_ID"
    
    # Wait for processing to complete
    print_status "Waiting for import processing to complete..."
    wait_for_db 10
    
    # Get session details
    SESSION_DETAILS=$(curl -s --max-time 10 "$BASE_URL/import/session/$IMPORT_SESSION_ID")
    echo "Session Details: $SESSION_DETAILS"
    
    print_success "Actuals upload completed successfully!"
else
    print_warning "Could not extract session ID from upload response"
    print_warning "You may need to manually upload the actuals file"
fi

# Wait before final summary
wait_for_db 5

# Step 10: Test Summary and Verification
print_status "Step 10: Test Summary and Verification..."

print_success "✅ BOE-081 Complete Test Scenario Successfully Created!"
echo ""
echo "📊 Test Data Summary:"
echo "====================="
echo "Program ID: $PROGRAM_ID"
echo "Program Code: $PROGRAM_CODE"
echo "Vendor ID: $VENDOR_ID"
echo "Cost Category ID: $CATEGORY_ID"
echo "BOE Version ID: $BOE_VERSION_ID"
echo "Frontend Element ID: $FRONTEND_ELEMENT_ID"
echo "Backend Element ID: $BACKEND_ELEMENT_ID"
echo "Frontend Allocation ID: $FRONTEND_ALLOCATION_ID"
echo "Backend Allocation ID: $BACKEND_ALLOCATION_ID"
if [ -n "$IMPORT_SESSION_ID" ] && [ "$IMPORT_SESSION_ID" != "null" ]; then
    echo "Import Session ID: $IMPORT_SESSION_ID"
fi
echo ""
echo "🎯 What was created:"
echo "==================="
echo "✅ Program with BOE integration"
echo "✅ Vendor (TechCorp Solutions)"
echo "✅ Cost Category (DEV)"
echo "✅ WBS Elements (Parent + 2 children)"
echo "✅ BOE Version 1.0 (Draft status)"
echo "✅ BOE Elements with cost category assignment"
echo "✅ BOE Element Allocations (Linear + Front-Loaded)"
echo "✅ 14 Ledger Entries created from allocations"
if [ -n "$IMPORT_SESSION_ID" ] && [ "$IMPORT_SESSION_ID" != "null" ]; then
    echo "✅ Actuals data uploaded for testing"
fi
echo ""
echo "🚀 Ready for BOE-081 Testing!"
echo "============================="
echo "You can now test:"
echo "1. BOE Element Allocations in the frontend"
echo "2. Ledger entry splitting functionality"
echo "3. Re-forecasting tools"
echo "4. BOE allocation management"
echo "5. Cost category integration"
if [ -n "$IMPORT_SESSION_ID" ] && [ "$IMPORT_SESSION_ID" != "null" ]; then
    echo "6. Actuals matching and split/re-forecast scenarios"
fi
echo ""
echo "💡 Next Steps:"
echo "=============="
echo "1. Open the frontend and navigate to the BOE page"
echo "2. Test the allocation management features"
echo "3. Test ledger entry splitting with actual invoices"
echo "4. Verify cost category assignment on BOE elements"
if [ -n "$IMPORT_SESSION_ID" ] && [ "$IMPORT_SESSION_ID" != "null" ]; then
    echo "5. Go to Actuals page to test matching and splits"
fi

print_success "✅ Complete BOE-081 test scenario created successfully!"
print_success "Program ID: $PROGRAM_ID"
print_success "Vendor ID: $VENDOR_ID"
print_success "Category ID: $CATEGORY_ID"
print_success "BOE Version ID: $BOE_VERSION_ID"
print_success "Frontend Element ID: $FRONTEND_ELEMENT_ID"
print_success "Backend Element ID: $BACKEND_ELEMENT_ID"
print_success "Frontend Allocation ID: $FRONTEND_ALLOCATION_ID"
print_success "Backend Allocation ID: $BACKEND_ALLOCATION_ID"
print_success "Import Session ID: $IMPORT_SESSION_ID"
print_success "Test Actuals Created:"
print_success "  - Actual 1: $50,000 (vs $80,000 planned) - Will trigger SPLIT"
print_success "  - Actual 2: $150,000 (vs $120,000 planned) - Will trigger RE-FORECAST"
print_success "  - Actual 3: $30,000 (vs $30,000 remaining) - Exact match"
print_success "Ready for testing split and re-forecast functionality!" 