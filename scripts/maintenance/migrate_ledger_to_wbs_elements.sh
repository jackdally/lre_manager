#!/bin/bash

# Migration script to replace WBS Category/Subcategory with WBS Elements in Ledger
# This script migrates existing ledger entries to use the new hierarchical WBS structure

set -e

echo "Starting Ledger to WBS Elements migration..."

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

# Create backup before migration
echo "Creating database backup..."
BACKUP_FILE="backup_before_ledger_migration_$(date +%Y%m%d_%H%M%S).sql"
docker-compose -f docker/docker-compose.dev.yml exec -T db pg_dump -U postgres lre_manager > "$BACKUP_FILE"
echo "Backup created: $BACKUP_FILE"

# Run the migration script
echo "Running ledger to WBS elements migration..."
docker-compose -f docker/docker-compose.dev.yml exec -T db psql -U postgres -d lre_manager < scripts/database/migrate_ledger_to_wbs_elements.sql

echo ""
echo "Migration completed successfully!"
echo ""
echo "Next steps:"
echo "1. Review the migration results above"
echo "2. If migration looks good, restart the backend:"
echo "   docker-compose -f docker/docker-compose.dev.yml restart backend"
echo ""
echo "3. Test the application to ensure everything works correctly"
echo ""
echo "4. If everything is working, you can clean up old columns by running:"
echo "   docker-compose -f docker/docker-compose.dev.yml exec db psql -U postgres -d lre_manager -c \"ALTER TABLE ledger_entry DROP COLUMN wbs_category;\""
echo "   docker-compose -f docker/docker-compose.dev.yml exec db psql -U postgres -d lre_manager -c \"ALTER TABLE ledger_entry DROP COLUMN wbs_subcategory;\""
echo ""
echo "Backup location: $BACKUP_FILE" 