#!/bin/bash

# Reset WBS Templates to Default
# This script runs the SQL reset script to delete test templates and insert the default template

echo "Resetting WBS Templates to default..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
DOCKER_COMPOSE_FILE="$PROJECT_ROOT/docker/docker-compose.dev.yml"
SQL_FILE="$PROJECT_ROOT/scripts/database/reset_wbs_templates.sql"

# Check if docker-compose is running
if ! docker-compose -f "$DOCKER_COMPOSE_FILE" ps | grep -q "Up"; then
    echo "Error: Docker containers are not running. Please start them first with:"
    echo "docker-compose -f docker/docker-compose.dev.yml up -d"
    exit 1
fi

# Copy the SQL file to the container and execute it
echo "Executing SQL reset script..."
docker cp "$SQL_FILE" "$(docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q db):/tmp/reset_wbs_templates.sql"
docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T db psql -U postgres -d lre_manager -f /tmp/reset_wbs_templates.sql

echo "WBS Templates reset successfully!"
echo "You can now refresh the Settings page to see the default template." 