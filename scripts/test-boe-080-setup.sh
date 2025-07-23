#!/bin/bash

# BOE-080 Test Setup Script
# This script sets up a test environment for BOE-080 invoice matching enhancements

BASE_URL="http://localhost:4000/api"
TEST_PROGRAM_ID="efcb3e0a-82f5-45b1-b60d-2ee62ef03916"

echo "🚀 Starting BOE-080 Test Setup"
echo "Test Program ID: $TEST_PROGRAM_ID"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to make API calls and handle responses
make_request() {
    local method=$1
    local url=$2
    local data=$3
    local description=$4
    
    echo -n "📋 $description... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "%{http_code}" "$url")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "%{http_code}" -X POST "$url" -H "Content-Type: application/json" -d "$data")
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "%{http_code}" -X DELETE "$url")
    fi
    
    status_code="${response: -3}"
    body="${response%???}"
    
    # Debug output
    echo "DEBUG: Status code: $status_code"
    echo "DEBUG: Body length: ${#body}"
    
    if [[ $status_code -ge 200 && $status_code -lt 300 ]]; then
        echo -e "${GREEN}✅ SUCCESS${NC}"
        if [ -n "$body" ]; then
            echo "$body" | head -c 200
            echo ""
        fi
    else
        echo -e "${RED}❌ FAILED (Status: $status_code)${NC}"
        if [ -n "$body" ]; then
            echo "$body"
        fi
    fi
    
    return $status_code
}

# Step 1: Check existing data (skip deletion for now)
echo "🔍 Step 1: Checking existing data..."
ledger_response=$(curl -s "$BASE_URL/programs/$TEST_PROGRAM_ID/ledger")
ledger_entries=$(echo "$ledger_response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -n "$ledger_entries" ]; then
    echo -e "${YELLOW}Found ${#ledger_entries[@]} existing ledger entries (will be overwritten)${NC}"
else
    echo -e "${GREEN}No existing ledger entries found${NC}"
fi

boe_response=$(curl -s "$BASE_URL/programs/$TEST_PROGRAM_ID/boe")
boe_id=$(echo "$boe_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$boe_id" ]; then
    echo -e "${YELLOW}Found existing BOE: $boe_id (will be overwritten)${NC}"
else
    echo -e "${GREEN}No existing BOE found${NC}"
fi

# Step 2: Create basic BOE
echo ""
echo "📋 Step 2: Creating basic BOE..."

boe_data='{
  "name": "BOE-080 Test BOE",
  "description": "Test BOE for BOE-080 invoice matching enhancements",
  "versionNumber": "1.0"
}'

boe_response=$(make_request "POST" "$BASE_URL/programs/$TEST_PROGRAM_ID/boe" "$boe_data" "Creating basic BOE")

if [ $? -eq 0 ]; then
    boe_id=$(echo "$boe_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo -e "${GREEN}✅ BOE created with ID: $boe_id${NC}"
else
    echo -e "${RED}❌ Failed to create BOE${NC}"
    exit 1
fi

# Step 2.5: Add BOE elements and allocations
echo ""
echo "📋 Step 2.5: Adding BOE elements and allocations..."

# Element 1: Software Development
element1_data='{
  "code": "TE-001",
  "name": "Software Development",
  "description": "Core software development activities",
  "level": 1,
  "estimatedCost": 50000,
  "costCategoryId": "ab719ce9-5028-4d37-8957-fead0ee50b44",
  "vendorId": null
}'

element1_response=$(make_request "POST" "$BASE_URL/boe/$boe_id/elements" "$element1_data" "Adding software development element")

if [ $? -eq 0 ]; then
    element1_id=$(echo "$element1_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo -e "${GREEN}✅ Software element created with ID: $element1_id${NC}"
    
    # Add allocations for element 1
    allocation1_data='{
      "name": "June 2025 Development",
      "description": "Initial development phase",
      "allocationType": "Linear",
      "totalAmount": 12500,
      "totalQuantity": 80,
      "startDate": "2025-06-01",
      "endDate": "2025-06-30"
    }'
    
    make_request "POST" "$BASE_URL/element-allocations" "$allocation1_data" "Adding June allocation"
    
    allocation2_data='{
      "name": "July 2025 Development",
      "description": "Core development phase",
      "allocationType": "Front-Loaded",
      "totalAmount": 15000,
      "totalQuantity": 100,
      "startDate": "2025-07-01",
      "endDate": "2025-07-31"
    }'
    
    make_request "POST" "$BASE_URL/element-allocations" "$allocation2_data" "Adding July allocation"
    
    allocation3_data='{
      "name": "August 2025 Development",
      "description": "Feature development phase",
      "allocationType": "Linear",
      "totalAmount": 12500,
      "totalQuantity": 80,
      "startDate": "2025-08-01",
      "endDate": "2025-08-31"
    }'
    
    make_request "POST" "$BASE_URL/element-allocations" "$allocation3_data" "Adding August allocation"
    
    allocation4_data='{
      "name": "September 2025 Development",
      "description": "Final development phase",
      "allocationType": "Back-Loaded",
      "totalAmount": 10000,
      "totalQuantity": 60,
      "startDate": "2025-09-01",
      "endDate": "2025-09-30"
    }'
    
    make_request "POST" "$BASE_URL/element-allocations" "$allocation4_data" "Adding September allocation"
else
    echo -e "${RED}❌ Failed to create software element${NC}"
fi

# Element 2: Hardware Procurement
element2_data='{
  "code": "TE-002",
  "name": "Hardware Procurement",
  "description": "Hardware and equipment procurement",
  "level": 1,
  "estimatedCost": 30000,
  "costCategoryId": "ab719ce9-5028-4d37-8957-fead0ee50b44",
  "vendorId": null
}'

element2_response=$(make_request "POST" "$BASE_URL/boe/$boe_id/elements" "$element2_data" "Adding hardware procurement element")

if [ $? -eq 0 ]; then
    element2_id=$(echo "$element2_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo -e "${GREEN}✅ Hardware element created with ID: $element2_id${NC}"
    
    # Add allocations for element 2
    hw_allocation1_data='{
      "name": "June 2025 Hardware",
      "description": "Initial hardware procurement",
      "allocationType": "Linear",
      "totalAmount": 7500,
      "totalQuantity": 5,
      "startDate": "2025-06-01",
      "endDate": "2025-06-30"
    }'
    
    make_request "POST" "$BASE_URL/element-allocations" "$hw_allocation1_data" "Adding June hardware allocation"
    
    hw_allocation2_data='{
      "name": "July 2025 Hardware",
      "description": "Additional hardware procurement",
      "allocationType": "Linear",
      "totalAmount": 7500,
      "totalQuantity": 5,
      "startDate": "2025-07-01",
      "endDate": "2025-07-31"
    }'
    
    make_request "POST" "$BASE_URL/element-allocations" "$hw_allocation2_data" "Adding July hardware allocation"
    
    hw_allocation3_data='{
      "name": "August 2025 Hardware",
      "description": "Final hardware procurement",
      "allocationType": "Linear",
      "totalAmount": 7500,
      "totalQuantity": 5,
      "startDate": "2025-08-01",
      "endDate": "2025-08-31"
    }'
    
    make_request "POST" "$BASE_URL/element-allocations" "$hw_allocation3_data" "Adding August hardware allocation"
    
    hw_allocation4_data='{
      "name": "September 2025 Hardware",
      "description": "Spare hardware procurement",
      "allocationType": "Linear",
      "totalAmount": 7500,
      "totalQuantity": 5,
      "startDate": "2025-09-01",
      "endDate": "2025-09-30"
    }'
    
    make_request "POST" "$BASE_URL/element-allocations" "$hw_allocation4_data" "Adding September hardware allocation"
else
    echo -e "${RED}❌ Failed to create hardware element${NC}"
fi

