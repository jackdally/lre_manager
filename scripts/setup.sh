#!/bin/bash

# Exit on error
set -e

echo "Setting up LRE Manager development environment..."

# Check for required tools
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Aborting." >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose is required but not installed. Aborting." >&2; exit 1; }

# Create necessary directories
mkdir -p backend/venv
mkdir -p frontend/node_modules
mkdir -p docs/assets

# Copy environment files if they don't exist
[ ! -f .env ] && cp .env.example .env

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "Setup complete! You can now run 'docker-compose up' to start the development environment."
