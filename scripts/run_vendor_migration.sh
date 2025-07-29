#!/bin/bash

echo "Starting vendor migration process..."

# Set environment variables if not already set
export DB_HOST=${DB_HOST:-localhost}
export DB_PORT=${DB_PORT:-5432}
export DB_USER=${DB_USER:-postgres}
export DB_PASSWORD=${DB_PASSWORD:-postgres}
export DB_NAME=${DB_NAME:-lre_manager}

echo "Database configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"

# Step 1: Create vendor table
echo "Step 1: Creating vendor table..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f scripts/database/create_vendors.sql

if [ $? -ne 0 ]; then
    echo "Error: Failed to create vendor table"
    exit 1
fi

# Step 2: Run vendor migration
echo "Step 2: Running vendor migration..."
cd backend
npx ts-node ../scripts/database/migrate_vendors.ts

if [ $? -ne 0 ]; then
    echo "Error: Failed to run vendor migration"
    exit 1
fi

echo "Vendor migration completed successfully!"
echo ""
echo "Next steps:"
echo "1. Start the backend server: cd backend && npm run dev"
echo "2. Test vendor API endpoints:"
echo "   - GET http://localhost:4000/api/vendors"
echo "   - GET http://localhost:4000/api/vendors/active"
echo "   - POST http://localhost:4000/api/vendors (create new vendor)"
echo "   - GET http://localhost:4000/api/vendors/template/download"
echo ""
echo "3. Test vendor upload:"
echo "   - POST http://localhost:4000/api/vendors/upload (with Excel/CSV file)"
echo ""
echo "4. Test NetSuite integration:"
echo "   - POST http://localhost:4000/api/vendors/import-netsuite (with credentials)" 