#!/bin/bash

# Exit on error
set -e

echo "Setting up LRE Manager development environment..."

# Check if Docker is installed
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Aborting." >&2; exit 1; }

# Check if Docker Compose is installed
command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose is required but not installed. Aborting." >&2; exit 1; }

# Create necessary directories
mkdir -p backend/venv
mkdir -p frontend/node_modules
mkdir -p docs/assets

# Copy environment files if they don't exist
[ ! -f backend/.env ] && cp backend/.env.example backend/.env
[ ! -f frontend/.env ] && cp frontend/.env.example frontend/.env

# Install dependencies
echo "Installing dependencies..."
cd frontend && npm install
cd ../backend && npm install
cd ..

# Build Docker images
echo "Building Docker images..."
docker-compose -f docker/docker-compose.yml build

# Start the database
echo "Starting database..."
docker-compose -f docker/docker-compose.yml up -d db

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 5

# Run migrations
echo "Running database migrations..."
cd backend && npm run typeorm migration:run
cd ..

echo "Setup complete! You can now run 'docker-compose -f docker/docker-compose.yml up' to start the development environment."
