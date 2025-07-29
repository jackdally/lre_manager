#!/bin/bash

# Cost Categories Migration Script
# This script creates the cost_category table and adds default categories

set -e

echo "Starting Cost Categories Migration..."

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
SQL_FILE="$PROJECT_ROOT/scripts/database/create_cost_categories.sql"

echo "Project root: $PROJECT_ROOT"
echo "SQL file: $SQL_FILE"

# Check if SQL file exists
if [ ! -f "$SQL_FILE" ]; then
    echo "Error: SQL file not found at $SQL_FILE"
    exit 1
fi

# Copy SQL file to container and run the migration
echo "Running cost categories migration..."
docker cp "$SQL_FILE" "$(docker-compose -f "$PROJECT_ROOT/docker/docker-compose.dev.yml" ps -q db):/tmp/create_cost_categories.sql"
docker-compose -f "$PROJECT_ROOT/docker/docker-compose.dev.yml" exec -T db psql -U postgres -d lre_manager -f /tmp/create_cost_categories.sql

echo "Cost Categories Migration completed successfully!"
echo ""
echo "Default cost categories created:"
echo "- LABOR: Labor costs"
echo "- MATERIALS: Materials and supplies"
echo "- EQUIPMENT: Equipment costs"
echo "- SUBCONTRACTOR: Subcontractor costs"
echo "- TRAVEL: Travel expenses"
echo "- OVERHEAD: Overhead costs"
echo "- G&A: General & Administrative"
echo "- FEE: Profit and fee markup"
echo "- OTHER: Other miscellaneous costs"
echo ""
echo "You can now manage cost categories through the Settings page." 