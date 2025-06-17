#!/bin/bash

# Exit on error
set -e

# Print usage information
usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -b, --backend  Run only backend tests"
    echo "  -f, --frontend Run only frontend tests"
    echo "  -v, --verbose  Show detailed test output"
    exit 1
}

# Parse command line arguments
VERBOSE=""
TEST_BACKEND=true
TEST_FRONTEND=true

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            ;;
        -b|--backend)
            TEST_FRONTEND=false
            shift
            ;;
        -f|--frontend)
            TEST_BACKEND=false
            shift
            ;;
        -v|--verbose)
            VERBOSE="--verbose"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

# Function to run tests with error handling
run_tests() {
    local dir=$1
    local name=$2
    echo "Running $name tests..."
    cd "$dir" || { echo "Error: Could not change to $dir directory"; exit 1; }
    if ! npm test $VERBOSE; then
        echo "Error: $name tests failed"
        exit 1
    fi
    cd ..
    echo "$name tests completed successfully!"
}

# Main test execution
echo "Starting test suite..."

if [ "$TEST_BACKEND" = true ]; then
    run_tests "backend" "Backend"
fi

if [ "$TEST_FRONTEND" = true ]; then
    run_tests "frontend" "Frontend"
fi

echo "All tests completed successfully!"
