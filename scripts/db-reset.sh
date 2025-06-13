#!/bin/bash

# Exit on error
set -e

echo "Resetting database..."

# Stop any running containers
docker-compose down

# Remove the database volume
docker volume rm lre_manager_postgres_data || true

# Start the database container
docker-compose up -d db

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 10

# Run migrations
cd backend
npm run migrate

# Seed the database
npm run seed

cd ..

echo "Database reset complete!" 