# Step 3: Push BOE to ledger
echo ""
echo "📤 Step 3: Pushing BOE to ledger..."
push_response=$(make_request "POST" "$BASE_URL/programs/$TEST_PROGRAM_ID/boe/$boe_id/push-to-ledger" "" "Pushing BOE to ledger")

if [ $? -eq 0 ]; then
    entries_created=$(echo "$push_response" | grep -o '"entriesCreated":[0-9]*' | cut -d':' -f2)
    echo -e "${GREEN}✅ BOE pushed to ledger successfully${NC}"
    echo -e "${BLUE}📊 Ledger entries created: $entries_created${NC}"
else
    echo -e "${RED}❌ Failed to push BOE to ledger${NC}"
    exit 1
fi

# Step 4: Create test actuals session
echo ""
echo "📊 Step 4: Creating test actuals session..."

session_data='{
  "description": "BOE-080 Test Actuals",
  "config": {
    "programCodeColumn": "Program Code",
    "vendorColumn": "Vendor Name",
    "descriptionColumn": "Description",
    "amountColumn": "Amount",
    "dateColumn": "Transaction Date",
    "categoryColumn": "Category",
    "subcategoryColumn": "Subcategory",
    "invoiceColumn": "Invoice Number",
    "referenceColumn": "Reference Number",
    "dateFormat": "YYYY-MM-DD",
    "amountTolerance": 0.01,
    "matchThreshold": 0.7
  }
}'

session_response=$(make_request "POST" "$BASE_URL/import/$TEST_PROGRAM_ID/upload" "$session_data" "Creating actuals session")

if [ $? -eq 0 ]; then
    session_id=$(echo "$session_response" | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✅ Actuals session created with ID: $session_id${NC}"
else
    echo -e "${RED}❌ Failed to create actuals session${NC}"
    exit 1
fi

# Step 5: Add test transactions
echo ""
echo "📝 Step 5: Adding test transactions..."

# Transaction 1: Software Development
transaction1='{
  "vendorName": "SWE",
  "description": "Software Development Services - June 2025",
  "amount": 12000,
  "transactionDate": "2025-06-15",
  "category": "Software",
  "subcategory": "Development",
  "invoiceNumber": "INV-2025-001",
  "referenceNumber": "https://example.com/invoice/2025-001"
}'

make_request "POST" "$BASE_URL/import/session/$session_id/transactions" "$transaction1" "Adding software development transaction"

# Transaction 2: Hardware Procurement
transaction2='{
  "vendorName": "HW Supplier",
  "description": "Hardware Procurement - July 2025",
  "amount": 7500,
  "transactionDate": "2025-07-10",
  "category": "Hardware",
  "subcategory": "Equipment",
  "invoiceNumber": "INV-2025-002",
  "referenceNumber": "https://example.com/invoice/2025-002"
}'

make_request "POST" "$BASE_URL/import/session/$session_id/transactions" "$transaction2" "Adding hardware procurement transaction"

# Step 6: Run smart matching
echo ""
echo "🔍 Step 6: Running smart matching..."
make_request "POST" "$BASE_URL/import/session/$session_id/smart-matching" "" "Running smart matching"

echo ""
echo "🎉 BOE-080 Test Setup Complete!"
echo ""
echo "📋 Test Summary:"
echo "- Test Program: TEST-BOE-079"
echo "- BOE Version ID: $boe_id"
echo "- 2 BOE Elements with 4 allocations each"
echo "- Allocations starting June 2025"
echo "- 2 test actuals created for matching"
echo "- Session ID: $session_id"
echo ""
echo "🔗 Next Steps:"
echo "1. Go to http://localhost:3000/programs/TEST-BOE-079/actuals"
echo "2. Check the upload sessions"
echo "3. Test the matching functionality"
echo "4. Verify BOE context appears in TransactionMatchModal"
echo ""
echo "💡 Test the BOE context endpoint:"
echo "curl -X GET \"$BASE_URL/import/ledger-entry/{ledger_entry_id}/boe-context\"" 