#!/bin/bash

# Exit on error
set -e

# Print usage information
usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -h, --help           Show this help message"
    echo "  -b, --backup         Create a backup"
    echo "  -r, --restore FILE   Restore from backup file"
    echo "  -l, --list           List available backups"
    echo "  -d, --dir DIR        Backup directory (default: ./backups)"
    echo "  -f, --force          Force restore without confirmation"
    exit 1
}

# Parse command line arguments
BACKUP=false
RESTORE=""
LIST=false
BACKUP_DIR="./backups"
FORCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            ;;
        -b|--backup)
            BACKUP=true
            shift
            ;;
        -r|--restore)
            RESTORE="$2"
            shift 2
            ;;
        -l|--list)
            LIST=true
            shift
            ;;
        -d|--dir)
            BACKUP_DIR="$2"
            shift 2
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

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "Error: Docker is not running"
        exit 1
    fi
}

# Function to check if database is running
check_database() {
    if ! docker-compose -f docker/docker-compose.yml ps db | grep -q "Up"; then
        echo "Error: Database container is not running"
        exit 1
    fi
}

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

# Function to create backup
create_backup() {
    echo "Creating database backup..."
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Generate backup filename with timestamp
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/lre_manager_backup_$timestamp.sql"
    
    # Create backup
    if ! docker-compose -f docker/docker-compose.yml exec -T db pg_dump -U postgres lre_manager > "$backup_file"; then
        echo "Error: Failed to create backup"
        exit 1
    fi
    
    # Compress backup
    gzip "$backup_file"
    echo "Backup created successfully: ${backup_file}.gz"
}

# Function to restore backup
restore_backup() {
    local backup_file="$1"
    
    # Check if backup file exists
    if [ ! -f "$backup_file" ]; then
        echo "Error: Backup file not found: $backup_file"
        exit 1
    fi
    
    echo "Restoring database from backup: $backup_file"
    confirm
    
    # Stop the application containers
    echo "Stopping application containers..."
    docker-compose -f docker/docker-compose.yml stop backend frontend
    
    # Restore backup
    if [[ "$backup_file" == *.gz ]]; then
        # Decompress and restore
        if ! gunzip -c "$backup_file" | docker-compose -f docker/docker-compose.yml exec -T db psql -U postgres lre_manager; then
            echo "Error: Failed to restore backup"
            exit 1
        fi
    else
        # Restore directly
        if ! docker-compose -f docker/docker-compose.yml exec -T db psql -U postgres lre_manager < "$backup_file"; then
            echo "Error: Failed to restore backup"
            exit 1
        fi
    fi
    
    # Start the application containers
    echo "Starting application containers..."
    docker-compose -f docker/docker-compose.yml start backend frontend
    
    echo "Backup restored successfully"
}

# Function to list backups
list_backups() {
    echo "Available backups in $BACKUP_DIR:"
    if [ ! -d "$BACKUP_DIR" ]; then
        echo "No backup directory found"
        return
    fi
    
    local backups=("$BACKUP_DIR"/*.sql*)
    if [ ${#backups[@]} -eq 0 ]; then
        echo "No backups found"
        return
    fi
    
    for backup in "${backups[@]}"; do
        local size=$(du -h "$backup" | cut -f1)
        local date=$(stat -c %y "$backup" | cut -d' ' -f1,2)
        echo "$(basename "$backup") - $size - $date"
    done
}

# Main execution
echo "Starting database backup/restore operations..."

# Check if Docker is running
check_docker

# Check if database is running
check_database

# Perform requested operation
if [ "$BACKUP" = true ]; then
    create_backup
elif [ -n "$RESTORE" ]; then
    restore_backup "$RESTORE"
elif [ "$LIST" = true ]; then
    list_backups
else
    echo "Error: No operation specified"
    usage
fi

echo "Operation completed successfully!" 