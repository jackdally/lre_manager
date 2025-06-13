#!/bin/bash

echo "Cleaning up project..."

# Remove build directories
rm -rf frontend/build
rm -rf backend/dist

# Remove node_modules
rm -rf frontend/node_modules
rm -rf backend/node_modules

# Remove temporary files
find . -name "*.log" -type f -delete
find . -name "*.tmp" -type f -delete

# Clean Docker
docker-compose down
docker system prune -f

echo "Cleanup complete!" 