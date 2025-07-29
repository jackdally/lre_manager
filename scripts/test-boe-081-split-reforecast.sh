#!/bin/bash

# Test Script for BOE-081: Split and Re-forecast Functionality
# This script creates a complete test scenario from scratch

set -e

echo "🚀 Starting BOE-081 Split and Re-forecast Test Scenario"
echo "======================================================"

# Configuration
BASE_URL="http://localhost:4000/api"
PROGRAM_NAME="BOE-081-Test-Program"
PROGRAM_CODE="BOE081"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Helper function to make API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -n "$data" ]; then
        response=$(curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -X "$method" \
            -H "Content-Type: application/json" \
            "$BASE_URL$endpoint")
    fi
    
    echo "$response"
}

# Step 1: Create Test Program
print_status "Step 1: Creating test program..."
PROGRAM_DATA='{
    "code": "'$PROGRAM_CODE'",
    "name": "'$PROGRAM_NAME'",
    "description": "Test program for BOE-081 split and re-forecast functionality",
    "status": "active",
    "startDate": "2025-01-01",
    "endDate": "2025-12-31",
    "totalBudget": 1000000,
    "type": "development",
    "program_manager": "Test Manager"
}'

PROGRAM_RESPONSE=$(api_call "POST" "/programs" "$PROGRAM_DATA")
PROGRAM_ID=$(echo "$PROGRAM_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$PROGRAM_ID" ]; then
    print_error "Failed to create program"
    echo "$PROGRAM_RESPONSE"
    exit 1
fi

print_success "Created program with ID: $PROGRAM_ID"

# Step 2: Create WBS Elements
print_status "Step 2: Creating WBS elements..."

# Create parent WBS element
PARENT_WBS_DATA='{
    "code": "1.0",
    "name": "Software Development",
    "description": "Software development activities",
    "level": 1,
    "parentId": null
}'

PARENT_WBS_RESPONSE=$(api_call "POST" "/programs/$PROGRAM_ID/wbs-elements" "$PARENT_WBS_DATA")
PARENT_WBS_ID=$(echo "$PARENT_WBS_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
print_success "Created parent WBS element with ID: $PARENT_WBS_ID"

# Create child WBS elements
CHILD1_WBS_DATA='{
    "code": "1.1",
    "name": "Frontend Development",
    "description": "Frontend development work",
    "level": 2,
    "parentId": "'$PARENT_WBS_ID'"
}'

CHILD1_WBS_RESPONSE=$(api_call "POST" "/programs/$PROGRAM_ID/wbs-elements" "$CHILD1_WBS_DATA")
CHILD1_WBS_ID=$(echo "$CHILD1_WBS_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
print_success "Created child WBS element 1 with ID: $CHILD1_WBS_ID"

CHILD2_WBS_DATA='{
    "code": "1.2",
    "name": "Backend Development",
    "description": "Backend development work",
    "level": 2,
    "parentId": "'$PARENT_WBS_ID'"
}'

CHILD2_WBS_RESPONSE=$(api_call "POST" "/programs/$PROGRAM_ID/wbs-elements" "$CHILD2_WBS_DATA")
CHILD2_WBS_ID=$(echo "$CHILD2_WBS_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
print_success "Created child WBS element 2 with ID: $CHILD2_WBS_ID"

# Step 3: Create Vendors
print_status "Step 3: Creating vendors..."

VENDOR1_DATA='{
    "name": "TechCorp Solutions",
    "code": "TECH001",
    "description": "Software development vendor",
    "contact_email": "dev@techcorp.com",
    "contact_phone": "555-0101"
}'

VENDOR1_RESPONSE=$(api_call "POST" "/vendors" "$VENDOR1_DATA")
VENDOR1_ID=$(echo "$VENDOR1_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
print_success "Created vendor 1 with ID: $VENDOR1_ID"

VENDOR2_DATA='{
    "name": "DataFlow Systems",
    "code": "DATA001",
    "description": "Database and backend services",
    "contact_email": "services@dataflow.com",
    "contact_phone": "555-0202"
}'

VENDOR2_RESPONSE=$(api_call "POST" "/vendors" "$VENDOR2_DATA")
VENDOR2_ID=$(echo "$VENDOR2_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
print_success "Created vendor 2 with ID: $VENDOR2_ID"

# Step 4: Create Cost Categories
print_status "Step 4: Creating cost categories..."

CATEGORY1_DATA='{
    "code": "LABOR",
    "name": "Labor",
    "description": "Labor costs"
}'

CATEGORY1_RESPONSE=$(api_call "POST" "/cost-categories" "$CATEGORY1_DATA")
CATEGORY1_ID=$(echo "$CATEGORY1_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
print_success "Created cost category 1 with ID: $CATEGORY1_ID"

CATEGORY2_DATA='{
    "code": "SERVICES",
    "name": "Services",
    "description": "External services"
}'

CATEGORY2_RESPONSE=$(api_call "POST" "/cost-categories" "$CATEGORY2_DATA")
CATEGORY2_ID=$(echo "$CATEGORY2_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
print_success "Created cost category 2 with ID: $CATEGORY2_ID"

# Step 5: Create BOE Template
print_status "Step 5: Creating BOE template..."

TEMPLATE_DATA='{
    "name": "Software Development Template",
    "description": "Template for software development projects",
    "category": "Software",
    "structure": {
        "elements": [
            {
                "code": "1.0",
                "name": "Software Development",
                "description": "Software development activities",
                "level": 1,
                "children": [
                    {
                        "code": "1.1",
                        "name": "Frontend Development",
                        "description": "Frontend development work",
                        "level": 2
                    },
                    {
                        "code": "1.2",
                        "name": "Backend Development",
                        "description": "Backend development work",
                        "level": 2
                    }
                ]
            }
        ]
    }
}'

TEMPLATE_RESPONSE=$(api_call "POST" "/boe-templates" "$TEMPLATE_DATA")
TEMPLATE_ID=$(echo "$TEMPLATE_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
print_success "Created BOE template with ID: $TEMPLATE_ID"

# Step 6: Create BOE with Allocations
print_status "Step 6: Creating BOE with allocations..."

BOE_DATA='{
    "templateId": "'$TEMPLATE_ID'",
    "name": "BOE-081 Test BOE",
    "description": "Test BOE for split and re-forecast functionality",
    "elements": [
        {
            "code": "1.1",
            "name": "Frontend Development",
            "description": "Frontend development work",
            "level": 2,
            "parentCode": "1.0",
            "costCategoryId": "'$CATEGORY1_ID'",
            "vendorId": "'$VENDOR1_ID'",
            "estimatedCost": 50000,
            "allocations": [
                {
                    "name": "Frontend Q1",
                    "description": "Frontend development Q1 allocation",
                    "allocationType": "Linear",
                    "totalAmount": 25000,
                    "totalQuantity": 0,
                    "startDate": "2025-01-01",
                    "endDate": "2025-03-31"
                },
                {
                    "name": "Frontend Q2",
                    "description": "Frontend development Q2 allocation",
                    "allocationType": "Linear",
                    "totalAmount": 25000,
                    "totalQuantity": 0,
                    "startDate": "2025-04-01",
                    "endDate": "2025-06-30"
                }
            ]
        },
        {
            "code": "1.2",
            "name": "Backend Development",
            "description": "Backend development work",
            "level": 2,
            "parentCode": "1.0",
            "costCategoryId": "'$CATEGORY2_ID'",
            "vendorId": "'$VENDOR2_ID'",
            "estimatedCost": 75000,
            "allocations": [
                {
                    "name": "Backend Q1",
                    "description": "Backend development Q1 allocation",
                    "allocationType": "Front-Loaded",
                    "totalAmount": 45000,
                    "totalQuantity": 0,
                    "startDate": "2025-01-01",
                    "endDate": "2025-03-31"
                },
                {
                    "name": "Backend Q2",
                    "description": "Backend development Q2 allocation",
                    "allocationType": "Back-Loaded",
                    "totalAmount": 30000,
                    "totalQuantity": 0,
                    "startDate": "2025-04-01",
                    "endDate": "2025-06-30"
                }
            ]
        }
    ]
}'

