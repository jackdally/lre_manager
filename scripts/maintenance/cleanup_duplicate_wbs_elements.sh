#!/bin/bash

# Cleanup script for duplicate WBS elements
# This script removes duplicate WBS elements that may have been created by running the migration multiple times

set -e

echo "Starting duplicate WBS elements cleanup..."

# Check if we're in the right directory
if [ ! -f "docker/docker-compose.dev.yml" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

# Find the database container
DB_CONTAINER=$(docker-compose -f docker/docker-compose.dev.yml ps -q db)

if [ -z "$DB_CONTAINER" ]; then
    echo "Error: Database container not found. Please ensure the development environment is running."
    exit 1
fi

echo "Found database container: $DB_CONTAINER"

# Create backup before cleanup
echo "Creating database backup..."
BACKUP_FILE="backup_before_wbs_cleanup_$(date +%Y%m%d_%H%M%S).sql"
docker-compose -f docker/docker-compose.dev.yml exec -T db pg_dump -U postgres lre_manager > "$BACKUP_FILE"
echo "Backup created: $BACKUP_FILE"

# Run the cleanup script
echo "Running duplicate WBS elements cleanup..."
docker-compose -f docker/docker-compose.dev.yml exec -T db psql -U postgres -d lre_manager < scripts/database/cleanup_duplicate_wbs_elements.sql

echo ""
echo "Cleanup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Restart the backend container to pick up the changes:"
echo "   docker-compose -f docker/docker-compose.dev.yml restart backend"
echo ""
echo "2. The duplicate WBS elements have been removed"
echo "3. The WBS reporting should now show clean, non-duplicate data"
echo ""
echo "Backup location: $BACKUP_FILE" 