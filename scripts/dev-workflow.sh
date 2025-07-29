#!/bin/bash

# LRE Manager Development Workflow Script
# This script helps follow the established development practices

echo "=== LRE Manager Development Workflow ==="
echo ""

# Function to check if we're in the right directory
check_directory() {
    if [[ ! -f "package.json" ]] || [[ ! -d "frontend" ]] || [[ ! -d "backend" ]]; then
        echo "❌ Error: Please run this script from the LRE Manager root directory"
        exit 1
    fi
    echo "✅ Working directory confirmed"
}

# Function to check implementation plans and tasks
check_documentation() {
    echo ""
    echo "📋 Checking documentation..."
    if [[ -d "lre-docs/docs/implementation-plans" ]]; then
        echo "✅ Implementation plans directory found"
        ls -la lre-docs/docs/implementation-plans/
    fi
    
    if [[ -d "lre-docs/docs/tasks" ]]; then
        echo "✅ Tasks directory found"
        ls -la lre-docs/docs/tasks/
    fi
    
    if [[ -f "lre-docs/docs/FEATURE_DEVELOPMENT_CHECKLIST.md" ]]; then
        echo "✅ Feature development checklist found"
    fi
}

# Function to run build checks
run_build_checks() {
    echo ""
    echo "🔨 Running build checks..."
    
    echo "Frontend build check..."
    cd frontend && npm run build
    cd ..
    
    echo "Backend build check..."
    cd backend && npm run build
    cd ..
    
    echo "TypeScript type check..."
    cd frontend && npx tsc --noEmit
    cd ..
    cd backend && npx tsc --noEmit
    cd ..
}

# Function to start development environment
start_dev_environment() {
    echo ""
    echo "🚀 Starting development environment..."
    echo "Using Docker Compose for development..."
    docker-compose -f docker/docker-compose.dev.yml up -d
    echo "✅ Development environment started"
    echo "Frontend: http://localhost:3000"
    echo "Backend: http://localhost:4000"
}

# Function to show current status
show_status() {
    echo ""
    echo "📊 Current Status:"
    echo "Working Directory: $(pwd)"
    echo "Date: $(date)"
    echo "Git Branch: $(git branch --show-current)"
    echo "Git Status:"
    git status --porcelain
}

# Main menu
show_menu() {
    echo ""
    echo "Choose an option:"
    echo "1) Check documentation and plans"
    echo "2) Run build checks"
    echo "3) Start development environment"
    echo "4) Show current status"
    echo "5) Run all checks"
    echo "6) Exit"
    echo ""
    read -p "Enter your choice (1-6): " choice
}

# Main execution
main() {
    check_directory
    
    while true; do
        show_menu
        
        case $choice in
            1)
                check_documentation
                ;;
            2)
                run_build_checks
                ;;
            3)
                start_dev_environment
                ;;
            4)
                show_status
                ;;
            5)
                check_documentation
                run_build_checks
                show_status
                ;;
            6)
                echo "Goodbye!"
                exit 0
                ;;
            *)
                echo "Invalid choice. Please try again."
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run main function
main