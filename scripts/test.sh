#!/bin/bash

# Exit on error
set -e

echo "Running test suite..."

# Run backend tests
echo "Running backend tests..."
cd backend
npm test
cd ..

# Run frontend tests
echo "Running frontend tests..."
cd frontend
npm test
cd ..

echo "All tests completed successfully!"
