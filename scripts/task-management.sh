#!/bin/bash

# Task Management Helper Script
# Usage: ./scripts/task-management.sh [command] [options]

set -e

TASKS_DIR="docs/tasks"
ACTIVE_DIR="$TASKS_DIR/active"
COMPLETED_DIR="$TASKS_DIR/completed"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Function to show help
show_help() {
    echo "Task Management Helper Script"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  list                    - List all active tasks"
    echo "  list-completed          - List all completed tasks"
    echo "  create-feature <name>   - Create a new feature task file"
    echo "  archive <feature>       - Archive a completed feature"
    echo "  stats                   - Show task statistics"
    echo "  help                    - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 list"
    echo "  $0 create-feature risks-opportunities"
    echo "  $0 archive user-preferences"
}

# Function to list active tasks
list_active_tasks() {
    print_header "Active Tasks"
    
    if [ -d "$ACTIVE_DIR" ]; then
        for file in "$ACTIVE_DIR"/*.md; do
            if [ -f "$file" ]; then
                filename=$(basename "$file" .md)
                echo "- $filename"
            fi
        done
    else
        print_error "Active tasks directory not found"
    fi
}

# Function to list completed tasks
list_completed_tasks() {
    print_header "Completed Tasks"
    
    if [ -d "$COMPLETED_DIR" ]; then
        for file in "$COMPLETED_DIR"/*.md; do
            if [ -f "$file" ]; then
                filename=$(basename "$file" .md)
                echo "- $filename"
            fi
        done
    else
        print_error "Completed tasks directory not found"
    fi
}

# Function to create a new feature task file
create_feature_task() {
    local feature_name="$1"
    
    if [ -z "$feature_name" ]; then
        print_error "Feature name is required"
        echo "Usage: $0 create-feature <feature-name>"
        exit 1
    fi
    
    local task_file="$ACTIVE_DIR/$feature_name.md"
    
    if [ -f "$task_file" ]; then
        print_warning "Task file already exists: $task_file"
        exit 1
    fi
    
    # Create the task file with template
    cat > "$task_file" << EOF
# $feature_name Tasks

## Status: Not Started
- [ ] TASK-001: Initial task setup

## Backend Tasks
- [ ] TASK-010: Create database models
- [ ] TASK-011: Implement API endpoints
- [ ] TASK-012: Add validation and error handling

## Frontend Tasks
- [ ] TASK-020: Create UI components
- [ ] TASK-021: Implement user interface
- [ ] TASK-022: Add form validation

## Integration Tasks
- [ ] TASK-030: Integrate with existing systems
- [ ] TASK-031: Test integration points

## Testing Tasks
- [ ] TASK-040: Write unit tests
- [ ] TASK-041: Create integration tests
- [ ] TASK-042: Perform user acceptance testing

## Notes
- Priority: Medium
- Dependencies: None identified
- Estimated completion: TBD
- Related implementation plan: \`docs/implementation-plans/$feature_name.md\`

---
*Last updated: [Current Date]*
EOF
    
    print_status "Created feature task file: $task_file"
}

# Function to archive a completed feature
archive_feature() {
    local feature_name="$1"
    
    if [ -z "$feature_name" ]; then
        print_error "Feature name is required"
        echo "Usage: $0 archive <feature-name>"
        exit 1
    fi
    
    local active_file="$ACTIVE_DIR/$feature_name.md"
    local completed_file="$COMPLETED_DIR/$feature_name.md"
    
    if [ ! -f "$active_file" ]; then
        print_error "Feature task file not found: $active_file"
        exit 1
    fi
    
    if [ -f "$completed_file" ]; then
        print_warning "Completed task file already exists: $completed_file"
        exit 1
    fi
    
    # Move the file to completed directory
    mv "$active_file" "$completed_file"
    
    print_status "Archived feature: $feature_name"
    print_status "Moved from: $active_file"
    print_status "Moved to: $completed_file"
}

# Function to show task statistics
show_stats() {
    print_header "Task Statistics"
    
    local active_count=0
    local completed_count=0
    
    if [ -d "$ACTIVE_DIR" ]; then
        active_count=$(find "$ACTIVE_DIR" -name "*.md" | wc -l)
    fi
    
    if [ -d "$COMPLETED_DIR" ]; then
        completed_count=$(find "$COMPLETED_DIR" -name "*.md" | wc -l)
    fi
    
    echo "Active Tasks: $active_count"
    echo "Completed Tasks: $completed_count"
    echo "Total Task Files: $((active_count + completed_count))"
}

# Main script logic
case "$1" in
    "list")
        list_active_tasks
        ;;
    "list-completed")
        list_completed_tasks
        ;;
    "create-feature")
        create_feature_task "$2"
        ;;
    "archive")
        archive_feature "$2"
        ;;
    "stats")
        show_stats
        ;;
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac 