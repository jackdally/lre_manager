#!/bin/bash

# Clean Upload Data Script
# This script removes all import sessions and transactions while preserving programs and ledger entries

set -e

echo "🧹 Cleaning up upload data..."
echo "This will remove ALL import sessions and transactions"
echo "Programs and ledger entries will be preserved"
echo ""

# Check if we're in the right directory
if [ ! -f "docker/docker-compose.yml" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Function to check if containers are running
check_containers() {
    echo "🔍 Checking if containers are running..."
    if ! docker-compose -f docker/docker-compose.yml ps | grep -q "Up"; then
        echo "❌ Error: Containers are not running. Please start them first with:"
        echo "   docker-compose -f docker/docker-compose.yml up -d"
        exit 1
    fi
    echo "✅ Containers are running"
}

# Function to backup current data (optional)
backup_data() {
    echo ""
    echo "📦 Creating backup of current upload data..."
    timestamp=$(date +"%Y%m%d_%H%M%S")
    backup_file="backup_uploads_${timestamp}.sql"
    
    docker-compose -f docker/docker-compose.yml exec -T db pg_dump -U postgres -d lre_manager \
        --table=import_session \
        --table=import_transaction \
        --table=import_config \
        --data-only \
        > "$backup_file"
    
    echo "✅ Backup created: $backup_file"
    echo "   You can restore this backup later if needed"
}

# Function to clean upload data
clean_uploads() {
    echo ""
    echo "🗑️  Cleaning upload data..."
    
    # Connect to database and clean tables
    docker-compose -f docker/docker-compose.yml exec -T db psql -U postgres -d lre_manager << 'EOF'
-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- Clean import transactions first (due to foreign key constraints)
DELETE FROM import_transaction;
echo "   ✅ Deleted all import transactions"

-- Clean import sessions
DELETE FROM import_session;
echo "   ✅ Deleted all import sessions"

-- Clean import configs (optional - uncomment if you want to remove these too)
-- DELETE FROM import_config;
-- echo "   ✅ Deleted all import configs"

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Show remaining data counts
SELECT 'Programs' as table_name, COUNT(*) as count FROM program
UNION ALL
SELECT 'Ledger Entries' as table_name, COUNT(*) as count FROM ledger_entry
UNION ALL
SELECT 'WBS Categories' as table_name, COUNT(*) as count FROM wbs_category
UNION ALL
SELECT 'WBS Subcategories' as table_name, COUNT(*) as count FROM wbs_subcategory;
EOF

    echo "✅ Upload data cleanup completed!"
}

# Function to verify cleanup
verify_cleanup() {
    echo ""
    echo "🔍 Verifying cleanup..."
    
    docker-compose -f docker/docker-compose.yml exec -T db psql -U postgres -d lre_manager << 'EOF'
SELECT 'Import Sessions' as table_name, COUNT(*) as count FROM import_session
UNION ALL
SELECT 'Import Transactions' as table_name, COUNT(*) as count FROM import_transaction
UNION ALL
SELECT 'Import Configs' as table_name, COUNT(*) as count FROM import_config;
EOF

    echo "✅ Verification completed"
}

# Main execution
main() {
    echo "🚀 Starting upload data cleanup..."
    echo ""
    
    check_containers
    
    # Ask for confirmation
    echo ""
    read -p "⚠️  Are you sure you want to delete ALL upload data? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Cleanup cancelled"
        exit 0
    fi
    
    # Ask about backup
    echo ""
    read -p "📦 Do you want to create a backup first? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        backup_data
    fi
    
    clean_uploads
    verify_cleanup
    
    echo ""
    echo "🎉 Upload data cleanup completed successfully!"
    echo "   Your programs and ledger entries are preserved"
    echo "   You can now start fresh with new uploads"
}

# Run main function
main "$@" 