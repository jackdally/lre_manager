#!/bin/bash

# Exit on error
set -e

# Print usage information
usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -f, --force    Force cleanup without confirmation"
    echo "  -d, --docker   Clean Docker resources only"
    echo "  -b, --build    Clean build artifacts only"
    echo "  -n, --node     Clean node_modules only"
    exit 1
}

# Parse command line arguments
FORCE=false
CLEAN_DOCKER=true
CLEAN_BUILD=true
CLEAN_NODE=true

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -d|--docker)
            CLEAN_BUILD=false
            CLEAN_NODE=false
            shift
            ;;
        -b|--build)
            CLEAN_DOCKER=false
            CLEAN_NODE=false
            shift
            ;;
        -n|--node)
            CLEAN_DOCKER=false
            CLEAN_BUILD=false
            shift
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
        read -p "Are you sure you want to proceed? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Operation cancelled."
            exit 1
        fi
    fi
}

# Function to clean build artifacts
clean_build() {
    echo "Cleaning build artifacts..."
    rm -rf frontend/build
    rm -rf backend/dist
    find . -name "*.log" -type f -delete
    find . -name "*.tmp" -type f -delete
}

# Function to clean node_modules
clean_node() {
    echo "Cleaning node_modules..."
    rm -rf frontend/node_modules
    rm -rf backend/node_modules
}

# Function to clean Docker resources
clean_docker() {
    echo "Cleaning Docker resources..."
    # Stop all containers
    docker-compose -f docker/docker-compose.yml down

    # Remove all containers
    docker rm -f $(docker ps -aq) 2>/dev/null || true

    # Remove all images
    docker rmi -f $(docker images -q) 2>/dev/null || true

    # Remove all volumes
    docker volume rm $(docker volume ls -q) 2>/dev/null || true

    # Remove all networks
    docker network prune -f
}

# Main cleanup execution
echo "Starting cleanup..."

if [ "$CLEAN_BUILD" = true ] || [ "$CLEAN_NODE" = true ] || [ "$CLEAN_DOCKER" = true ]; then
    confirm
fi

if [ "$CLEAN_BUILD" = true ]; then
    clean_build
fi

if [ "$CLEAN_NODE" = true ]; then
    clean_node
fi

if [ "$CLEAN_DOCKER" = true ]; then
    clean_docker
fi

echo "Cleanup complete!" 