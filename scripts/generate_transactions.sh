#!/bin/bash

# Function to generate a random date between start and end dates
random_date() {
    local start=$1
    local end=$2
    local diff=$(( ($(date -d "$end" +%s) - $(date -d "$start" +%s)) / 86400 ))
    local random_days=$(( RANDOM % diff ))
    date -d "$start + $random_days days" +%Y-%m-%d
}

# Function to generate a random amount between min and max
random_amount() {
    local min=$1
    local max=$2
    echo "scale=2; $min + ($RANDOM * ($max - $min) / 32767)" | bc
}

# WBS categories and subcategories
declare -A WBS_CATEGORIES=(
    ["Labor"]="Direct Labor,Indirect Labor,Overtime"
    ["Materials"]="Raw Materials,Supplies,Equipment"
    ["Services"]="Consulting,Training,Maintenance"
    ["Travel"]="Airfare,Lodging,Per Diem"
    ["Other"]="Miscellaneous,Contingency"
)

# Vendor names
VENDORS=(
    "Acme Corporation"
    "Tech Solutions Inc"
    "Global Services LLC"
    "Innovative Systems"
    "Quality Products Co"
    "Professional Services Group"
    "Advanced Technologies"
    "Strategic Partners Inc"
    "Elite Solutions"
    "Premier Services"
)

# Function to generate a transaction
generate_transaction() {
    local program_id=$1
    local is_annual=$2
    
    # Select random category and subcategory
    local categories=("${!WBS_CATEGORIES[@]}")
    local category=${categories[$RANDOM % ${#categories[@]}]}
    IFS=',' read -ra subcategories <<< "${WBS_CATEGORIES[$category]}"
    local subcategory=${subcategories[$RANDOM % ${#subcategories[@]}]}
    
    # Generate dates
    if [ "$is_annual" = true ]; then
        local baseline_date=$(random_date "2024-01-01" "2024-12-31")
    else
        local baseline_date=$(random_date "2024-01-01" "2025-06-30")
    fi
    
    local planned_date=$(date -d "$baseline_date + $((RANDOM % 30)) days" +%Y-%m-%d)
    
    # 70% chance of having actuals
    if [ $((RANDOM % 10)) -lt 7 ]; then
        local actual_date=$(date -d "$planned_date + $((RANDOM % 30)) days" +%Y-%m-%d)
        local actual_amount=$(random_amount 10000 500000)
        local actual_date_json="\"$actual_date\""
        local actual_amount_json="$actual_amount"
    else
        local actual_date_json="null"
        local actual_amount_json="null"
    fi
    
    local baseline_amount=$(random_amount 10000 500000)
    local planned_amount=$(echo "scale=2; $baseline_amount * (0.8 + (RANDOM * 0.4 / 32767))" | bc)
    local vendor=${VENDORS[$RANDOM % ${#VENDORS[@]}]}
    
    # Create JSON payload
    local json="{
        \"vendor_name\": \"$vendor\",
        \"expense_description\": \"$category - $subcategory expenses\",
        \"wbs_category\": \"$category\",
        \"wbs_subcategory\": \"$subcategory\",
        \"baseline_date\": \"$baseline_date\",
        \"baseline_amount\": $baseline_amount,
        \"planned_date\": \"$planned_date\",
        \"planned_amount\": $planned_amount,
        \"actual_date\": $actual_date_json,
        \"actual_amount\": $actual_amount_json,
        \"notes\": \"Transaction for $category - $subcategory\"
    }"
    
    # Send POST request
    curl -X POST http://localhost:4000/api/programs/$program_id/ledger \
        -H "Content-Type: application/json" \
        -d "$json"
}

# Generate transactions for Annual Program (ID: 1)
echo "Generating transactions for Annual Program..."
for i in {1..40}; do
    generate_transaction 1 true
    echo "Created transaction $i for Annual Program"
done

# Generate transactions for POP Program (ID: 2)
echo "Generating transactions for POP Program..."
for i in {1..40}; do
    generate_transaction 2 false
    echo "Created transaction $i for POP Program"
done 