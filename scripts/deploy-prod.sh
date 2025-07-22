#!/bin/bash

# Production Deployment Script for LRE Manager
# This script builds and deploys the application in production mode

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "docker/docker-compose.prod.yml" ]; then
    print_error "This script must be run from the project root directory"
    exit 1
fi

# Check if .env.prod exists
if [ ! -f "docker/.env.prod" ]; then
    print_warning "Production environment file not found. Creating from template..."
    if [ -f "docker/env.prod.example" ]; then
        cp docker/env.prod.example docker/.env.prod
        print_warning "Please edit docker/.env.prod with your production values before continuing"
        exit 1
    else
        print_error "Environment template not found. Please create docker/.env.prod manually"
        exit 1
    fi
fi

# Load environment variables
print_status "Loading production environment variables..."
export $(cat docker/.env.prod | grep -v '^#' | xargs)

# Stop any running containers
print_status "Stopping any running containers..."
docker-compose -f docker/docker-compose.prod.yml down --remove-orphans

# Build and start production containers
print_status "Building and starting production containers..."
docker-compose -f docker/docker-compose.prod.yml up --build -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Check service health
print_status "Checking service health..."

# Check frontend
if curl -f -s http://localhost:3000 > /dev/null; then
    print_success "Frontend is running on http://localhost:3000"
else
    print_error "Frontend health check failed"
fi

# Check backend
if curl -f -s http://localhost:4000/api/health > /dev/null; then
    print_success "Backend is running on http://localhost:4000"
else
    print_error "Backend health check failed"
fi

# Check docs
if curl -f -s http://localhost:3001 > /dev/null; then
    print_success "Documentation is running on http://localhost:3001"
else
    print_error "Documentation health check failed"
fi

# Check database
if docker-compose -f docker/docker-compose.prod.yml exec -T db pg_isready -U postgres > /dev/null 2>&1; then
    print_success "Database is ready"
else
    print_error "Database health check failed"
fi

print_success "Production deployment completed!"
print_status "Services available at:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:4000"
echo "  - Documentation: http://localhost:3001"
echo "  - Database: localhost:5432"

print_status "To view logs: docker-compose -f docker/docker-compose.prod.yml logs -f"
print_status "To stop services: docker-compose -f docker/docker-compose.prod.yml down" 