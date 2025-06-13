#!/bin/bash

PROGRAM_ID=3  # The ID of the program we just created

# Function to generate a random amount under $1000
generate_amount() {
    echo $(($RANDOM % 1000))
}

# Function to generate a random date within a range
generate_date() {
    local start=$1
    local end=$2
    local start_ts=$(date -d "$start" +%s)
    local end_ts=$(date -d "$end" +%s)
    local range=$((end_ts - start_ts))
    local random_ts=$((start_ts + RANDOM % range))
    date -d "@$random_ts" +%Y-%m-%d
}

# Create transactions for each month
# January
curl -X POST http://localhost:4000/api/programs/$PROGRAM_ID/ledger \
    -H "Content-Type: application/json" \
    -d "{
        \"vendor_name\": \"Vendor A\",
        \"expense_description\": \"January Expense\",
        \"wbs_category\": \"Category 1\",
        \"wbs_subcategory\": \"Subcategory 1\",
        \"baseline_date\": \"2025-01-15\",
        \"baseline_amount\": 750,
        \"planned_date\": \"2025-01-15\",
        \"planned_amount\": 800,
        \"actual_date\": \"2025-01-15\",
        \"actual_amount\": 780,
        \"notes\": \"January transaction\"
    }"

# February
curl -X POST http://localhost:4000/api/programs/$PROGRAM_ID/ledger \
    -H "Content-Type: application/json" \
    -d "{
        \"vendor_name\": \"Vendor B\",
        \"expense_description\": \"February Expense\",
        \"wbs_category\": \"Category 2\",
        \"wbs_subcategory\": \"Subcategory 2\",
        \"baseline_date\": \"2025-02-15\",
        \"baseline_amount\": 850,
        \"planned_date\": \"2025-02-15\",
        \"planned_amount\": 900,
        \"actual_date\": \"2025-02-15\",
        \"actual_amount\": 875,
        \"notes\": \"February transaction\"
    }"

# March
curl -X POST http://localhost:4000/api/programs/$PROGRAM_ID/ledger \
    -H "Content-Type: application/json" \
    -d "{
        \"vendor_name\": \"Vendor C\",
        \"expense_description\": \"March Expense\",
        \"wbs_category\": \"Category 3\",
        \"wbs_subcategory\": \"Subcategory 3\",
        \"baseline_date\": \"2025-03-15\",
        \"baseline_amount\": 920,
        \"planned_date\": \"2025-03-15\",
        \"planned_amount\": 950,
        \"actual_date\": \"2025-03-15\",
        \"actual_amount\": 940,
        \"notes\": \"March transaction\"
    }"

# April
curl -X POST http://localhost:4000/api/programs/$PROGRAM_ID/ledger \
    -H "Content-Type: application/json" \
    -d "{
        \"vendor_name\": \"Vendor D\",
        \"expense_description\": \"April Expense\",
        \"wbs_category\": \"Category 1\",
        \"wbs_subcategory\": \"Subcategory 4\",
        \"baseline_date\": \"2025-04-15\",
        \"baseline_amount\": 880,
        \"planned_date\": \"2025-04-15\",
        \"planned_amount\": 850,
        \"actual_date\": \"2025-04-15\",
        \"actual_amount\": 860,
        \"notes\": \"April transaction\"
    }"

# May - First Transaction
curl -X POST http://localhost:4000/api/programs/$PROGRAM_ID/ledger \
    -H "Content-Type: application/json" \
    -d "{
        \"vendor_name\": \"Vendor E\",
        \"expense_description\": \"May Expense 1\",
        \"wbs_category\": \"Category 2\",
        \"wbs_subcategory\": \"Subcategory 1\",
        \"baseline_date\": \"2025-05-01\",
        \"baseline_amount\": 450,
        \"planned_date\": \"2025-05-01\",
        \"planned_amount\": 475,
        \"actual_date\": \"2025-05-01\",
        \"actual_amount\": 460,
        \"notes\": \"May transaction 1\"
    }"

# May - Second Transaction
curl -X POST http://localhost:4000/api/programs/$PROGRAM_ID/ledger \
    -H "Content-Type: application/json" \
    -d "{
        \"vendor_name\": \"Vendor F\",
        \"expense_description\": \"May Expense 2\",
        \"wbs_category\": \"Category 3\",
        \"wbs_subcategory\": \"Subcategory 2\",
        \"baseline_date\": \"2025-05-15\",
        \"baseline_amount\": 550,
        \"planned_date\": \"2025-05-15\",
        \"planned_amount\": 525,
        \"actual_date\": \"2025-05-15\",
        \"actual_amount\": 540,
        \"notes\": \"May transaction 2\"
    }"

# June (No actuals)
curl -X POST http://localhost:4000/api/programs/$PROGRAM_ID/ledger \
    -H "Content-Type: application/json" \
    -d "{
        \"vendor_name\": \"Vendor G\",
        \"expense_description\": \"June Expense\",
        \"wbs_category\": \"Category 1\",
        \"wbs_subcategory\": \"Subcategory 3\",
        \"baseline_date\": \"2025-06-15\",
        \"baseline_amount\": 900,
        \"planned_date\": \"2025-06-15\",
        \"planned_amount\": 950,
        \"actual_date\": null,
        \"actual_amount\": null,
        \"notes\": \"June transaction\"
    }"

# July (No actuals)
curl -X POST http://localhost:4000/api/programs/$PROGRAM_ID/ledger \
    -H "Content-Type: application/json" \
    -d "{
        \"vendor_name\": \"Vendor H\",
        \"expense_description\": \"July Expense\",
        \"wbs_category\": \"Category 2\",
        \"wbs_subcategory\": \"Subcategory 4\",
        \"baseline_date\": \"2025-07-15\",
        \"baseline_amount\": 850,
        \"planned_date\": \"2025-07-15\",
        \"planned_amount\": 900,
        \"actual_date\": null,
        \"actual_amount\": null,
        \"notes\": \"July transaction\"
    }"

# August (No actuals)
curl -X POST http://localhost:4000/api/programs/$PROGRAM_ID/ledger \
    -H "Content-Type: application/json" \
    -d "{
        \"vendor_name\": \"Vendor I\",
        \"expense_description\": \"August Expense\",
        \"wbs_category\": \"Category 3\",
        \"wbs_subcategory\": \"Subcategory 1\",
        \"baseline_date\": \"2025-08-15\",
        \"baseline_amount\": 800,
        \"planned_date\": \"2025-08-15\",
        \"planned_amount\": 850,
        \"actual_date\": null,
        \"actual_amount\": null,
        \"notes\": \"August transaction\"
    }"

echo "Created all transactions" 