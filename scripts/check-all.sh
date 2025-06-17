#!/bin/bash

# Exit on error
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Print usage information
usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -h, --help           Show this help message"
    echo "  -v, --verbose        Show detailed output"
    echo "  -f, --fix            Attempt to fix issues"
    exit 1
}

# Parse command line arguments
VERBOSE=false
FIX=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -f|--fix)
            FIX=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

# Build verbose flag
VERBOSE_FLAG=""
if [ "$VERBOSE" = true ]; then
    VERBOSE_FLAG="-v"
fi

# Build fix flag
FIX_FLAG=""
if [ "$FIX" = true ]; then
    FIX_FLAG="-f"
fi

echo "Running system checks..."
echo "======================="

# Check system requirements
echo -e "\nChecking system requirements..."
"$SCRIPT_DIR/check-requirements.sh" $VERBOSE_FLAG $FIX_FLAG

# Check environment variables
echo -e "\nChecking environment variables..."
"$SCRIPT_DIR/manage-env.sh" -c $VERBOSE_FLAG

# Check Docker volumes
echo -e "\nChecking Docker volumes..."
"$SCRIPT_DIR/manage-volumes.sh" -l $VERBOSE_FLAG

# Check database
echo -e "\nChecking database..."
if [ -f "backend/.env" ]; then
    source backend/.env
    if pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; then
        echo "Database is ready"
    else
        echo "Database is not ready"
    fi
else
    echo "Backend environment file not found"
fi

echo -e "\nAll checks completed!" 