#!/bin/bash

# Exit on error
set -e

# Print usage information
usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -h, --help           Show this help message"
    echo "  -a, --annual ID      Generate transactions for Annual Program (ID required)"
    echo "  -p, --pop ID         Generate transactions for POP Program (ID required)"
    echo "  -n, --number NUM     Number of transactions to generate (default: 40)"
    echo "  -u, --url URL        API URL (default: http://localhost:4000)"
    echo "  -v, --verbose        Show detailed output"
    exit 1
}

# Parse command line arguments
ANNUAL_ID=""
POP_ID=""
NUM_TRANSACTIONS=40
API_URL="http://localhost:4000"
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            ;;
        -a|--annual)
            ANNUAL_ID="$2"
            shift 2
            ;;
        -p|--pop)
            POP_ID="$2"
            shift 2
            ;;
        -n|--number)
            NUM_TRANSACTIONS="$2"
            shift 2
            ;;
        -u|--url)
            API_URL="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

# Check if at least one program ID is provided
if [ -z "$ANNUAL_ID" ] && [ -z "$POP_ID" ]; then
    echo "Error: At least one program ID must be provided"
    usage
fi

# Function to check if API is available
check_api() {
    if ! curl -s "$API_URL/health" > /dev/null; then
        echo "Error: API is not available at $API_URL"
        exit 1
    fi
}

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
    local transaction_num=$3
    local total=$4
    
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
    if [ "$VERBOSE" = true ]; then
        echo "Creating transaction $transaction_num/$total for Program $program_id..."
    fi
    
    if ! curl -s -X POST "$API_URL/api/programs/$program_id/ledger" \
        -H "Content-Type: application/json" \
        -d "$json" > /dev/null; then
        echo "Error: Failed to create transaction $transaction_num for Program $program_id"
        return 1
    fi
    
    if [ "$VERBOSE" = true ]; then
        echo "Successfully created transaction $transaction_num/$total for Program $program_id"
    fi
}

# Main execution
echo "Starting transaction generation..."

# Check if API is available
check_api

# Generate transactions for Annual Program if ID provided
if [ -n "$ANNUAL_ID" ]; then
    echo "Generating $NUM_TRANSACTIONS transactions for Annual Program (ID: $ANNUAL_ID)..."
    for i in $(seq 1 $NUM_TRANSACTIONS); do
        if ! generate_transaction "$ANNUAL_ID" true "$i" "$NUM_TRANSACTIONS"; then
            echo "Error: Failed to generate transactions for Annual Program"
            exit 1
        fi
    done
    echo "Successfully generated $NUM_TRANSACTIONS transactions for Annual Program"
fi

# Generate transactions for POP Program if ID provided
if [ -n "$POP_ID" ]; then
    echo "Generating $NUM_TRANSACTIONS transactions for POP Program (ID: $POP_ID)..."
    for i in $(seq 1 $NUM_TRANSACTIONS); do
        if ! generate_transaction "$POP_ID" false "$i" "$NUM_TRANSACTIONS"; then
            echo "Error: Failed to generate transactions for POP Program"
            exit 1
        fi
    done
    echo "Successfully generated $NUM_TRANSACTIONS transactions for POP Program"
fi

echo "Transaction generation completed successfully!" 