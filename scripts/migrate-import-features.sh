#!/bin/bash

# Import Feature Migration Script
# This script reorganizes the import features to eliminate naming confusion

set -e

echo "🔄 Starting Import Feature Migration"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Check if running in project root
if [ ! -f "package.json" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Function to backup a file
backup_file() {
    local file_path="$1"
    if [ -f "$file_path" ]; then
        cp "$file_path" "${file_path}.backup.$(date +%Y%m%d_%H%M%S)"
        print_success "Backed up: $file_path"
    fi
}

# Function to create directory if it doesn't exist
create_dir() {
    if [ ! -d "$1" ]; then
        mkdir -p "$1"
        print_success "Created directory: $1"
    else
        print_warning "Directory already exists: $1"
    fi
}

echo ""
echo "📁 Phase 1: Creating New Directory Structure"
echo "============================================"

# Create new directory structure
create_dir "frontend/src/components/features"
create_dir "frontend/src/components/features/actuals"
create_dir "frontend/src/components/features/ledger"
create_dir "frontend/src/components/features/ledger/BulkImport"

echo ""
echo "📁 Phase 2: Moving and Renaming Files"
echo "====================================="

# Backup and move files
print_status "Backing up and moving files..."

# Move ImportPage.tsx to ActualsUploadPage.tsx
if [ -f "frontend/src/components/ImportPage.tsx" ]; then
    backup_file "frontend/src/components/ImportPage.tsx"
    mv frontend/src/components/ImportPage.tsx frontend/src/components/features/actuals/ActualsUploadPage.tsx
    print_success "Moved ImportPage.tsx → ActualsUploadPage.tsx"
else
    print_warning "ImportPage.tsx not found, skipping..."
fi

# Move TransactionMatchModal.tsx
if [ -f "frontend/src/components/TransactionMatchModal.tsx" ]; then
    backup_file "frontend/src/components/TransactionMatchModal.tsx"
    mv frontend/src/components/TransactionMatchModal.tsx frontend/src/components/features/actuals/
    print_success "Moved TransactionMatchModal.tsx"
else
    print_warning "TransactionMatchModal.tsx not found, skipping..."
fi

# Move UploadSessionDetails.tsx
if [ -f "frontend/src/components/UploadSessionDetails.tsx" ]; then
    backup_file "frontend/src/components/UploadSessionDetails.tsx"
    mv frontend/src/components/UploadSessionDetails.tsx frontend/src/components/features/actuals/
    print_success "Moved UploadSessionDetails.tsx"
else
    print_warning "UploadSessionDetails.tsx not found, skipping..."
fi

echo ""
echo "📝 Phase 3: Updating Component Files"
echo "===================================="

# Update ActualsUploadPage.tsx
if [ -f "frontend/src/components/features/actuals/ActualsUploadPage.tsx" ]; then
    print_status "Updating ActualsUploadPage.tsx..."
    
    # Update the component name
    sed -i 's/const ImportPage:/const ActualsUploadPage:/g' frontend/src/components/features/actuals/ActualsUploadPage.tsx
    sed -i 's/export default ImportPage;/export default ActualsUploadPage;/g' frontend/src/components/features/actuals/ActualsUploadPage.tsx
    
    # Update any internal references
    sed -i 's/ImportPage/ActualsUploadPage/g' frontend/src/components/features/actuals/ActualsUploadPage.tsx
    
    print_success "Updated ActualsUploadPage.tsx"
fi

# Update TransactionMatchModal.tsx imports
if [ -f "frontend/src/components/features/actuals/TransactionMatchModal.tsx" ]; then
    print_status "Updating TransactionMatchModal.tsx imports..."
    
    # Update relative imports
    sed -i 's|from '\''\.\./\.\./|from '\''\.\./\.\./\.\./|g' frontend/src/components/features/actuals/TransactionMatchModal.tsx
    
    print_success "Updated TransactionMatchModal.tsx"
fi

# Update UploadSessionDetails.tsx imports
if [ -f "frontend/src/components/features/actuals/UploadSessionDetails.tsx" ]; then
    print_status "Updating UploadSessionDetails.tsx imports..."
    
    # Update relative imports
    sed -i 's|from '\''\.\./\.\./|from '\''\.\./\.\./\.\./|g' frontend/src/components/features/actuals/UploadSessionDetails.tsx
    
    print_success "Updated UploadSessionDetails.tsx"
fi

echo ""
echo "🛣️ Phase 4: Updating Routes"
echo "============================"

# Backup and update App.tsx
if [ -f "frontend/src/App.tsx" ]; then
    backup_file "frontend/src/App.tsx"
    print_status "Updating App.tsx routes..."
    
    # Update import statement
    sed -i 's|import ImportPage from '\''\./components/ImportPage'\'';|import ActualsUploadPage from '\''\./components/features/actuals/ActualsUploadPage'\'';|g' frontend/src/App.tsx
    
    # Update route path
    sed -i 's|path="/programs/:id/import"|path="/programs/:id/actuals"|g' frontend/src/App.tsx
    
    # Update component reference
    sed -i 's|element={<ImportPage />}|element={<ActualsUploadPage />}|g' frontend/src/App.tsx
    
    print_success "Updated App.tsx"
fi

echo ""
echo "🧭 Phase 5: Updating Navigation"
echo "==============================="

# Backup and update Layout.tsx
if [ -f "frontend/src/components/Layout.tsx" ]; then
    backup_file "frontend/src/components/Layout.tsx"
    print_status "Updating Layout.tsx navigation..."
    
    # Update route path
    sed -i 's|to={`/programs/${programId}/import`}|to={`/programs/${programId}/actuals`}|g' frontend/src/components/Layout.tsx
    
    # Update icon and text
    sed -i 's|<span>📥</span>|<span>💰</span>|g' frontend/src/components/Layout.tsx
    sed -i 's|Upload Actuals|Actual Expenses|g' frontend/src/components/Layout.tsx
    
    print_success "Updated Layout.tsx"
fi

echo ""
echo "📋 Phase 6: Updating Ledger Page"
echo "================================"

# Backup and update LedgerPage.tsx
if [ -f "frontend/src/components/LedgerPage.tsx" ]; then
    backup_file "frontend/src/components/LedgerPage.tsx"
    print_status "Updating LedgerPage.tsx..."
    
    # Update button text
    sed -i 's|onClick={() => setShowImportModal(true)}|onClick={() => setShowBulkAddModal(true)}|g' frontend/src/components/LedgerPage.tsx
    sed -i 's|Import|Bulk Add|g' frontend/src/components/LedgerPage.tsx
    
    # Update modal title
    sed -i 's|Import Ledger Data|Bulk Add Ledger Entries|g' frontend/src/components/LedgerPage.tsx
    
    # Update help text
    sed -i 's|Upload your NetSuite export to match transactions|Import your initial program budget and planned expenses|g' frontend/src/components/LedgerPage.tsx
    
    print_success "Updated LedgerPage.tsx"
fi

echo ""
echo "🔧 Phase 7: Creating Index Files"
echo "================================"

# Create index.ts for actuals feature
print_status "Creating index.ts for actuals feature..."
cat > frontend/src/components/features/actuals/index.ts << 'EOF'
export { default as ActualsUploadPage } from './ActualsUploadPage';
export { default as TransactionMatchModal } from './TransactionMatchModal';
export { default as UploadSessionDetails } from './UploadSessionDetails';
EOF

# Create index.ts for ledger feature
print_status "Creating index.ts for ledger feature..."
cat > frontend/src/components/features/ledger/index.ts << 'EOF'
export { default as LedgerPage } from '../LedgerPage';
export { default as LedgerTable } from '../LedgerTable';
EOF

echo ""
echo "📝 Phase 8: Creating Documentation"
echo "=================================="

# Create README for actuals feature
print_status "Creating documentation for actuals feature..."
cat > frontend/src/components/features/actuals/README.md << 'EOF'
# Actual Expenses Feature

This feature handles the upload and processing of monthly actual expense transactions.

## Components

- **ActualsUploadPage**: Main page for uploading actual expense files
- **TransactionMatchModal**: Modal for reviewing and confirming transaction matches
- **UploadSessionDetails**: Page for viewing upload session details and results

## Purpose

This feature allows users to:
1. Upload monthly actual expense reports from accounting systems (NetSuite, QuickBooks, etc.)
2. Automatically match transactions to existing ledger entries
3. Review and confirm matches with confidence scoring
4. Handle unmatched transactions as new expenses

## Usage

Users access this feature through the "Actual Expenses" navigation item within a program.
EOF

# Create README for ledger bulk import
print_status "Creating documentation for ledger bulk import..."
cat > frontend/src/components/features/ledger/BulkImport/README.md << 'EOF'
# Ledger Bulk Import Feature

This feature handles the initial setup of program ledger entries through bulk import.

## Purpose

This feature allows users to:
1. Import initial program budget and planned expenses
2. Set up baseline spending categories
3. Bulk add multiple ledger entries at once
4. Use templates for consistent data entry

## Usage

Users access this feature through the "Bulk Add" button on the Ledger page.
EOF

echo ""
echo "✅ Phase 9: Final Steps"
echo "======================="

print_success "Import feature migration completed!"
echo ""
echo "📋 Summary of Changes:"
echo "1. ✅ Renamed ImportPage.tsx → ActualsUploadPage.tsx"
echo "2. ✅ Moved files to feature-based structure"
echo "3. ✅ Updated routes from /import → /actuals"
echo "4. ✅ Updated navigation from 'Upload Actuals' → 'Actual Expenses'"
echo "5. ✅ Updated Ledger 'Import' button → 'Bulk Add'"
echo "6. ✅ Created feature documentation"
echo ""
echo "🔄 Next Steps:"
echo "1. Test the application to ensure all routes work correctly"
echo "2. Update any remaining import statements in other files"
echo "3. Update backend routes if needed (api/import → api/actuals)"
echo "4. Update any documentation that references the old names"
echo "5. Train users on the new feature names and locations"
echo ""
echo "📚 Files Modified:"
echo "- frontend/src/App.tsx"
echo "- frontend/src/components/Layout.tsx"
echo "- frontend/src/components/LedgerPage.tsx"
echo "- frontend/src/components/features/actuals/ActualsUploadPage.tsx"
echo "- frontend/src/components/features/actuals/TransactionMatchModal.tsx"
echo "- frontend/src/components/features/actuals/UploadSessionDetails.tsx"
echo ""
echo "🔍 To test the changes:"
echo "1. Start the development server"
echo "2. Navigate to a program"
echo "3. Check that 'Actual Expenses' appears in navigation"
echo "4. Verify the route /programs/:id/actuals works"
echo "5. Check that 'Bulk Add' appears on the Ledger page"
echo ""

print_success "🎉 Migration completed successfully!" 