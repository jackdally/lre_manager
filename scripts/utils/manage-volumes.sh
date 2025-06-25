#!/bin/bash

# Exit on error
set -e

# Print usage information
usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -h, --help           Show this help message"
    echo "  -l, --list           List all volumes"
    echo "  -i, --info VOLUME    Show volume information"
    echo "  -c, --clean          Clean unused volumes"
    echo "  -b, --backup VOLUME  Backup a volume"
    echo "  -r, --restore FILE   Restore a volume from backup"
    echo "  -v, --verbose        Show detailed output"
    echo "  -f, --force          Force operations without confirmation"
    exit 1
}

# Parse command line arguments
LIST=false
INFO_VOLUME=""
CLEAN=false
BACKUP_VOLUME=""
RESTORE_FILE=""
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
        -i|--info)
            INFO_VOLUME="$2"
            shift 2
            ;;
        -c|--clean)
            CLEAN=true
            shift
            ;;
        -b|--backup)
            BACKUP_VOLUME="$2"
            shift 2
            ;;
        -r|--restore)
            RESTORE_FILE="$2"
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

# Function to list volumes
list_volumes() {
    echo "Listing Docker volumes..."
    docker volume ls --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}"
}

# Function to show volume information
show_volume_info() {
    local volume=$1
    
    if [ -z "$volume" ]; then
        echo "Error: Volume name is required"
        usage
    fi
    
    echo "Showing information for volume: $volume"
    
    # Check if volume exists
    if ! docker volume inspect "$volume" > /dev/null 2>&1; then
        echo "Error: Volume $volume does not exist"
        exit 1
    fi
    
    # Get volume information
    echo "Volume Details:"
    docker volume inspect "$volume" | jq '.[0]'
    
    # Get container using this volume
    echo "Containers using this volume:"
    docker ps -a --filter volume="$volume" --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"
}

# Function to clean unused volumes
clean_volumes() {
    echo "Cleaning unused volumes..."
    confirm
    
    # Get list of unused volumes
    unused_volumes=$(docker volume ls -q -f dangling=true)
    
    if [ -z "$unused_volumes" ]; then
        echo "No unused volumes found"
        return
    fi
    
    # Remove unused volumes
    echo "Removing unused volumes..."
    echo "$unused_volumes" | while read -r volume; do
        echo "Removing volume: $volume"
        docker volume rm "$volume"
        print_status true "Removed volume: $volume"
    done
}

# Function to backup a volume
backup_volume() {
    local volume=$1
    
    if [ -z "$volume" ]; then
        echo "Error: Volume name is required"
        usage
    fi
    
    # Check if volume exists
    if ! docker volume inspect "$volume" > /dev/null 2>&1; then
        echo "Error: Volume $volume does not exist"
        exit 1
    fi
    
    # Create backup directory if it doesn't exist
    mkdir -p backups
    
    # Create backup filename with timestamp
    local backup_file="backups/${volume}_$(date +%Y%m%d_%H%M%S).tar"
    
    echo "Backing up volume: $volume"
    confirm
    
    # Create a temporary container to backup the volume
    docker run --rm -v "$volume":/source -v "$(pwd)/backups":/backup alpine tar czf "/backup/$(basename "$backup_file")" -C /source .
    
    print_status true "Backup created: $backup_file"
}

# Function to restore a volume from backup
restore_volume() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        echo "Error: Backup file is required"
        usage
    fi
    
    if [ ! -f "$backup_file" ]; then
        echo "Error: Backup file $backup_file does not exist"
        exit 1
    fi
    
    # Extract volume name from backup filename
    local volume_name=$(basename "$backup_file" | cut -d'_' -f1)
    
    echo "Restoring volume: $volume_name from backup: $backup_file"
    confirm
    
    # Create volume if it doesn't exist
    if ! docker volume inspect "$volume_name" > /dev/null 2>&1; then
        echo "Creating volume: $volume_name"
        docker volume create "$volume_name"
    fi
    
    # Create a temporary container to restore the volume
    docker run --rm -v "$volume_name":/target -v "$(pwd)/$(dirname "$backup_file")":/backup alpine sh -c "rm -rf /target/* && tar xzf /backup/$(basename "$backup_file") -C /target"
    
    print_status true "Volume restored: $volume_name"
}

# Main execution
echo "Starting Docker volume management..."

# Check if Docker is running
check_docker

# Perform requested operation
if [ "$LIST" = true ]; then
    list_volumes
elif [ -n "$INFO_VOLUME" ]; then
    show_volume_info "$INFO_VOLUME"
elif [ "$CLEAN" = true ]; then
    clean_volumes
elif [ -n "$BACKUP_VOLUME" ]; then
    backup_volume "$BACKUP_VOLUME"
elif [ -n "$RESTORE_FILE" ]; then
    restore_volume "$RESTORE_FILE"
else
    echo "Error: No operation specified"
    usage
fi

echo "Docker volume management completed!" 