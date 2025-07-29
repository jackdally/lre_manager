#!/bin/bash

# Migration script for hierarchical WBS structure
# This script runs the database migration to add the new WBS element table
# and update the ledger table to support both old and new structures

set -e

echo "Starting hierarchical WBS migration..."

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Check if we're in the right directory
if [ ! -f "$PROJECT_ROOT/docker/docker-compose.dev.yml" ]; then
    echo "Error: This script must be run from the project root directory"
    echo "Current directory: $(pwd)"
    echo "Expected project root: $PROJECT_ROOT"
    exit 1
fi

# Check if Docker containers are running
if ! docker-compose -f "$PROJECT_ROOT/docker/docker-compose.dev.yml" ps | grep -q "db.*Up"; then
    echo "Error: Database container is not running"
    echo "Please start the development environment first:"
    echo "  docker-compose -f docker/docker-compose.dev.yml up -d"
    exit 1
fi

# Get the database container name
DB_CONTAINER=$(docker-compose -f "$PROJECT_ROOT/docker/docker-compose.dev.yml" ps -q db)

if [ -z "$DB_CONTAINER" ]; then
    echo "Error: Could not find database container"
    exit 1
fi

echo "Found database container: $DB_CONTAINER"

# Create backup before migration
echo "Creating database backup..."
BACKUP_FILE="$PROJECT_ROOT/backup_before_wbs_migration_$(date +%Y%m%d_%H%M%S).sql"
docker exec "$DB_CONTAINER" pg_dump -U postgres lre_manager > "$BACKUP_FILE"
echo "Backup created: $BACKUP_FILE"

# Run the migration
echo "Running hierarchical WBS migration..."
docker exec -i "$DB_CONTAINER" psql -U postgres -d lre_manager < "$PROJECT_ROOT/scripts/database/migrate_to_hierarchical_wbs.sql"

# Verify the migration
echo "Verifying migration..."
docker exec "$DB_CONTAINER" psql -U postgres -d lre_manager -c "
SELECT 
    'wbs_element table exists' as check_item,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wbs_element') 
         THEN 'PASS' ELSE 'FAIL' END as status
UNION ALL
SELECT 
    'ledger_entry has wbs_element_id column' as check_item,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ledger_entry' AND column_name = 'wbs_element_id') 
         THEN 'PASS' ELSE 'FAIL' END as status
UNION ALL
SELECT 
    'wbs_element has data' as check_item,
    CASE WHEN (SELECT COUNT(*) FROM wbs_element) > 0 
         THEN 'PASS (' || COUNT(*) || ' elements)' ELSE 'FAIL' END as status
FROM wbs_element;
"

echo ""
echo "Migration completed successfully!"
echo ""
echo "Next steps:"
echo "1. Restart the backend container to pick up the new entity:"
echo "   docker-compose -f docker/docker-compose.dev.yml restart backend"
echo ""
echo "2. The new hierarchical WBS structure is now available alongside the old 2-tier structure"
echo "3. You can gradually migrate ledger entries to use the new structure"
echo "4. The WbsTreeView component can be integrated into your program settings"
echo ""
echo "Backup location: $BACKUP_FILE" 