BOE_RESPONSE=$(api_call "POST" "/programs/$PROGRAM_ID/boe" "$BOE_DATA")
BOE_VERSION_ID=$(echo "$BOE_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
print_success "Created BOE with ID: $BOE_VERSION_ID"

# Step 7: Push BOE to Ledger
print_status "Step 7: Pushing BOE to ledger..."

PUSH_RESPONSE=$(api_call "POST" "/programs/$PROGRAM_ID/boe/$BOE_VERSION_ID/push-to-ledger")
print_success "Pushed BOE to ledger"

# Step 8: Get Ledger Entries
print_status "Step 8: Retrieving ledger entries..."

LEDGER_RESPONSE=$(api_call "GET" "/programs/$PROGRAM_ID/ledger")
echo "$LEDGER_RESPONSE" > /tmp/ledger_entries.json

# Extract ledger entry IDs for testing
LEDGER_ENTRIES=$(echo "$LEDGER_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
LEDGER_ENTRY_IDS=($LEDGER_ENTRIES)

print_success "Found ${#LEDGER_ENTRY_IDS[@]} ledger entries"

# Step 9: Create Import Session
print_status "Step 9: Creating import session..."

SESSION_DATA='{
    "filename": "boe-081-test-actuals.csv",
    "description": "Test actuals for BOE-081 split and re-forecast testing",
    "programId": "'$PROGRAM_ID'"
}'

SESSION_RESPONSE=$(api_call "POST" "/import-sessions" "$SESSION_DATA")
SESSION_ID=$(echo "$SESSION_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
print_success "Created import session with ID: $SESSION_ID"

# Step 10: Create Test Actuals (Transactions that will trigger splits/re-forecasts)
print_status "Step 10: Creating test actuals..."

# Actual 1: Less than planned (will trigger split)
ACTUAL1_DATA='{
    "vendorName": "TechCorp Solutions",
    "description": "Frontend Development - Q1 Partial",
    "amount": 15000,
    "transactionDate": "2025-02-15",
    "programCode": "'$PROGRAM_CODE'",
    "category": "Labor",
    "subcategory": "Development",
    "invoiceNumber": "INV-001",
    "importSessionId": "'$SESSION_ID'"
}'

ACTUAL1_RESPONSE=$(api_call "POST" "/import-transactions" "$ACTUAL1_DATA")
ACTUAL1_ID=$(echo "$ACTUAL1_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
print_success "Created actual 1 (split trigger) with ID: $ACTUAL1_ID"

# Actual 2: More than planned (will trigger re-forecast)
ACTUAL2_DATA='{
    "vendorName": "DataFlow Systems",
    "description": "Backend Development - Q1 Extended",
    "amount": 55000,
    "transactionDate": "2025-03-20",
    "programCode": "'$PROGRAM_CODE'",
    "category": "Services",
    "subcategory": "Development",
    "invoiceNumber": "INV-002",
    "importSessionId": "'$SESSION_ID'"
}'

ACTUAL2_RESPONSE=$(api_call "POST" "/import-transactions" "$ACTUAL2_DATA")
ACTUAL2_ID=$(echo "$ACTUAL2_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
print_success "Created actual 2 (re-forecast trigger) with ID: $ACTUAL2_ID"

# Actual 3: Date mismatch (will trigger re-forecast)
ACTUAL3_DATA='{
    "vendorName": "TechCorp Solutions",
    "description": "Frontend Development - Q2 Early",
    "amount": 25000,
    "transactionDate": "2025-03-15",
    "programCode": "'$PROGRAM_CODE'",
    "category": "Labor",
    "subcategory": "Development",
    "invoiceNumber": "INV-003",
    "importSessionId": "'$SESSION_ID'"
}'

ACTUAL3_RESPONSE=$(api_call "POST" "/import-transactions" "$ACTUAL3_DATA")
ACTUAL3_ID=$(echo "$ACTUAL3_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
print_success "Created actual 3 (date mismatch) with ID: $ACTUAL3_ID"

# Step 11: Run Import Processing
print_status "Step 11: Running import processing..."

PROCESS_RESPONSE=$(api_call "POST" "/import-sessions/$SESSION_ID/process")
print_success "Import processing completed"

# Step 12: Get Potential Matches
print_status "Step 12: Retrieving potential matches..."

MATCHES_RESPONSE=$(api_call "GET" "/import-sessions/$SESSION_ID/potential-matches")
echo "$MATCHES_RESPONSE" > /tmp/potential_matches.json

print_success "Retrieved potential matches"

# Step 13: Display Test Summary
echo ""
echo "🎉 BOE-081 Test Scenario Setup Complete!"
echo "========================================"
echo ""
echo "📋 Test Data Summary:"
echo "  Program ID: $PROGRAM_ID"
echo "  Program Code: $PROGRAM_CODE"
echo "  BOE Version ID: $BOE_VERSION_ID"
echo "  Import Session ID: $SESSION_ID"
echo ""
echo "🏗️  Created Structure:"
echo "  - 1 Program with 2 WBS elements"
echo "  - 2 Vendors (TechCorp Solutions, DataFlow Systems)"
echo "  - 2 Cost Categories (Labor, Services)"
echo "  - 1 BOE Template"
echo "  - 1 BOE with 2 elements and 4 allocations"
echo "  - 4 Ledger entries (from BOE push)"
echo ""
echo "💰 Test Actuals Created:"
echo "  - Actual 1: $15,000 (vs $25,000 planned) - Will trigger SPLIT"
echo "  - Actual 2: $55,000 (vs $45,000 planned) - Will trigger RE-FORECAST"
echo "  - Actual 3: $25,000 (date mismatch) - Will trigger RE-FORECAST"
echo ""
echo "🔗 Test URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Program: http://localhost:3000/programs/$PROGRAM_ID"
echo "  Actuals: http://localhost:3000/programs/$PROGRAM_ID/actuals"
echo ""
echo "📝 Next Steps:"
echo "  1. Open the frontend application"
echo "  2. Navigate to the test program"
echo "  3. Go to Actuals tab"
echo "  4. Upload the test CSV or use the created import session"
echo "  5. Test the TransactionMatchModal split/re-forecast functionality"
echo ""
echo "✅ Test scenario ready for manual testing!"

# Save test data to file for reference
cat > /tmp/boe-081-test-data.txt << EOF
BOE-081 Test Scenario Data
==========================

Program:
  ID: $PROGRAM_ID
  Code: $PROGRAM_CODE
  Name: $PROGRAM_NAME

BOE:
  Version ID: $BOE_VERSION_ID
  Template ID: $TEMPLATE_ID

WBS Elements:
  Parent: $PARENT_WBS_ID (1.0 - Software Development)
  Child 1: $CHILD1_WBS_ID (1.1 - Frontend Development)
  Child 2: $CHILD2_WBS_ID (1.2 - Backend Development)

Vendors:
  Vendor 1: $VENDOR1_ID (TechCorp Solutions)
  Vendor 2: $VENDOR2_ID (DataFlow Systems)

Cost Categories:
  Category 1: $CATEGORY1_ID (Labor)
  Category 2: $CATEGORY2_ID (Services)

Import Session:
  Session ID: $SESSION_ID
  Filename: boe-081-test-actuals.csv

Test Actuals:
  Actual 1: $ACTUAL1_ID (\$15,000 - Split trigger)
  Actual 2: $ACTUAL2_ID (\$55,000 - Re-forecast trigger)
  Actual 3: $ACTUAL3_ID (\$25,000 - Date mismatch)

Ledger Entries: ${#LEDGER_ENTRY_IDS[@]} entries created
EOF

print_success "Test data saved to /tmp/boe-081-test-data.txt" 