#!/bin/bash

# Simple BOE-080 Test Setup Script
# This script sets up a test environment for BOE-080 invoice matching enhancements

BASE_URL="http://localhost:4000/api"
TEST_PROGRAM_ID="efcb3e0a-82f5-45b1-b60d-2ee62ef03916"

echo "🚀 Starting BOE-080 Test Setup (Simple Version)"
echo "Test Program ID: $TEST_PROGRAM_ID"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Create basic BOE
echo "📋 Step 1: Creating basic BOE..."

boe_response=$(curl -s -X POST "$BASE_URL/programs/$TEST_PROGRAM_ID/boe" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "BOE-080 Test BOE",
    "description": "Test BOE for BOE-080 invoice matching enhancements",
    "versionNumber": "1.0"
  }')

if [[ $? -eq 0 ]]; then
    boe_id=$(echo "$boe_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo -e "${GREEN}✅ BOE created with ID: $boe_id${NC}"
else
    echo -e "${RED}❌ Failed to create BOE${NC}"
    echo "Response: $boe_response"
    exit 1
fi

# Step 2: Add BOE elements
echo ""
echo "📋 Step 2: Adding BOE elements..."

# Element 1: Software Development
element1_response=$(curl -s -X POST "$BASE_URL/boe/$boe_id/elements" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "TE-001",
    "name": "Software Development",
    "description": "Core software development activities",
    "level": 1,
    "estimatedCost": 50000,
    "costCategoryId": "ab719ce9-5028-4d37-8957-fead0ee50b44",
    "vendorId": null
  }')

if [[ $? -eq 0 ]]; then
    element1_id=$(echo "$element1_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo -e "${GREEN}✅ Software element created with ID: $element1_id${NC}"
else
    echo -e "${RED}❌ Failed to create software element${NC}"
    echo "Response: $element1_response"
fi

# Element 2: Hardware Procurement
element2_response=$(curl -s -X POST "$BASE_URL/boe/$boe_id/elements" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "TE-002",
    "name": "Hardware Procurement",
    "description": "Hardware and equipment procurement",
    "level": 1,
    "estimatedCost": 30000,
    "costCategoryId": "ab719ce9-5028-4d37-8957-fead0ee50b44",
    "vendorId": null
  }')

if [[ $? -eq 0 ]]; then
    element2_id=$(echo "$element2_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo -e "${GREEN}✅ Hardware element created with ID: $element2_id${NC}"
else
    echo -e "${RED}❌ Failed to create hardware element${NC}"
    echo "Response: $element2_response"
fi

# Step 3: Add element allocations
echo ""
echo "📋 Step 3: Adding element allocations..."

# Allocations for Software Development
echo "Adding software development allocations..."

allocation1_response=$(curl -s -X POST "$BASE_URL/element-allocations" \
  -H "Content-Type: application/json" \
  -d "{
    \"boeElementId\": \"$element1_id\",
    \"name\": \"June 2025 Development\",
    \"description\": \"Initial development phase\",
    \"allocationType\": \"Linear\",
    \"totalAmount\": 12500,
    \"totalQuantity\": 80,
    \"startDate\": \"2025-06-01\",
    \"endDate\": \"2025-06-30\"
  }")

if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ June allocation created${NC}"
else
    echo -e "${RED}❌ Failed to create June allocation${NC}"
    echo "Response: $allocation1_response"
fi

allocation2_response=$(curl -s -X POST "$BASE_URL/element-allocations" \
  -H "Content-Type: application/json" \
  -d "{
    \"boeElementId\": \"$element1_id\",
    \"name\": \"July 2025 Development\",
    \"description\": \"Core development phase\",
    \"allocationType\": \"Front-Loaded\",
    \"totalAmount\": 15000,
    \"totalQuantity\": 100,
    \"startDate\": \"2025-07-01\",
    \"endDate\": \"2025-07-31\"
  }")

if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ July allocation created${NC}"
else
    echo -e "${RED}❌ Failed to create July allocation${NC}"
    echo "Response: $allocation2_response"
fi

allocation3_response=$(curl -s -X POST "$BASE_URL/element-allocations" \
  -H "Content-Type: application/json" \
  -d "{
    \"boeElementId\": \"$element1_id\",
    \"name\": \"August 2025 Development\",
    \"description\": \"Feature development phase\",
    \"allocationType\": \"Linear\",
    \"totalAmount\": 12500,
    \"totalQuantity\": 80,
    \"startDate\": \"2025-08-01\",
    \"endDate\": \"2025-08-31\"
  }")

if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ August allocation created${NC}"
else
    echo -e "${RED}❌ Failed to create August allocation${NC}"
    echo "Response: $allocation3_response"
fi

allocation4_response=$(curl -s -X POST "$BASE_URL/element-allocations" \
  -H "Content-Type: application/json" \
  -d "{
    \"boeElementId\": \"$element1_id\",
    \"name\": \"September 2025 Development\",
    \"description\": \"Final development phase\",
    \"allocationType\": \"Back-Loaded\",
    \"totalAmount\": 10000,
    \"totalQuantity\": 60,
    \"startDate\": \"2025-09-01\",
    \"endDate\": \"2025-09-30\"
  }")

if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ September allocation created${NC}"
else
    echo -e "${RED}❌ Failed to create September allocation${NC}"
    echo "Response: $allocation4_response"
fi

# Allocations for Hardware Procurement
echo "Adding hardware procurement allocations..."

hw_allocation1_response=$(curl -s -X POST "$BASE_URL/element-allocations" \
  -H "Content-Type: application/json" \
  -d "{
    \"boeElementId\": \"$element2_id\",
    \"name\": \"June 2025 Hardware\",
    \"description\": \"Initial hardware procurement\",
    \"allocationType\": \"Linear\",
    \"totalAmount\": 7500,
    \"totalQuantity\": 5,
    \"startDate\": \"2025-06-01\",
    \"endDate\": \"2025-06-30\"
  }")

if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ June hardware allocation created${NC}"
else
    echo -e "${RED}❌ Failed to create June hardware allocation${NC}"
    echo "Response: $hw_allocation1_response"
fi

hw_allocation2_response=$(curl -s -X POST "$BASE_URL/element-allocations" \
  -H "Content-Type: application/json" \
  -d "{
    \"boeElementId\": \"$element2_id\",
    \"name\": \"July 2025 Hardware\",
    \"description\": \"Additional hardware procurement\",
    \"allocationType\": \"Linear\",
    \"totalAmount\": 7500,
    \"totalQuantity\": 5,
    \"startDate\": \"2025-07-01\",
    \"endDate\": \"2025-07-31\"
  }")

if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ July hardware allocation created${NC}"
else
    echo -e "${RED}❌ Failed to create July hardware allocation${NC}"
    echo "Response: $hw_allocation2_response"
fi

hw_allocation3_response=$(curl -s -X POST "$BASE_URL/element-allocations" \
  -H "Content-Type: application/json" \
  -d "{
    \"boeElementId\": \"$element2_id\",
    \"name\": \"August 2025 Hardware\",
    \"description\": \"Final hardware procurement\",
    \"allocationType\": \"Linear\",
    \"totalAmount\": 7500,
    \"totalQuantity\": 5,
    \"startDate\": \"2025-08-01\",
    \"endDate\": \"2025-08-31\"
  }")

if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ August hardware allocation created${NC}"
else
    echo -e "${RED}❌ Failed to create August hardware allocation${NC}"
    echo "Response: $hw_allocation3_response"
fi

hw_allocation4_response=$(curl -s -X POST "$BASE_URL/element-allocations" \
  -H "Content-Type: application/json" \
  -d "{
    \"boeElementId\": \"$element2_id\",
    \"name\": \"September 2025 Hardware\",
    \"description\": \"Spare hardware procurement\",
    \"allocationType\": \"Linear\",
    \"totalAmount\": 7500,
    \"totalQuantity\": 5,
    \"startDate\": \"2025-09-01\",
    \"endDate\": \"2025-09-30\"
  }")

if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ September hardware allocation created${NC}"
else
    echo -e "${RED}❌ Failed to create September hardware allocation${NC}"
    echo "Response: $hw_allocation4_response"
fi

# Step 4: Push BOE to ledger
echo ""
echo "📤 Step 4: Pushing BOE to ledger..."

push_response=$(curl -s -X POST "$BASE_URL/programs/$TEST_PROGRAM_ID/boe/$boe_id/push-to-ledger" \
  -H "Content-Type: application/json")

if [[ $? -eq 0 ]]; then
    entries_created=$(echo "$push_response" | grep -o '"entriesCreated":[0-9]*' | cut -d':' -f2)
    echo -e "${GREEN}✅ BOE pushed to ledger successfully${NC}"
    echo -e "${BLUE}📊 Ledger entries created: $entries_created${NC}"
else
    echo -e "${RED}❌ Failed to push BOE to ledger${NC}"
    echo "Response: $push_response"
    exit 1
fi

# Step 5: Create test actuals session
echo ""
echo "📊 Step 5: Creating test actuals session..."

session_response=$(curl -s -X POST "$BASE_URL/import/$TEST_PROGRAM_ID/upload" \
  -H "Content-Type: application/json" \
  -d '{
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
  }')

if [[ $? -eq 0 ]]; then
    session_id=$(echo "$session_response" | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✅ Actuals session created with ID: $session_id${NC}"
else
    echo -e "${RED}❌ Failed to create actuals session${NC}"
    echo "Response: $session_response"
    exit 1
fi

# Step 6: Add test transactions
echo ""
echo "📝 Step 6: Adding test transactions..."

# Transaction 1: Software Development
transaction1_response=$(curl -s -X POST "$BASE_URL/import/session/$session_id/transactions" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorName": "SWE",
    "description": "Software Development Services - June 2025",
    "amount": 12000,
    "transactionDate": "2025-06-15",
    "category": "Software",
    "subcategory": "Development",
    "invoiceNumber": "INV-2025-001",
    "referenceNumber": "https://example.com/invoice/2025-001"
  }')

if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ Software development transaction added${NC}"
else
    echo -e "${RED}❌ Failed to add software development transaction${NC}"
    echo "Response: $transaction1_response"
fi

# Transaction 2: Hardware Procurement
transaction2_response=$(curl -s -X POST "$BASE_URL/import/session/$session_id/transactions" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorName": "HW Supplier",
    "description": "Hardware Procurement - July 2025",
    "amount": 7500,
    "transactionDate": "2025-07-10",
    "category": "Hardware",
    "subcategory": "Equipment",
    "invoiceNumber": "INV-2025-002",
    "referenceNumber": "https://example.com/invoice/2025-002"
  }')

if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ Hardware procurement transaction added${NC}"
else
    echo -e "${RED}❌ Failed to add hardware procurement transaction${NC}"
    echo "Response: $transaction2_response"
fi

# Step 7: Run smart matching
echo ""
echo "🔍 Step 7: Running smart matching..."

matching_response=$(curl -s -X POST "$BASE_URL/import/session/$session_id/smart-matching" \
  -H "Content-Type: application/json")

if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ Smart matching completed${NC}"
else
    echo -e "${RED}❌ Failed to run smart matching${NC}"
    echo "Response: $matching_response"
fi

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