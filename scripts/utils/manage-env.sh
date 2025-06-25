#!/bin/bash

# Exit on error
set -e

# Print usage information
usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -h, --help           Show this help message"
    echo "  -i, --init           Initialize environment files"
    echo "  -c, --check          Check environment variables"
    echo "  -u, --update KEY VAL Update a specific environment variable"
    echo "  -v, --verbose        Show detailed output"
    echo "  -f, --force          Force operations without confirmation"
    exit 1
}

# Parse command line arguments
INIT=false
CHECK=false
UPDATE_KEY=""
UPDATE_VAL=""
VERBOSE=false
FORCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            ;;
        -i|--init)
            INIT=true
            shift
            ;;
        -c|--check)
            CHECK=true
            shift
            ;;
        -u|--update)
            UPDATE_KEY="$2"
            UPDATE_VAL="$3"
            shift 3
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

# Function to confirm action
confirm() {
    if [ "$FORCE" = false ]; then
        read -p "Are you sure you want to proceed? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Operation cancelled."
            exit 1
        fi
    fi
}

# Function to print status
print_status() {
    local status=$1
    local message=$2
    
    if [ "$VERBOSE" = true ]; then
        echo -n "$message: "
        if [ "$status" = true ]; then
            echo "OK"
        else
            echo "FAILED"
        fi
    else
        if [ "$status" = false ]; then
            echo "ERROR: $message"
        fi
    fi
}

# Function to initialize environment files
init_env() {
    echo "Initializing environment files..."
    
    # Backend environment
    if [ ! -f "backend/.env" ]; then
        echo "Creating backend/.env from example..."
        cp backend/.env.example backend/.env
        print_status true "Created backend/.env"
    else
        print_status true "backend/.env already exists"
    fi
    
    # Frontend environment
    if [ ! -f "frontend/.env" ]; then
        echo "Creating frontend/.env from example..."
        cp frontend/.env.example frontend/.env
        print_status true "Created frontend/.env"
    else
        print_status true "frontend/.env already exists"
    fi
}

# Function to check environment variables
check_env() {
    echo "Checking environment variables..."
    
    # Check backend environment
    if [ -f "backend/.env" ]; then
        echo "Backend environment:"
        while IFS='=' read -r key value; do
            # Skip comments and empty lines
            [[ $key =~ ^#.*$ ]] && continue
            [[ -z $key ]] && continue
            
            # Remove quotes from value
            value=$(echo "$value" | tr -d '"'"'")
            
            if [ -z "$value" ]; then
                print_status false "Backend: $key is not set"
            else
                print_status true "Backend: $key is set"
            fi
        done < backend/.env
    else
        print_status false "Backend environment file not found"
    fi
    
    # Check frontend environment
    if [ -f "frontend/.env" ]; then
        echo "Frontend environment:"
        while IFS='=' read -r key value; do
            # Skip comments and empty lines
            [[ $key =~ ^#.*$ ]] && continue
            [[ -z $key ]] && continue
            
            # Remove quotes from value
            value=$(echo "$value" | tr -d '"'"'")
            
            if [ -z "$value" ]; then
                print_status false "Frontend: $key is not set"
            else
                print_status true "Frontend: $key is set"
            fi
        done < frontend/.env
    else
        print_status false "Frontend environment file not found"
    fi
}

# Function to update environment variable
update_env() {
    local key=$1
    local value=$2
    
    if [ -z "$key" ] || [ -z "$value" ]; then
        echo "Error: Both key and value are required for update"
        usage
    fi
    
    echo "Updating environment variable: $key"
    confirm
    
    # Update backend environment
    if [ -f "backend/.env" ]; then
        if grep -q "^$key=" backend/.env; then
            sed -i "s/^$key=.*/$key=$value/" backend/.env
            print_status true "Updated $key in backend/.env"
        else
            echo "$key=$value" >> backend/.env
            print_status true "Added $key to backend/.env"
        fi
    else
        print_status false "Backend environment file not found"
    fi
    
    # Update frontend environment
    if [ -f "frontend/.env" ]; then
        if grep -q "^$key=" frontend/.env; then
            sed -i "s/^$key=.*/$key=$value/" frontend/.env
            print_status true "Updated $key in frontend/.env"
        else
            echo "$key=$value" >> frontend/.env
            print_status true "Added $key to frontend/.env"
        fi
    else
        print_status false "Frontend environment file not found"
    fi
}

# Main execution
echo "Starting environment management..."

# Perform requested operation
if [ "$INIT" = true ]; then
    init_env
elif [ "$CHECK" = true ]; then
    check_env
elif [ -n "$UPDATE_KEY" ]; then
    update_env "$UPDATE_KEY" "$UPDATE_VAL"
else
    echo "Error: No operation specified"
    usage
fi

echo "Environment management completed!" 