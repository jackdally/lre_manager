#!/bin/bash

# Exit on error
set -e

# Print usage information
usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -h, --help           Show this help message"
    echo "  -l, --list           List all containers"
    echo "  -s, --start          Start all containers"
    echo "  -t, --stop           Stop all containers"
    echo "  -r, --restart        Restart all containers"
    echo "  -c, --clean          Remove stopped containers"
    echo "  -b, --rebuild        Rebuild all containers"
    echo "  -i, --info CONTAINER Show container information"
    echo "  -v, --verbose        Show detailed output"
    echo "  -f, --force          Force operations without confirmation"
    exit 1
}

# Parse command line arguments
LIST=false
START=false
STOP=false
RESTART=false
CLEAN=false
REBUILD=false
INFO_CONTAINER=""
VERBOSE=false
FORCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            ;;
        -l|--list)
            LIST=true
            shift
            ;;
        -s|--start)
            START=true
            shift
            ;;
        -t|--stop)
            STOP=true
            shift
            ;;
        -r|--restart)
            RESTART=true
            shift
            ;;
        -c|--clean)
            CLEAN=true
            shift
            ;;
        -b|--rebuild)
            REBUILD=true
            shift
            ;;
        -i|--info)
            INFO_CONTAINER="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -f|--force)
            FORCE=true
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

# Function to print status
print_status() {
    local status=$1
    local message=$2
    
    if [ "$VERBOSE" = true ]; then
        echo -n "$message: "
        if [ "$status" = true ]; then
            echo "OK"
        else
            echo "FAILED"
        fi
    else
        if [ "$status" = false ]; then
            echo "ERROR: $message"
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

# Function to list containers
list_containers() {
    echo "Listing Docker containers..."
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Image}}\t{{.Ports}}"
}

# Function to show container information
show_container_info() {
    local container=$1
    
    if [ -z "$container" ]; then
        echo "Error: Container name is required"
        usage
    fi
    
    echo "Showing information for container: $container"
    
    # Check if container exists
    if ! docker container inspect "$container" > /dev/null 2>&1; then
        echo "Error: Container $container does not exist"
        exit 1
    fi
    
    # Get container information
    echo "Container Details:"
    docker container inspect "$container" | jq '.[0]'
    
    # Get container logs
    echo "Container Logs:"
    docker logs "$container" --tail 50
}

# Function to start containers
start_containers() {
    echo "Starting containers..."
    confirm
    
    # Start using docker-compose
    docker-compose -f docker/docker-compose.yml up -d
    
    print_status true "Containers started"
}

# Function to stop containers
stop_containers() {
    echo "Stopping containers..."
    confirm
    
    # Stop using docker-compose
    docker-compose -f docker/docker-compose.yml down
    
    print_status true "Containers stopped"
}

# Function to restart containers
restart_containers() {
    echo "Restarting containers..."
    confirm
    
    # Restart using docker-compose
    docker-compose -f docker/docker-compose.yml restart
    
    print_status true "Containers restarted"
}

# Function to clean containers
clean_containers() {
    echo "Cleaning stopped containers..."
    confirm
    
    # Remove stopped containers
    docker container prune -f
    
    print_status true "Stopped containers removed"
}

# Function to rebuild containers
rebuild_containers() {
    echo "Rebuilding containers..."
    confirm
    
    # Rebuild using docker-compose
    docker-compose -f docker/docker-compose.yml build --no-cache
    
    print_status true "Containers rebuilt"
}

# Main execution
echo "Starting Docker container management..."

# Check if Docker is running
check_docker

# Perform requested operation
if [ "$LIST" = true ]; then
    list_containers
elif [ -n "$INFO_CONTAINER" ]; then
    show_container_info "$INFO_CONTAINER"
elif [ "$START" = true ]; then
    start_containers
elif [ "$STOP" = true ]; then
    stop_containers
elif [ "$RESTART" = true ]; then
    restart_containers
elif [ "$CLEAN" = true ]; then
    clean_containers
elif [ "$REBUILD" = true ]; then
    rebuild_containers
else
    echo "Error: No operation specified"
    usage
fi

echo "Docker container management completed!" 