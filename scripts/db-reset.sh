#!/bin/bash

# Exit on error
set -e

# Print usage information
usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -f, --force    Force reset without confirmation"
    echo "  -s, --seed     Seed the database after reset"
    echo "  -m, --migrate  Run migrations after reset (default: true)"
    echo "  -w, --wait     Wait time for database to be ready (default: 5)"
    exit 1
}

# Parse command line arguments
FORCE=false
SEED=false
MIGRATE=true
WAIT_TIME=5

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -s|--seed)
            SEED=true
            shift
            ;;
        -m|--migrate)
            MIGRATE=true
            shift
            ;;
        -w|--wait)
            WAIT_TIME="$2"
            shift 2
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
        echo "WARNING: This will delete all data in the database."
        read -p "Are you sure you want to proceed? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Operation cancelled."
            exit 1
        fi
    fi
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "Error: Docker is not running"
        exit 1
    fi
}

# Function to wait for database
wait_for_db() {
    echo "Waiting for database to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f docker/docker-compose.yml exec -T db pg_isready -U postgres > /dev/null 2>&1; then
            echo "Database is ready!"
            return 0
        fi
        echo "Waiting for database... (attempt $attempt/$max_attempts)"
        sleep 1
        attempt=$((attempt + 1))
    done
    
    echo "Error: Database failed to start within $max_attempts seconds"
    exit 1
}

# Main execution
echo "Starting database reset..."

# Check if Docker is running
check_docker

# Confirm action
confirm

# Stop all containers
echo "Stopping containers..."
docker-compose -f docker/docker-compose.yml down

# Remove the postgres volume
echo "Removing database volume..."
docker volume rm lre_manager_postgres_data || true

# Start only the database container
echo "Starting database container..."
docker-compose -f docker/docker-compose.yml up -d db

# Wait for database to be ready
wait_for_db

# Run migrations if requested
if [ "$MIGRATE" = true ]; then
    echo "Running migrations..."
    cd backend && npm run typeorm migration:run
    cd ..
fi

# Seed database if requested
if [ "$SEED" = true ]; then
    echo "Seeding database..."
    npx ts-node scripts/seed_programs_and_expenses.ts
fi

echo "Database reset completed successfully!" 